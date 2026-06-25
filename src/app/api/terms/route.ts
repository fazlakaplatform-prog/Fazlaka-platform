// app/api/terms/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SectionType } from '@prisma/client';

// Helper to get localized text
const getLocalizedText = (language: string, arText?: string | null, enText?: string | null) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// GET: Fetch all terms
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    const sectionTypeParam = searchParams.get('sectionType');

    // Map camelCase to SCREAMING_SNAKE_CASE for DB enum
    const sectionTypeMap: Record<string, SectionType> = {
      'mainTerms': 'MAIN_TERMS',
      'legalTerm': 'LEGAL_TERM',
      'rightsResponsibility': 'RIGHTS_RESPONSIBILITY',
      'additionalPolicy': 'ADDITIONAL_POLICY',
      'siteSettings': 'SITE_SETTINGS',
    };
    
    const where = sectionTypeParam && sectionTypeMap[sectionTypeParam] 
      ? { sectionType: sectionTypeMap[sectionTypeParam] } 
      : {};

    const terms = await prisma.terms.findMany({
      where,
      include: {
        items: true,
      },
      orderBy: [
        { sectionType: 'asc' },
        { title: 'asc' }
      ]
    });
    
    // Format data with localized fields
    const formattedTerms = terms.map(term => ({
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
    
    return NextResponse.json({ success: true, data: formattedTerms });
  } catch (error) {
    console.error('Error fetching terms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch terms' },
      { status: 500 }
    );
  }
}

// POST: Create new terms
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { items, ...termsData } = body;
    
    if (!termsData.sectionType) {
      return NextResponse.json(
        { success: false, error: 'Missing required field: sectionType' },
        { status: 400 }
      );
    }
    
    const sectionTypeMap: Record<string, SectionType> = {
      'mainTerms': 'MAIN_TERMS',
      'legalTerm': 'LEGAL_TERM',
      'rightsResponsibility': 'RIGHTS_RESPONSIBILITY',
      'additionalPolicy': 'ADDITIONAL_POLICY',
      'siteSettings': 'SITE_SETTINGS',
    };
    const finalSectionType = sectionTypeMap[termsData.sectionType] || termsData.sectionType as SectionType;

    const newTerms = await prisma.terms.create({
      data: {
        ...termsData,
        sectionType: finalSectionType,
        items: items ? {
          create: items.map((item: { item: string; itemEn?: string }) => ({
            item: item.item,
            itemEn: item.itemEn || null
          }))
        } : undefined
      },
      include: { items: true }
    });
    
    // Optional: Send notifications
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'تحديث في الشروط والأحكام',
        'Terms & Conditions Update',
        `تم تحديث الشروط والأحكام: ${newTerms.title || 'قسم جديد'}`,
        `The terms and conditions have been updated: ${newTerms.titleEn || newTerms.title || 'New section'}`,
        newTerms.id,
        'terms',
        '/terms'
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: newTerms
    });
  } catch (error) {
    console.error('Error creating terms:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create terms' },
      { status: 500 }
    );
  }
} 