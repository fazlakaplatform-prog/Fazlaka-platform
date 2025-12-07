import { NextRequest, NextResponse } from 'next/server';
import { fetchPlaylists, createPlaylist } from '@/services/playlists';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const playlists = await fetchPlaylists(language);
    
    return NextResponse.json({ playlists }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error in playlists API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch playlists' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const playlistData = await request.json();
    
    const newPlaylist = await createPlaylist(playlistData);
    
    if (!newPlaylist) {
      return NextResponse.json(
        { error: 'Failed to create playlist' },
        { status: 400 }
      );
    }
    
    // إرسال إشعارات لجميع المستخدمين عند إضافة قائمة تشغيل جديدة
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      
      // استخراج معرف قائمة التشغيل بطريقة آمنة
      const playlistId = (newPlaylist as { _id?: unknown })._id;
      const playlistIdStr = playlistId ? String(playlistId) : '';
      
      await notifyAllUsers(
        'قائمة تشغيل جديدة',
        'New Playlist',
        `تمت إضافة قائمة تشغيل جديدة: ${newPlaylist.title}`,
        `A new playlist has been added: ${newPlaylist.titleEn || newPlaylist.title}`,
        playlistIdStr,
        'playlist',
        `/playlists/${newPlaylist.slug}`
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({ playlist: newPlaylist }, { status: 201 });
  } catch (error) {
    console.error('Error in playlists API:', error);
    return NextResponse.json(
      { error: 'Failed to create playlist' },
      { status: 500 }
    );
  }
}