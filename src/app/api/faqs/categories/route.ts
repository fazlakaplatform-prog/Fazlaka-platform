import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const faqs = await prisma.fAQ.findMany({
      select: {
        category: true,
        categoryEn: true
      }
    });
    
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