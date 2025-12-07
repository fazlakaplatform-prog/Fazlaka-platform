// src/app/api/search/suggestions/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getSearchSuggestions } from '@/services/semanticSearch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const language = searchParams.get('language') || 'ar';
    const limit = parseInt(searchParams.get('limit') || '10');
    
    if (!query.trim()) {
      return NextResponse.json({ suggestions: [] });
    }
    
    const suggestions = await getSearchSuggestions(query, language, limit);
    
    return NextResponse.json({ suggestions });
    
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}