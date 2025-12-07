import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { faqs } = await request.json();
    
    if (!faqs || !Array.isArray(faqs) || faqs.length === 0) {
      return NextResponse.json(
        { error: 'No FAQs provided' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    let imported = 0;
    const errors = [];
    
    for (const faqData of faqs) {
      try {
        // Skip if no question or answer
        if (!faqData.question || !faqData.answer) {
          errors.push(`Skipping FAQ with missing question or answer`);
          continue;
        }
        
        // Create new FAQ
        const newFaq = {
          question: faqData.question,
          questionEn: faqData.questionEn || faqData.question,
          answer: faqData.answer,
          answerEn: faqData.answerEn || faqData.answer,
          category: faqData.category || 'General',
          categoryEn: faqData.categoryEn || faqData.category || 'General',
          createdAt: faqData.createdAt ? new Date(faqData.createdAt) : new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('faqs').insertOne(newFaq);
        imported++;
      } catch (error) {
        console.error('Error importing FAQ:', error);
        errors.push(`Error importing FAQ: ${faqData.question || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ 
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Failed to import FAQs' },
      { status: 500 }
    );
  }
}