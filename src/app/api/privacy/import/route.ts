import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

/**
 * API Endpoint: /api/privacy/import
 * Method: POST
 * Description: Imports privacy content items using an "upsert" logic.
 * It updates existing items or inserts them if they don't exist.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { privacyContent: items } = body;

    if (!items || !Array.isArray(items)) {
      return NextResponse.json(
        { success: false, error: 'Invalid data format. Expected a "privacyContent" array in the request body.' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const collection = db.collection('privacyContent');
    
    let updatedCount = 0;
    let insertedCount = 0;
    const errors: string[] = [];

    for (const item of items) {
      try {
        // <-- تم التعديل هنا: تم حذف createdAt و updatedAt من الاستخراج -->
        const { id, _id, ...itemData } = item; 
        const itemId = id || _id;

        if (itemId && ObjectId.isValid(itemId)) {
          // --- التعديل الرئيسي هنا: استخدام upsert ---
          const result = await collection.updateOne(
            { _id: new ObjectId(itemId) },
            { 
              $set: {
                ...itemData,
                updatedAt: new Date(),
              }
            },
            { upsert: true } // <-- هذا هو الحل
          );

          // --- تعديل منطق العد ---
          if (result.upsertedCount > 0) {
            insertedCount++;
          } else if (result.matchedCount > 0) {
            updatedCount++;
          }

        } else {
          // إدراج عنصر جديد تمامًا إذا لم يكن لديه معرف صالح
          const newItem = {
            ...itemData,
            createdAt: new Date(),
            updatedAt: new Date(),
          };
          await collection.insertOne(newItem);
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