// src/services/termsService.ts
import { SectionType, RightsType, Prisma } from '@prisma/client';
import { prisma } from '@/lib/prisma';

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string | null, enText?: string | null) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// Define an extended type that includes localized properties
type TermsContentWithLocalized = {
  id: string;
  sectionType: SectionType;
  title?: string | null;
  titleEn?: string | null;
  content?: unknown | null;
  contentEn?: unknown | null;
  term?: string | null;
  termEn?: string | null;
  definition?: string | null;
  definitionEn?: string | null;
  icon?: string | null;
  rightsType?: RightsType | null;
  items?: { id: string; item: string; itemEn?: string | null }[] | null;
  color?: string | null;
  borderColor?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  linkText?: string | null;
  linkTextEn?: string | null;
  linkUrl?: string | null;
  siteTitle?: string | null;
  siteTitleEn?: string | null;
  siteDescription?: string | null;
  siteDescriptionEn?: string | null;
  logo?: unknown | null;
  logoEn?: unknown | null;
  footerText?: string | null;
  footerTextEn?: string | null;
  lastUpdated?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  localizedTitle?: string;
  localizedContent?: unknown | null;
  localizedTerm?: string;
  localizedDefinition?: string;
  localizedDescription?: string;
  localizedLinkText?: string;
  localizedSiteTitle?: string;
  localizedSiteDescription?: string;
  localizedFooterText?: string;
  localizedLogo?: unknown;
  localizedItems?: string[];
};

// جلب جميع محتويات الشروط والأحكام
export async function getAllTermsContent(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const terms = await prisma.terms.findMany({
      include: {
        items: true
      },
      orderBy: [
        { sectionType: 'asc' },
        { title: 'asc' }
      ]
    });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return terms.map(term => ({
      ...term,
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
  } catch (error) {
    console.error('Error fetching all terms content:', error);
    return [];
  }
}

// جلب شروط وأحكام الموقع الرئيسية
export async function getMainTerms(language: string = 'ar'): Promise<TermsContentWithLocalized | null> {
  try {
    const result = await prisma.terms.findFirst({
      where: { sectionType: 'MAIN_TERMS' },
      include: {
        items: true
      }
    });
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      localizedTitle: getLocalizedText(language, result.title, result.titleEn),
      localizedContent: language === 'ar' ? result.content : result.contentEn
    };
  } catch (error) {
    console.error('Error fetching main terms:', error);
    return null;
  }
}

// جلب المصطلحات القانونية
export async function getLegalTerms(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const terms = await prisma.terms.findMany({
      where: { sectionType: 'LEGAL_TERM' },
      include: {
        items: true
      },
      orderBy: { term: 'asc' }
    });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return terms.map(term => ({
      ...term,
      localizedTerm: getLocalizedText(language, term.term, term.termEn),
      localizedDefinition: getLocalizedText(language, term.definition, term.definitionEn)
    }));
  } catch (error) {
    console.error('Error fetching legal terms:', error);
    return [];
  }
}

// جلب الحقوق والمسؤوليات
export async function getRightsResponsibilities(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const rights = await prisma.terms.findMany({
      where: { sectionType: 'RIGHTS_RESPONSIBILITY' },
      include: {
        items: true
      },
      orderBy: [
        { rightsType: 'asc' },
        { title: 'asc' }
      ]
    });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return rights.map(right => ({
      ...right,
      localizedTitle: getLocalizedText(language, right.title, right.titleEn),
      localizedItems: language === 'ar' ? 
        right.items?.map(item => item.item) : 
        right.items?.map(item => item.itemEn || item.item)
    }));
  } catch (error) {
    console.error('Error fetching rights and responsibilities:', error);
    return [];
  }
}

// جلب السياسات الإضافية
export async function getAdditionalPolicies(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const policies = await prisma.terms.findMany({
      where: { sectionType: 'ADDITIONAL_POLICY' },
      include: {
        items: true
      },
      orderBy: { title: 'asc' }
    });
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return policies.map(policy => ({
      ...policy,
      localizedTitle: getLocalizedText(language, policy.title, policy.titleEn),
      localizedDescription: getLocalizedText(language, policy.description, policy.descriptionEn),
      localizedLinkText: getLocalizedText(language, policy.linkText, policy.linkTextEn)
    }));
  } catch (error) {
    console.error('Error fetching additional policies:', error);
    return [];
  }
}

