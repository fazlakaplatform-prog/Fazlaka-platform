import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // تمت إضافة الاستيراد

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // التحقق من الصلاحيات
    // تمت إضافة "as string" هنا لتجنب الخطأ
    if (!session?.user || !['ADMIN', 'OWNER', 'EDITOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const tab = searchParams.get('tab'); // 'reported', 'episodes', 'articles', 'users'
    const search = searchParams.get('search'); // للبحث في المحتوى أو الاسم

    // 1. حالة البلاغات
    if (tab === 'reported') {
      const reports = await prisma.commentReport.findMany({
        where: { status: 'PENDING' },
        include: {
          comment: {
            include: {
              userRelation: { select: { id: true, name: true, email: true, image: true } },
              episode: { select: { id: true, title: true, slug: true } },
              article: { select: { id: true, title: true, slug: true } }
            }
          },
          user: { select: { id: true, name: true } } // المبلغ
        },
        orderBy: { createdAt: 'desc' }
      });
      return NextResponse.json({ data: reports, type: 'reports' });
    }

    // 2. حالة جلب التعليقات (كلها أو مصفاة)
    // تم إصلاح الخطأ هنا: استخدام نوع Prisma الصحيح
    const whereClause: Prisma.CommentWhereInput = {};

    if (search) {
        whereClause.OR = [
            { content: { contains: search, mode: 'insensitive' } },
            { userRelation: { name: { contains: search, mode: 'insensitive' } } }
        ];
    }

    if (tab === 'episodes') whereClause.episodeId = { not: null };
    if (tab === 'articles') whereClause.articleId = { not: null };
    
    const comments = await prisma.comment.findMany({
      where: whereClause,
      include: {
        userRelation: { select: { id: true, name: true, email: true, image: true, role: true } },
        episode: { select: { title: true, slug: true } },
        article: { select: { title: true, slug: true } },
        _count: { select: { likes: true, replies: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // جلب آخر 100 للإدارة
    });

    return NextResponse.json({ data: comments, type: 'comments' });

  } catch (error) {
    console.error('Admin fetch error:', error);
    return NextResponse.json({ error: 'Internal Error' }, { status: 500 });
  }
}