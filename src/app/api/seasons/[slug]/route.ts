import { NextRequest, NextResponse } from 'next/server';
import { getSeasonBySlug, updateSeason, deleteSeason } from '@/services/seasons';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> } // <--- التعديل: Promise
) {
  try {
    const { slug } = await params; // <--- التعديل: await
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const season = await getSeasonBySlug(slug, language);
    
    if (!season) {
      return NextResponse.json({ error: 'Season not found' }, { status: 404 });
    }
    
    return NextResponse.json({ season });
  } catch (error) {
    console.error('Error fetching season:', error);
    return NextResponse.json({ error: 'Failed to fetch season' }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> } // <--- التعديل: Promise
) {
  try {
    const { slug } = await params; // <--- التعديل: await
    const body = await request.json();
    
    const updatedSeason = await updateSeason(slug, body);
    
    return NextResponse.json({ season: updatedSeason });
  } catch (error) {
    console.error('Error updating season:', error);
    return NextResponse.json({ error: 'Failed to update season' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> } // <--- التعديل: Promise
) {
  try {
    const { slug } = await params; // <--- التعديل: await
    await deleteSeason(slug);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting season:', error);
    return NextResponse.json({ error: 'Failed to delete season' }, { status: 500 });
  }
}