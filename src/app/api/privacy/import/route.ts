import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { PrivacySectionType, Prisma } from '@prisma/client'; // تمت إضافة Prisma لاستخدام أنواعه

// تعريف واجهة لعنصر الاستيراد
interface PrivacyImportItem {
  id?: string;
  _id?: string;
  sectionType: PrivacySectionType;
  title?: string;
  titleEn?: string;
  content?: unknown;
  contentEn?: unknown;
  description?: string;
  descriptionEn?: string;
  icon?: string;
  color?: string;
  textColor?: string;
  lastUpdated?: string | Date;
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

/**
 * API Endpoint: /api/privacy/import
 * Method: POST
 * Description: Imports privacy content items using an "upsert" logic.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privacyContent: items } = body as { privacyContent: PrivacyImportItem[] };

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format. Expected a "privacyContent" array in the request body.' },
        { status: 400 }
      );
    }

    const validSectionTypes: PrivacySectionType[] = ['MAIN_POLICY', 'USER_RIGHT', 'DATA_TYPE', 'SECURITY_MEASURE'];
    
    let updatedCount = 0;
    let insertedCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        const { id, _id, createdAt, updatedAt, ...itemData } = item;
        const itemId = id || _id;

        // التحقق من صحة sectionType
        if (!itemData.sectionType || !validSectionTypes.includes(itemData.sectionType)) {
          errors.push(`Invalid sectionType for item: ${item.title || 'Unknown'}`);
          continue;
        }

        // إعداد بيانات التاريخ
        const lastUpdatedValue = itemData.lastUpdated ? new Date(itemData.lastUpdated) : new Date();

        if (itemId) {
          const existingItem = await prisma.privacy.findUnique({
            where: { id: itemId }
          });

          if (existingItem) {
            // تحديث العنصر الموجود
            // تم الإصلاح: استخدام Prisma.PrivacyUpdateInput بدلاً من any لتجنب خطأ ESLint
            await prisma.privacy.update({
              where: { id: itemId },
              data: {
                ...itemData,
                lastUpdated: lastUpdatedValue
              } as unknown as Prisma.PrivacyUpdateInput
            });
            updatedCount++;
          } else {
            // إدراج عنصر جديد بالمعرف المحدد
            await prisma.privacy.create({
              data: {
                id: itemId,
                ...itemData,
                lastUpdated: lastUpdatedValue
              } as unknown as Prisma.PrivacyCreateInput
            });
            insertedCount++;
          }
        } else {
          // إدراج عنصر جديد تماماً بدون معرف
          await prisma.privacy.create({
            data: {
              ...itemData,
              lastUpdated: lastUpdatedValue
            } as unknown as Prisma.PrivacyCreateInput
          });
          insertedCount++;
        }
      } catch (itemError) {
        console.error(`Error processing item: ${item.title || 'Unknown'}`, itemError);
        errors.push(`Failed to process item: ${item.title || 'Unknown'}`);
      }
    }

    return NextResponse.json({
      success: true,
      message: `Import completed. ${updatedCount} updated, ${insertedCount} inserted.`,
      updated: updatedCount,
      inserted: insertedCount,
      errors: errors.length,
      errorDetails: errors
    });

  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to import privacy content' },
      { status: 500 }
    );
  }
}