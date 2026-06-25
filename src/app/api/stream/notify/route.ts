import { NextRequest, NextResponse } from 'next/server';
import { sendToAllGeneralClients } from '@/services/sseService';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, data } = body;

    if (!type) {
      return NextResponse.json({ error: 'Missing "type"' }, { status: 400 });
    }
    
    sendToAllGeneralClients({ type, data });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}