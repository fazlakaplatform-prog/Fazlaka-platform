import { prisma } from '@/lib/prisma';
import { Privacy, PrivacySectionType, Prisma } from '@prisma/client';

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
export interface PrivacyContentWithLocalized extends Omit<Privacy, 'content' | 'contentEn'> {
  content?: PortableTextBlock[] | null;
  contentEn?: PortableTextBlock[] | null;
  localizedTitle?: string;
  localizedContent?: string;
  localizedDescription?: string;
}

// دالة لتحويل PortableTextBlock[] إلى نص
const convertPortableTextToString = (content?: PortableTextBlock[] | null): string => {
  if (!content || content.length === 0) return '';
  
  return content.map(block => {
    if (block._type === 'block' && block.children) {
      return block.children.map(child => child.text).join('');
    }
    return '';
  }).join('');
};

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string | null, enText?: string | null) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// جلب سياسة الخصوصية الرئيسية
export async function getPrivacyPolicy(language: string = 'ar'): Promise<PrivacyContentWithLocalized | null> {
  try {
    const result = await prisma.privacy.findFirst({
      where: { sectionType: 'MAIN_POLICY' }
    });
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      content: result.content as PortableTextBlock[] | null,
      contentEn: result.contentEn as PortableTextBlock[] | null,
      localizedTitle: getLocalizedText(language, result.title, result.titleEn),
      localizedContent: language === 'ar' ? 
        convertPortableTextToString(result.content as PortableTextBlock[] | null) : 
        convertPortableTextToString(result.contentEn as PortableTextBlock[] | null)
    };
  } catch (error) {
    console.error('Error fetching privacy policy from Prisma:', error);
    return null;
  }
}

// جلب حقوق المستخدم
export async function getUserRights(language: string = 'ar'): Promise<PrivacyContentWithLocalized[]> {
  try {
    const rights = await prisma.privacy.findMany({
      where: { sectionType: 'USER_RIGHT' },
      orderBy: { title: 'asc' }
    });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return rights.map(right => ({
      ...right,
      content: right.content as PortableTextBlock[] | null,
      contentEn: right.contentEn as PortableTextBlock[] | null,
      localizedTitle: getLocalizedText(language, right.title, right.titleEn),
      localizedDescription: getLocalizedText(language, right.description, right.descriptionEn)
    }));
  } catch (error) {
    console.error('Error fetching user rights from Prisma:', error);
    return [];
  }
}

// جلب أنواع البيانات
export async function getDataTypes(language: string = 'ar'): Promise<PrivacyContentWithLocalized[]> {
  try {
    const dataTypes = await prisma.privacy.findMany({
      where: { sectionType: 'DATA_TYPE' },
      orderBy: { title: 'asc' }
    });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return dataTypes.map(dataType => ({
      ...dataType,
      content: dataType.content as PortableTextBlock[] | null,
      contentEn: dataType.contentEn as PortableTextBlock[] | null,
      localizedTitle: getLocalizedText(language, dataType.title, dataType.titleEn),
      localizedDescription: getLocalizedText(language, dataType.description, dataType.descriptionEn)
    }));
  } catch (error) {
    console.error('Error fetching data types from Prisma:', error);
    return [];
  }
}

// جلب الإجراءات الأمنية
export async function getSecurityMeasures(language: string = 'ar'): Promise<PrivacyContentWithLocalized[]> {
  try {
    const measures = await prisma.privacy.findMany({
      where: { sectionType: 'SECURITY_MEASURE' },
      orderBy: { title: 'asc' }
    });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return measures.map(measure => ({
      ...measure,
      content: measure.content as PortableTextBlock[] | null,
      contentEn: measure.contentEn as PortableTextBlock[] | null,
      localizedTitle: getLocalizedText(language, measure.title, measure.titleEn),
      localizedDescription: getLocalizedText(language, measure.description, measure.descriptionEn)
    }));
  } catch (error) {
    console.error('Error fetching security measures from Prisma:', error);
    return [];
  }
}

// واجهة لإنشاء محتوى جديد
export interface CreatePrivacyInput {
  sectionType: PrivacySectionType;
  title?: string;
  titleEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  description?: string;
  descriptionEn?: string;
  icon?: string;
  color?: string;
  textColor?: string;
  lastUpdated?: Date;
}

