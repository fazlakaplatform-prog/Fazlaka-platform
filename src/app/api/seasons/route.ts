import { NextRequest, NextResponse } from 'next/server';
import { getSeasons, createSeason } from '@/services/seasons';
import { notifyAllUsers } from '@/services/notifications'; // <--- استيراد دالة الإشعارات

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const seasons = await getSeasons(language);
    
    return NextResponse.json({ seasons }, {
      headers: { 'Cache-Control': 'no-cache, no-store, must-revalidate' }
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
    const body = await request.json();
    
    if (!body.title) {
      return NextResponse.json(
        { error: 'Title is required' },
        { status: 400 }
      );
    }

    const newSeason = await createSeason(body);
    
    // --- إرسال الإشعارات ---
    // التأكد من أن العملية تتم بشكل غير متزامن حتى لا تتأخر الاستجابة
    notifyAllUsers(
      "موسم جديد", // Title AR
      "New Season", // Title EN
      `تمت إضافة موسم جديد: ${newSeason.title}`, // Message AR
      `A new season has been added: ${newSeason.titleEn || newSeason.title}`, // Message EN
      newSeason.id, // relatedId
      "SEASON", // relatedType (يجب أن يكون بأحرف كبيرة)
      `/seasons/${newSeason.slug}` // actionUrl
    ).catch(err => console.error("Error sending season notification:", err));
    // ---------------------

    return NextResponse.json({ season: newSeason }, { status: 201 });
  } catch (error) {
    console.error('Error creating season:', error);
    return NextResponse.json(
      { error: 'Failed to create season' },
      { status: 500 }
    );
  }
}