import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { contentId, contentType, slug, title } = await request.json();
    if (!contentId || !contentType) {
      return NextResponse.json({ success: false, error: 'MissingRequired' }, { status: 400 });
    }

    const session = await getServerSession(authOptions);
    const userId = session?.user?.id || null;

    const existing = await prisma.contentView.findUnique({
      where: { contentId_contentType_userId: { contentId, contentType, userId: userId || '' } },
    });

    if (existing) {
      await prisma.contentView.update({
        where: { id: existing.id },
        data: { count: { increment: 1 } },
      });
    } else {
      await prisma.contentView.create({
        data: { contentId, contentType, slug, title, userId, count: 1 },
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Track view error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
