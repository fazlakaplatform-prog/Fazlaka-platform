import { NextRequest, NextResponse } from 'next/server';
import { fetchEpisodes, createEpisode } from '@/services/episodes';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const episodes = await fetchEpisodes(language);
    
    return NextResponse.json({ episodes });
  } catch (error) {
    console.error('Error in episodes API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episodes' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const episodeData = await request.json();
    
    const newEpisode = await createEpisode(episodeData);
    
    if (!newEpisode) {
      return NextResponse.json(
        { error: 'Failed to create episode' },
        { status: 400 }
      );
    }
    
    // إرسال إشعارات
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      const { broadcastNotification } = await import('@/services/sseService');
      
      await notifyAllUsers(
        'حلقة جديدة',
        'New Episode',
        `تم إضافة حلقة جديدة: ${newEpisode.title}`,
        `A new episode has been added: ${newEpisode.titleEn || newEpisode.title}`,
        newEpisode.id,
        'episode',
        `/episodes/${newEpisode.slug}`
      );
      
      broadcastNotification({
        _id: new Date().getTime().toString(),
        type: 'info',
        title: 'حلقة جديدة',
        titleEn: 'New Episode',
        message: `تم إضافة حلقة جديدة: ${newEpisode.title}`,
        messageEn: `A new episode has been added: ${newEpisode.titleEn || newEpisode.title}`,
        relatedId: newEpisode.id,
        relatedType: 'episode',
        actionUrl: `/episodes/${newEpisode.slug}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        userId: '',
        updatedAt: new Date().toISOString()
      });
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({ episode: newEpisode }, { status: 201 });
  } catch (error) {
    console.error('Error in episodes API:', error);
    return NextResponse.json(
      { error: 'Failed to create episode' },
      { status: 500 }
    );
  }
}