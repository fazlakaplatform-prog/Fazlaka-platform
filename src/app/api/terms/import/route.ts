// app/api/terms/import/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { SectionType } from '@prisma/client';

export async function POST(request: NextRequest) {
  try {
    const { terms } = await request.json();
    
    if (!terms || !Array.isArray(terms) || terms.length === 0) {
      return NextResponse.json(
        { error: 'No terms provided' },
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
    
    let imported = 0;
    const errors: string[] = [];

    // استخدام معاملة لضمان إدخال كل شيء أو لا شيء
    await prisma.$transaction(async (tx) => {
      for (const termData of terms) {
        try {
          if (!termData.sectionType) {
            errors.push(`Skipping term with missing sectionType`);
            continue;
          }

          const { items, ...data } = termData;
          const finalSectionType = sectionTypeMap[data.sectionType] || data.sectionType as SectionType;

          await tx.terms.create({
            data: {
              ...data,
              sectionType: finalSectionType,
              createdAt: data.createdAt ? new Date(data.createdAt) : new Date(),
              items: items ? {
                create: items.map((item: { item: string; itemEn?: string }) => ({
                  item: item.item,
                  itemEn: item.itemEn || null
                }))
              } : undefined
            }
          });
          imported++;
        } catch (error) {
          console.error('Error importing term:', error);
          errors.push(`Error importing term: ${termData.title || termData.term || 'Unknown'}`);
        }
      }
    });
    
    return NextResponse.json({ 
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Failed to import terms' },
      { status: 500 }
    );
  }
}