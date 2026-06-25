import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { toggleCommentLike } from '@/services/comments';
import { pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Login required' }, { status: 401 });

    const { id } = await params;
    const comment = await prisma.comment.findUnique({ where: { id }, select: { articleId: true, episodeId: true } });
    if (!comment) return NextResponse.json({ error: 'Comment not found' }, { status: 404 });

    const result = await toggleCommentLike(id, session.user.id);
    
    // بث التحديث ليتم تحديث العداد عند الجميع
    const contentId = comment.articleId || comment.episodeId;
    if (contentId) await pusherServer.trigger(`comments-${contentId}`, 'new-comment', {});

    return NextResponse.json(result);
  } catch (error) { return NextResponse.json({ error: 'Error liking comment' }, { status: 500 }); }
}