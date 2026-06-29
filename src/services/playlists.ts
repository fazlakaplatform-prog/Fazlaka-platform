// src/services/playlists.ts
import { prisma } from '@/lib/prisma';
import { Playlist, Episode, Article, Prisma } from '@prisma/client';
import { nanoid } from 'nanoid';

// Helper function to generate unique slug
function generateUniqueSlug(title: string): string {
  const baseSlug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
  return `${baseSlug}-${nanoid(6)}`;
}

interface PopulatedPlaylist extends Playlist {
  episodes: Episode[];
  articles: Article[];
  user?: { name: string | null; image: string | null } | null;
}

export interface PlaylistWithLocalized extends Playlist {
  localizedTitle?: string;
  localizedDescription?: string | null;
  localizedImageUrl?: string | null;
  user?: { name: string | null; image: string | null } | null;
}

function mapPlaylist(playlist: PopulatedPlaylist, language: string): PlaylistWithLocalized {
  return {
    ...playlist,
    id: playlist.id,
    updatedAt: playlist.updatedAt,
    localizedTitle: language === 'ar' ? playlist.title : playlist.titleEn,
    localizedDescription: language === 'ar' ? playlist.description : playlist.descriptionEn,
    localizedImageUrl: language === 'ar' ? playlist.imageUrl : playlist.imageUrlEn,
    user: playlist.user
  };
}

export async function fetchPlaylists(language: string = 'ar', currentUserId?: string): Promise<PlaylistWithLocalized[]> {
  try {
    const whereClause: Prisma.PlaylistWhereInput = currentUserId
      ? {
          OR: [
            { userId: null },
            { userId: currentUserId }
          ]
        }
      : { userId: null };

    const playlists = await prisma.playlist.findMany({
      where: whereClause,
      include: {
        episodes: true,
        articles: true,
        user: { select: { name: true, image: true } }
      },
      orderBy: [
        { createdAt: 'desc' }
      ],
    });
    
    return playlists.map(playlist => mapPlaylist(playlist as PopulatedPlaylist, language));
  } catch (error) {
    console.error('Error fetching playlists from Prisma:', error);
    return [];
  }
}

export async function fetchPlaylistBySlug(slug: string, language: string = 'ar', currentUserId?: string): Promise<PlaylistWithLocalized | null> {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { slug },
      include: {
        episodes: true,
        articles: true,
        user: { select: { name: true, image: true } }
      },
    });
    
    if (!playlist) return null;

    if (playlist.userId && playlist.userId !== currentUserId) {
      return null;
    }
    
    return mapPlaylist(playlist as PopulatedPlaylist, language);
  } catch (error) {
    console.error('Error fetching playlist by slug from Prisma:', error);
    return null;
  }
}

interface CreatePlaylistData {
  title: string;
  titleEn: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  isPublic?: boolean;
  episodes?: string[];
  articles?: string[];
}

export async function createPlaylist(userId: string, playlistData: CreatePlaylistData): Promise<Playlist | null> {
  try {
    const slug = generateUniqueSlug(playlistData.titleEn || playlistData.title);

    const data: Prisma.PlaylistCreateInput = {
      title: playlistData.title,
      titleEn: playlistData.titleEn,
      slug,
      description: playlistData.description,
      descriptionEn: playlistData.descriptionEn,
      imageUrl: playlistData.imageUrl,
      isPublic: playlistData.isPublic ?? false,
      user: { connect: { id: userId } },
    };

    if (playlistData.episodes && playlistData.episodes.length > 0) {
      data.episodes = { connect: playlistData.episodes.map(id => ({ id })) };
    }
    if (playlistData.articles && playlistData.articles.length > 0) {
      data.articles = { connect: playlistData.articles.map(id => ({ id })) };
    }

    const newPlaylist = await prisma.playlist.create({ 
      data,
      include: { episodes: true, articles: true }
    });
    return newPlaylist;
  } catch (error) {
    console.error('Error creating playlist in Prisma:', error);
    return null;
  }
}

// Fix: Define a specific type instead of 'any'
type FlexibleItem = string | { id: string };

export async function updatePlaylist(userId: string, slug: string, playlistData: Partial<CreatePlaylistData>): Promise<Playlist | null> {
  try {
    const existing = await prisma.playlist.findUnique({ where: { slug } });
    if (!existing) return null;
    
    if (existing.userId && existing.userId !== userId) {
      throw new Error("Unauthorized");
    }

    const data: Prisma.PlaylistUpdateInput = {};

    if (playlistData.title) data.title = playlistData.title;
    if (playlistData.titleEn) data.titleEn = playlistData.titleEn;
    if (playlistData.description !== undefined) data.description = playlistData.description;
    if (playlistData.descriptionEn !== undefined) data.descriptionEn = playlistData.descriptionEn;
    if (playlistData.imageUrl !== undefined) data.imageUrl = playlistData.imageUrl;

    // Robust handling for relations (Accepts both IDs and Objects)
    if (playlistData.episodes) {
      // Cast to FlexibleItem to handle both strings and objects safely
      const ids = (playlistData.episodes as FlexibleItem[])
        .map((item) => typeof item === 'string' ? item : item.id)
        .filter((id): id is string => typeof id === 'string');
      
      data.episodes = { set: ids.map((id) => ({ id })) };
    }

    if (playlistData.articles) {
       // Cast to FlexibleItem
      const ids = (playlistData.articles as FlexibleItem[])
        .map((item) => typeof item === 'string' ? item : item.id)
        .filter((id): id is string => typeof id === 'string');
        
      data.articles = { set: ids.map((id) => ({ id })) };
    }

    const updatedPlaylist = await prisma.playlist.update({
      where: { slug },
      data,
    });
    
    return updatedPlaylist;
  } catch (error) {
    console.error('Error updating playlist in Prisma:', error);
    return null;
  }
}

export async function deletePlaylist(userId: string, slug: string): Promise<boolean> {
  try {
    const playlist = await prisma.playlist.findUnique({ where: { slug } });
    if (!playlist) return false;
    
    if (playlist.userId && playlist.userId !== userId) {
      return false;
    }

    await prisma.playlist.delete({ where: { slug } });
    return true;
  } catch (error) {
    console.error('Error deleting playlist from Prisma:', error);
    return false;
  }
}