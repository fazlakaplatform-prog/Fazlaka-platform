import { prisma } from '@/lib/prisma';

export interface CommentWithReplies {
  id: string;
  content: string;
  userId: string | null;
  email: string | null;
  name: string | null;
  userFirstName: string | null;
  userLastName: string | null;
  userImageUrl: string | null;
  createdAt: Date;
  isEdited: boolean;
  episodeId: string | null;
  articleId: string | null;
  parentId: string | null;
  likes?: { id: string }[]; 
  dislikes?: { id: string }[]; // جديد
  _count?: { likes: number; dislikes: number }; // جديد
  replies?: CommentWithReplies[];
  userRelation?: {
    id: string;
    name: string | null;
    image: string | null;
    role?: string;
  } | null;
}

// تعريف واجهة لبيانات إنشاء التعليق
interface CreateCommentInput {
  content: string;
  name?: string | null;
  email?: string | null;
  userId?: string | null;
  userFirstName?: string | null;
  userLastName?: string | null;
  userImageUrl?: string | null;
  episodeId?: string | null;
  articleId?: string | null;
  parentId?: string | null;
}

export async function fetchComments(
  articleId?: string,
  episodeId?: string
): Promise<CommentWithReplies[]> {
  try {
    // تم إصلاح الخطأ: استبدال any بنوع محدد
    const whereClause: { articleId?: string; episodeId?: string } = {};
    if (articleId) whereClause.articleId = articleId;
    else if (episodeId) whereClause.episodeId = episodeId;
    else return [];

    const allComments = await prisma.comment.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      include: {
        userRelation: {
          select: { id: true, name: true, image: true, role: true }
        },
        likes: {
          select: { userId: true }
        },
        dislikes: {
          select: { userId: true }
        },
        _count: {
          select: { likes: true, dislikes: true }
        }
      }
    });

    const commentMap = new Map<string, CommentWithReplies>();
    const rootComments: CommentWithReplies[] = [];

    allComments.forEach((comment) => {
      const formattedLikes = comment.likes.map(l => ({ id: l.userId }));
      const formattedDislikes = comment.dislikes.map(l => ({ id: l.userId }));
      
      commentMap.set(comment.id, { 
        ...comment, 
        likes: formattedLikes,
        dislikes: formattedDislikes,
        replies: [] 
      });
    });

    allComments.forEach((comment) => {
      const current = commentMap.get(comment.id)!;
      if (comment.parentId) {
        const parent = commentMap.get(comment.parentId);
        if (parent) {
          parent.replies!.push(current);
        }
      } else {
        rootComments.push(current);
      }
    });

    // ترتيب الردود تصاعدياً
    const sortReplies = (comments: CommentWithReplies[]) => {
      comments.forEach(c => {
        if (c.replies && c.replies.length > 0) {
          c.replies.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          sortReplies(c.replies);
        }
      });
    };
    sortReplies(rootComments);

    return rootComments;
  } catch (error) {
    console.error('Error fetching comments:', error);
    return [];
  }
}

// تم إصلاح الخطأ: استخدام الواجهة المحددة بدلاً من any
export async function createComment(data: CreateCommentInput) {
  return prisma.comment.create({
    data: {
      content: data.content,
      name: data.name,
      email: data.email,
      userId: data.userId,
      userFirstName: data.userFirstName,
      userLastName: data.userLastName,
      userImageUrl: data.userImageUrl,
      episodeId: data.episodeId,
      articleId: data.articleId,
      parentId: data.parentId,
    },
  });
}

export async function deleteComment(commentId: string) {
  return prisma.comment.delete({
    where: { id: commentId },
  });
}

export async function updateComment(commentId: string, userId: string, content: string) {
  const comment = await prisma.comment.findUnique({ where: { id: commentId } });
  if (!comment || comment.userId !== userId) {
    throw new Error('Unauthorized or Comment not found');
  }
  return prisma.comment.update({
    where: { id: commentId },
    data: { content, isEdited: true, updatedAt: new Date() },
  });
}

// منطق الإعجاب وعدم الإعجاب (تبادلي)
export async function toggleCommentLike(commentId: string, userId: string) {
  const existingLike = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });
  const existingDislike = await prisma.commentDislike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  // إذا كان قد ضغط عدم إعجاب، قم بإزالته أولاً
  if (existingDislike) {
    await prisma.commentDislike.delete({ where: { id: existingDislike.id } });
  }

  if (existingLike) {
    await prisma.commentLike.delete({ where: { id: existingLike.id } });
    return { liked: false };
  } else {
    await prisma.commentLike.create({ data: { userId, commentId } });
    return { liked: true };
  }
}

export async function toggleCommentDislike(commentId: string, userId: string) {
  const existingLike = await prisma.commentLike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });
  const existingDislike = await prisma.commentDislike.findUnique({
    where: { userId_commentId: { userId, commentId } },
  });

  // إذا كان قد ضغط إعجاب، قم بإزالته أولاً
  if (existingLike) {
    await prisma.commentLike.delete({ where: { id: existingLike.id } });
  }

  if (existingDislike) {
    await prisma.commentDislike.delete({ where: { id: existingDislike.id } });
    return { disliked: false };
  } else {
    await prisma.commentDislike.create({ data: { userId, commentId } });
    return { disliked: true };
  }
}

export async function reportComment(commentId: string, userId: string, reason: string) {
  const existing = await prisma.commentReport.findFirst({
    where: { commentId, userId }
  });
  if (existing) throw new Error('Already reported');
  return prisma.commentReport.create({
    data: { commentId, userId, reason },
  });
}