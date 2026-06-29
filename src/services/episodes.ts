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
  localizedDescriptionMobile?: string | null;
  localizedContent?: PortableTextBlock[] | null;
  localizedContentMobile?: string | null;
  localizedVideoUrl?: string | null;
  localizedThumbnailUrl?: string | null;
}

function mapEpisode(episode: PopulatedEpisode, language: string): EpisodeWithLocalized {
  return {
    ...episode,
    id: episode.id,
    localizedTitle: language === 'ar' ? episode.title : episode.titleEn,
    localizedDescription: language === 'ar' ? episode.description : episode.descriptionEn,
    localizedDescriptionMobile: language === 'ar' ? episode.descriptionMobile : episode.descriptionMobileEn,
    localizedContent: (language === 'ar' ? episode.content : episode.contentEn) as PortableTextBlock[] | null,
    localizedContentMobile: language === 'ar' ? episode.contentMobile : episode.contentMobileEn,
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

    const data: Record<string, unknown> = {
      title: episodeData.title,
      titleEn: episodeData.titleEn,
      slug,
      description: episodeData.description,
      descriptionEn: episodeData.descriptionEn,
      descriptionMobile: episodeData.descriptionMobile,
      descriptionMobileEn: episodeData.descriptionMobileEn,
      videoUrl: episodeData.videoUrl,
      videoUrlEn: episodeData.videoUrlEn,
      thumbnailUrl: episodeData.thumbnailUrl,
      thumbnailUrlEn: episodeData.thumbnailUrlEn,
      publishedAt: episodeData.publishedAt,
      contentMobile: episodeData.contentMobile,
      contentMobileEn: episodeData.contentMobileEn,
    };

    if (episodeData.seasonId) {
      data.season = { connect: { id: episodeData.seasonId } };
    }

    if (episodeData.content !== undefined) {
      const raw = episodeData.content;
      if (typeof raw === 'string' && (raw.trimStart().startsWith('{') || raw.trimStart().startsWith('['))) {
        try { data.content = JSON.parse(raw); } catch { data.content = raw || Prisma.JsonNull; }
      } else {
        data.content = raw || Prisma.JsonNull;
      }
    }
    if (episodeData.contentEn !== undefined) {
      const raw = episodeData.contentEn;
      if (typeof raw === 'string' && (raw.trimStart().startsWith('{') || raw.trimStart().startsWith('['))) {
        try { data.contentEn = JSON.parse(raw); } catch { data.contentEn = raw || Prisma.JsonNull; }
      } else {
        data.contentEn = raw || Prisma.JsonNull;
      }
    }

    if (episodeData.articles && Array.isArray(episodeData.articles)) {
      data.articles = { connect: episodeData.articles.map(id => ({ id })) };
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

    const data: Record<string, unknown> = {};

    if (episodeData.title !== undefined) data.title = episodeData.title;
    if (episodeData.titleEn !== undefined) data.titleEn = episodeData.titleEn;
    if (episodeData.slug !== undefined) data.slug = episodeData.slug;
    if (episodeData.description !== undefined) data.description = episodeData.description;
    if (episodeData.descriptionEn !== undefined) data.descriptionEn = episodeData.descriptionEn;
    if (episodeData.descriptionMobile !== undefined) data.descriptionMobile = episodeData.descriptionMobile;
    if (episodeData.descriptionMobileEn !== undefined) data.descriptionMobileEn = episodeData.descriptionMobileEn;
    if (episodeData.videoUrl !== undefined) data.videoUrl = episodeData.videoUrl;
    if (episodeData.videoUrlEn !== undefined) data.videoUrlEn = episodeData.videoUrlEn;
    if (episodeData.thumbnailUrl !== undefined) data.thumbnailUrl = episodeData.thumbnailUrl;
    if (episodeData.thumbnailUrlEn !== undefined) data.thumbnailUrlEn = episodeData.thumbnailUrlEn;
    if (episodeData.publishedAt !== undefined) data.publishedAt = episodeData.publishedAt;
    if (episodeData.contentMobile !== undefined) data.contentMobile = episodeData.contentMobile;
    if (episodeData.contentMobileEn !== undefined) data.contentMobileEn = episodeData.contentMobileEn;

    if (episodeData.seasonId !== undefined) {
      if (episodeData.seasonId) {
        data.season = { connect: { id: episodeData.seasonId } };
      } else {
        data.season = { disconnect: true };
      }
    }

    if (episodeData.content !== undefined) {
      const raw = episodeData.content;
      if (typeof raw === 'string' && (raw.trimStart().startsWith('{') || raw.trimStart().startsWith('['))) {
        try { data.content = JSON.parse(raw); } catch { data.content = raw || Prisma.JsonNull; }
      } else {
        data.content = raw || Prisma.JsonNull;
      }
    }
    if (episodeData.contentEn !== undefined) {
      const raw = episodeData.contentEn;
      if (typeof raw === 'string' && (raw.trimStart().startsWith('{') || raw.trimStart().startsWith('['))) {
        try { data.contentEn = JSON.parse(raw); } catch { data.contentEn = raw || Prisma.JsonNull; }
      } else {
        data.contentEn = raw || Prisma.JsonNull;
      }
    }

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