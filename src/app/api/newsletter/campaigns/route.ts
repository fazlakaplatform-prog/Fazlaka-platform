import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const where: Record<string, unknown> = {};
    if (status) where.status = status;

    const [total, campaigns] = await Promise.all([
      prisma.newsletterCampaign.count({ where }),
      prisma.newsletterCampaign.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return NextResponse.json({
      success: true,
      data: campaigns,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Campaigns list error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    if (!body.subject) {
      return NextResponse.json({ success: false, error: 'SubjectRequired' }, { status: 400 });
    }

    const campaign = await prisma.newsletterCampaign.create({
      data: {
        subject: body.subject,
        subjectEn: body.subjectEn,
        previewText: body.previewText,
        previewTextEn: body.previewTextEn,
        content: body.content || [],
        contentEn: body.contentEn,
        status: 'DRAFT',
        targetTags: body.targetTags ? JSON.stringify(body.targetTags) : undefined,
        targetLanguages: body.targetLanguages,
        scheduledAt: body.scheduledAt ? new Date(body.scheduledAt) : undefined,
        createdBy: session.user.id,
      },
    });

    return NextResponse.json({ success: true, data: campaign });
  } catch (error) {
    console.error('Campaign create error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
