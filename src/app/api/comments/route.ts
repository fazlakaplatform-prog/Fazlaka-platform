import { NextRequest, NextResponse } from 'next/server';
import { fetchComments, createComment } from '@/services/comments';
import { pusherServer } from '@/lib/pusher';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const articleId = searchParams.get('articleId');
  const episodeId = searchParams.get('episodeId');
  const comments = await fetchComments(articleId || undefined, episodeId || undefined);
  return NextResponse.json({ data: comments });
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { content, episode, article, name, email, userId, userFirstName, userLastName, userImageUrl, parentComment } = body;

  if (!content || (!episode && !article)) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  try {
    const newComment = await createComment({
      content, name, email, userId, userFirstName, userLastName, userImageUrl,
      episodeId: episode, articleId: article, parentId: parentComment,
    });

    // بث الإشعار للتحديث الفوري
    const contentId = article || episode;
    if (contentId) {
      console.log(`🚀 Triggering Pusher Event for channel: comments-${contentId}`);
      await pusherServer.trigger(`comments-${contentId}`, 'new-comment', {
        message: 'new-update'
      });
    }

    return NextResponse.json({ success: true, id: newComment.id });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}