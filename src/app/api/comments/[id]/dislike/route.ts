import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toggleCommentDislike } from '@/services/comments';
import { pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. التحقق من تسجيل الدخول
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Login required' }, { status: 401 });
    }

    const { id } = await params;
    
    // 2. جلب التعليق لمعرفة المحتوى التابع له (للإشعار)
    const comment = await prisma.comment.findUnique({
      where: { id },
      select: { articleId: true, episodeId: true }
    });

    if (!comment) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 });
    }

    // 3. تنفيذ عملية عدم الإعجاب (تبديلية)
    const result = await toggleCommentDislike(id, session.user.id);
    
    // 4. بث التحديث الفوري عبر Pusher
    const contentId = comment.articleId || comment.episodeId;
    if (contentId) {
      await pusherServer.trigger(`comments-${contentId}`, 'new-comment', {});
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Dislike Error:", error);
    return NextResponse.json({ error: 'Error disliking comment' }, { status: 500 });
  }
}