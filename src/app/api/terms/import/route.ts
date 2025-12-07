import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { terms } = await request.json();
    
    if (!terms || !Array.isArray(terms) || terms.length === 0) {
      return NextResponse.json(
        { error: 'No terms provided' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    let imported = 0;
    const errors = []; // تم التغيير من let إلى const
    
    for (const termData of terms) {
      try {
        // Skip if no sectionType
        if (!termData.sectionType) {
          errors.push(`Skipping term with missing sectionType`);
          continue;
        }
        
        // Create new term
        const newTerm = {
          ...termData,
          createdAt: termData.createdAt ? new Date(termData.createdAt) : new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('termsContent').insertOne(newTerm);
        imported++;
      } catch (error) {
        console.error('Error importing term:', error);
        errors.push(`Error importing term: ${termData.title || termData.term || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ 
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