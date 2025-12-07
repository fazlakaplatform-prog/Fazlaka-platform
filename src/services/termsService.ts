import { getDatabase } from '@/lib/mongodb';
import { TermsContent, TermsDocument } from '@/models/terms';
import { ObjectId } from 'mongodb';

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string, enText?: string) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// Define an extended type that includes localized properties
type TermsContentWithLocalized = TermsContent & {
  localizedTitle?: string;
  localizedContent?: unknown[] | undefined;
  localizedTerm?: string;
  localizedDefinition?: string;
  localizedDescription?: string;
  localizedLinkText?: string;
  localizedSiteTitle?: string;
  localizedSiteDescription?: string;
  localizedFooterText?: string;
  localizedLogo?: unknown; // Changed from string to unknown to handle ImageAsset type
  localizedItems?: string[];
};

// جلب جميع محتويات الشروط والأحكام
export async function getAllTermsContent(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const db = await getDatabase();
    const terms = await db.collection('termsContent').find({}).sort({ sectionType: 1, title: 1 }).toArray() as TermsDocument[];
    
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
    console.error('Error fetching all terms content from MongoDB:', error);
    return [];
  }
}

// جلب شروط وأحكام الموقع الرئيسية
export async function getMainTerms(language: string = 'ar'): Promise<TermsContentWithLocalized | null> {
  try {
    const db = await getDatabase();
    const result = await db.collection('termsContent').findOne({ sectionType: 'mainTerms' }) as TermsDocument;
    
    if (!result) return null;
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return {
      ...result,
      localizedTitle: getLocalizedText(language, result.title, result.titleEn),
      localizedContent: language === 'ar' ? result.content : result.contentEn
    };
  } catch (error) {
    console.error('Error fetching main terms from MongoDB:', error);
    return null;
  }
}

// جلب المصطلحات القانونية
export async function getLegalTerms(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const db = await getDatabase();
    const terms = await db.collection('termsContent')
      .find({ sectionType: 'legalTerm' })
      .sort({ term: 1 })
      .toArray() as TermsDocument[];
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return terms.map(term => ({
      ...term,
      localizedTerm: getLocalizedText(language, term.term, term.termEn),
      localizedDefinition: getLocalizedText(language, term.definition, term.definitionEn)
    }));
  } catch (error) {
    console.error('Error fetching legal terms from MongoDB:', error);
    return [];
  }
}

// جلب الحقوق والمسؤوليات
export async function getRightsResponsibilities(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const db = await getDatabase();
    const rights = await db.collection('termsContent')
      .find({ sectionType: 'rightsResponsibility' })
      .sort({ rightsType: 1, title: 1 })
      .toArray() as TermsDocument[];
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return rights.map(right => ({
      ...right,
      localizedTitle: getLocalizedText(language, right.title, right.titleEn),
      localizedItems: language === 'ar' ? 
        right.items?.map(item => item.item) : 
        right.items?.map(item => item.itemEn || item.item)
    }));
  } catch (error) {
    console.error('Error fetching rights and responsibilities from MongoDB:', error);
    return [];
  }
}

// جلب السياسات الإضافية
export async function getAdditionalPolicies(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const db = await getDatabase();
    const policies = await db.collection('termsContent')
      .find({ sectionType: 'additionalPolicy' })
      .sort({ title: 1 })
      .toArray() as TermsDocument[];
    
    // إضافة حقول النصوص المحلية بناءً على اللغة المطلوبة
    return policies.map(policy => ({
      ...policy,
      localizedTitle: getLocalizedText(language, policy.title, policy.titleEn),
      localizedDescription: getLocalizedText(language, policy.description, policy.descriptionEn),
      localizedLinkText: getLocalizedText(language, policy.linkText, policy.linkTextEn)
    }));
  } catch (error) {
    console.error('Error fetching additional policies from MongoDB:', error);
    return [];
  }
}

// جلب إعدادات الموقع
export async function getSiteSettings(language: string = 'ar'): Promise<TermsContentWithLocalized | null> {
  try {
    const db = await getDatabase();
    const result = await db.collection('termsContent').findOne({ sectionType: 'siteSettings' }) as TermsDocument;
    
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
    console.error('Error fetching site settings from MongoDB:', error);
    return null;
  }
}

// دوال لإنشاء وتحديث وحذف محتوى الشروط والأحكام
export async function createTermsContent(termsData: Omit<TermsContent, '_id' | 'createdAt' | 'updatedAt'>): Promise<TermsContent> {
  try {
    const db = await getDatabase();
    const newTerms = {
      ...termsData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('termsContent').insertOne(newTerms);
    return {
      ...newTerms,
      _id: result.insertedId
    };
  } catch (error) {
    console.error('Error creating terms content in MongoDB:', error);
    throw error;
  }
}

export async function updateTermsContent(termsId: string, termsData: Partial<TermsContent>): Promise<TermsContent | null> {
  try {
    const db = await getDatabase();
    const updateData = {
      ...termsData,
      updatedAt: new Date()
    };
    
    const result = await db.collection('termsContent').findOneAndUpdate(
      { _id: new ObjectId(termsId) },
      { $set: updateData },
      { returnDocument: 'after' }
    ) as TermsDocument;
    
    return result;
  } catch (error) {
    console.error('Error updating terms content in MongoDB:', error);
    throw error;
  }
}

export async function deleteTermsContent(termsId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.collection('termsContent').deleteOne({ _id: new ObjectId(termsId) });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting terms content in MongoDB:', error);
    throw error;
  }
}