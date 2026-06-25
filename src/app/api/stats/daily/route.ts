import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [totalUsers, newUsersToday, totalSubs, newSubsToday, totalEpisodes, totalArticles, viewsToday, viewsWeek, dailyViews] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: today } } }),
      prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE' } }),
      prisma.newsletterSubscriber.count({ where: { subscribedAt: { gte: today }, status: 'ACTIVE' } }),
      prisma.episode.count(),
      prisma.article.count(),
      prisma.contentView.count({ where: { createdAt: { gte: today } } }),
      prisma.contentView.count({ where: { createdAt: { gte: weekAgo } } }),
      prisma.contentView.findMany({
        where: { createdAt: { gte: monthAgo } },
        select: { createdAt: true, count: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: {
        users: { total: totalUsers, newToday: newUsersToday },
        subscribers: { total: totalSubs, newToday: newSubsToday },
        content: { episodes: totalEpisodes, articles: totalArticles },
        views: { today: viewsToday, week: viewsWeek },
        dailyViews: dailyViews.map(d => ({ date: d.createdAt.toISOString().split('T')[0], views: d.count })),
      },
    });
  } catch (error) {
    console.error('Daily stats error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
