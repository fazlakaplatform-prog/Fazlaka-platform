import { NextRequest, NextResponse } from 'next/server';
import { broadcastNotification } from '@/services/sseService';

export async function POST(request: NextRequest) {
  try {
    const notificationData = await request.json();
    const sentCount = broadcastNotification(notificationData);
    return NextResponse.json({ message: 'Broadcast sent', sentTo: sentCount });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to broadcast' }, { status: 500 });
  }
}