import { connectDB } from '@/lib/mongodb';
import Playlist, { IPlaylist } from '@/models/Playlist';

// Define an extended type that includes localized fields
export interface PlaylistWithLocalized extends IPlaylist {
  localizedTitle?: string;
  localizedDescription?: string;
  localizedImageUrl?: string;
}

export async function fetchPlaylists(language: string = 'ar'): Promise<PlaylistWithLocalized[]> {
  try {
    await connectDB();
    
    const playlists = await Playlist.find({})
      .populate('episodes')
      .populate('articles')
      .sort({ createdAt: -1 });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return playlists.map(playlist => {
      const playlistObj = playlist.toObject();

      return {
        ...playlistObj,
        _id: playlist._id.toString(),
        updatedAt: playlist.updatedAt?.toISOString(), // التأكد من وجود updatedAt
        localizedTitle: language === 'ar' ? playlist.title : playlist.titleEn,
        localizedDescription: language === 'ar' ? playlist.description : playlist.descriptionEn,
        localizedImageUrl: language === 'ar' ? playlist.imageUrl : playlist.imageUrlEn
      };
    });
  } catch (error) {
    console.error('Error fetching playlists from MongoDB:', error);
    return [];
  }
}

export async function fetchPlaylistBySlug(slug: string, language: string = 'ar'): Promise<PlaylistWithLocalized | null> {
  try {
    await connectDB();
    
    const playlist = await Playlist.findOne({ slug })
      .populate('episodes')
      .populate('articles');
    
    if (!playlist) return null;
    
    const playlistObj = playlist.toObject();

    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...playlistObj,
      _id: playlist._id.toString(),
      updatedAt: playlist.updatedAt?.toISOString(), // التأكد من وجود updatedAt
      localizedTitle: language === 'ar' ? playlist.title : playlist.titleEn,
      localizedDescription: language === 'ar' ? playlist.description : playlist.descriptionEn,
      localizedImageUrl: language === 'ar' ? playlist.imageUrl : playlist.imageUrlEn
    };
  } catch (error) {
    console.error('Error fetching playlist by slug from MongoDB:', error);
    return null;
  }
}

export async function createPlaylist(playlistData: Partial<IPlaylist>): Promise<IPlaylist | null> {
  try {
    await connectDB();
    
    const newPlaylist = new Playlist(playlistData);
    await newPlaylist.save();
    
    return newPlaylist;
  } catch (error) {
    console.error('Error creating playlist in MongoDB:', error);
    return null;
  }
}

export async function updatePlaylist(idOrSlug: string, playlistData: Partial<IPlaylist>): Promise<IPlaylist | null> {
  try {
    await connectDB();
    
    // Check if idOrSlug is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    
    let query;
    if (isValidObjectId) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }
    
    const updatedPlaylist = await Playlist.findOneAndUpdate(
      query, 
      playlistData, 
      { new: true, runValidators: true }
    );
    
    return updatedPlaylist;
  } catch (error) {
    console.error('Error updating playlist in MongoDB:', error);
    return null;
  }
}

export async function deletePlaylist(idOrSlug: string): Promise<boolean> {
  try {
    await connectDB();
    
    // Check if idOrSlug is a valid ObjectId
    const isValidObjectId = /^[0-9a-fA-F]{24}$/.test(idOrSlug);
    
    let query;
    if (isValidObjectId) {
      query = { _id: idOrSlug };
    } else {
      query = { slug: idOrSlug };
    }
    
    const result = await Playlist.findOneAndDelete(query);
    
    return !!result;
  } catch (error) {
    console.error('Error deleting playlist from MongoDB:', error);
    return false;
  }
}

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
export function getLocalizedText(arText?: string, enText?: string, language: string = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}