import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb';
import ChatHistory from '@/models/ChatHistory';
import { randomBytes } from 'crypto';

// تعريف واجهة لمعلمات السياق
interface ShareContext {
  params: Promise<{ id: string }>;
}

// تعريف واجهة لجسم الطلب
interface ShareRequestBody {
  isPublic?: boolean;
}

export async function POST(
  request: NextRequest,
  context: ShareContext
) {
  try {
    console.log('--- SHARE API START ---');
    const { id } = await context.params;
    console.log('Received chat ID:', id);
    
    // التحقق من وجود معرف المحادثة
    if (!id) {
      console.error('Share API: No chat ID provided');
      return NextResponse.json(
        { error: 'Chat ID is required' },
        { status: 400 }
      );
    }
    
    // تصحيح: استخدام authOptions بالكامل بدلاً من كائن مخصص
    const session = await getServerSession(authOptions);
    console.log('User session:', session?.user?.id);
    
    if (!session?.user?.id) {
      console.error('Share API: Unauthorized access attempt');
      return NextResponse.json(
        { error: 'Unauthorized: You must be logged in to share a chat.' },
        { status: 401 }
      );
    }

    // التحقق من جسم الطلب
    let requestBody: ShareRequestBody = {};
    try {
      requestBody = await request.json();
    } catch (parseError) {
      console.error('Share API: Failed to parse request body:', parseError);
      return NextResponse.json(
        { error: 'Invalid request body format' },
        { status: 400 }
      );
    }
    
    const { isPublic } = requestBody;
    console.log('Request body (isPublic):', isPublic);
    
    console.log('Connecting to database...');
    await connectDB();
    console.log('Database connected.');
    
    console.log(`Searching for chat with ID: ${id} and user: ${session.user.id}`);
    // البحث عن المحادثة
    const chat = await ChatHistory.findOne({ 
      _id: id, 
      userId: session.user.id 
    });
    
    console.log('Chat found:', chat);
    
    if (!chat) {
      console.error(`Share API: Chat not found for ID: ${id} and user: ${session.user.id}`);
      return NextResponse.json(
        { error: 'Chat not found or you do not have permission to share it.' },
        { status: 404 }
      );
    }
    
    // إنشاء معرف مشاركة فريد إذا لم يكن موجودًا
    let shareId = chat.shareId;
    if (!shareId) {
      console.log('No shareId found, generating a new one...');
      let newShareIdIsUnique = false;
      let attempts = 0;
      const maxAttempts = 5;

      while (!newShareIdIsUnique && attempts < maxAttempts) {
        const candidateShareId = randomBytes(16).toString('hex');
        console.log(`Attempt ${attempts + 1}: Checking candidate shareId: ${candidateShareId}`);
        const existingChat = await ChatHistory.findOne({ shareId: candidateShareId });
        if (!existingChat) {
          shareId = candidateShareId;
          newShareIdIsUnique = true;
          console.log('Unique shareId found:', shareId);
        }
        attempts++;
      }

      if (!newShareIdIsUnique) {
        console.error('Share API: Could not generate a unique shareId after multiple attempts.');
        return NextResponse.json(
          { error: 'Could not generate a unique share link. Please try again.' },
          { status: 500 }
        );
      }
    } else {
      console.log('Using existing shareId:', shareId);
    }
    
    console.log(`Updating chat with ID: ${id}`);
    // تحديث المحادثة مع معرف المشاركة وحالة المشاركة
    const updatedChat = await ChatHistory.findByIdAndUpdate(
      id,
      {
        shareId: shareId,
        isPublic: isPublic !== undefined ? isPublic : true,
        sharedAt: new Date()
      },
      { new: true } // إرجاع المستند المحدث
    );
    
    console.log('Chat updated successfully:', updatedChat);
    
    if (!updatedChat) {
      console.error(`Share API: Failed to update chat with ID: ${id}`);
      return NextResponse.json(
        { error: 'Failed to update chat with sharing details.' },
        { status: 500 }
      );
    }
    
    console.log('--- SHARE API SUCCESS ---');
    return NextResponse.json({ 
      shareId: shareId,
      isPublic: updatedChat.isPublic,
      message: 'Chat shared successfully'
    });
  } catch (error) {
    console.error('--- SHARE API CRASH ---');
    console.error('Caught error object:', error);
    
    // تسجيل المزيد من التفاصيل إذا كان خطأ Mongoose
    if (error instanceof Error) {
        console.error('Error name:', error.name);
        console.error('Error message:', error.message);
        console.error('Error stack:', error.stack);
    }
    console.error('--- END CRASH ---');
    
    return NextResponse.json(
      { error: 'An internal server error occurred while sharing chat.' },
      { status: 500 }
    );
  }
}