// app/api/playlists/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchPlaylists, createPlaylist } from '@/services/playlists';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    // تمرير معرف المستخدم الحالي إن وجد لجلب قوائمه الخاصة
    const playlists = await fetchPlaylists(language, session?.user?.id);
    
    return NextResponse.json({ playlists }, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
    });
  } catch (error) {
    console.error('Error in playlists API:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const playlistData = await request.json();
    
    // التحقق من وجود العنوان
    if (!playlistData.title) {
       return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    // إنشاء قائمة مرتبطة بالمستخدم
    const newPlaylist = await createPlaylist(session.user.id, {
        title: playlistData.title,
        titleEn: playlistData.titleEn || playlistData.title, // توفير قيمة افتراضية
        description: playlistData.description,
        descriptionEn: playlistData.descriptionEn,
        imageUrl: playlistData.imageUrl,
        episodes: playlistData.episodes,
        articles: playlistData.articles
    });
    
    if (!newPlaylist) {
      return NextResponse.json({ error: 'Failed to create playlist' }, { status: 400 });
    }
    
    return NextResponse.json({ playlist: newPlaylist }, { status: 201 });
  } catch (error) {
    console.error('Error in playlists API:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}