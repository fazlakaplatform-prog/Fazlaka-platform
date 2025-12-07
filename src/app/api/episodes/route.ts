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
    
    // إرسال إشعارات لجميع المستخدمين عند إضافة حلقة جديدة
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      
      // استخراج معرف الحلقة بطريقة آمنة
      const episodeId = (newEpisode as { _id?: unknown })._id;
      const episodeIdStr = episodeId ? String(episodeId) : '';
      
      // استيراد دالة البث من الملف الصحيح
      const { broadcastNotification } = await import('@/services/sseService');
      
      // إنشاء الإشعار في قاعدة البيانات أولاً
      await notifyAllUsers(
        'حلقة جديدة',
        'New Episode',
        `تم إضافة حلقة جديدة: ${newEpisode.title}`,
        `A new episode has been added: ${newEpisode.titleEn || newEpisode.title}`,
        episodeIdStr,
        'episode',
        `/episodes/${newEpisode.slug}`
      );
      
      // إرسال الإشعار فوراً عبر SSE
      // إنشاء معرف فريد للإشعار
      const notificationId = new Date().getTime().toString();
      
      broadcastNotification({
        _id: notificationId, // إضافة المعرف المطلوب
        type: 'info',
        title: 'حلقة جديدة',
        titleEn: 'New Episode',
        message: `تم إضافة حلقة جديدة: ${newEpisode.title}`,
        messageEn: `A new episode has been added: ${newEpisode.titleEn || newEpisode.title}`,
        relatedId: episodeIdStr,
        relatedType: 'episode',
        actionUrl: `/episodes/${newEpisode.slug}`,
        isRead: false,
        createdAt: new Date().toISOString(),
        userId: '', // سيتم تعيينه لكل مستخدم
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