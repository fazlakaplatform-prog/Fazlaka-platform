import { prisma } from '@/lib/prisma';

// واجهة للمحتوى العام
export interface ContentItem {
  id: string;
  title: string;
  titleEn?: string | null;
  slug: string;
  description?: string | null;
  descriptionEn?: string | null;
  excerpt?: string | null;
  excerptEn?: string | null;
  imageUrl?: string | null;
  imageUrlEn?: string | null;
  thumbnailUrl?: string | null;
  thumbnailUrlEn?: string | null;
  type: 'article' | 'episode' | 'season' | 'playlist';
  publishedAt?: Date | null;
  createdAt?: Date;
  updatedAt?: Date;
}

// جلب كل المحتوى
export async function fetchAllContent(): Promise<ContentItem[]> {
  try {
    // Use Promise.all for parallel fetching
    const [articles, episodes, seasons, playlists] = await Promise.all([
      prisma.article.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
      prisma.episode.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
      prisma.season.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
      prisma.playlist.findMany({ take: 20, orderBy: { createdAt: 'desc' } }),
    ]);
    
    // تحويل البيانات إلى تنسيق موحد
    const contentItems: ContentItem[] = [
      ...articles.map(article => ({
        id: article.id,
        title: article.title,
        titleEn: article.titleEn,
        slug: article.slug,
        description: article.excerpt,
        descriptionEn: article.excerptEn,
        excerpt: article.excerpt,
        excerptEn: article.excerptEn,
        imageUrl: article.featuredImageUrl,
        imageUrlEn: article.featuredImageUrlEn,
        type: 'article' as const,
        publishedAt: article.publishedAt,
        createdAt: article.createdAt,
        updatedAt: article.updatedAt
      })),
      ...episodes.map(episode => ({
        id: episode.id,
        title: episode.title,
        titleEn: episode.titleEn,
        slug: episode.slug,
        description: episode.description,
        descriptionEn: episode.descriptionEn,
        imageUrl: episode.thumbnailUrl,
        imageUrlEn: episode.thumbnailUrlEn,
        type: 'episode' as const,
        publishedAt: episode.publishedAt,
        createdAt: episode.createdAt,
        updatedAt: episode.updatedAt
      })),
      ...seasons.map(season => ({
        id: season.id,
        title: season.title,
        titleEn: season.titleEn,
        slug: season.slug,
        description: season.description,
        descriptionEn: season.descriptionEn,
        imageUrl: season.thumbnailUrl,
        imageUrlEn: season.thumbnailUrlEn,
        type: 'season' as const,
        publishedAt: season.publishedAt,
        createdAt: season.createdAt,
        updatedAt: season.updatedAt
      })),
      ...playlists.map(playlist => ({
        id: playlist.id,
        title: playlist.title,
        titleEn: playlist.titleEn,
        slug: playlist.slug,
        description: playlist.description,
        descriptionEn: playlist.descriptionEn,
        imageUrl: playlist.imageUrl,
        imageUrlEn: playlist.imageUrlEn,
        type: 'playlist' as const,
        createdAt: playlist.createdAt,
        updatedAt: playlist.updatedAt
      }))
    ];
    
    // ترتيب المحتوى حسب التاريخ (الأحدث أولاً)
    return contentItems.sort((a, b) => {
      const dateA = new Date(a.publishedAt || a.createdAt || 0);
      const dateB = new Date(b.publishedAt || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error fetching all content:', error);
    return [];
  }
}

// جلب محتوى حسب النوع
export async function fetchContentByType(type: string): Promise<ContentItem[]> {
  try {
    // Directly fetch from the correct table instead of filtering all content
    let items: ContentItem[] = [];

    if (type === 'article') {
      const data = await prisma.article.findMany({ orderBy: { createdAt: 'desc' } });
      items = data.map(d => ({ ...d, id: d.id, description: d.excerpt, descriptionEn: d.excerptEn, imageUrl: d.featuredImageUrl, imageUrlEn: d.featuredImageUrlEn, type: 'article' }));
    } else if (type === 'episode') {
      const data = await prisma.episode.findMany({ orderBy: { createdAt: 'desc' } });
      items = data.map(d => ({ ...d, id: d.id, imageUrl: d.thumbnailUrl, imageUrlEn: d.thumbnailUrlEn, type: 'episode' }));
    } else if (type === 'season') {
      const data = await prisma.season.findMany({ orderBy: { createdAt: 'desc' } });
      items = data.map(d => ({ ...d, id: d.id, imageUrl: d.thumbnailUrl, imageUrlEn: d.thumbnailUrlEn, type: 'season' }));
    } else if (type === 'playlist') {
      const data = await prisma.playlist.findMany({ orderBy: { createdAt: 'desc' } });
      items = data.map(d => ({ ...d, id: d.id, type: 'playlist' }));
    }

    return items;
  } catch (error) {
    console.error(`Error fetching content by type ${type}:`, error);
    return [];
  }
}

// جلب محتوى حسب المعرف أو الرابط
export async function fetchContentByIdOrSlug(
  idOrSlug: string, 
  type?: string
): Promise<ContentItem | null> {
  try {
    // تم إصلاح الخطأ: استبدال any بـ ContentItem | null
    const fetchers: Record<string, (q: string) => Promise<ContentItem | null>> = {
      article: async (q) => {
        const item = await prisma.article.findFirst({ where: { OR: [{ id: q }, { slug: q }] }});
        return item ? { ...item, type: 'article', description: item.excerpt, imageUrl: item.featuredImageUrl } : null;
      },
      episode: async (q) => {
        const item = await prisma.episode.findFirst({ where: { OR: [{ id: q }, { slug: q }] }});
        return item ? { ...item, type: 'episode', imageUrl: item.thumbnailUrl } : null;
      },
      season: async (q) => {
        const item = await prisma.season.findFirst({ where: { OR: [{ id: q }, { slug: q }] }});
        return item ? { ...item, type: 'season', imageUrl: item.thumbnailUrl } : null;
      },
      playlist: async (q) => {
        const item = await prisma.playlist.findFirst({ where: { OR: [{ id: q }, { slug: q }] }});
        return item ? { ...item, type: 'playlist' } : null;
      }
    };

    if (type && fetchers[type]) {
      return await fetchers[type](idOrSlug);
    } else {
      // Search all types if no type specified
      const allContent = await fetchAllContent();
      return allContent.find(item => item.id === idOrSlug || item.slug === idOrSlug) || null;
    }
  } catch (error) {
    console.error(`Error fetching content by ID or slug ${idOrSlug}:`, error);
    return null;
  }
}

// البحث عن المحتوى
export async function searchContent(
  query: string, 
  type?: string
): Promise<ContentItem[]> {
  try {
    // Prisma full-text search or contains logic
    const containsCondition = {
      OR: [
        { title: { contains: query, mode: 'insensitive' as const } },
        { titleEn: { contains: query, mode: 'insensitive' as const } },
        // Add other fields if necessary
      ]
    };

    // تم إصلاح الخطأ: استخدام const بدلاً من let لأن المتغير لا يعاد تعيينه
    const results: ContentItem[] = [];

    if (!type || type === 'article') {
      const articles = await prisma.article.findMany({ where: containsCondition });
      results.push(...articles.map(a => ({ ...a, id: a.id, type: 'article' as const, description: a.excerpt, imageUrl: a.featuredImageUrl })));
    }
    if (!type || type === 'episode') {
      const episodes = await prisma.episode.findMany({ where: containsCondition });
      results.push(...episodes.map(e => ({ ...e, id: e.id, type: 'episode' as const, imageUrl: e.thumbnailUrl })));
    }
    if (!type || type === 'season') {
      const seasons = await prisma.season.findMany({ where: containsCondition });
      results.push(...seasons.map(s => ({ ...s, id: s.id, type: 'season' as const, imageUrl: s.thumbnailUrl })));
    }
    if (!type || type === 'playlist') {
      const playlists = await prisma.playlist.findMany({ where: containsCondition });
      results.push(...playlists.map(p => ({ ...p, id: p.id, type: 'playlist' as const })));
    }

    return results;
  } catch (error) {
    console.error(`Error searching content with query ${query}:`, error);
    return [];
  }
}

// جلب المحتوى الشائع
export async function fetchPopularContent(limit: number = 10): Promise<ContentItem[]> {
  // For now, returning latest content as "popular"
  const allContent = await fetchAllContent();
  return allContent.slice(0, limit);
}

// جلب المحتوى ذي الصلة
export async function fetchRelatedContent(
  contentId: string, 
  contentType: string, 
  limit: number = 5
): Promise<ContentItem[]> {
  try {
    // Simple implementation: fetch latest of same type, excluding current
    const items = await fetchContentByType(contentType);
    return items.filter(item => item.id !== contentId).slice(0, limit);
  } catch (error) {
    console.error(`Error fetching related content for ${contentId}:`, error);
    return [];
  }
}