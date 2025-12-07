// src/services/content.ts

import { connectDB } from '@/lib/mongodb';
import Article from '@/models/Article';
import Episode from '@/models/Episode';
import Season from '@/models/Season';
import Playlist from '@/models/Playlist';
import mongoose from 'mongoose';

// تعريف واجهة لمحتوى PortableText
interface PortableTextBlock {
  _type: string;
  _key?: string;
  style?: string;
  markDefs?: Array<{
    _type: string;
    _key: string;
    [key: string]: unknown;
  }>;
  children: Array<{
    _type: string;
    text: string;
    marks?: string[];
  }>;
}

// واجهة للمحتوى العام
export interface ContentItem {
  id: string;
  title: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  excerpt?: string;
  excerptEn?: string;
  imageUrl?: string;
  imageUrlEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  type: 'article' | 'episode' | 'season' | 'playlist';
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

// تعريف أنواع للبيانات المسترجعة من MongoDB
interface RawArticle {
  _id: mongoose.Types.ObjectId;
  title: string;
  titleEn?: string;
  slug: string;
  excerpt?: string;
  excerptEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  season?: string;
  episode?: string;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v: number;
}

interface RawEpisode {
  _id: mongoose.Types.ObjectId;
  title: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  videoUrl?: string;
  videoUrlEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  season?: string;
  articles?: string[];
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v: number;
}

interface RawSeason {
  _id: mongoose.Types.ObjectId;
  title: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  episodes?: string[];
  articles?: string[];
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v: number;
}

interface RawPlaylist {
  _id: mongoose.Types.ObjectId;
  title: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  imageUrlEn?: string;
  episodes?: string[];
  articles?: string[];
  createdAt?: Date;
  updatedAt?: Date;
  __v: number;
}

// جلب كل المحتوى
export async function fetchAllContent(): Promise<ContentItem[]> {
  try {
    await connectDB();
    
    const articles = await Article.find({}).limit(20).lean() as RawArticle[];
    const episodes = await Episode.find({}).limit(20).lean() as RawEpisode[];
    const seasons = await Season.find({}).limit(20).lean() as RawSeason[];
    const playlists = await Playlist.find({}).limit(20).lean() as RawPlaylist[];
    
    // تحويل البيانات إلى تنسيق موحد
    const contentItems: ContentItem[] = [
      ...articles.map(article => ({
        id: article._id.toString(),
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
        id: episode._id.toString(),
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
        id: season._id.toString(),
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
        id: playlist._id.toString(),
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
    const allContent = await fetchAllContent();
    return allContent.filter(item => item.type === type);
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
    await connectDB();
    
    if (type) {
      // إذا تم تحديد النوع، استخدم الموديل المناسب
      switch (type) {
        case 'article':
          const article = await Article.findOne({ $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }).lean() as RawArticle | null;
          if (article) {
            return {
              id: article._id.toString(),
              title: article.title,
              titleEn: article.titleEn,
              slug: article.slug,
              description: article.excerpt,
              descriptionEn: article.excerptEn,
              excerpt: article.excerpt,
              excerptEn: article.excerptEn,
              imageUrl: article.featuredImageUrl,
              imageUrlEn: article.featuredImageUrlEn,
              type: 'article',
              publishedAt: article.publishedAt,
              createdAt: article.createdAt,
              updatedAt: article.updatedAt
            };
          }
          break;
        case 'episode':
          const episode = await Episode.findOne({ $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }).lean() as RawEpisode | null;
          if (episode) {
            return {
              id: episode._id.toString(),
              title: episode.title,
              titleEn: episode.titleEn,
              slug: episode.slug,
              description: episode.description,
              descriptionEn: episode.descriptionEn,
              imageUrl: episode.thumbnailUrl,
              imageUrlEn: episode.thumbnailUrlEn,
              type: 'episode',
              publishedAt: episode.publishedAt,
              createdAt: episode.createdAt,
              updatedAt: episode.updatedAt
            };
          }
          break;
        case 'season':
          const season = await Season.findOne({ $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }).lean() as RawSeason | null;
          if (season) {
            return {
              id: season._id.toString(),
              title: season.title,
              titleEn: season.titleEn,
              slug: season.slug,
              description: season.description,
              descriptionEn: season.descriptionEn,
              imageUrl: season.thumbnailUrl,
              imageUrlEn: season.thumbnailUrlEn,
              type: 'season',
              publishedAt: season.publishedAt,
              createdAt: season.createdAt,
              updatedAt: season.updatedAt
            };
          }
          break;
        case 'playlist':
          const playlist = await Playlist.findOne({ $or: [{ _id: idOrSlug }, { slug: idOrSlug }] }).lean() as RawPlaylist | null;
          if (playlist) {
            return {
              id: playlist._id.toString(),
              title: playlist.title,
              titleEn: playlist.titleEn,
              slug: playlist.slug,
              description: playlist.description,
              descriptionEn: playlist.descriptionEn,
              imageUrl: playlist.imageUrl,
              imageUrlEn: playlist.imageUrlEn,
              type: 'playlist',
              createdAt: playlist.createdAt,
              updatedAt: playlist.updatedAt
            };
          }
          break;
      }
    } else {
      // إذا لم يتم تحديد النوع، ابحث في كل المحتوى
      const allContent = await fetchAllContent();
      return allContent.find(item => item.id === idOrSlug || item.slug === idOrSlug) || null;
    }
    
    return null;
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
    const allContent = await fetchAllContent();
    let results = allContent;
    
    // تصفية حسب النوع إذا تم تحديده
    if (type) {
      results = results.filter(item => item.type === type);
    }
    
    // البحث في العناوين والأوصاف
    const normalizedQuery = query.toLowerCase();
    return results.filter(item => 
      item.title.toLowerCase().includes(normalizedQuery) ||
      (item.titleEn && item.titleEn.toLowerCase().includes(normalizedQuery)) ||
      (item.description && item.description.toLowerCase().includes(normalizedQuery)) ||
      (item.descriptionEn && item.descriptionEn.toLowerCase().includes(normalizedQuery)) ||
      (item.excerpt && item.excerpt.toLowerCase().includes(normalizedQuery)) ||
      (item.excerptEn && item.excerptEn.toLowerCase().includes(normalizedQuery))
    );
  } catch (error) {
    console.error(`Error searching content with query ${query}:`, error);
    return [];
  }
}

// جلب المحتوى الشائع
export async function fetchPopularContent(limit: number = 10): Promise<ContentItem[]> {
  try {
    // في تطبيق حقيقي، ستقوم بتحليل شعبية المحتوى بناءً على المشاهدات والتفاعلات
    // للتبسيط، سنرجع المحتوى الأحدث
    const allContent = await fetchAllContent();
    return allContent.slice(0, limit);
  } catch (error) {
    console.error('Error fetching popular content:', error);
    return [];
  }
}

// جلب المحتوى ذي الصلة
export async function fetchRelatedContent(
  contentId: string, 
  contentType: string, 
  limit: number = 5
): Promise<ContentItem[]> {
  try {
    const content = await fetchContentByIdOrSlug(contentId, contentType);
    if (!content) {
      return [];
    }
    
    // جلب كل المحتوى من نفس النوع
    const sameTypeContent = await fetchContentByType(contentType);
    
    // استبعاد المحتوى الحالي
    const otherContent = sameTypeContent.filter(item => item.id !== contentId);
    
    // في تطبيق حقيقي، ستستخدم خوارزمية أكثر تعقيداً لتحديد المحتوى ذي الصلة
    // للتبسيط، سنرجع المحتوى الأحدث من نفس النوع
    return otherContent.slice(0, limit);
  } catch (error) {
    console.error(`Error fetching related content for ${contentId}:`, error);
    return [];
  }
}