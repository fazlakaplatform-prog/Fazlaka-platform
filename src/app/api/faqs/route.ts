import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
// تم إزالة استيراد ObjectId لأنه لم يكن مستخدمًا
// import { ObjectId } from 'mongodb';

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string, enText?: string) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// جلب جميع الأسئلة الشائعة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    const category = searchParams.get('category');
    
    const db = await getDatabase();
    let query = {};
    
    // إذا تم تحديد فئة، أضفها إلى الاستعلام
    if (category) {
      const categoryField = language === 'ar' ? 'category' : 'categoryEn';
      query = { [categoryField]: category };
    }
    
    const faqs = await db.collection('faqs')
      .find(query)
      .sort({ createdAt: -1 })
      .toArray();
    
    // تحويل البيانات لتشمل النصوص المحلية
    const formattedFaqs = faqs.map(faq => ({
      ...faq,
      id: faq._id.toString(),
      localizedQuestion: getLocalizedText(language, faq.question, faq.questionEn),
      localizedAnswer: getLocalizedText(language, faq.answer, faq.answerEn),
      localizedCategory: getLocalizedText(language, faq.category, faq.categoryEn)
    }));
    
    return NextResponse.json({ success: true, data: formattedFaqs });
  } catch (error) {
    console.error('Error fetching FAQs:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQs' },
      { status: 500 }
    );
  }
}

// إنشاء سؤال شائع جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من الحقول المطلوبة
    if (!body.question || !body.answer || !body.category) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const newFaq = {
      ...body,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('faqs').insertOne(newFaq);
    
    // إرسال إشعارات لجميع المستخدمين عند إضافة سؤال شائع جديد
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'سؤال شائع جديد',
        'New FAQ',
        `تمت إضافة سؤال شائع جديد: ${newFaq.question}`,
        `A new FAQ has been added: ${newFaq.questionEn || newFaq.question}`,
        result.insertedId.toString(),
        'faq',
        '/faqs'
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...newFaq,
        id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}