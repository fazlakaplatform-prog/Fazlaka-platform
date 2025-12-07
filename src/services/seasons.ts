import { connectDB } from '@/lib/mongodb';
import Season, { ISeason } from '@/models/Season';

// Define an extended type that includes localized fields
export interface SeasonWithLocalized extends ISeason {
  localizedTitle?: string;
  localizedDescription?: string;
  localizedThumbnailUrl?: string;
}

export async function fetchSeasons(language: string = 'ar'): Promise<SeasonWithLocalized[]> {
  try {
    await connectDB();
    
    const seasons = await Season.find({})
      .sort({ publishedAt: -1 });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return seasons.map(season => {
      const seasonObj = season.toObject();

      return {
        ...seasonObj,
        _id: season._id.toString(), // تحويل ObjectId إلى string
        updatedAt: season.updatedAt?.toISOString(), // التأكد من وجود updatedAt
        localizedTitle: language === 'ar' ? season.title : season.titleEn,
        localizedDescription: language === 'ar' ? season.description : season.descriptionEn,
        localizedThumbnailUrl: language === 'ar' ? season.thumbnailUrl : season.thumbnailUrlEn,
      };
    });
  } catch (error) {
    console.error('Error fetching seasons from MongoDB:', error);
    return [];
  }
}

export async function fetchSeasonBySlug(slug: string, language: string = 'ar'): Promise<SeasonWithLocalized | null> {
  try {
    await connectDB();
    
    const season = await Season.findOne({ slug });
    
    if (!season) return null;
    
    const seasonObj = season.toObject();

    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...seasonObj,
      _id: season._id.toString(), // تحويل ObjectId إلى string
      updatedAt: season.updatedAt?.toISOString(), // التأكد من وجود updatedAt
      localizedTitle: language === 'ar' ? season.title : season.titleEn,
      localizedDescription: language === 'ar' ? season.description : season.descriptionEn,
      localizedThumbnailUrl: language === 'ar' ? season.thumbnailUrl : season.thumbnailUrlEn,
    };
  } catch (error) {
    console.error('Error fetching season by slug from MongoDB:', error);
    return null;
  }
}

export async function createSeason(seasonData: Partial<ISeason>): Promise<ISeason | null> {
  try {
    await connectDB();
    
    const newSeason = new Season(seasonData);
    await newSeason.save();
    
    return newSeason;
  } catch (error) {
    console.error('Error creating season in MongoDB:', error);
    return null;
  }
}

export async function updateSeason(idOrSlug: string, seasonData: Partial<ISeason>): Promise<ISeason | null> {
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
    
    const updatedSeason = await Season.findOneAndUpdate(
      query, 
      seasonData, 
      { new: true, runValidators: true }
    );
    
    return updatedSeason;
  } catch (error) {
    console.error('Error updating season in MongoDB:', error);
    return null;
  }
}

export async function deleteSeason(idOrSlug: string): Promise<boolean> {
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
    
    const result = await Season.findOneAndDelete(query);
    
    return !!result;
  } catch (error) {
    console.error('Error deleting season from MongoDB:', error);
    return false;
  }
}

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
export function getLocalizedText(arText?: string, enText?: string, language: string = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}