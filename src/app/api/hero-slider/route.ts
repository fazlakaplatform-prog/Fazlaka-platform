import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: جلب كل عناصر الهيرو سلايدر
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'ar';

    const sliders = await prisma.heroSlider.findMany({
      orderBy: [
        { orderRank: 'asc' },
        { createdAt: 'desc' }
      ]
    });

    const localizedSliders = sliders.map(slider => ({
      ...slider,
      localizedTitle: language === 'en' ? slider.titleEn : slider.title,
      localizedDescription: language === 'en' ? slider.descriptionEn : slider.description,
      localizedImage: language === 'en' ? slider.imageEn : slider.image,
      localizedVideoUrl: language === 'en' ? slider.videoUrlEn : slider.videoUrl,
      localizedLinkText: language === 'en' ? slider.linkTextEn : slider.linkText,
    }));

    return NextResponse.json(localizedSliders);
  } catch (error) {
    console.error('Error fetching hero sliders:', error);
    return NextResponse.json({ message: 'Error fetching data' }, { status: 500 });
  }
}

// POST: إضافة هيرو سلايدر جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // التحقق من الحقول المطلوبة
    if (!body.title || !body.titleEn) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title and titleEn' },
        { status: 400 }
      );
    }
    
    // تجهيز البيانات لـ Prisma
    const data = {
      title: body.title,
      titleEn: body.titleEn,
      description: body.description || '',
      descriptionEn: body.descriptionEn || body.description || '',
      mediaType: body.mediaType || 'IMAGE',
      image: body.image,
      imageEn: body.imageEn,
      videoUrl: body.videoUrl,
      videoUrlEn: body.videoUrlEn,
      // تسطيح link
      linkText: body.link?.text,
      linkTextEn: body.link?.textEn,
      linkUrl: body.link?.url,
      orderRank: body.orderRank || 0,
    };
    
    const savedSlider = await prisma.heroSlider.create({
      data
    });
    
    // إرسال إشعارات لجميع المستخدمين عند إضافة هيرو سلايدر جديد
    try {
      // ملاحظة: تأكد من وجود ملف الخدمات هذا أو قم بتعديله
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'تحديث في الشريط الرئيسي',
        'Hero Slider Update',
        `تمت إضافة شريط رئيسي جديد: ${savedSlider.title}`,
        `A new hero slider has been added: ${savedSlider.titleEn || savedSlider.title}`,
        savedSlider.id,
        'general',
        '/'
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
      // نستمر في التنفيذ حتى لو فشل الإشعار
    }
    
    return NextResponse.json({
      success: true,
      data: savedSlider
    });
  } catch (error) {
    console.error('Error creating hero slider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create hero slider' },
      { status: 500 }
    );
  }
}