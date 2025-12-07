import { NextResponse } from 'next/server'; // <-- تم حذف NextRequest من هنا لأنه غير مستخدم -->
import { getDatabase } from '@/lib/mongodb';

// <-- تم حذف 'request: NextRequest' من هنا لأنه غير مستخدم -->
export async function POST() {
  try {
    const db = await getDatabase();
    const terms = await db.collection('termsContent').find({}).sort({ sectionType: 1, title: 1 }).toArray();
    
    return NextResponse.json({ terms });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export terms' },
      { status: 500 }
    );
  }
}