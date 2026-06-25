import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrivacySectionType } from '@prisma/client';

/**
 * API Endpoint: /api/privacy/export
 * Method: POST
 * Description: Exports privacy content items with optional filtering by sectionType.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionType } = body as { sectionType?: PrivacySectionType };

    // بناء شرط البحث
    const where = sectionType ? { sectionType } : {};

    const privacyContent = await prisma.privacy.findMany({
      where,
      orderBy: [
        { sectionType: 'asc' },
        { title: 'asc' }
      ]
    });

    // تحويل البيانات إلى صيغة مناسبة للتصدير
    const exportData = privacyContent.map(item => ({
      id: item.id,
      sectionType: item.sectionType,
      title: item.title,
      titleEn: item.titleEn,
      content: item.content,
      contentEn: item.contentEn,
      description: item.description,
      descriptionEn: item.descriptionEn,
      icon: item.icon,
      color: item.color,
      textColor: item.textColor,
      lastUpdated: item.lastUpdated,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

    return NextResponse.json({
      success: true,
      data: exportData,
      count: exportData.length,
    });

  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export privacy content' },
      { status: 500 }
    );
  }
}
