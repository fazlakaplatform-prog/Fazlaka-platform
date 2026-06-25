import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { filters } = await request.json();
    
    // Build query based on filters (Prisma 'where' object)
    const where: Record<string, unknown> = {};
    
    if (filters) {
      // Media type filter
      if (filters.mediaType && filters.mediaType !== 'all') {
        where.mediaType = filters.mediaType;
      }
      
      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        // إنشاء كائن منفصل لفلتر التاريخ لتجنب مشاكل النوع (Type Safety)
        const dateFilter: { gte?: Date; lte?: Date } = {};
        
        if (filters.dateFrom) {
          dateFilter.gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          dateFilter.lte = new Date(filters.dateTo);
        }
        
        // تعيين كائن الفلتر إلى where
        where.createdAt = dateFilter;
      }
    }
    
    const sliders = await prisma.heroSlider.findMany({
      where,
      orderBy: [
        { orderRank: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    return NextResponse.json({ heroSliders: sliders });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export hero sliders' },
      { status: 500 }
    );
  }
}