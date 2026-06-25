import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const campaign = await prisma.newsletterCampaign.findUnique({
      where: { id },
      include: {
        subscribers: {
          include: { subscriber: { select: { id: true, email: true, name: true, language: true } } },
          orderBy: { sentAt: 'desc' },
          take: 50,
        },
      },
    });
    if (!campaign) return NextResponse.json({ success: false, error: 'NotFound' }, { status: 404 });
    return NextResponse.json({ success: true, data: { ...campaign, campaignSubscribers: campaign.subscribers } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.newsletterCampaign.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'NotFound' }, { status: 404 });
    if (existing.status === 'SENT' || existing.status === 'SENDING') {
      return NextResponse.json({ success: false, error: 'CampaignAlreadySent' }, { status: 400 });
    }

    const body = await request.json();
    const data: Record<string, unknown> = {};
    if (body.subject !== undefined) data.subject = body.subject;
    if (body.subjectEn !== undefined) data.subjectEn = body.subjectEn;
    if (body.previewText !== undefined) data.previewText = body.previewText;
    if (body.previewTextEn !== undefined) data.previewTextEn = body.previewTextEn;
    if (body.content !== undefined) data.content = body.content;
    if (body.contentEn !== undefined) data.contentEn = body.contentEn;
    if (body.targetTags !== undefined) data.targetTags = JSON.stringify(body.targetTags);
    if (body.targetLanguages !== undefined) data.targetLanguages = body.targetLanguages;
    if (body.scheduledAt !== undefined) data.scheduledAt = body.scheduledAt ? new Date(body.scheduledAt) : null;
    if (body.status !== undefined) data.status = body.status;

    const updated = await prisma.newsletterCampaign.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const existing = await prisma.newsletterCampaign.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'NotFound' }, { status: 404 });
    if (existing.status === 'SENDING') {
      return NextResponse.json({ success: false, error: 'CampaignSending' }, { status: 400 });
    }
    await prisma.newsletterCampaign.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
