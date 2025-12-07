import { connectDB } from '@/lib/mongodb';
import Article, { IArticle } from '@/models/Article';
import { PortableTextBlock } from '@portabletext/types';

// تعريف واجهة للكائنات الموسمية والحلقات
interface SeasonObject {
  _id: { toString(): string };
  title: string;
  titleEn?: string;
  slug: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
}

interface EpisodeObject {
  _id: { toString(): string };
  title: string;
  titleEn?: string;
  slug: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
}

// تعريف واجهة للمحتوى الموسع مع الحقول المترجمة
// نستخدم Omit لإزالة خصائص season و episode من IArticle ثم نضيفها من جديد بالأنواع الصحيحة
export interface ArticleWithLocalized extends Omit<IArticle, 'season' | 'episode'> {
  localizedTitle?: string;
  localizedExcerpt?: string;
  localizedContent?: PortableTextBlock[] | undefined;
  localizedFeaturedImageUrl?: string;
  season?: {
    _id: string;
    title: string;
    titleEn?: string;
    slug: string;
    thumbnailUrl?: string;
    thumbnailUrlEn?: string;
    localizedTitle?: string;
  };
  episode?: {
    _id: string;
    title: string;
    titleEn?: string;
    slug: string;
    thumbnailUrl?: string;
    thumbnailUrlEn?: string;
    localizedTitle?: string;
  };
}

