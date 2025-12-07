import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
// <-- تم حذف ObjectId من هنا لأنه غير مستخدم -->

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string, enText?: string) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// جلب محتويات سياسة الخصوصية
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
    
    const privacy = await db.collection('privacyContent')
      .find(query)
      .sort({ sectionType: 1, title: 1 })
      .toArray();
    
    // تحويل البيانات لتشمل النصوص المحلية
    const formattedPrivacy = privacy.map(item => ({
      ...item,
      id: item._id.toString(),
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
    
    // التحقق من الحقول المطلوبة
    if (!body.sectionType) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: sectionType' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const newPrivacy = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('privacyContent').insertOne(newPrivacy);
    
    // إرسال إشعارات لجميع المستخدمين عند تحديث سياسة الخصوصية
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'تحديث في سياسة الخصوصية',
        'Privacy Policy Update',
        `تم تحديث سياسة الخصوصية: ${newPrivacy.title || 'قسم جديد'}`,
        `The privacy policy has been updated: ${newPrivacy.titleEn || newPrivacy.title || 'New section'}`,
        result.insertedId.toString(),
        'privacy',
        '/privacy'
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...newPrivacy,
        id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Error creating privacy content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create privacy content' },
      { status: 500 }
    );
  }
}