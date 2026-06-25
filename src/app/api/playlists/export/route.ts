import { NextRequest, NextResponse } from 'next/server';
import { fetchPlaylists } from '@/services/playlists';

export async function POST(request: NextRequest) {
  try {
    const { language, filters } = await request.json();
    
    // Fetch all playlists with filters
    const playlists = await fetchPlaylists(language || 'ar');
    
    // Apply filters if provided
    let filteredPlaylists = playlists;
    
    if (filters) {
      filteredPlaylists = playlists.filter(playlist => {
        // Date range filter
        if (filters.dateFrom && new Date(playlist.createdAt) < new Date(filters.dateFrom)) {
          return false;
        }
        
        if (filters.dateTo && new Date(playlist.createdAt) > new Date(filters.dateTo)) {
          return false;
        }
        
        return true;
      });
    }
    
    return NextResponse.json({ playlists: filteredPlaylists });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export playlists' },
      { status: 500 }
    );
  }
}