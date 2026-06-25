import { NextRequest, NextResponse } from 'next/server';
import { 
  performComprehensiveSearch, 
  getSearchSuggestions, 
  getTrendingSearches
} from '@/services/semanticSearch';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q') || '';
    const language = searchParams.get('language') || 'ar';
    const type = searchParams.get('type') || 'all';
    const dateRange = searchParams.get('dateRange') || 'all';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');
    const suggestions = searchParams.get('suggestions') === 'true';
    const trending = searchParams.get('trending') === 'true';
    
    if (suggestions) {
      const searchSuggestions = await getSearchSuggestions(query, language, 10);
      return NextResponse.json({ suggestions: searchSuggestions });
    }
    
    if (trending) {
      const trendingSearches = await getTrendingSearches(language, 10);
      return NextResponse.json({ trending: trendingSearches });
    }
    
    if (!query.trim()) {
      return NextResponse.json({ 
        results: [],
        totalCount: 0,
        suggestions: [],
        trending: await getTrendingSearches(language, 5)
      });
    }
    
    const options = {
      limit,
      offset,
      filters: {
        type: type !== 'all' ? type : undefined,
        dateRange: dateRange !== 'all' ? dateRange : undefined
      }
    };
    
    const searchResults = await performComprehensiveSearch(query, language, options);
    return NextResponse.json(searchResults);
    
  } catch (error) {
    console.error('Error in search API:', error);
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { query, language = 'ar', filters = {}, options = {} } = body;
    
    if (!query || !query.trim()) {
      return NextResponse.json({ results: [], totalCount: 0 });
    }
    
    const searchResults = await performComprehensiveSearch(query, language, {
      ...options,
      filters
    });
    
    return NextResponse.json(searchResults);
  } catch (error) {
    console.error('Error in advanced search API:', error);
    return NextResponse.json({ error: 'Failed to perform advanced search' }, { status: 500 });
  }
}