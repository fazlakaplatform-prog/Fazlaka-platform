// src/app/api/chat/history/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb'; // استخدام connectDB بدلاً من clientPromise
import ChatHistory from '@/models/ChatHistory';

// تعريف واجهة لرسائل الدردشة
interface ChatMessage {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  // يمكن إضافة خصائص أخرى حسب الحاجة
}

// تعريف واجهة لبيانات التحديث
interface UpdateData {
  messages: ChatMessage[];
  updatedAt: Date;
  title?: string; // خاصية اختيارية
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // تصحيح: استخدام authOptions بالكامل بدلاً من كائن مخصص
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB(); // استخدام connectDB بدلاً من clientPromise
    
    const chat = await ChatHistory.findOne({ 
      _id: id, 
      userId: session.user.id 
    });
    
    if (!chat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(chat);
  } catch (error) {
    console.error('Error fetching chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // تصحيح: استخدام authOptions بالكامل بدلاً من كائن مخصص
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title, messages } = await request.json();
    
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages are required and must be an array' },
        { status: 400 }
      );
    }

    await connectDB(); // استخدام connectDB بدلاً من clientPromise
    
    // استخدام الواجهة المعرّفة بدلاً من any
    const updateData: UpdateData = {
      messages,
      updatedAt: new Date(),
    };
    
    // إضافة العنوان إذا تم توفيره
    if (title) {
      updateData.title = title;
    }
    
    const updatedChat = await ChatHistory.findOneAndUpdate(
      { _id: id, userId: session.user.id },
      updateData,
      { new: true }
    );
    
    if (!updatedChat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedChat);
  } catch (error) {
    console.error('Error updating chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    // تصحيح: استخدام authOptions بالكامل بدلاً من كائن مخصص
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB(); // استخدام connectDB بدلاً من clientPromise
    
    const deletedChat = await ChatHistory.findOneAndDelete({ 
      _id: id, 
      userId: session.user.id 
    });
    
    if (!deletedChat) {
      return NextResponse.json(
        { error: 'Chat not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ message: 'Chat deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}