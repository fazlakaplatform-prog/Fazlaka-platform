import { getDatabase } from '@/lib/mongodb';
import { FAQ, FAQDocument } from '@/models/faq';
import { ObjectId } from 'mongodb';

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string, enText?: string) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// جلب جميع الأسئلة الشائعة
export async function fetchFaqs(language: string = 'ar'): Promise<FAQ[]> {
  try {
    const db = await getDatabase();
    const faqs = await db.collection('faqs').find({}).sort({ createdAt: -1 }).toArray() as FAQDocument[];
    
    return faqs.map(faq => ({
      ...faq,
      localizedQuestion: getLocalizedText(language, faq.question, faq.questionEn),
      localizedAnswer: getLocalizedText(language, faq.answer, faq.answerEn),
      localizedCategory: getLocalizedText(language, faq.category, faq.categoryEn)
    }));
  } catch (error) {
    console.error('Error fetching FAQs from MongoDB:', error);
    return [];
  }
}

// جلب سؤال شائع بالمعرف
export async function fetchFaqById(id: string): Promise<FAQ | null> {
  try {
    const db = await getDatabase();
    const faq = await db.collection('faqs').findOne({ _id: new ObjectId(id) }) as FAQDocument;
    return faq;
  } catch (error) {
    console.error('Error fetching FAQ by ID from MongoDB:', error);
    return null;
  }
}

// إنشاء سؤال شائع جديد
export async function createFaq(faqData: Omit<FAQ, '_id' | 'createdAt' | 'updatedAt'>): Promise<FAQ> {
  try {
    const db = await getDatabase();
    const newFaq = {
      ...faqData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('faqs').insertOne(newFaq);
    return {
      ...newFaq,
      _id: result.insertedId
    };
  } catch (error) {
    console.error('Error creating FAQ in MongoDB:', error);
    throw error;
  }
}

// تحديث سؤال شائع
export async function updateFaq(faqId: string, faqData: Partial<FAQ>): Promise<FAQ | null> {
  try {
    const db = await getDatabase();
    const updateData = {
      ...faqData,
      updatedAt: new Date()
    };
    
    const result = await db.collection('faqs').findOneAndUpdate(
      { _id: new ObjectId(faqId) },
      { $set: updateData },
      { returnDocument: 'after' }
    ) as FAQDocument;
    
    return result;
  } catch (error) {
    console.error('Error updating FAQ in MongoDB:', error);
    throw error;
  }
}

// حذف سؤال شائع
export async function deleteFaq(faqId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.collection('faqs').deleteOne({ _id: new ObjectId(faqId) });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting FAQ in MongoDB:', error);
    throw error;
  }
}

// جلب الفئات المتاحة
export async function fetchCategories(language: string = 'ar'): Promise<string[]> {
  try {
    const faqs = await fetchFaqs(language);
    const categoryField = language === 'ar' ? 'category' : 'categoryEn';
    
    const categories = [...new Set(
      faqs
        .map(faq => faq[categoryField as keyof FAQ])
        .filter((cat): cat is string => Boolean(cat))
    )];
    
    return categories;
  } catch (error) {
    console.error('Error fetching categories from MongoDB:', error);
    return [];
  }
}

// جلب الأسئلة الشائعة حسب الفئة
export async function fetchFaqsByCategory(category: string, language: string = 'ar'): Promise<FAQ[]> {
  try {
    const db = await getDatabase();
    const categoryField = language === 'ar' ? 'category' : 'categoryEn';
    
    const faqs = await db.collection('faqs')
      .find({ [categoryField]: category })
      .sort({ createdAt: -1 })
      .toArray() as FAQDocument[];
    
    return faqs.map(faq => ({
      ...faq,
      localizedQuestion: getLocalizedText(language, faq.question, faq.questionEn),
      localizedAnswer: getLocalizedText(language, faq.answer, faq.answerEn),
      localizedCategory: getLocalizedText(language, faq.category, faq.categoryEn)
    }));
  } catch (error) {
    console.error('Error fetching FAQs by category from MongoDB:', error);
    return [];
  }
}