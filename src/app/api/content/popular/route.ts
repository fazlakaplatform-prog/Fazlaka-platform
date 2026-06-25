import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const contentType = searchParams.get('type') || 'EPISODE';
    const limit = parseInt(searchParams.get('limit') || '6');

    const views = await prisma.contentView.groupBy({
      by: ['contentId', 'contentType', 'slug', 'title'],
      where: { contentType },
      _sum: { count: true },
      orderBy: { _sum: { count: 'desc' } },
      take: limit,
    });

    const ids = views.map(v => v.contentId);

    type ContentItem = { id: string; slug: string; title: string; titleEn: string | null };
    let items: ContentItem[] = [];
    if (contentType === 'EPISODE' && ids.length > 0) {
      items = await prisma.episode.findMany({
        where: { id: { in: ids } },
        select: { id: true, slug: true, title: true, titleEn: true, thumbnailUrl: true, description: true },
      }) as unknown as ContentItem[];
    } else if (contentType === 'ARTICLE' && ids.length > 0) {
      items = await prisma.article.findMany({
        where: { id: { in: ids } },
        select: { id: true, slug: true, title: true, titleEn: true, featuredImageUrl: true, excerpt: true },
      }) as unknown as ContentItem[];
    }

    const data = views.map(v => ({
      ...v,
      item: items.find(i => i.id === v.contentId) || null,
    }));

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Popular content error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
