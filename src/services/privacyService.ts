import { getDatabase } from '@/lib/mongodb';
import { PrivacyContent, PrivacyDocument } from '@/models/privacy';
import mongoose, { Types } from 'mongoose';

// تعريف واجهة لمحتوى PortableText
interface PortableTextBlock {
  _type: string;
  _key?: string;
  style?: string;
  markDefs?: Array<{
    _type: string;
    _key: string;
    [key: string]: unknown;
  }>;
  children: Array<{
    _type: string;
    text: string;
    marks?: string[];
  }>;
}

// تعريف واجهة موسعة تحتوي على حقول النصوص المحلية
export interface PrivacyContentWithLocalized extends PrivacyContent {
  localizedTitle?: string;
  localizedContent?: string;
  localizedDescription?: string;
}

// دالة لتحويل PortableTextBlock[] إلى نص
const convertPortableTextToString = (content?: PortableTextBlock[]): string => {
  if (!content || content.length === 0) return '';
  
  return content.map(block => {
    if (block._type === 'block' && block.children) {
      return block.children.map(child => child.text).join('');
    }
    return '';
  }).join('');
};

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string, enText?: string) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// جلب سياسة الخصوصية الرئيسية
export async function getPrivacyPolicy(language: string = 'ar'): Promise<PrivacyContentWithLocalized | null> {
  try {
    const db = await getDatabase();
    const result = await db.collection('privacyContent').findOne({ sectionType: 'mainPolicy' }) as PrivacyDocument;
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      localizedTitle: getLocalizedText(language, result.title, result.titleEn),
      localizedContent: language === 'ar' ? 
        convertPortableTextToString(result.content as PortableTextBlock[]) : 
        convertPortableTextToString(result.contentEn as PortableTextBlock[])
    };
  } catch (error) {
    console.error('Error fetching privacy policy from MongoDB:', error);
    return null;
  }
}

// جلب حقوق المستخدم
export async function getUserRights(language: string = 'ar'): Promise<PrivacyContentWithLocalized[]> {
  try {
    const db = await getDatabase();
    const rights = await db.collection('privacyContent')
      .find({ sectionType: 'userRight' })
      .sort({ title: 1 })
      .toArray() as PrivacyDocument[];
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return rights.map(right => ({
      ...right,
      localizedTitle: getLocalizedText(language, right.title, right.titleEn),
      localizedDescription: getLocalizedText(language, right.description, right.descriptionEn)
    }));
  } catch (error) {
    console.error('Error fetching user rights from MongoDB:', error);
    return [];
  }
}

// جلب أنواع البيانات
export async function getDataTypes(language: string = 'ar'): Promise<PrivacyContentWithLocalized[]> {
  try {
    const db = await getDatabase();
    const dataTypes = await db.collection('privacyContent')
      .find({ sectionType: 'dataType' })
      .sort({ title: 1 })
      .toArray() as PrivacyDocument[];
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return dataTypes.map(dataType => ({
      ...dataType,
      localizedTitle: getLocalizedText(language, dataType.title, dataType.titleEn),
      localizedDescription: getLocalizedText(language, dataType.description, dataType.descriptionEn)
    }));
  } catch (error) {
    console.error('Error fetching data types from MongoDB:', error);
    return [];
  }
}

// جلب الإجراءات الأمنية
export async function getSecurityMeasures(language: string = 'ar'): Promise<PrivacyContentWithLocalized[]> {
  try {
    const db = await getDatabase();
    const measures = await db.collection('privacyContent')
      .find({ sectionType: 'securityMeasure' })
      .sort({ title: 1 })
      .toArray() as PrivacyDocument[];
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return measures.map(measure => ({
      ...measure,
      localizedTitle: getLocalizedText(language, measure.title, measure.titleEn),
      localizedDescription: getLocalizedText(language, measure.description, measure.descriptionEn)
    }));
  } catch (error) {
    console.error('Error fetching security measures from MongoDB:', error);
    return [];
  }
}

// دوال لإنشاء وتحديث وحذف محتوى سياسة الخصوصية
export async function createPrivacyContent(privacyData: Omit<PrivacyContent, '_id' | 'createdAt' | 'updatedAt'>): Promise<PrivacyContent> {
  try {
    const db = await getDatabase();
    const newPrivacy = {
      ...privacyData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('privacyContent').insertOne(newPrivacy);
    return {
      ...newPrivacy,
      _id: result.insertedId
    };
  } catch (error) {
    console.error('Error creating privacy content in MongoDB:', error);
    throw error;
  }
}

export async function updatePrivacyContent(privacyId: string, privacyData: Partial<PrivacyContent>): Promise<PrivacyContent | null> {
  try {
    const db = await getDatabase();
    const updateData = {
      ...privacyData,
      updatedAt: new Date()
    };
    
    const result = await db.collection('privacyContent').findOneAndUpdate(
      { _id: new Types.ObjectId(privacyId) },
      { $set: updateData },
      { returnDocument: 'after' }
    ) as PrivacyDocument;
    
    return result;
  } catch (error) {
    console.error('Error updating privacy content in MongoDB:', error);
    throw error;
  }
}

export async function deletePrivacyContent(privacyId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.collection('privacyContent').deleteOne({ _id: new Types.ObjectId(privacyId) });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting privacy content in MongoDB:', error);
    throw error;
  }
}