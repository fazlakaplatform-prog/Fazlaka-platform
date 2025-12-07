// src/app/api/chat/shared/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import ChatHistory from '@/models/ChatHistory';
import User from '@/models/User'; // Assuming you have a User model

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    console.log(`Searching for chat with shareId: ${id}`);
    
    await connectDB();
    
    // Find the chat with the shareId
    const chat = await ChatHistory.findOne({ 
      shareId: id
    }).populate({
      path: 'userId',
      model: User,
      select: 'name image' // Only get the name and image fields
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
      _id: chat._id,
      title: chat.title,
      messages: chat.messages,
      sharedAt: chat.sharedAt,
      sharerName: chat.userId?.name || 'مستخدم فذلكه', // Use the actual user's name
      sharerImage: chat.userId?.image || null // Include the user's image if available
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