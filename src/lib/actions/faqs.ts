import { prisma } from '@/lib/prisma';
import { FAQ } from '@/types/faq';
import { Prisma } from '@prisma/client';

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string | null, enText?: string | null) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// جلب جميع الأسئلة الشائعة
export async function fetchFaqs(language: string = 'ar'): Promise<FAQ[]> {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return faqs.map(faq => ({
      ...faq,
      localizedQuestion: getLocalizedText(language, faq.question, faq.questionEn),
      localizedAnswer: getLocalizedText(language, faq.answer, faq.answerEn),
      localizedCategory: getLocalizedText(language, faq.category, faq.categoryEn)
    }));
  } catch (error) {
    console.error('Error fetching FAQs from Prisma:', error);
    return [];
  }
}

// جلب سؤال شائع بالمعرف
export async function fetchFaqById(id: string): Promise<FAQ | null> {
  try {
    const faq = await prisma.fAQ.findUnique({ 
      where: { id } 
    });
    return faq;
  } catch (error) {
    console.error('Error fetching FAQ by ID from Prisma:', error);
    return null;
  }
}

// إنشاء سؤال شائع جديد
// تم تغيير النوع إلى Prisma.FAQCreateInput لضمان التوافق
export async function createFaq(faqData: Prisma.FAQCreateInput): Promise<FAQ> {
  try {
    const newFaq = await prisma.fAQ.create({
      data: faqData
    });
    return newFaq;
  } catch (error) {
    console.error('Error creating FAQ in Prisma:', error);
    throw error;
  }
}

// تحديث سؤال شائع
// تم تغيير النوع إلى Prisma.FAQUpdateInput
export async function updateFaq(faqId: string, faqData: Prisma.FAQUpdateInput): Promise<FAQ | null> {
  try {
    const result = await prisma.fAQ.update({
      where: { id: faqId },
      data: faqData
    });
    
    return result;
  } catch (error) {
    console.error('Error updating FAQ in Prisma:', error);
    throw error;
  }
}

// حذف سؤال شائع
export async function deleteFaq(faqId: string): Promise<boolean> {
  try {
    await prisma.fAQ.delete({ 
      where: { id: faqId } 
    });
    return true;
  } catch (error) {
    console.error('Error deleting FAQ in Prisma:', error);
    throw error;
  }
}

// جلب الفئات المتاحة
export async function fetchCategories(language: string = 'ar'): Promise<string[]> {
  try {
    const faqs = await prisma.fAQ.findMany({
      select: {
        category: true,
        categoryEn: true
      }
    });
    
    const categoryField = language === 'ar' ? 'category' : 'categoryEn';
    
    const categories = [...new Set(
      faqs
        .map(faq => faq[categoryField as keyof typeof faq])
        .filter((cat): cat is string => Boolean(cat))
    )];
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories from Prisma:', error);
    return [];
  }
}

// جلب الأسئلة الشائعة حسب الفئة
export async function fetchFaqsByCategory(category: string, language: string = 'ar'): Promise<FAQ[]> {
  try {
    const categoryField = language === 'ar' ? 'category' : 'categoryEn';
    
    const faqs = await prisma.fAQ.findMany({
      where: {
        [categoryField]: category
      },
      orderBy: { createdAt: 'desc' }
    });
    
    return faqs.map(faq => ({
      ...faq,
      localizedQuestion: getLocalizedText(language, faq.question, faq.questionEn),
      localizedAnswer: getLocalizedText(language, faq.answer, faq.answerEn),
      localizedCategory: getLocalizedText(language, faq.category, faq.categoryEn)
    }));
  } catch (error) {
    console.error('Error fetching FAQs by category from Prisma:', error);
    return [];
  }
}