import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { episodes } = await request.json();
    
    if (!episodes || !Array.isArray(episodes) || episodes.length === 0) {
      return NextResponse.json({ error: 'No episodes provided' }, { status: 400 });
    }
    
    let imported = 0;
    const errors = [];
    
    for (const episodeData of episodes) {
      try {
        if (!episodeData.title || !episodeData.slug) {
          errors.push(`Skipping episode with missing title or slug`);
          continue;
        }
        
        let seasonId: string | undefined = undefined;
        // تم إصلاح الخطأ: استخدام const بدلاً من let لأن المصفوفة لا يتم إعادة تعيينها
        const articleIds: string[] = [];

        // Handle Season
        if (episodeData.season) {
          const seasonInput = typeof episodeData.season === 'object' ? episodeData.season : { id: episodeData.season };
          const sId = seasonInput.id || seasonInput._id;
          if (sId) {
             const season = await prisma.season.upsert({
              where: { id: sId },
              update: {
                title: seasonInput.title || 'Untitled',
                titleEn: seasonInput.titleEn,
                slug: seasonInput.slug || sId,
              },
              create: {
                id: sId,
                title: seasonInput.title || 'Untitled',
                titleEn: seasonInput.titleEn,
                slug: seasonInput.slug || sId,
              }
            });
            seasonId = season.id;
          }
        }

        // Handle Articles
        if (episodeData.articles && Array.isArray(episodeData.articles)) {
          for (const articleInput of episodeData.articles) {
            const aId = (typeof articleInput === 'object') ? (articleInput.id || articleInput._id) : articleInput;
            if (aId) {
              // Ensure article exists or connect
              // For simplicity in import, we assume articles are imported first or exist
              // We will just collect IDs to connect
              articleIds.push(aId);
            }
          }
        }
        
        // Upsert Episode
        await prisma.episode.upsert({
          where: { slug: episodeData.slug },
          update: {
            title: episodeData.title,
            titleEn: episodeData.titleEn,
            description: episodeData.description,
            descriptionEn: episodeData.descriptionEn,
            videoUrl: episodeData.videoUrl,
            videoUrlEn: episodeData.videoUrlEn,
            thumbnailUrl: episodeData.thumbnailUrl,
            thumbnailUrlEn: episodeData.thumbnailUrlEn,
            content: episodeData.content,
            contentEn: episodeData.contentEn,
            seasonId: seasonId,
            publishedAt: episodeData.publishedAt ? new Date(episodeData.publishedAt) : null,
            articles: { 
              set: articleIds.map(id => ({ id })) // Overwrite relations
            }
          },
          create: {
            title: episodeData.title,
            titleEn: episodeData.titleEn,
            slug: episodeData.slug,
            description: episodeData.description,
            descriptionEn: episodeData.descriptionEn,
            videoUrl: episodeData.videoUrl,
            videoUrlEn: episodeData.videoUrlEn,
            thumbnailUrl: episodeData.thumbnailUrl,
            thumbnailUrlEn: episodeData.thumbnailUrlEn,
            content: episodeData.content,
            contentEn: episodeData.contentEn,
            seasonId: seasonId,
            publishedAt: episodeData.publishedAt ? new Date(episodeData.publishedAt) : null,
            articles: { 
              connect: articleIds.map(id => ({ id })) 
            }
          }
        });
        
        imported++;
      } catch (error) {
        console.error('Error importing episode:', error);
        errors.push(`Error importing episode: ${episodeData.title || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ imported, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json({ error: 'Failed to import episodes' }, { status: 500 });
  }
}