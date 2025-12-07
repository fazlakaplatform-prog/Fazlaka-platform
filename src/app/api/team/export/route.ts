import { NextResponse } from 'next/server'; // <-- تم حذف NextRequest من هنا لأنه غير مستخدم -->
import { connectDB } from '@/lib/mongodb';
import Team from '@/models/Team';

// <-- تم حذف 'request: NextRequest' من هنا لأنه غير مستخدم -->
export async function POST() {
  try {
    await connectDB();
    
    // Sort by order field, then by creation date
    const teamMembers = await Team.find({}).sort({ order: 1, createdAt: 1 });
    
    return NextResponse.json({ teamMembers });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export team members' },
      { status: 500 }
    );
  }
}