import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrivacySectionType } from '@prisma/client';

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string | null, enText?: string | null) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// جلب محتويات سياسة الخصوصية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    const sectionType = searchParams.get('sectionType') as PrivacySectionType | null;
    
    const where = sectionType ? { sectionType } : {};
    
    const privacy = await prisma.privacy.findMany({
      where,
      orderBy: [
        { sectionType: 'asc' },
        { title: 'asc' }
      ]
    });
    
    const formattedPrivacy = privacy.map(item => ({
      ...item,
      localizedTitle: getLocalizedText(language, item.title, item.titleEn),
      localizedContent: language === 'ar' ? item.content : item.contentEn,
      localizedDescription: getLocalizedText(language, item.description, item.descriptionEn)
    }));
    
    return NextResponse.json({ success: true, data: formattedPrivacy });
  } catch (error) {
    console.error('Error fetching privacy content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch privacy content' },
      { status: 500 }
    );
  }
}

// إنشاء محتوى سياسة الخصوصية جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    if (!body.sectionType) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: sectionType' },
        { status: 400 }
      );
    }
    
    const validSectionTypes: PrivacySectionType[] = ['MAIN_POLICY', 'USER_RIGHT', 'DATA_TYPE', 'SECURITY_MEASURE'];
    if (!validSectionTypes.includes(body.sectionType)) {
      return NextResponse.json(
        { success: false, error: 'Invalid sectionType value' },
        { status: 400 }
      );
    }
    
    const newPrivacy = await prisma.privacy.create({
      data: {
        sectionType: body.sectionType,
        title: body.title,
        titleEn: body.titleEn,
        content: body.content,
        contentEn: body.contentEn,
        description: body.description,
        descriptionEn: body.descriptionEn,
        icon: body.icon,
        color: body.color,
        textColor: body.textColor,
        lastUpdated: body.lastUpdated ? new Date(body.lastUpdated) : new Date()
      }
    });
    
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'تحديث في سياسة الخصوصية',
        'Privacy Policy Update',
        `تم تحديث سياسة الخصوصية: ${newPrivacy.title || 'قسم جديد'}`,
        `The privacy policy has been updated: ${newPrivacy.titleEn || newPrivacy.title || 'New section'}`,
        newPrivacy.id,
        'privacy',
        '/privacy'
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: newPrivacy
    });
  } catch (error) {
    console.error('Error creating privacy content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create privacy content' },
      { status: 500 }
    );
  }
}