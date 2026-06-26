import { NextRequest, NextResponse } from 'next/server';
import { getUserIdFromRequest } from '@/lib/auth-helper';
import { updateComment, deleteComment } from '@/services/comments';
import { pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(request);
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const updated = await updateComment(id, userId, content);
    
    // بث التحديث
    const contentId = updated.articleId || updated.episodeId;
    if (contentId) await pusherServer.trigger(`comments-${contentId}`, 'new-comment', {});

    return NextResponse.json({ success: true, comment: updated });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 }); 
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = await getUserIdFromRequest(request);
    const { id } = await params;
    const comment = await prisma.comment.findUnique({ where: { id }, select: { userId: true, articleId: true, episodeId: true } });
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (userId !== comment.userId) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const contentId = comment.articleId || comment.episodeId;
    await deleteComment(id);
    
    if (contentId) await pusherServer.trigger(`comments-${contentId}`, 'new-comment', {});

    return NextResponse.json({ success: true });
  } catch (_error) { 
    return NextResponse.json({ error: 'Error deleting' }, { status: 500 }); 
  }
}