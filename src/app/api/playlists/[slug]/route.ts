// src/app/api/playlists/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchPlaylistBySlug, updatePlaylist, deletePlaylist } from '@/services/playlists';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const playlist = await fetchPlaylistBySlug(slug, language);
    
    if (!playlist) {
      return NextResponse.json(
        { error: 'Playlist not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Error in playlist API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlist' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const playlistData = await request.json();
    
    const updatedPlaylist = await updatePlaylist(slug, playlistData);
    
    if (!updatedPlaylist) {
      return NextResponse.json(
        { error: 'Playlist not found or update failed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ playlist: updatedPlaylist });
  } catch (error) {
    console.error('Error in playlist API:', error);
    return NextResponse.json(
      { error: 'Failed to update playlist' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const success = await deletePlaylist(slug);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Playlist not found or deletion failed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in playlist API:', error);
    return NextResponse.json(
      { error: 'Failed to delete playlist' },
      { status: 500 }
    );
  }
}