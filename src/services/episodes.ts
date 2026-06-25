import { prisma } from '@/lib/prisma';
import { Episode, Season, Article, Prisma } from '@prisma/client';
import { PortableTextBlock } from '@portabletext/types';

// Helper function to generate slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

interface PopulatedEpisode extends Episode {
  season: Season | null;
  articles: Article[];
}

export interface EpisodeWithLocalized extends Episode {
  localizedTitle?: string;
  localizedDescription?: string | null;
  localizedContent?: PortableTextBlock[] | null;
  localizedVideoUrl?: string | null;
  localizedThumbnailUrl?: string | null;
}

function mapEpisode(episode: PopulatedEpisode, language: string): EpisodeWithLocalized {
  return {
    ...episode,
    id: episode.id,
    localizedTitle: language === 'ar' ? episode.title : episode.titleEn,
    localizedDescription: language === 'ar' ? episode.description : episode.descriptionEn,
    localizedContent: (language === 'ar' ? episode.content : episode.contentEn) as PortableTextBlock[] | null,
    localizedVideoUrl: language === 'ar' ? episode.videoUrl : episode.videoUrlEn,
    localizedThumbnailUrl: language === 'ar' ? episode.thumbnailUrl : episode.thumbnailUrlEn
  };
}

export async function fetchEpisodes(language: string = 'ar'): Promise<EpisodeWithLocalized[]> {
  try {
    const episodes = await prisma.episode.findMany({
      include: {
        season: true,
        articles: true, // Relation defined in schema
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
    
    return episodes.map(episode => mapEpisode(episode as PopulatedEpisode, language));
  } catch (error) {
    console.error('Error fetching episodes from Prisma:', error);
    return [];
  }
}

export async function fetchEpisodeBySlug(slug: string, language: string = 'ar'): Promise<EpisodeWithLocalized | null> {
  try {
    const episode = await prisma.episode.findUnique({
      where: { slug },
      include: {
        season: true,
        articles: true,
      },
    });
    
    if (!episode) return null;
    
    return mapEpisode(episode as PopulatedEpisode, language);
  } catch (error) {
    console.error('Error fetching episode by slug from Prisma:', error);
    return null;
  }
}

export async function fetchEpisodesBySeason(seasonId: string, language: string = 'ar'): Promise<EpisodeWithLocalized[]> {
  try {
    const episodes = await prisma.episode.findMany({
      where: { seasonId },
      include: {
        season: true,
        articles: true,
      },
      orderBy: {
        publishedAt: 'desc',
      },
    });
    
    return episodes.map(episode => mapEpisode(episode as PopulatedEpisode, language));
  } catch (error) {
    console.error('Error fetching episodes by season from Prisma:', error);
    return [];
  }
}

export async function createEpisode(episodeData: Partial<Episode> & { articles?: string[] }): Promise<Episode | null> {
  try {
    const slug = episodeData.slug || generateSlug(episodeData.titleEn || episodeData.title || '');

    // تم إصلاح الخطأ: استبدال any بـ Record<string, unknown>
    const data: Record<string, unknown> = {
      ...episodeData,
      slug,
    };

    if (episodeData.seasonId) {
      data.season = { connect: { id: episodeData.seasonId } };
      delete data.seasonId;
    }

    if (episodeData.articles && Array.isArray(episodeData.articles)) {
      data.articles = { connect: episodeData.articles.map(id => ({ id })) };
      delete data.articles; // Remove from top level as it's handled in connect
    }

    const newEpisode = await prisma.episode.create({ 
      data: data as Prisma.EpisodeCreateInput,
      include: { articles: true } 
    });
    
    return newEpisode;
  } catch (error) {
    console.error('Error creating episode in Prisma:', error);
    return null;
  }
}

export async function updateEpisode(idOrSlug: string, episodeData: Partial<Episode> & { articles?: string[] }): Promise<Episode | null> {
  try {
    const episode = await prisma.episode.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
    });

    if (!episode) return null;

    // تم إصلاح الخطأ: استبدال any بـ Record<string, unknown>
    const data: Record<string, unknown> = { ...episodeData };

    if (episodeData.seasonId) {
      data.season = { connect: { id: episodeData.seasonId } };
      delete data.seasonId;
    }

    // Handle articles update (set will replace existing relations)
    if (episodeData.articles && Array.isArray(episodeData.articles)) {
      data.articles = { set: episodeData.articles.map(id => ({ id })) };
    }

    const updatedEpisode = await prisma.episode.update({
      where: { id: episode.id },
      data: data as Prisma.EpisodeUpdateInput,
    });
    
    return updatedEpisode;
  } catch (error) {
    console.error('Error updating episode in Prisma:', error);
    return null;
  }
}

export async function deleteEpisode(idOrSlug: string): Promise<boolean> {
  try {
    const episode = await prisma.episode.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] }
    });

    if (!episode) return false;

    await prisma.episode.delete({ where: { id: episode.id } });
    return true;
  } catch (error) {
    console.error('Error deleting episode from Prisma:', error);
    return false;
  }
}