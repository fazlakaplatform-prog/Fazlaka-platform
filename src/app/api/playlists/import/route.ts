import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Playlist from '@/models/Playlist';
// تم إزالة استيرادات Episode و Article لأنها لم تكن مستخدمة
// import Episode from '@/models/Episode';
// import Article from '@/models/Article';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { playlists } = await request.json();
    
    if (!playlists || !Array.isArray(playlists) || playlists.length === 0) {
      return NextResponse.json(
        { error: 'No playlists provided' },
        { status: 400 }
      );
    }
    
    let imported = 0;
    const errors = [];
    
    for (const playlistData of playlists) {
      try {
        // Skip if no title or slug
        if (!playlistData.title || !playlistData.slug) {
          errors.push(`Skipping playlist with missing title or slug`);
          continue;
        }
        
        // Check if playlist with this slug already exists
        const existingPlaylist = await Playlist.findOne({ slug: playlistData.slug });
        
        const playlistUpdateData = {
          title: playlistData.title,
          titleEn: playlistData.titleEn || playlistData['Title (EN)'] || playlistData.title,
          slug: playlistData.slug,
          description: playlistData.description || playlistData.Description,
          descriptionEn: playlistData.descriptionEn || playlistData['Description (EN)'] || playlistData.description,
          imageUrl: playlistData.imageUrl || playlistData['Image URL'],
          imageUrlEn: playlistData.imageUrlEn || playlistData['Image URL (EN)'] || playlistData.imageUrl,
          updatedAt: new Date()
        };
        
        if (existingPlaylist) {
          // Update existing playlist
          await Playlist.updateOne(
            { slug: playlistData.slug },
            { $set: playlistUpdateData }
          );
          imported++;
        } else {
          // Create new playlist
          const newPlaylist = new Playlist({
            ...playlistUpdateData,
            createdAt: playlistData.createdAt || playlistData['Created At'] ? new Date(playlistData.createdAt || playlistData['Created At']) : new Date()
          });
          
          await newPlaylist.save();
          imported++;
        }
      } catch (error) {
        console.error('Error importing playlist:', error);
        errors.push(`Error importing playlist: ${playlistData.title || playlistData.slug || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ 
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Failed to import playlists' },
      { status: 500 }
    );
  }
}