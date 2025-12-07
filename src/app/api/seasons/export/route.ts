import { NextRequest, NextResponse } from 'next/server';
import { fetchSeasons } from '@/services/seasons';

export async function POST(request: NextRequest) {
  try {
    const { language, filters } = await request.json();
    
    // Fetch all seasons with filters
    const seasons = await fetchSeasons(language || 'ar');
    
    // Apply filters if provided
    let filteredSeasons = seasons;
    
    if (filters) {
      filteredSeasons = seasons.filter(season => {
        // Published filter
        if (filters.published === 'published' && !season.publishedAt) {
          return false;
        } else if (filters.published === 'draft' && season.publishedAt) {
          return false;
        }
        
        // Date range filter
        if (filters.dateFrom && new Date(season.createdAt) < new Date(filters.dateFrom)) {
          return false;
        }
        
        if (filters.dateTo && new Date(season.createdAt) > new Date(filters.dateTo)) {
          return false;
        }
        
        return true;
      });
    }
    
    return NextResponse.json({ seasons: filteredSeasons });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export seasons' },
      { status: 500 }
    );
  }
}