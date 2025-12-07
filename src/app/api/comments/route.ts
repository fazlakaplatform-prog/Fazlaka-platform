import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { fetchComments, createComment, deleteComment } from '@/services/comments';

// واجهة لتمثيل البيانات الواردة من الطلب (كل الحقول كـ string كما تأتي من الـ client)
interface CommentDataForCreation {
  content: string;
  name: string;
  email?: string;
  userFirstName?: string;
  userLastName?: string;
  userImageUrl?: string;
  episode?: string;
  article?: string;
  userId?: string;
  parentComment?: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const episodeId = searchParams.get('episodeId');
    const articleId = searchParams.get('articleId');

    const comments = await fetchComments(
      articleId || undefined,
      episodeId || undefined
    );

    return NextResponse.json({ data: comments });
  } catch (error) {
    console.error('Error in GET /api/comments:', error);
    return NextResponse.json(
      { error: 'Failed to fetch comments' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as CommentDataForCreation;
    const {
      content,
      episode,
      article,
      name,
      email,
      userId,
      userFirstName,
      userLastName,
      userImageUrl,
      parentComment,
    } = body;

    if (!content || (!episode && !article) || !name) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // دالة مساعدة لتحويل أي معرف صالح إلى ObjectId، وإلا تعيد القيمة كما هي
    const toObjectIdIfValid = (id?: string) => {
      if (!id) return undefined;
      return mongoose.Types.ObjectId.isValid(id)
        ? new mongoose.Types.ObjectId(id)
        : id;
    };

    // تجهيز الحمولة التي سترسل إلى createComment
    const commentPayload: Record<string, unknown> = {
      content,
      name,
      email: email || '',
      userFirstName: userFirstName || '',
      userLastName: userLastName || '',
      userImageUrl: userImageUrl || '',
    };

    if (episode) {
      commentPayload.episode = toObjectIdIfValid(episode);
    }

    if (article) {
      commentPayload.article = toObjectIdIfValid(article);
    }

    if (userId) {
      commentPayload.userId = toObjectIdIfValid(userId);
    }

    if (parentComment) {
      commentPayload.parentComment = toObjectIdIfValid(parentComment);
    }

    // مرّر الحمولة إلى دالة الخدمة. نستخدم any/unknown لتحاشي تعارضات الأنواع بين واجهة الخدمة والنوع المحلي.
    const newComment = await createComment(commentPayload as unknown as Record<string, unknown>);

    if (!newComment) {
      return NextResponse.json(
        { error: 'Failed to create comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      id: String((newComment as unknown as Record<string, unknown>)._id),
      message: 'Comment created successfully',
    });
  } catch (error) {
    console.error('Error in POST /api/comments:', error);
    return NextResponse.json(
      { error: 'Failed to create comment' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const commentId = searchParams.get('id');

    if (!commentId) {
      return NextResponse.json(
        { error: 'Comment ID is required' },
        { status: 400 }
      );
    }

    const success = await deleteComment(commentId);

    if (!success) {
      return NextResponse.json(
        { error: 'Failed to delete comment' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    console.error('Error in DELETE /api/comments:', error);
    return NextResponse.json(
      { error: 'Failed to delete comment' },
      { status: 500 }
    );
  }
}
