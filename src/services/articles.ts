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
  localizedExcerptMobile?: string | null;
  localizedContentMobile?: string | null;
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
    localizedExcerptMobile: language === 'ar' ? article.excerptMobile : article.excerptMobileEn,
    localizedContentMobile: language === 'ar' ? article.contentMobile : article.contentMobileEn,
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
    const slug = articleData.slug || generateSlug(articleData.titleEn || articleData.title || '');

    const data: Record<string, unknown> = {
      title: articleData.title,
      titleEn: articleData.titleEn,
      slug,
      excerpt: articleData.excerpt,
      excerptEn: articleData.excerptEn,
      excerptMobile: articleData.excerptMobile,
      excerptMobileEn: articleData.excerptMobileEn,
      contentMobile: articleData.contentMobile,
      contentMobileEn: articleData.contentMobileEn,
      featuredImageUrl: articleData.featuredImageUrl,
      featuredImageUrlEn: articleData.featuredImageUrlEn,
    };

    // Handle JSON content fields
    if (articleData.content) {
      const raw = articleData.content;
      if (typeof raw === 'string' && (raw.trimStart().startsWith('{') || raw.trimStart().startsWith('['))) {
        try { data.content = JSON.parse(raw); } catch { data.content = raw; }
      } else {
        data.content = raw;
      }
    } else {
      data.content = Prisma.JsonNull;
    }
    if (articleData.contentEn) {
      const raw = articleData.contentEn;
      if (typeof raw === 'string' && (raw.trimStart().startsWith('{') || raw.trimStart().startsWith('['))) {
        try { data.contentEn = JSON.parse(raw); } catch { data.contentEn = raw; }
      } else {
        data.contentEn = raw;
      }
    } else {
      data.contentEn = Prisma.JsonNull;
    }

    // Handle relations
    if (articleData.seasonId) {
      data.season = { connect: { id: articleData.seasonId } };
    }
    if (articleData.episodeId) {
      data.episode = { connect: { id: articleData.episodeId } };
    }

    data.publishedAt = articleData.publishedAt ? new Date(articleData.publishedAt) : new Date();

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

    if (!article) {
      console.error('Article not found:', idOrSlug);
      return null;
    }

    // Build explicit update data — only known fields
    const data: Record<string, unknown> = {};

    if (articleData.title !== undefined) data.title = articleData.title;
    if (articleData.titleEn !== undefined) data.titleEn = articleData.titleEn;
    if (articleData.slug !== undefined) data.slug = articleData.slug;
    if (articleData.excerpt !== undefined) data.excerpt = articleData.excerpt;
    if (articleData.excerptEn !== undefined) data.excerptEn = articleData.excerptEn;
    if (articleData.excerptMobile !== undefined) data.excerptMobile = articleData.excerptMobile;
    if (articleData.excerptMobileEn !== undefined) data.excerptMobileEn = articleData.excerptMobileEn;
    if (articleData.featuredImageUrl !== undefined) data.featuredImageUrl = articleData.featuredImageUrl;
    if (articleData.featuredImageUrlEn !== undefined) data.featuredImageUrlEn = articleData.featuredImageUrlEn;
    if (articleData.contentMobile !== undefined) data.contentMobile = articleData.contentMobile;
    if (articleData.contentMobileEn !== undefined) data.contentMobileEn = articleData.contentMobileEn;

    // Handle JSON content fields — parse only if it looks like JSON
    if (articleData.content !== undefined) {
      const raw = articleData.content;
      if (typeof raw === 'string' && (raw.trimStart().startsWith('{') || raw.trimStart().startsWith('['))) {
        try { data.content = JSON.parse(raw); } catch { data.content = raw || Prisma.JsonNull; }
      } else {
        data.content = raw || Prisma.JsonNull;
      }
    }
    if (articleData.contentEn !== undefined) {
      const raw = articleData.contentEn;
      if (typeof raw === 'string' && (raw.trimStart().startsWith('{') || raw.trimStart().startsWith('['))) {
        try { data.contentEn = JSON.parse(raw); } catch { data.contentEn = raw || Prisma.JsonNull; }
      } else {
        data.contentEn = raw || Prisma.JsonNull;
      }
    }

    // Handle season relation
    if (articleData.seasonId !== undefined) {
      data.season = articleData.seasonId
        ? { connect: { id: articleData.seasonId } }
        : { disconnect: true };
    }

    // Handle episode relation
    if (articleData.episodeId !== undefined) {
      data.episode = articleData.episodeId
        ? { connect: { id: articleData.episodeId } }
        : { disconnect: true };
    }

    // Handle publishedAt
    if (articleData.publishedAt !== undefined) {
      data.publishedAt = articleData.publishedAt ? new Date(articleData.publishedAt) : null;
    }

    console.log('Updating article with data keys:', Object.keys(data));

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