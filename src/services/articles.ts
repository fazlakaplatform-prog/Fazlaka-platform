import { prisma } from '@/lib/prisma';
import { Article, Season, Episode, Prisma } from '@prisma/client';
import { PortableTextBlock } from '@portabletext/types';

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

// Define an interface for the populated article
interface PopulatedArticle extends Article {
  season: (Season & { localizedTitle?: string }) | null;
  episode: (Episode & { localizedTitle?: string }) | null;
}

export interface ArticleWithLocalized extends Omit<Article, 'season' | 'episode'> {
  localizedTitle?: string;
  localizedExcerpt?: string | null;
  localizedContent?: PortableTextBlock[] | null;
  localizedFeaturedImageUrl?: string | null;
  season?: {
    id: string;
    title: string;
    titleEn?: string | null;
    slug: string;
    thumbnailUrl?: string | null;
    thumbnailUrlEn?: string | null;
    localizedTitle?: string;
  } | null;
  episode?: {
    id: string;
    title: string;
    titleEn?: string | null;
    slug: string;
    thumbnailUrl?: string | null;
    thumbnailUrlEn?: string | null;
    localizedTitle?: string;
  } | null;
}

function mapArticle(article: PopulatedArticle, language: string): ArticleWithLocalized {
  return {
    ...article,
    id: article.id,
    localizedTitle: language === 'ar' ? article.title : article.titleEn,
    localizedExcerpt: language === 'ar' ? article.excerpt : article.excerptEn,
    localizedContent: (language === 'ar' ? article.content : article.contentEn) as PortableTextBlock[] | null,
    localizedFeaturedImageUrl: language === 'ar' ? article.featuredImageUrl : article.featuredImageUrlEn,
    season: article.season ? {
      id: article.season.id,
      title: article.season.title,
      titleEn: article.season.titleEn,
      slug: article.season.slug,
      thumbnailUrl: article.season.thumbnailUrl,
      thumbnailUrlEn: article.season.thumbnailUrlEn,
      localizedTitle: language === 'ar' ? article.season.title : article.season.titleEn,
    } : null,
    episode: article.episode ? {
      id: article.episode.id,
      title: article.episode.title,
      titleEn: article.episode.titleEn,
      slug: article.episode.slug,
      thumbnailUrl: article.episode.thumbnailUrl,
      thumbnailUrlEn: article.episode.thumbnailUrlEn,
      localizedTitle: language === 'ar' ? article.episode.title : article.episode.titleEn,
    } : null,
  };
}

export async function fetchArticles(language: string = 'ar'): Promise<ArticleWithLocalized[]> {
  try {
    const articles = await prisma.article.findMany({
      include: {
        season: true,
        episode: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
    
    return articles.map(article => mapArticle(article as PopulatedArticle, language));
  } catch (error) {
    console.error('Error fetching articles from Prisma:', error);
    return [];
  }
}

export async function fetchArticleBySlug(slug: string, language: string = 'ar'): Promise<ArticleWithLocalized | null> {
  try {
    const article = await prisma.article.findUnique({
      where: { slug },
      include: {
        season: true,
        episode: true,
      },
    });
    
    if (!article) return null;
    
    return mapArticle(article as PopulatedArticle, language);
  } catch (error) {
    console.error('Error fetching article by slug from Prisma:', error);
    return null;
  }
}

export async function fetchArticleById(id: string, language: string = 'ar'): Promise<ArticleWithLocalized | null> {
  try {
    const article = await prisma.article.findUnique({
      where: { id },
      include: {
        season: true,
        episode: true,
      },
    });
    
    if (!article) return null;
    
    return mapArticle(article as PopulatedArticle, language);
  } catch (error) {
    console.error('Error fetching article by id from Prisma:', error);
    return null;
  }
}

export async function fetchArticlesBySeason(seasonId: string, language: string = 'ar'): Promise<ArticleWithLocalized[]> {
  try {
    const articles = await prisma.article.findMany({
      where: { seasonId },
      include: {
        season: true,
        episode: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
    
    return articles.map(article => mapArticle(article as PopulatedArticle, language));
  } catch (error) {
    console.error('Error fetching articles by season from Prisma:', error);
    return [];
  }
}

export async function createArticle(articleData: Partial<Article>): Promise<Article | null> {
  try {
    // Generate slug if not provided
    const slug = articleData.slug || generateSlug(articleData.titleEn || articleData.title || '');

    // Prepare data for creation
    // تم إصلاح الخطأ: استبدال any بـ Record<string, unknown>
    const data: Record<string, unknown> = {
      ...articleData,
      slug,
    };

    // Handle relations (assuming input has IDs for season and episode)
    if (articleData.seasonId) {
      data.season = { connect: { id: articleData.seasonId } };
      delete data.seasonId;
    }
    if (articleData.episodeId) {
      data.episode = { connect: { id: articleData.episodeId } };
      delete data.episodeId;
    }

    const newArticle = await prisma.article.create({ data: data as Prisma.ArticleCreateInput });
    return newArticle;
  } catch (error) {
    console.error('Error creating article in Prisma:', error);
    return null;
  }
}

export async function updateArticle(idOrSlug: string, articleData: Partial<Article>): Promise<Article | null> {
  try {
    // Find the article first to ensure we update by ID
    const article = await prisma.article.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      }
    });

    if (!article) return null;

    // تم إصلاح الخطأ: استبدال any بـ Record<string, unknown>
    const data: Record<string, unknown> = { ...articleData };

    // Handle relations
    if (articleData.seasonId) {
      data.season = { connect: { id: articleData.seasonId } };
      delete data.seasonId;
    }
    if (articleData.episodeId) {
      data.episode = { connect: { id: articleData.episodeId } };
      delete data.episodeId;
    }

    const updatedArticle = await prisma.article.update({
      where: { id: article.id },
      data: data as Prisma.ArticleUpdateInput,
    });
    
    return updatedArticle;
  } catch (error) {
    console.error('Error updating article in Prisma:', error);
    return null;
  }
}

export async function deleteArticle(idOrSlug: string): Promise<boolean> {
  try {
    const article = await prisma.article.findFirst({
      where: {
        OR: [
          { id: idOrSlug },
          { slug: idOrSlug }
        ]
      }
    });

    if (!article) return false;

    await prisma.article.delete({ where: { id: article.id } });
    return true;
  } catch (error) {
    console.error('Error deleting article from Prisma:', error);
    return false;
  }
}