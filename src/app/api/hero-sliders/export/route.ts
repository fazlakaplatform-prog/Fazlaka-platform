import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import HeroSlider from '@/models/HeroSlider';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const { filters } = await request.json(); // 1. تم حذف 'language' لأنه غير مستخدم
    
    // Build query based on filters
    let query: Record<string, unknown> = {}; // تم تحديد نوع للمتغير query لمزيد من الأمان
    
    if (filters) {
      // Media type filter
      if (filters.mediaType && filters.mediaType !== 'all') {
        query = { ...query, mediaType: filters.mediaType };
      }
      
      // Date range filter
      if (filters.dateFrom || filters.dateTo) {
        // 2. تم استبدال 'any' بـ 'Record<string, Date>' وهو نوع أكثر أمانًا
        const dateFilter: Record<string, Date> = {};
        if (filters.dateFrom) {
          dateFilter.$gte = new Date(filters.dateFrom);
        }
        if (filters.dateTo) {
          dateFilter.$lte = new Date(filters.dateTo);
        }
        query = { ...query, createdAt: dateFilter };
      }
    }
    
    const sliders = await HeroSlider.find(query).sort({ orderRank: 1, createdAt: -1 });
    
    return NextResponse.json({ heroSliders: sliders });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export hero sliders' },
      { status: 500 }
    );
  }
}