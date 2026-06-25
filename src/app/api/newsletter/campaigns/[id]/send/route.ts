import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { campaignHtml, sendEmail } from '@/lib/newsletter/email';
import { createTrackingPixel, wrapLinksWithTracking } from '@/lib/newsletter/tracking';
import { buildUnsubscribeUrl, createUnsubscribeToken } from '@/lib/newsletter/unsubscribe';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const campaign = await prisma.newsletterCampaign.findUnique({ where: { id } });
    if (!campaign) return NextResponse.json({ success: false, error: 'NotFound' }, { status: 404 });
    if (campaign.status === 'SENT' || campaign.status === 'SENDING') {
      return NextResponse.json({ success: false, error: 'AlreadySent' }, { status: 400 });
    }

    const where: Record<string, unknown> = { status: 'ACTIVE' };
    const targetTags = campaign.targetTags ? (typeof campaign.targetTags === 'string' ? JSON.parse(campaign.targetTags) : campaign.targetTags) : [];
    if (targetTags.length > 0) {
      where.OR = targetTags.map((tag: string) => ({ tags: { array_contains: tag } }));
    }
    if (campaign.targetLanguages) {
      const langs = campaign.targetLanguages.split(',');
      where.language = { in: langs };
    }

    let subscribers = await prisma.newsletterSubscriber.findMany({ where });
    let totalRecipients = subscribers.length;
    if (totalRecipients === 0 && session.user.email) {
      await prisma.newsletterSubscriber.upsert({
        where: { email: session.user.email },
        update: { status: 'ACTIVE' },
        create: { email: session.user.email, name: session.user.name || undefined, language: 'ar', status: 'ACTIVE' },
      });
      subscribers = await prisma.newsletterSubscriber.findMany({ where: { status: 'ACTIVE' } });
      totalRecipients = subscribers.length;
    }
    if (totalRecipients === 0) {
      return NextResponse.json({ success: false, error: 'NoSubscribers', message: 'لا يوجد مشتركون نشطون. اشترك أولاً في النشرة البريدية من الموقع أو أضف مشتركين من لوحة التحكم.' }, { status: 400 });
    }

    const isRTL = !campaign.subjectEn || (campaign.contentEn ? false : true);
    const subject = isRTL ? campaign.subject : (campaign.subjectEn || campaign.subject);
    const contentBlocks = isRTL ? (campaign.content as { html?: string; text?: string }[]) : ((campaign.contentEn as { html?: string; text?: string }[]) || (campaign.content as { html?: string; text?: string }[]));
    const htmlContent = contentBlocks.map((b: { html?: string; text?: string }) => b.html || b.text || '').join('');

    await prisma.newsletterCampaign.update({
      where: { id },
      data: { status: 'SENDING', totalRecipients, sentCount: 0, failedCount: 0 },
    });

    let sentCount = 0;
    let failedCount = 0;

    for (const sub of subscribers) {
      const unsubToken = await createUnsubscribeToken(sub.email);
      const unsubUrl = buildUnsubscribeUrl(sub.email, unsubToken);
      const trackingPixel = createTrackingPixel(id, sub.id);
      let personalizedHtml = htmlContent;
      personalizedHtml = personalizedHtml.replace(/\{\{NAME\}\}/g, sub.name || '');
      personalizedHtml = personalizedHtml.replace(/\{\{EMAIL\}\}/g, sub.email);
      personalizedHtml = wrapLinksWithTracking(personalizedHtml, id, sub.id);
      personalizedHtml += `<img src="${trackingPixel}" width="1" height="1" alt="" style="display:none" />`;
      const finalHtml = campaignHtml(subject, personalizedHtml, unsubUrl, sub.language !== 'en');

      try {
        await sendEmail(sub.email, subject, finalHtml);
        sentCount++;
        await prisma.newsletterCampaignSubscriber.create({
          data: { campaignId: id, subscriberId: sub.id, sentAt: new Date() },
        }).catch(() => {});
      } catch (e) {
        failedCount++;
        await prisma.newsletterCampaignSubscriber.create({
          data: { campaignId: id, subscriberId: sub.id, failed: true, failReason: e instanceof Error ? e.message : 'Unknown' },
        }).catch(() => {});
      }
    }

    await prisma.newsletterCampaign.update({
      where: { id },
      data: {
        status: failedCount === totalRecipients ? 'FAILED' : 'SENT',
        sentCount,
        failedCount,
        sentAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      data: { totalRecipients, sentCount, failedCount },
    });
  } catch (error) {
    console.error('Send campaign error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