// جلب إعدادات الموقع
export async function getSiteSettings(language: string = 'ar'): Promise<TermsContentWithLocalized | null> {
  try {
    const result = await prisma.terms.findFirst({
      where: { sectionType: 'SITE_SETTINGS' },
      include: {
        items: true
      }
    });
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      localizedSiteTitle: getLocalizedText(language, result.siteTitle, result.siteTitleEn),
      localizedSiteDescription: getLocalizedText(language, result.siteDescription, result.siteDescriptionEn),
      localizedFooterText: getLocalizedText(language, result.footerText, result.footerTextEn),
      localizedLogo: language === 'ar' ? result.logo : result.logoEn
    };
  } catch (error) {
    console.error('Error fetching site settings:', error);
    return null;
  }
}

// واجهة لبيانات الإدخال لإنشاء المحتوى
interface CreateTermsInput {
  sectionType: SectionType;
  title?: string;
  titleEn?: string;
  content?: unknown;
  contentEn?: unknown;
  term?: string;
  termEn?: string;
  definition?: string;
  definitionEn?: string;
  icon?: string;
  rightsType?: RightsType;
  items?: { item: string; itemEn?: string }[];
  color?: string;
  borderColor?: string;
  description?: string;
  descriptionEn?: string;
  linkText?: string;
  linkTextEn?: string;
  linkUrl?: string;
  siteTitle?: string;
  siteTitleEn?: string;
  siteDescription?: string;
  siteDescriptionEn?: string;
  logo?: unknown;
  logoEn?: unknown;
  footerText?: string;
  footerTextEn?: string;
}

// واجهة لبيانات الإدخال لتحديث المحتوى
interface UpdateTermsInput {
  sectionType?: SectionType;
  title?: string;
  titleEn?: string;
  content?: unknown;
  contentEn?: unknown;
  term?: string;
  termEn?: string;
  definition?: string;
  definitionEn?: string;
  icon?: string;
  rightsType?: RightsType;
  items?: { item: string; itemEn?: string }[];
  color?: string;
  borderColor?: string;
  description?: string;
  descriptionEn?: string;
  linkText?: string;
  linkTextEn?: string;
  linkUrl?: string;
  siteTitle?: string;
  siteTitleEn?: string;
  siteDescription?: string;
  siteDescriptionEn?: string;
  logo?: unknown;
  logoEn?: unknown;
  footerText?: string;
  footerTextEn?: string;
}

// دوال لإنشاء وتحديث وحذف محتوى الشروط والأحكام
export async function createTermsContent(termsData: CreateTermsInput): Promise<TermsContentWithLocalized> {
  try {
    const { items, content, contentEn, logo, logoEn, ...restData } = termsData;
    
    const newTerms = await prisma.terms.create({
      data: {
        ...restData,
        // تحويل حقول JSON للتوافق مع Prisma
        content: content as unknown as Prisma.InputJsonValue,
        contentEn: contentEn as unknown as Prisma.InputJsonValue,
        logo: logo as unknown as Prisma.InputJsonValue,
        logoEn: logoEn as unknown as Prisma.InputJsonValue,
        items: items ? {
          create: items.map(item => ({ item: item.item, itemEn: item.itemEn || null }))
        } : undefined
      },
      include: {
        items: true
      }
    });
    
    return newTerms as TermsContentWithLocalized;
  } catch (error) {
    console.error('Error creating terms content:', error);
    throw error;
  }
}

export async function updateTermsContent(
  termsId: string, 
  termsData: UpdateTermsInput
): Promise<TermsContentWithLocalized | null> {
  try {
    const { items, content, contentEn, logo, logoEn, ...restData } = termsData;
    
    // بناء كائن التحديث
    const updateData: Prisma.TermsUpdateInput = {
      ...restData,
      // تحويل حقول JSON
      content: content as unknown as Prisma.InputJsonValue,
      contentEn: contentEn as unknown as Prisma.InputJsonValue,
      logo: logo as unknown as Prisma.InputJsonValue,
      logoEn: logoEn as unknown as Prisma.InputJsonValue,
    };

    // التعامل مع العناصر (Items)
    if (items) {
      // حذف العناصر القديمة
      await prisma.termsItem.deleteMany({
        where: { termsId }
      });
      
      // إضافة العناصر الجديدة
      updateData.items = {
        create: items.map(item => ({ item: item.item, itemEn: item.itemEn || null }))
      };
    }
    
    const result = await prisma.terms.update({
      where: { id: termsId },
      data: updateData,
      include: {
        items: true
      }
    });
    
    return result as TermsContentWithLocalized;
  } catch (error) {
    console.error('Error updating terms content:', error);
    throw error;
  }
}

export async function deleteTermsContent(termsId: string): Promise<boolean> {
  try {
    // سيتم حذف العناصر المرتبطة تلقائيًا بسبب onDelete: Cascade
    await prisma.terms.delete({
      where: { id: termsId }
    });
    
    return true;
  } catch (error) {
    console.error('Error deleting terms content:', error);
    throw error;
  }
}