import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const subscriberId = searchParams.get('subscriberId');
    if (campaignId && subscriberId) {
      await prisma.newsletterCampaignSubscriber.updateMany({
        where: { campaignId, subscriberId, openedAt: null },
        data: { openedAt: new Date() },
      });
      await prisma.newsletterCampaign.update({ where: { id: campaignId }, data: { openCount: { increment: 1 } } }).catch(() => {});
      await prisma.newsletterSubscriber.update({ where: { id: subscriberId }, data: { openCount: { increment: 1 }, lastOpenedAt: new Date() } }).catch(() => {});
    }
    return new NextResponse(null, { status: 204, headers: { 'Content-Type': 'image/gif' } });
  } catch {
    return new NextResponse(null, { status: 204, headers: { 'Content-Type': 'image/gif' } });
  }
}
