import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { reportComment } from '@/services/comments';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const { id } = await params;
    const { reason } = await request.json();

    if (!reason || reason.length < 5) {
      return NextResponse.json({ error: 'Reason too short' }, { status: 400 });
    }

    await reportComment(id, session.user.id, reason);
    return NextResponse.json({ success: true, message: 'Report submitted' });
  } catch (error: unknown) {
    // تم إصلاح الخطأ: استخدام unknown بدلاً من any والتحقق من النوع
    let message = 'An unexpected error occurred';
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}