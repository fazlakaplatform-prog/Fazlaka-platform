import { prisma } from '@/lib/prisma';

// تعريف أنواع البيانات
interface FavoriteWithRelations {
  id: string;
  userId: string;
  episodeId: string | null;
  articleId: string | null;
  createdAt: Date;
  updatedAt: Date;
  episode?: {
    id: string;
    title: string;
    titleEn: string | null;
    slug: string;
    thumbnailUrl: string | null;
    thumbnailUrlEn: string | null;
  } | null;
  article?: {
    id: string;
    title: string;
    titleEn: string | null;
    slug: string;
    featuredImageUrl: string | null;
    featuredImageUrlEn: string | null;
  } | null;
}

export async function fetchUserFavorites(userId: string): Promise<FavoriteWithRelations[]> {
  try {
    const favorites = await prisma.favorite.findMany({
      where: { userId },
      include: {
        episode: {
          select: {
            id: true,
            title: true,
            titleEn: true,
            slug: true,
            thumbnailUrl: true,
            thumbnailUrlEn: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            titleEn: true,
            slug: true,
            featuredImageUrl: true,
            featuredImageUrlEn: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return favorites;
  } catch (error) {
    console.error('Error fetching user favorites from PostgreSQL:', error);
    return [];
  }
}

export async function checkFavorite(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<boolean> {
  try {
    const whereClause = contentType === 'episode' 
      ? { userId_episodeId: { userId, episodeId: contentId } }
      : { userId_articleId: { userId, articleId: contentId } };

    const favorite = await prisma.favorite.findUnique({
      where: whereClause,
    });

    return !!favorite;
  } catch (error) {
    console.error("Error checking favorite status:", error);
    return false;
  }
}

export async function addToFavorites(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<FavoriteWithRelations | null> {
  try {
    // التحقق مما إذا كان المحتوى موجوداً بالفعل في المفضلة
    const isAlreadyFavorite = await checkFavorite(userId, contentId, contentType);
    if (isAlreadyFavorite) {
      throw new Error('Content is already in favorites');
    }

    const data = contentType === 'episode' 
      ? { userId, episodeId: contentId }
      : { userId, articleId: contentId };

    const newFavorite = await prisma.favorite.create({
      data,
      include: {
        episode: {
          select: {
            id: true,
            title: true,
            titleEn: true,
            slug: true,
            thumbnailUrl: true,
            thumbnailUrlEn: true,
          },
        },
        article: {
          select: {
            id: true,
            title: true,
            titleEn: true,
            slug: true,
            featuredImageUrl: true,
            featuredImageUrlEn: true,
          },
        },
      },
    });

    return newFavorite;
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

export async function removeFromFavorites(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<boolean> {
  try {
    const whereClause = contentType === 'episode' 
      ? { userId_episodeId: { userId, episodeId: contentId } }
      : { userId_articleId: { userId, articleId: contentId } };

    await prisma.favorite.delete({
      where: whereClause,
    });

    return true;
  } catch (error) {
    console.error("Error removing from favorites:", error);
    throw error;
  }
}

export async function deleteFavorite(favoriteId: string): Promise<boolean> {
  try {
    await prisma.favorite.delete({
      where: { id: favoriteId },
    });
    return true;
  } catch (error) {
    console.error("Error deleting favorite:", error);
    return false;
  }
}

// دالة للحصول على عدد الإعجابات لمحتوى معين
export async function getFavoritesCount(contentId: string, contentType: 'episode' | 'article'): Promise<number> {
  try {
    const whereClause = contentType === 'episode' 
      ? { episodeId: contentId }
      : { articleId: contentId };

    const count = await prisma.favorite.count({
      where: whereClause,
    });

    return count;
  } catch (error) {
    console.error("Error getting favorites count:", error);
    return 0;
  }
}

// دالة للحصول على عدد الإعجابات لمحتوى متعدد
export async function getMultipleFavoritesCount(
  contentIds: string[], 
  contentType: 'episode' | 'article'
): Promise<{ [contentId: string]: number }> {
  try {
    const field = contentType === 'episode' ? 'episodeId' : 'articleId';

    const results = await prisma.favorite.groupBy({
      by: [field],
      where: {
        [field]: { in: contentIds },
      },
      _count: {
        id: true,
      },
    });

    // تحويل النتائج إلى كائن بسيط
    const counts: { [contentId: string]: number } = {};
    
    // تهيئة كل المعرفات بقيمة 0
    contentIds.forEach(id => {
      counts[id] = 0;
    });

    // تحديث القيم الفعلية
    results.forEach(result => {
      const id = result[field];
      if (id) {
        counts[id] = result._count.id;
      }
    });

    return counts;
  } catch (error) {
    console.error("Error getting multiple favorites count:", error);
    const counts: { [contentId: string]: number } = {};
    contentIds.forEach(id => {
      counts[id] = 0;
    });
    return counts;
  }
}