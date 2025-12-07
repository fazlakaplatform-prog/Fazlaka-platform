// app/api/episodes/export/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { fetchEpisodes } from '@/services/episodes';

export async function POST(request: NextRequest) {
  try {
    const { language, filters } = await request.json();
    
    // Fetch all episodes with filters
    const episodes = await fetchEpisodes(language || 'ar');
    
    // Apply filters if provided
    let filteredEpisodes = episodes;
    
    if (filters) {
      filteredEpisodes = episodes.filter(episode => {
        // Season filter - تعديل هنا للتعامل مع الحالة التي يكون فيها season عبارة عن سلسلة نصية
        if (filters.season) {
          // إذا كان episode.season عبارة عن كائن
          if (typeof episode.season === 'object' && episode.season !== null) {
            const seasonObj = episode.season as Record<string, unknown>;
            if (seasonObj._id !== filters.season) {
              return false;
            }
          } 
          // إذا كان episode.season عبارة عن سلسلة نصية
          else if (typeof episode.season === 'string') {
            if (episode.season !== filters.season) {
              return false;
            }
          }
        }
        
        // Published filter
        if (filters.published === 'published' && !episode.publishedAt) {
          return false;
        } else if (filters.published === 'draft' && episode.publishedAt) {
          return false;
        }
        
        // Date range filter
        if (filters.dateFrom && new Date(episode.createdAt) < new Date(filters.dateFrom)) {
          return false;
        }
        
        if (filters.dateTo && new Date(episode.createdAt) > new Date(filters.dateTo)) {
          return false;
        }
        
        return true;
      });
    }
    
    return NextResponse.json({ episodes: filteredEpisodes });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export episodes' },
      { status: 500 }
    );
  }
}