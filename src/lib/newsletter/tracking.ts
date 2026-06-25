import { prisma } from '@/lib/prisma';

export async function trackOpen(campaignId: string, subscriberId: string) {
  await prisma.newsletterCampaignSubscriber.updateMany({
    where: { campaignId, subscriberId, openedAt: null },
    data: { openedAt: new Date() },
  });
  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: { openCount: { increment: 1 } },
  });
  await prisma.newsletterSubscriber.update({
    where: { id: subscriberId },
    data: { openCount: { increment: 1 }, lastOpenedAt: new Date() },
  });
}

export async function trackClick(campaignId: string, subscriberId: string) {
  await prisma.newsletterCampaignSubscriber.updateMany({
    where: { campaignId, subscriberId },
    data: {
      clickedAt: new Date(),
      clickCount: { increment: 1 },
    },
  });
  await prisma.newsletterCampaign.update({
    where: { id: campaignId },
    data: { clickCount: { increment: 1 } },
  });
  await prisma.newsletterSubscriber.update({
    where: { id: subscriberId },
    data: { clickCount: { increment: 1 }, lastClickedAt: new Date() },
  });
}

export function createTrackingPixel(campaignId: string, subscriberId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/newsletter/track/open?campaignId=${campaignId}&subscriberId=${subscriberId}`;
}

export function wrapLinksWithTracking(html: string, campaignId: string, subscriberId: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return html.replace(/href="(https?:\/\/[^"]+)"/g, (match, url) => {
    return `href="${baseUrl}/api/newsletter/track/click?campaignId=${campaignId}&subscriberId=${subscriberId}&url=${encodeURIComponent(url)}"`;
  });
}
