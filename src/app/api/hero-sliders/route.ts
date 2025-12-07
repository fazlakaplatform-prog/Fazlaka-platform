// File: src/app/api/hero-slider/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import HeroSlider from '@/models/HeroSlider';

// GET: جلب كل عناصر الهيرو سلايدر
export async function GET(request: NextRequest) {
  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('lang') || 'ar';

    const sliders = await HeroSlider.find({}).sort({ orderRank: 1, createdAt: -1 });

    const localizedSliders = sliders.map(slider => ({
      ...slider.toJSON(),
      _id: slider._id.toString(),
      localizedTitle: language === 'en' ? slider.titleEn : slider.title,
      localizedDescription: language === 'en' ? slider.descriptionEn : slider.description,
      localizedImage: language === 'en' ? slider.imageEn : slider.image,
      localizedVideoUrl: language === 'en' ? slider.videoUrlEn : slider.videoUrl,
      localizedLinkText: language === 'en' ? slider.link?.textEn : slider.link?.text,
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
    await connectDB();
    const body = await request.json();

    // التحقق من الحقول المطلوبة
    if (!body.title || !body.titleEn) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title and titleEn' },
        { status: 400 }
      );
    }
    
    const newHeroSlider = new HeroSlider({
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    const savedSlider = await newHeroSlider.save();
    
    // إرسال إشعارات لجميع المستخدمين عند إضافة هيرو سلايدر جديد
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'تحديث في الشريط الرئيسي',
        'Hero Slider Update',
        `تمت إضافة شريط رئيسي جديد: ${savedSlider.title}`,
        `A new hero slider has been added: ${savedSlider.titleEn || savedSlider.title}`,
        savedSlider._id.toString(),
        'general', // استخدام نوع عام لأنه ليس محتوى رئيسيًا مثل المقالات
        '/' // رابط الصفحة الرئيسية
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...savedSlider.toJSON(),
        id: savedSlider._id.toString()
      }
    });
  } catch (error) {
    console.error('Error creating hero slider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create hero slider' },
      { status: 500 }
    );
  }
}