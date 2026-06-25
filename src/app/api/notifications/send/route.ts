import { NextRequest, NextResponse } from 'next/server';
import { sendNotificationToUser } from '@/services/sseService';

export async function POST(request: NextRequest) {
  try {
    const { userId, notification } = await request.json();
    
    if (!userId || !notification) {
      return NextResponse.json({ error: 'Missing data' }, { status: 400 });
    }
    
    const success = sendNotificationToUser(userId, notification);
    
    if (success) {
      return NextResponse.json({ message: 'Notification sent' });
    } else {
      return NextResponse.json({ error: 'User not connected' }, { status: 404 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Failed to send' }, { status: 500 });
  }
}