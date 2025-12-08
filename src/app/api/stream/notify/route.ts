// File: src/app/api/stream/notify/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { sendToAllClients } from '../streamClients';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type) {
      return NextResponse.json(
        { error: 'Missing "type" in request body' },
        { status: 400 }
      );
    }
    
    // إرسال البيانات لجميع العملاء المتصلين باستخدام الدالة المركزية
    sendToAllClients({ type, data });
    
    return NextResponse.json({ success: true, message: 'Notification sent to all clients.' });
  } catch (error: unknown) {
    console.error('Error in stream notify API:', error);
    return NextResponse.json(
      { error: 'Failed to send notification' },
      { status: 500 }
    );
  }
}