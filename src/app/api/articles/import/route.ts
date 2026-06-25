import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { articles } = await request.json();
    
    if (!articles || !Array.isArray(articles) || articles.length === 0) {
      return NextResponse.json(
        { error: 'No articles provided' },
        { status: 400 }
      );
    }
    
    let imported = 0;
    const errors = [];
    
    for (const articleData of articles) {
      try {
        if (!articleData.title || !articleData.slug) {
          errors.push(`Skipping article with missing title or slug`);
          continue;
        }
        
        // Helper to upsert related entities
        let seasonId: string | undefined = undefined;
        let episodeId: string | undefined = undefined;

        // Handle Season
        if (articleData.season) {
          const seasonInput = typeof articleData.season === 'object' ? articleData.season : { id: articleData.season };
          
          if (seasonInput.id || seasonInput._id) {
            const sId = seasonInput.id || seasonInput._id;
            // Try to find or create season
            const season = await prisma.season.upsert({
              where: { id: sId },
              update: {
                title: seasonInput.title || 'Untitled Season',
                titleEn: seasonInput.titleEn || seasonInput.title,
                slug: seasonInput.slug || sId,
                thumbnailUrl: seasonInput.thumbnailUrl,
                thumbnailUrlEn: seasonInput.thumbnailUrlEn,
              },
              create: {
                id: sId,
                title: seasonInput.title || 'Untitled Season',
                titleEn: seasonInput.titleEn || seasonInput.title,
                slug: seasonInput.slug || sId,
                thumbnailUrl: seasonInput.thumbnailUrl,
                thumbnailUrlEn: seasonInput.thumbnailUrlEn,
              }
            });
            seasonId = season.id;
          }
        }

        // Handle Episode
        if (articleData.episode) {
          const episodeInput = typeof articleData.episode === 'object' ? articleData.episode : { id: articleData.episode };
          
          if (episodeInput.id || episodeInput._id) {
            const eId = episodeInput.id || episodeInput._id;
            const episode = await prisma.episode.upsert({
              where: { id: eId },
              update: {
                title: episodeInput.title || 'Untitled Episode',
                titleEn: episodeInput.titleEn || episodeInput.title,
                slug: episodeInput.slug || eId,
                thumbnailUrl: episodeInput.thumbnailUrl,
                thumbnailUrlEn: episodeInput.thumbnailUrlEn,
                seasonId: seasonId, // Link season
              },
              create: {
                id: eId,
                title: episodeInput.title || 'Untitled Episode',
                titleEn: episodeInput.titleEn || episodeInput.title,
                slug: episodeInput.slug || eId,
                thumbnailUrl: episodeInput.thumbnailUrl,
                thumbnailUrlEn: episodeInput.thumbnailUrlEn,
                seasonId: seasonId,
              }
            });
            episodeId = episode.id;
          }
        }

        // Upsert Article
        await prisma.article.upsert({
          where: { slug: articleData.slug },
          update: {
            title: articleData.title,
            titleEn: articleData.titleEn || articleData.title,
            excerpt: articleData.excerpt,
            excerptEn: articleData.excerptEn,
            content: articleData.content,
            contentEn: articleData.contentEn,
            featuredImageUrl: articleData.featuredImageUrl,
            featuredImageUrlEn: articleData.featuredImageUrlEn,
            seasonId: seasonId,
            episodeId: episodeId,
            publishedAt: articleData.publishedAt ? new Date(articleData.publishedAt) : null,
          },
          create: {
            title: articleData.title,
            titleEn: articleData.titleEn || articleData.title,
            slug: articleData.slug,
            excerpt: articleData.excerpt,
            excerptEn: articleData.excerptEn,
            content: articleData.content,
            contentEn: articleData.contentEn,
            featuredImageUrl: articleData.featuredImageUrl,
            featuredImageUrlEn: articleData.featuredImageUrlEn,
            seasonId: seasonId,
            episodeId: episodeId,
            publishedAt: articleData.publishedAt ? new Date(articleData.publishedAt) : null,
          }
        });
        
        imported++;
      } catch (error) {
        console.error('Error importing article:', error);
        errors.push(`Error importing article: ${articleData.title || articleData.slug || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ 
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Failed to import articles' },
      { status: 500 }
    );
  }
}