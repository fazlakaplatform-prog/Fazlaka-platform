// src/app/api/seasons/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { fetchSeasons, createSeason } from '@/services/seasons';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const seasons = await fetchSeasons(language);
    
    return NextResponse.json({ seasons }, {
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0'
      }
    });
  } catch (error) {
    console.error('Error in seasons API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch seasons' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const seasonData = await request.json();
    
    const newSeason = await createSeason(seasonData);
    
    if (!newSeason) {
      return NextResponse.json(
        { error: 'Failed to create season' },
        { status: 400 }
      );
    }
    
    // إرسال إشعارات لجميع المستخدمين عند إضافة موسم جديد
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      
      // استخدام تحويل مزدوج لتجنب مشاكل TypeScript
      const seasonId = (newSeason as unknown as { _id: { toString(): string } | string })._id?.toString() || '';
      
      await notifyAllUsers(
        'موسم جديد',
        'New Season',
        `تم إضافة موسم جديد: ${(newSeason as { title: string }).title}`,
        `A new season has been added: ${(newSeason as { titleEn?: string, title: string }).titleEn || (newSeason as { title: string }).title}`,
        seasonId,
        'season',
        `/seasons/${(newSeason as { slug: string }).slug}`
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({ season: newSeason }, { status: 201 });
  } catch (error) {
    console.error('Error in seasons API:', error);
    return NextResponse.json(
      { error: 'Failed to create season' },
      { status: 500 }
    );
  }
}