import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'all';

    const whereDate: Record<string, unknown> = {};
    if (period === '7d') {
      const d = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      whereDate.createdAt = { gte: d };
    } else if (period === '30d') {
      const d = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      whereDate.createdAt = { gte: d };
    } else if (period === '90d') {
      const d = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
      whereDate.createdAt = { gte: d };
    }

    const [
      totalSubscribers,
      activeSubscribers,
      unsubscribedSubscribers,
      bouncedSubscribers,
      totalCampaigns,
      sentCampaigns,
      draftCampaigns,
      recentSubscribers,
    ] = await Promise.all([
      prisma.newsletterSubscriber.count(),
      prisma.newsletterSubscriber.count({ where: { status: 'ACTIVE', ...whereDate } }),
      prisma.newsletterSubscriber.count({ where: { status: 'UNSUBSCRIBED', ...whereDate } }),
      prisma.newsletterSubscriber.count({ where: { status: 'BOUNCED', ...whereDate } }),
      prisma.newsletterCampaign.count(),
      prisma.newsletterCampaign.count({ where: { status: 'SENT', ...whereDate } }),
      prisma.newsletterCampaign.count({ where: { status: 'DRAFT' } }),
      prisma.newsletterSubscriber.findMany({
        where: { ...whereDate },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: { id: true, email: true, name: true, status: true, createdAt: true },
      }),
    ]);

    const campaignAgg = await prisma.newsletterCampaign.aggregate({
      _sum: { openCount: true, clickCount: true, sentCount: true, failedCount: true, unsubscribeCount: true },
    });

    return NextResponse.json({
      success: true,
      data: {
        subscribers: {
          total: totalSubscribers,
          active: activeSubscribers,
          unsubscribed: unsubscribedSubscribers,
          bounced: bouncedSubscribers,
        },
        campaigns: {
          total: totalCampaigns,
          sent: sentCampaigns,
          drafts: draftCampaigns,
        },
        engagement: {
          totalSent: campaignAgg._sum.sentCount || 0,
          totalOpens: campaignAgg._sum.openCount || 0,
          totalClicks: campaignAgg._sum.clickCount || 0,
          totalFailed: campaignAgg._sum.failedCount || 0,
          totalUnsubscribes: campaignAgg._sum.unsubscribeCount || 0,
          openRate: campaignAgg._sum.sentCount ? ((campaignAgg._sum.openCount || 0) / campaignAgg._sum.sentCount * 100).toFixed(1) : '0',
          clickRate: campaignAgg._sum.sentCount ? ((campaignAgg._sum.clickCount || 0) / campaignAgg._sum.sentCount * 100).toFixed(1) : '0',
        },
        recentSubscribers,
      },
    });
  } catch (error) {
    console.error('Stats error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
