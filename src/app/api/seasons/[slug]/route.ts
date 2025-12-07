import { NextRequest, NextResponse } from 'next/server';
import { fetchSeasonBySlug, updateSeason, deleteSeason } from '@/services/seasons';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const season = await fetchSeasonBySlug(slug, language);
    
    if (!season) {
      return NextResponse.json(
        { error: 'Season not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ season });
  } catch (error) {
    console.error('Error in season API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch season' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const seasonData = await request.json();
    
    const updatedSeason = await updateSeason(slug, seasonData);
    
    if (!updatedSeason) {
      return NextResponse.json(
        { error: 'Season not found or update failed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ season: updatedSeason });
  } catch (error) {
    console.error('Error in season API:', error);
    return NextResponse.json(
      { error: 'Failed to update season' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const success = await deleteSeason(slug);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Season not found or deletion failed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in season API:', error);
    return NextResponse.json(
      { error: 'Failed to delete season' },
      { status: 500 }
    );
  }
}