import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // تمت إضافة الاستيراد

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string | null, enText?: string | null) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// جلب جميع الأسئلة الشائعة
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    const category = searchParams.get('category');
    
    // تم إصلاح الخطأ: استخدام const ونوع Prisma الصحيح بدلاً من any
    const whereClause: Prisma.FAQWhereInput = {};
    
    // إذا تم تحديد فئة، أضفها إلى الاستعلام
    if (category) {
      // تم تعديل الطريقة لتكون متوافقة مع TypeScript بدلاً من استخدام مفاتيح ديناميكية
      if (language === 'ar') {
        whereClause.category = category;
      } else {
        whereClause.categoryEn = category;
      }
    }
    
    const faqs = await prisma.fAQ.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' }
    });
    
    // تحويل البيانات لتشمل النصوص المحلية
    const formattedFaqs = faqs.map(faq => ({
      ...faq,
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
    
    const newFaq = await prisma.fAQ.create({
      data: {
        question: body.question,
        questionEn: body.questionEn,
        answer: body.answer,
        answerEn: body.answerEn,
        category: body.category,
        categoryEn: body.categoryEn,
      }
    });
    
    // إرسال إشعارات لجميع المستخدمين عند إضافة سؤال شائع جديد
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'سؤال شائع جديد',
        'New FAQ',
        `تمت إضافة سؤال شائع جديد: ${newFaq.question}`,
        `A new FAQ has been added: ${newFaq.questionEn || newFaq.question}`,
        newFaq.id,
        'faq',
        '/faqs'
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: newFaq
    });
  } catch (error) {
    console.error('Error creating FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create FAQ' },
      { status: 500 }
    );
  }
}