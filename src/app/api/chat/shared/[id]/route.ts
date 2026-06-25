import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma'; // تم التعديل: استخدام Named Import

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log(`Searching for chat with shareId: ${id}`);
    
    // Find the chat with the shareId and include user data
    const chat = await prisma.chatHistory.findFirst({
      where: { shareId: id },
      include: {
        user: {
          select: {
            name: true,
            image: true
          }
        }
      }
    });
    
    console.log(`Chat search result:`, chat);
    
    if (!chat) {
      console.log(`Chat not found with shareId: ${id}`);
      return NextResponse.json(
        { error: 'Shared chat not found' },
        { status: 404 }
      );
    }
    
    // Check if the chat is public
    if (!chat.isPublic) {
      console.log(`Chat found but not public with shareId: ${id}`);
      return NextResponse.json(
        { error: 'Shared chat is not public' },
        { status: 403 }
      );
    }
    
    // Prepare the response data with the actual user's name
    const sharedChat = {
      id: chat.id,
      title: chat.title,
      messages: chat.messages,
      sharedAt: chat.sharedAt,
      sharerName: chat.user?.name || 'مستخدم فذلكه',
      sharerImage: chat.user?.image || null
    };
    
    console.log(`Returning shared chat:`, sharedChat);
    
    return NextResponse.json(sharedChat);
  } catch (error) {
    console.error('Error fetching shared chat:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}