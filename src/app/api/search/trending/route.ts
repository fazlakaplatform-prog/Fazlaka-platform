// src/app/api/search/trending/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getTrendingSearches } from '@/services/semanticSearch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    const trending = await getTrendingSearches(language, limit);
    
    return NextResponse.json({ trending });
    
  } catch (error) {
    console.error('Error getting trending searches:', error);
    return NextResponse.json(
      { error: 'Failed to get trending searches' },
      { status: 500 }
    );
  }
}