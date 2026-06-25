// lib/terms.ts
import { PrismaClient, SectionType, RightsType } from '@prisma/client';

const prisma = new PrismaClient();

const getLocalizedText = (language: string, arText?: string | null, enText?: string | null) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

type TermsContentWithLocalized = {
  id: string; // Standard SQL ID
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

export async function getAllTermsContent(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const terms = await prisma.terms.findMany({
      include: { items: true },
      orderBy: [{ sectionType: 'asc' }, { title: 'asc' }]
    });
    
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
      localizedLogo: language === 'ar' ? term.logo : term.logoEn,
      localizedItems: language === 'ar' ? 
        term.items?.map(item => item.item) : 
        term.items?.map(item => item.itemEn || item.item)
    }));
  } catch (error) {
    console.error('Error fetching all terms content:', error);
    return [];
  }
}

export async function getMainTerms(language: string = 'ar'): Promise<TermsContentWithLocalized | null> {
  try {
    const result = await prisma.terms.findFirst({
      where: { sectionType: 'MAIN_TERMS' },
      include: { items: true }
    });
    
    if (!result) return null;
    
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

export async function getLegalTerms(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const terms = await prisma.terms.findMany({
      where: { sectionType: 'LEGAL_TERM' },
      include: { items: true },
      orderBy: { term: 'asc' }
    });
    
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

export async function getRightsResponsibilities(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const rights = await prisma.terms.findMany({
      where: { sectionType: 'RIGHTS_RESPONSIBILITY' },
      include: { items: true },
      orderBy: [{ rightsType: 'asc' }, { title: 'asc' }]
    });
    
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

export async function getAdditionalPolicies(language: string = 'ar'): Promise<TermsContentWithLocalized[]> {
  try {
    const policies = await prisma.terms.findMany({
      where: { sectionType: 'ADDITIONAL_POLICY' },
      include: { items: true },
      orderBy: { title: 'asc' }
    });
    
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

export async function getSiteSettings(language: string = 'ar'): Promise<TermsContentWithLocalized | null> {
  try {
    const result = await prisma.terms.findFirst({
      where: { sectionType: 'SITE_SETTINGS' },
      include: { items: true }
    });
    
    if (!result) return null;
    
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