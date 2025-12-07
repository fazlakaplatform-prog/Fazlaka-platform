import { NextRequest, NextResponse } from 'next/server';
import { fetchEpisodeBySlug, updateEpisode, deleteEpisode } from '@/services/episodes';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const { slug } = await params;
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const episode = await fetchEpisodeBySlug(slug, language);
    
    if (!episode) {
      return NextResponse.json(
        { error: 'Episode not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ episode });
  } catch (error) {
    console.error('Error in episode API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch episode' },
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
    const episodeData = await request.json();
    
    const updatedEpisode = await updateEpisode(slug, episodeData);
    
    if (!updatedEpisode) {
      return NextResponse.json(
        { error: 'Episode not found or update failed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ episode: updatedEpisode });
  } catch (error) {
    console.error('Error in episode API:', error);
    return NextResponse.json(
      { error: 'Failed to update episode' },
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
    const success = await deleteEpisode(slug);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Episode not found or deletion failed' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in episode API:', error);
    return NextResponse.json(
      { error: 'Failed to delete episode' },
      { status: 500 }
    );
  }
}