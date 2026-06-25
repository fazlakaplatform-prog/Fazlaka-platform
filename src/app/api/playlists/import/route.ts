import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { playlists } = await request.json();
    
    if (!playlists || !Array.isArray(playlists) || playlists.length === 0) {
      return NextResponse.json({ error: 'No playlists provided' }, { status: 400 });
    }
    
    let imported = 0;
    const errors = [];
    
    for (const playlistData of playlists) {
      try {
        if (!playlistData.title || !playlistData.slug) {
          errors.push(`Skipping playlist with missing title or slug`);
          continue;
        }
        
        await prisma.playlist.upsert({
          where: { slug: playlistData.slug },
          update: {
            title: playlistData.title,
            titleEn: playlistData.titleEn || playlistData.title,
            description: playlistData.description,
            descriptionEn: playlistData.descriptionEn,
            imageUrl: playlistData.imageUrl,
            imageUrlEn: playlistData.imageUrlEn,
          },
          create: {
            title: playlistData.title,
            titleEn: playlistData.titleEn || playlistData.title,
            slug: playlistData.slug,
            description: playlistData.description,
            descriptionEn: playlistData.descriptionEn,
            imageUrl: playlistData.imageUrl,
            imageUrlEn: playlistData.imageUrlEn,
          }
        });
        
        imported++;
      } catch (error) {
        console.error('Error importing playlist:', error);
        errors.push(`Error importing playlist: ${playlistData.title || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ imported, errors: errors.length > 0 ? errors : undefined });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json({ error: 'Failed to import playlists' }, { status: 500 });
  }
}