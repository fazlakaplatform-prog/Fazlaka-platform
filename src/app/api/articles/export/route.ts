import { NextRequest, NextResponse } from 'next/server';
import { fetchArticles } from '@/services/articles';

export async function POST(request: NextRequest) {
  try {
    const { language, filters } = await request.json();
    
    // Fetch all articles with filters
    const articles = await fetchArticles(language || 'ar');
    
    // Apply filters if provided
    let filteredArticles = articles;
    
    if (filters) {
      filteredArticles = articles.filter(article => {
        // Season filter
        if (filters.season && article.season?._id !== filters.season) {
          return false;
        }
        
        // Episode filter
        if (filters.episode && article.episode?._id !== filters.episode) {
          return false;
        }
        
        // Published filter
        if (filters.published === 'published' && !article.publishedAt) {
          return false;
        } else if (filters.published === 'draft' && article.publishedAt) {
          return false;
        }
        
        // Date range filter
        if (filters.dateFrom && new Date(article.createdAt) < new Date(filters.dateFrom)) {
          return false;
        }
        
        if (filters.dateTo && new Date(article.createdAt) > new Date(filters.dateTo)) {
          return false;
        }
        
        return true;
      });
    }
    
    return NextResponse.json({ articles: filteredArticles });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export articles' },
      { status: 500 }
    );
  }
}