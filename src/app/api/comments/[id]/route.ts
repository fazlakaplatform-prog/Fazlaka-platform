import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { updateComment, deleteComment } from '@/services/comments';
import { pusherServer } from '@/lib/pusher';
import { prisma } from '@/lib/prisma';

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const { content } = await request.json();
    if (!content) return NextResponse.json({ error: 'Content required' }, { status: 400 });

    const updated = await updateComment(id, session.user.id, content);
    
    // بث التحديث
    const contentId = updated.articleId || updated.episodeId;
    if (contentId) await pusherServer.trigger(`comments-${contentId}`, 'new-comment', {});

    return NextResponse.json({ success: true, comment: updated });
  } catch (error: unknown) {
    // تم إصلاح الخطأ: استخدام unknown بدلاً من any
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return NextResponse.json({ error: message }, { status: 500 }); 
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    const { id } = await params;
    const comment = await prisma.comment.findUnique({ where: { id } });
    if (!comment) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    if (session?.user?.id !== comment.userId && session?.user?.role !== 'ADMIN' && session?.user?.role !== 'OWNER') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const contentId = comment.articleId || comment.episodeId;
    await deleteComment(id);
    
    // بث التحديث
    if (contentId) await pusherServer.trigger(`comments-${contentId}`, 'new-comment', {});

    return NextResponse.json({ success: true });
  } catch (_error) { 
    // تم إصلاح التحذير: استخدام _error للإشارة إلى أن المتغير غير مستخدم عمداً
    return NextResponse.json({ error: 'Error deleting' }, { status: 500 }); 
  }
}