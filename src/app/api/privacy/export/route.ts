import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sectionType } = body; // <-- تم حذف 'language' من هنا

    // تم تصحيح الخطأ هنا بإضافة await
    const db = await getDatabase(); 

    let query = {};
    if (sectionType) {
      query = { sectionType };
    }

    const privacyContent = await db.collection('privacyContent')
      .find(query)
      .sort({ sectionType: 1, title: 1 })
      .toArray();

    // تحويل البيانات إلى صيغة مناسبة للتصدير
    const exportData = privacyContent.map(item => ({
      id: item._id.toString(),
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