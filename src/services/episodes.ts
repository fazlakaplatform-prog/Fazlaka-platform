// File: src/services/episodes.ts

import { connectDB } from '@/lib/mongodb';
import Episode, { IEpisode } from '@/models/Episode';
import { PortableTextBlock } from '@portabletext/types';

// Define an extended type that includes localized fields
export interface EpisodeWithLocalized extends IEpisode {
  localizedTitle?: string;
  localizedDescription?: string;
  localizedContent?: PortableTextBlock[] | undefined;
  localizedVideoUrl?: string;
  localizedThumbnailUrl?: string;
}

export async function fetchEpisodes(language: string = 'ar'): Promise<EpisodeWithLocalized[]> {
  try {
    await connectDB();
    
    // تحقق من وجود نموذج Episode
    if (!Episode) {
      console.error('Episode model is not available');
      return [];
    }
    
    // جلب الحلقات مع populate حسب توفر النماذج
    let episodes;
    try {
      // استيراد نموذج Article بشكل مباشر
      const { default: Article } = await import('@/models/Article');
      
      if (Article) {
        // إذا كان نموذج Article متاحًا، قم ب populate كل الحقول
        episodes = await Episode.find({})
          .populate('season')
          .populate('articles')
          .sort({ publishedAt: -1 });
      } else {
        throw new Error('Article model not available');
      }
    } catch (populateError) {
      console.error('Error during population:', populateError);
      
      // في حالة فشل populate، جلب البيانات بدون populate
      try {
        episodes = await Episode.find({})
          .sort({ publishedAt: -1 });
        console.log('Fetched episodes without population');
      } catch (basicError) {
        console.error('Error fetching basic episodes:', basicError);
        return [];
      }
    }
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return episodes.map(episode => ({
      ...episode.toObject(),
      _id: episode._id.toString(),
      localizedTitle: language === 'ar' ? episode.title : episode.titleEn,
      localizedDescription: language === 'ar' ? episode.description : episode.descriptionEn,
      localizedContent: language === 'ar' ? episode.content : episode.contentEn,
      localizedVideoUrl: language === 'ar' ? episode.videoUrl : episode.videoUrlEn,
      localizedThumbnailUrl: language === 'ar' ? episode.thumbnailUrl : episode.thumbnailUrlEn
    }));
  } catch (error) {
    console.error('Error fetching episodes from MongoDB:', error);
    return [];
  }
}

export async function fetchEpisodeBySlug(slug: string, language: string = 'ar'): Promise<EpisodeWithLocalized | null> {
  try {
    await connectDB();
    
    if (!Episode) {
      console.error('Episode model is not available');
      return null;
    }
    
    let episode;
    try {
      // استيراد نموذج Article بشكل مباشر
      const { default: Article } = await import('@/models/Article');
      
      if (Article) {
        episode = await Episode.findOne({ slug })
          .populate('season')
          .populate('articles');
      } else {
        throw new Error('Article model not available');
      }
    } catch (populateError) {
      console.error('Error during population:', populateError);
      episode = await Episode.findOne({ slug });
    }
    
    if (!episode) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...episode.toObject(),
      _id: episode._id.toString(),
      localizedTitle: language === 'ar' ? episode.title : episode.titleEn,
      localizedDescription: language === 'ar' ? episode.description : episode.descriptionEn,
      localizedContent: language === 'ar' ? episode.content : episode.contentEn,
      localizedVideoUrl: language === 'ar' ? episode.videoUrl : episode.videoUrlEn,
      localizedThumbnailUrl: language === 'ar' ? episode.thumbnailUrl : episode.thumbnailUrlEn
    };
  } catch (error) {
    console.error('Error fetching episode by slug from MongoDB:', error);
    return null;
  }
}

export async function fetchEpisodesBySeason(seasonId: string, language: string = 'ar'): Promise<EpisodeWithLocalized[]> {
  try {
    await connectDB();
    
    if (!Episode) {
      console.error('Episode model is not available');
      return [];
    }
    
    let episodes;
    try {
      // استيراد نموذج Article بشكل مباشر
      const { default: Article } = await import('@/models/Article');
      
      if (Article) {
        episodes = await Episode.find({ season: seasonId })
          .populate('season')
          .populate('articles')
          .sort({ publishedAt: -1 });
      } else {
        throw new Error('Article model not available');
      }
    } catch (populateError) {
      console.error('Error during population:', populateError);
      episodes = await Episode.find({ season: seasonId })
        .sort({ publishedAt: -1 });
    }
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return episodes.map(episode => ({
      ...episode.toObject(),
      _id: episode._id.toString(),
      localizedTitle: language === 'ar' ? episode.title : episode.titleEn,
      localizedDescription: language === 'ar' ? episode.description : episode.descriptionEn,
      localizedContent: language === 'ar' ? episode.content : episode.contentEn,
      localizedVideoUrl: language === 'ar' ? episode.videoUrl : episode.videoUrlEn,
      localizedThumbnailUrl: language === 'ar' ? episode.thumbnailUrl : episode.thumbnailUrlEn
    }));
  } catch (error) {
    console.error('Error fetching episodes by season from MongoDB:', error);
    return [];
  }
}

export async function createEpisode(episodeData: Partial<IEpisode>): Promise<IEpisode | null> {
  try {
    await connectDB();
    
    if (!Episode) {
      console.error('Episode model is not available');
      return null;
    }
    
    const newEpisode = new Episode(episodeData);
    await newEpisode.save();
    
    return newEpisode;
  } catch (error) {
    console.error('Error creating episode in MongoDB:', error);
    return null;
  }
}

export async function updateEpisode(idOrSlug: string, episodeData: Partial<IEpisode>): Promise<IEpisode | null> {
  try {
    await connectDB();
    
    if (!Episode) {
      console.error('Episode model is not available');
      return null;
    }
    
    // Check if the idOrSlug is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    
    let query;
    if (isValidObjectId) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }
    
    const updatedEpisode = await Episode.findOneAndUpdate(
      query, 
      episodeData, 
      { new: true, runValidators: true }
    );
    
    return updatedEpisode;
  } catch (error) {
    console.error('Error updating episode in MongoDB:', error);
    return null;
  }
}

export async function deleteEpisode(idOrSlug: string): Promise<boolean> {
  try {
    await connectDB();
    
    if (!Episode) {
      console.error('Episode model is not available');
      return false;
    }
    
    // Check if the idOrSlug is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    
    let query;
    if (isValidObjectId) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }
    
    const result = await Episode.findOneAndDelete(query);
    
    return !!result;
  } catch (error) {
    console.error('Error deleting episode from MongoDB:', error);
    return false;
  }
}

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
export function getLocalizedText(arText?: string, enText?: string, language: string = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}