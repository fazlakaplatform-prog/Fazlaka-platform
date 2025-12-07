// src/app/api/chat/history/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/mongodb'; // استخدام connectDB بدلاً من clientPromise
import ChatHistory from '@/models/ChatHistory';

export async function GET() {
  try {
    // تصحيح: استخدام authOptions بالكامل بدلاً من كائن مخصص
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB(); // استخدام connectDB بدلاً من clientPromise
    
    const chatHistory = await ChatHistory.find({ userId: session.user.id })
      .sort({ updatedAt: -1 })
      .select('_id title createdAt updatedAt');
    
    return NextResponse.json(chatHistory);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    // تصحيح: استخدام authOptions بالكامل بدلاً من كائن مخصص
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { title } = await request.json();
    
    if (!title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    await connectDB(); // استخدام connectDB بدلاً من clientPromise
    
    const newChat = new ChatHistory({
      userId: session.user.id,
      title,
      messages: [],
    });
    
    await newChat.save();
    
    return NextResponse.json(newChat, { status: 201 });
  } catch (error) {
    console.error('Error creating new chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}