import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const campaignId = searchParams.get('campaignId');
    const subscriberId = searchParams.get('subscriberId');
    const url = searchParams.get('url');

    if (campaignId && subscriberId) {
      await prisma.newsletterCampaignSubscriber.updateMany({
        where: { campaignId, subscriberId },
        data: { clickedAt: new Date(), clickCount: { increment: 1 } },
      });
      await prisma.newsletterCampaign.update({ where: { id: campaignId }, data: { clickCount: { increment: 1 } } }).catch(() => {});
      await prisma.newsletterSubscriber.update({ where: { id: subscriberId }, data: { clickCount: { increment: 1 }, lastClickedAt: new Date() } }).catch(() => {});
    }

    if (url) {
      return NextResponse.redirect(url);
    }
    return NextResponse.redirect(new URL('/', request.url));
  } catch {
    return NextResponse.redirect(new URL('/', request.url));
  }
}