// واجهة لتحديث محتوى
export interface UpdatePrivacyInput {
  sectionType?: PrivacySectionType;
  title?: string;
  titleEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  description?: string;
  descriptionEn?: string;
  icon?: string;
  color?: string;
  textColor?: string;
  lastUpdated?: Date;
}

// دوال لإنشاء وتحديث وحذف محتوى سياسة الخصوصية
export async function createPrivacyContent(privacyData: CreatePrivacyInput): Promise<Privacy> {
  try {
    const newPrivacy = await prisma.privacy.create({
      data: {
        sectionType: privacyData.sectionType,
        title: privacyData.title,
        titleEn: privacyData.titleEn,
        description: privacyData.description,
        descriptionEn: privacyData.descriptionEn,
        icon: privacyData.icon,
        color: privacyData.color,
        textColor: privacyData.textColor,
        lastUpdated: privacyData.lastUpdated || new Date(),
        // استخدام Prisma.InputJsonValue للتوافق مع حقول JSON
        content: privacyData.content as unknown as Prisma.InputJsonValue,
        contentEn: privacyData.contentEn as unknown as Prisma.InputJsonValue,
      }
    });
    
    return newPrivacy;
  } catch (error) {
    console.error('Error creating privacy content in Prisma:', error);
    throw error;
  }
}

export async function updatePrivacyContent(privacyId: string, privacyData: UpdatePrivacyInput): Promise<Privacy | null> {
  try {
    const result = await prisma.privacy.update({
      where: { id: privacyId },
      data: {
        ...privacyData,
        // التأكد من تحويل حقول JSON
        content: privacyData.content as unknown as Prisma.InputJsonValue,
        contentEn: privacyData.contentEn as unknown as Prisma.InputJsonValue,
      }
    });
    
    return result;
  } catch (error) {
    console.error('Error updating privacy content in Prisma:', error);
    throw error;
  }
}

export async function deletePrivacyContent(privacyId: string): Promise<boolean> {
  try {
    await prisma.privacy.delete({
      where: { id: privacyId }
    });
    return true;
  } catch (error) {
    console.error('Error deleting privacy content in Prisma:', error);
    throw error;
  }
}

// جلب كل محتوى الخصوصية
export async function getAllPrivacyContent(language: string = 'ar'): Promise<PrivacyContentWithLocalized[]> {
  try {
    const allContent = await prisma.privacy.findMany({
      orderBy: [
        { sectionType: 'asc' },
        { title: 'asc' }
      ]
    });
    
    return allContent.map(item => ({
      ...item,
      content: item.content as PortableTextBlock[] | null,
      contentEn: item.contentEn as PortableTextBlock[] | null,
      localizedTitle: getLocalizedText(language, item.title, item.titleEn),
      localizedContent: language === 'ar' ? 
        convertPortableTextToString(item.content as PortableTextBlock[] | null) : 
        convertPortableTextToString(item.contentEn as PortableTextBlock[] | null),
      localizedDescription: getLocalizedText(language, item.description, item.descriptionEn)
    }));
  } catch (error) {
    console.error('Error fetching all privacy content from Prisma:', error);
    return [];
  }
}

// جلب محتوى حسب نوع القسم
export async function getPrivacyBySectionType(
  sectionType: PrivacySectionType, 
  language: string = 'ar'
): Promise<PrivacyContentWithLocalized[]> {
  try {
    const content = await prisma.privacy.findMany({
      where: { sectionType },
      orderBy: { title: 'asc' }
    });
    
    return content.map(item => ({
      ...item,
      content: item.content as PortableTextBlock[] | null,
      contentEn: item.contentEn as PortableTextBlock[] | null,
      localizedTitle: getLocalizedText(language, item.title, item.titleEn),
      localizedContent: language === 'ar' ? 
        convertPortableTextToString(item.content as PortableTextBlock[] | null) : 
        convertPortableTextToString(item.contentEn as PortableTextBlock[] | null),
      localizedDescription: getLocalizedText(language, item.description, item.descriptionEn)
    }));
  } catch (error) {
    console.error('Error fetching privacy by section type from Prisma:', error);
    return [];
  }
}

// جلب عنصر واحد بالمعرف
export async function getPrivacyById(id: string): Promise<Privacy | null> {
  try {
    return await prisma.privacy.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error('Error fetching privacy by id from Prisma:', error);
    return null;
  }
}