import { connectDB } from '@/lib/mongodb';
import Favorite, { IFavorite } from '@/models/Favorite';
import mongoose, { Types } from 'mongoose';

// تعريف واجهة للاستعلام
interface FavoriteQuery {
  userId: string;
  episode?: string;
  article?: string;
}

export async function fetchUserFavorites(userId: string): Promise<IFavorite[]> {
  try {
    await connectDB();
    
    const favorites = await Favorite.find({ userId })
      .populate('episode')
      .populate('article')
      .sort({ createdAt: -1 });
    
    return favorites;
  } catch (error) {
    console.error('Error fetching user favorites from MongoDB:', error);
    return [];
  }
}

export async function createFavorite(favoriteData: Partial<IFavorite>): Promise<IFavorite | null> {
  try {
    await connectDB();
    
    const newFavorite = new Favorite(favoriteData);
    await newFavorite.save();
    
    return newFavorite;
  } catch (error) {
    console.error('Error creating favorite in MongoDB:', error);
    return null;
  }
}

export async function deleteFavorite(favoriteId: string): Promise<boolean> {
  try {
    await connectDB();
    
    const result = await Favorite.findByIdAndDelete(favoriteId);
    
    return !!result;
  } catch (error) {
    console.error("Error deleting favorite from MongoDB:", error);
    return false;
  }
}

export async function checkFavorite(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<boolean> {
  try {
    await connectDB();
    
    const query: FavoriteQuery = { userId };
    
    if (contentType === 'episode') {
      query.episode = contentId;
    } else {
      query.article = contentId;
    }
    
    const favorite = await Favorite.findOne(query);
    
    return !!favorite;
  } catch (error) {
    console.error("Error checking favorite status from MongoDB:", error);
    return false;
  }
}

export async function addToFavorites(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<IFavorite | null> {
  try {
    // التحقق مما إذا كان المحتوى موجوداً بالفعل في المفضلة
    const isAlreadyFavorite = await checkFavorite(userId, contentId, contentType);
    if (isAlreadyFavorite) {
      throw new Error('Content is already in favorites');
    }

    const favoriteData: Partial<IFavorite> = {
      userId,
    };
    
    if (contentType === 'episode') {
      favoriteData.episode = new Types.ObjectId(contentId);
    } else {
      favoriteData.article = new Types.ObjectId(contentId);
    }

    return await createFavorite(favoriteData);
  } catch (error) {
    console.error('Error adding to favorites:', error);
    throw error;
  }
}

export async function removeFromFavorites(userId: string, contentId: string, contentType: 'episode' | 'article'): Promise<boolean> {
  try {
    await connectDB();
    
    const query: FavoriteQuery = { userId };
    
    if (contentType === 'episode') {
      query.episode = contentId;
    } else {
      query.article = contentId;
    }
    
    const result = await Favorite.findOneAndDelete(query);
    
    return !!result;
  } catch (error) {
    console.error("Error removing from favorites:", error);
    throw error;
  }
}

// دالة جديدة للحصول على عدد الإعجابات لمحتوى معين
export async function getFavoritesCount(contentId: string, contentType: 'episode' | 'article'): Promise<number> {
  try {
    await connectDB();
    
    const query: Record<string, unknown> = {};
    
    if (contentType === 'episode') {
      query.episode = contentId;
    } else {
      query.article = contentId;
    }
    
    const count = await Favorite.countDocuments(query);
    
    return count;
  } catch (error) {
    console.error("Error getting favorites count:", error);
    return 0;
  }
}

// دالة جديدة للحصول على عدد الإعجابات لمحتوى متعدد
export async function getMultipleFavoritesCount(
  contentIds: string[], 
  contentType: 'episode' | 'article'
): Promise<{ [contentId: string]: number }> {
  try {
    await connectDB();
    
    const field = contentType === 'episode' ? 'episode' : 'article';
    const objectIds = contentIds.map(id => new Types.ObjectId(id));
    
    const pipeline = [
      {
        $match: {
          [field]: { $in: objectIds }
        }
      },
      {
        $group: {
          _id: `$${field}`,
          count: { $sum: 1 }
        }
      }
    ];
    
    const results = await Favorite.aggregate(pipeline);
    
    // تحويل النتائج إلى كائن بسيط
    const counts: { [contentId: string]: number } = {};
    
    // تهيئة كل المعرفات بقيمة 0
    contentIds.forEach(id => {
      counts[id] = 0;
    });
    
    // تحديث القيم الفعلية
    results.forEach(result => {
      counts[result._id.toString()] = result.count;
    });
    
    return counts;
  } catch (error) {
    console.error("Error getting multiple favorites count:", error);
    // إرجاع كائن بجميع المعرفات بقيمة 0 في حالة الخطأ
    const counts: { [contentId: string]: number } = {};
    contentIds.forEach(id => {
      counts[id] = 0;
    });
    return counts;
  }
}