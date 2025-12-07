import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
// <-- تم حذف ObjectId من هنا لأنه غير مستخدم -->

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string, enText?: string) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// جلب جميع محتويات الشروط والأحكام
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    const sectionType = searchParams.get('sectionType');
    
    const db = await getDatabase();
    let query = {};
    
    // إذا تم تحديد نوع القسم، أضفه إلى الاستعلام
    if (sectionType) {
      query = { sectionType };
    }
    
    const terms = await db.collection('termsContent')
      .find(query)
      .sort({ sectionType: 1, title: 1 })
      .toArray();
    
    // تحويل البيانات لتشمل النصوص المحلية
    const formattedTerms = terms.map(term => ({
      ...term,
      id: term._id.toString(),
      localizedTitle: getLocalizedText(language, term.title, term.titleEn),
      localizedContent: language === 'ar' ? term.content : term.contentEn,
      localizedTerm: getLocalizedText(language, term.term, term.termEn),
      localizedDefinition: getLocalizedText(language, term.definition, term.definitionEn),
      localizedDescription: getLocalizedText(language, term.description, term.descriptionEn),
      localizedLinkText: getLocalizedText(language, term.linkText, term.linkTextEn),
      localizedSiteTitle: getLocalizedText(language, term.siteTitle, term.siteTitleEn),
      localizedSiteDescription: getLocalizedText(language, term.siteDescription, term.siteDescriptionEn),
      localizedFooterText: getLocalizedText(language, term.footerText, term.footerTextEn),
      localizedLogo: language === 'ar' ? term.logo : term.logoEn
    }));
    
    return NextResponse.json({ success: true, data: formattedTerms });
  } catch (error) {
    console.error('Error fetching terms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch terms' },
      { status: 500 }
    );
  }
}

// إنشاء محتوى شروط وأحكام جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من الحقول المطلوبة
    if (!body.sectionType) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: sectionType' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const newTerms = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('termsContent').insertOne(newTerms);
    
    // إرسال إشعارات لجميع المستخدمين عند تحديث الشروط والأحكام
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'تحديث في الشروط والأحكام',
        'Terms & Conditions Update',
        `تم تحديث الشروط والأحكام: ${newTerms.title || 'قسم جديد'}`,
        `The terms and conditions have been updated: ${newTerms.titleEn || newTerms.title || 'New section'}`,
        result.insertedId.toString(),
        'terms',
        '/terms'
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...newTerms,
        id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Error creating terms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create terms' },
      { status: 500 }
    );
  }
}