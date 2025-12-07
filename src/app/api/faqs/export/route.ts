import { NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST() {
  try {
    // تم إزالة المتغير 'request' لأنه لم يعد مستخدمًا
    const db = await getDatabase();    
    const faqs = await db.collection('faqs').find({}).sort({ createdAt: -1 }).toArray();
    
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export FAQs' },
      { status: 500 }
    );
  }
}