export async function fetchArticles(language: string = 'ar'): Promise<ArticleWithLocalized[]> {
  try {
    await connectDB();
    
    const articles = await Article.find({})
      .populate({
        path: 'season',
        select: '_id title titleEn slug thumbnailUrl thumbnailUrlEn'
      })
      .populate({
        path: 'episode',
        select: '_id title titleEn slug thumbnailUrl thumbnailUrlEn'
      })
      .sort({ publishedAt: -1 });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return articles.map(article => {
      const articleObj = article.toObject();
      const seasonObj = articleObj.season as SeasonObject | undefined;
      const episodeObj = articleObj.episode as EpisodeObject | undefined;

      return {
        ...articleObj,
        _id: article._id.toString(), // تحويل ObjectId إلى string
        localizedTitle: language === 'ar' ? article.title : article.titleEn,
        localizedExcerpt: language === 'ar' ? article.excerpt : article.excerptEn,
        localizedContent: language === 'ar' ? article.content : article.contentEn,
        localizedFeaturedImageUrl: language === 'ar' ? article.featuredImageUrl : article.featuredImageUrlEn,
        // Ensure season and episode are properly populated
        season: seasonObj ? {
          _id: seasonObj._id.toString(), // تحويل ObjectId إلى string
          title: seasonObj.title || '',
          titleEn: seasonObj.titleEn || '',
          slug: seasonObj.slug,
          thumbnailUrl: seasonObj.thumbnailUrl || '',
          thumbnailUrlEn: seasonObj.thumbnailUrlEn || '',
          localizedTitle: language === 'ar' ? seasonObj.title : seasonObj.titleEn,
        } : undefined,
        episode: episodeObj ? {
          _id: episodeObj._id.toString(), // تحويل ObjectId إلى string
          title: episodeObj.title || '',
          titleEn: episodeObj.titleEn || '',
          slug: episodeObj.slug,
          thumbnailUrl: episodeObj.thumbnailUrl || '',
          thumbnailUrlEn: episodeObj.thumbnailUrlEn || '',
          localizedTitle: language === 'ar' ? episodeObj.title : episodeObj.titleEn,
        } : undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching articles from MongoDB:', error);
    return [];
  }
}

export async function fetchArticleBySlug(slug: string, language: string = 'ar'): Promise<ArticleWithLocalized | null> {
  try {
    await connectDB();
    
    const article = await Article.findOne({ slug })
      .populate({
        path: 'season',
        select: '_id title titleEn slug thumbnailUrl thumbnailUrlEn'
      })
      .populate({
        path: 'episode',
        select: '_id title titleEn slug thumbnailUrl thumbnailUrlEn'
      });
    
    if (!article) return null;
    
    const articleObj = article.toObject();
    const seasonObj = articleObj.season as SeasonObject | undefined;
    const episodeObj = articleObj.episode as EpisodeObject | undefined;

    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...articleObj,
      _id: article._id.toString(), // تحويل ObjectId إلى string
      localizedTitle: language === 'ar' ? article.title : article.titleEn,
      localizedExcerpt: language === 'ar' ? article.excerpt : article.excerptEn,
      localizedContent: language === 'ar' ? article.content : article.contentEn,
      localizedFeaturedImageUrl: language === 'ar' ? article.featuredImageUrl : article.featuredImageUrlEn,
      // Ensure season and episode are properly populated
      season: seasonObj ? {
        _id: seasonObj._id.toString(), // تحويل ObjectId إلى string
        title: seasonObj.title || '',
        titleEn: seasonObj.titleEn || '',
        slug: seasonObj.slug,
        thumbnailUrl: seasonObj.thumbnailUrl || '',
        thumbnailUrlEn: seasonObj.thumbnailUrlEn || '',
        localizedTitle: language === 'ar' ? seasonObj.title : seasonObj.titleEn,
      } : undefined,
      episode: episodeObj ? {
        _id: episodeObj._id.toString(), // تحويل ObjectId إلى string
        title: episodeObj.title || '',
        titleEn: episodeObj.titleEn || '',
        slug: episodeObj.slug,
        thumbnailUrl: episodeObj.thumbnailUrl || '',
        thumbnailUrlEn: episodeObj.thumbnailUrlEn || '',
        localizedTitle: language === 'ar' ? episodeObj.title : episodeObj.titleEn,
      } : undefined,
    };
  } catch (error) {
    console.error('Error fetching article by slug from MongoDB:', error);
    return null;
  }
}

export async function fetchArticleById(id: string, language: string = 'ar'): Promise<ArticleWithLocalized | null> {
  try {
    await connectDB();
    
    const article = await Article.findById(id)
      .populate({
        path: 'season',
        select: '_id title titleEn slug thumbnailUrl thumbnailUrlEn'
      })
      .populate({
        path: 'episode',
        select: '_id title titleEn slug thumbnailUrl thumbnailUrlEn'
      });
    
    if (!article) return null;
    
    const articleObj = article.toObject();
    const seasonObj = articleObj.season as SeasonObject | undefined;
    const episodeObj = articleObj.episode as EpisodeObject | undefined;

    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...articleObj,
      _id: article._id.toString(), // تحويل ObjectId إلى string
      localizedTitle: language === 'ar' ? article.title : article.titleEn,
      localizedExcerpt: language === 'ar' ? article.excerpt : article.excerptEn,
      localizedContent: language === 'ar' ? article.content : article.contentEn,
      localizedFeaturedImageUrl: language === 'ar' ? article.featuredImageUrl : article.featuredImageUrlEn,
      // Ensure season and episode are properly populated
      season: seasonObj ? {
        _id: seasonObj._id.toString(), // تحويل ObjectId إلى string
        title: seasonObj.title || '',
        titleEn: seasonObj.titleEn || '',
        slug: seasonObj.slug,
        thumbnailUrl: seasonObj.thumbnailUrl || '',
        thumbnailUrlEn: seasonObj.thumbnailUrlEn || '',
        localizedTitle: language === 'ar' ? seasonObj.title : seasonObj.titleEn,
      } : undefined,
      episode: episodeObj ? {
        _id: episodeObj._id.toString(), // تحويل ObjectId إلى string
        title: episodeObj.title || '',
        titleEn: episodeObj.titleEn || '',
        slug: episodeObj.slug,
        thumbnailUrl: episodeObj.thumbnailUrl || '',
        thumbnailUrlEn: episodeObj.thumbnailUrlEn || '',
        localizedTitle: language === 'ar' ? episodeObj.title : episodeObj.titleEn,
      } : undefined,
    };
  } catch (error) {
    console.error('Error fetching article by id from MongoDB:', error);
    return null;
  }
}

export async function fetchArticlesBySeason(seasonId: string, language: string = 'ar'): Promise<ArticleWithLocalized[]> {
  try {
    await connectDB();
    
    const articles = await Article.find({ season: seasonId })
      .populate({
        path: 'season',
        select: '_id title titleEn slug thumbnailUrl thumbnailUrlEn'
      })
      .populate({
        path: 'episode',
        select: '_id title titleEn slug thumbnailUrl thumbnailUrlEn'
      })
      .sort({ publishedAt: -1 });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return articles.map(article => {
      const articleObj = article.toObject();
      const seasonObj = articleObj.season as SeasonObject | undefined;
      const episodeObj = articleObj.episode as EpisodeObject | undefined;

      return {
        ...articleObj,
        _id: article._id.toString(), // تحويل ObjectId إلى string
        localizedTitle: language === 'ar' ? article.title : article.titleEn,
        localizedExcerpt: language === 'ar' ? article.excerpt : article.excerptEn,
        localizedContent: language === 'ar' ? article.content : article.contentEn,
        localizedFeaturedImageUrl: language === 'ar' ? article.featuredImageUrl : article.featuredImageUrlEn,
        // Ensure season and episode are properly populated
        season: seasonObj ? {
          _id: seasonObj._id.toString(), // تحويل ObjectId إلى string
          title: seasonObj.title || '',
          titleEn: seasonObj.titleEn || '',
          slug: seasonObj.slug,
          thumbnailUrl: seasonObj.thumbnailUrl || '',
          thumbnailUrlEn: seasonObj.thumbnailUrlEn || '',
          localizedTitle: language === 'ar' ? seasonObj.title : seasonObj.titleEn,
        } : undefined,
        episode: episodeObj ? {
          _id: episodeObj._id.toString(), // تحويل ObjectId إلى string
          title: episodeObj.title || '',
          titleEn: episodeObj.titleEn || '',
          slug: episodeObj.slug,
          thumbnailUrl: episodeObj.thumbnailUrl || '',
          thumbnailUrlEn: episodeObj.thumbnailUrlEn || '',
          localizedTitle: language === 'ar' ? episodeObj.title : episodeObj.titleEn,
        } : undefined,
      };
    });
  } catch (error) {
    console.error('Error fetching articles by season from MongoDB:', error);
    return [];
  }
}

export async function createArticle(articleData: Partial<IArticle>): Promise<IArticle | null> {
  try {
    await connectDB();
    
    const newArticle = new Article(articleData);
    await newArticle.save();
    
    return newArticle;
  } catch (error) {
    console.error('Error creating article in MongoDB:', error);
    return null;
  }
}

export async function updateArticle(idOrSlug: string, articleData: Partial<IArticle>): Promise<IArticle | null> {
  try {
    await connectDB();
    
    // Check if the idOrSlug is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    
    let query;
    if (isValidObjectId) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }
    
    const updatedArticle = await Article.findOneAndUpdate(
      query, 
      articleData, 
      { new: true, runValidators: true }
    );
    
    return updatedArticle;
  } catch (error) {
    console.error('Error updating article in MongoDB:', error);
    return null;
  }
}

export async function deleteArticle(idOrSlug: string): Promise<boolean> {
  try {
    await connectDB();
    
    // Check if the idOrSlug is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    
    let query;
    if (isValidObjectId) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }
    
    const result = await Article.findOneAndDelete(query);
    
    return !!result;
  } catch (error) {
    console.error('Error deleting article from MongoDB:', error);
    return false;
  }
}

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
export function getLocalizedText(arText?: string, enText?: string, language: string = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}