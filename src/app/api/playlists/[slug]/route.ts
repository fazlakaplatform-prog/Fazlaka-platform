// app/api/playlists/[slug]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchPlaylistBySlug, updatePlaylist, deletePlaylist } from '@/services/playlists';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    // جلب القائمة مع التحقق إذا كانت خاصة
    const playlist = await fetchPlaylistBySlug(slug, language, session?.user?.id);
    
    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found or access denied' }, { status: 404 });
    }
    
    return NextResponse.json({ playlist });
  } catch (error) {
    console.error('Error in playlist API:', error);
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const playlistData = await request.json();
    
    const updatedPlaylist = await updatePlaylist(session.user.id, slug, playlistData);
    
    if (!updatedPlaylist) {
      return NextResponse.json({ error: 'Playlist not found or update failed' }, { status: 404 });
    }
    
    return NextResponse.json({ playlist: updatedPlaylist });
  } catch (error) {
    console.error('Error in playlist API:', error);
    return NextResponse.json({ error: 'Failed to update playlist' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { slug } = await params;
    const success = await deletePlaylist(session.user.id, slug);
    
    if (!success) {
      return NextResponse.json({ error: 'Playlist not found or deletion failed' }, { status: 404 });
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in playlist API:', error);
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}