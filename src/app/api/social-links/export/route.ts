import { NextResponse } from 'next/server'; // <-- تم حذف NextRequest من هنا لأنه غير مستخدم -->
import { getDatabase } from '@/lib/mongodb';

export async function POST() {
  try {
    const db = await getDatabase();
    const socialLinks = await db.collection('socialLinks').find({}).sort({ order: 1, createdAt: -1 }).toArray();
    
    return NextResponse.json({ socialLinks });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export social links' },
      { status: 500 }
    );
  }
}