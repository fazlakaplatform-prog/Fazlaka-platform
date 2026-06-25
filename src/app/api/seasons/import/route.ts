import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { seasons } = await request.json();
    
    if (!seasons || !Array.isArray(seasons) || seasons.length === 0) {
      return NextResponse.json({ error: 'No seasons provided' }, { status: 400 });
    }
    
    let imported = 0;
    const errors = [];
    
    for (const seasonData of seasons) {
      try {
        if (!seasonData.title || !seasonData.slug) {
          errors.push(`Skipping season with missing title or slug`);
          continue;
        }
        
        await prisma.season.upsert({
          where: { slug: seasonData.slug },
          update: {
            title: seasonData.title,
            titleEn: seasonData.titleEn || seasonData.title,
            description: seasonData.description,
            descriptionEn: seasonData.descriptionEn,
            thumbnailUrl: seasonData.thumbnailUrl,
            thumbnailUrlEn: seasonData.thumbnailUrlEn,
            publishedAt: seasonData.publishedAt ? new Date(seasonData.publishedAt) : null,
          },
          create: {
            title: seasonData.title,
            titleEn: seasonData.titleEn || seasonData.title,
            slug: seasonData.slug,
            description: seasonData.description,
            descriptionEn: seasonData.descriptionEn,
            thumbnailUrl: seasonData.thumbnailUrl,
            thumbnailUrlEn: seasonData.thumbnailUrlEn,
            publishedAt: seasonData.publishedAt ? new Date(seasonData.publishedAt) : null,
          }
        });
        
        imported++;
      } catch (error) {
        console.error('Error importing season:', error);
        errors.push(`Error importing season: ${seasonData.title || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ imported, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json({ error: 'Failed to import seasons' }, { status: 500 });
  }
}