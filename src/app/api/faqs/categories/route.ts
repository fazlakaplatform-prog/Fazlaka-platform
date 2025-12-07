import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const db = await getDatabase();
    const faqs = await db.collection('faqs').find({}).toArray();
    
    // Extract unique categories
    const categoryField = language === 'ar' ? 'category' : 'categoryEn';
    const categories = [...new Set(faqs.map(faq => faq[categoryField]).filter(Boolean))];
    
    return NextResponse.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}