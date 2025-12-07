// src/app/api/search/similar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { findSimilarContent } from '@/services/semanticSearch';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { contentId, contentType, language = 'ar', limit = 5 } = body;
    
    if (!contentId || !contentType) {
      return NextResponse.json(
        { error: 'contentId and contentType are required' },
        { status: 400 }
      );
    }
    
    // Fix: Pass the limit as the third parameter
    const similarContent = await findSimilarContent(contentId, contentType, limit);
    
    return NextResponse.json({ similarContent });
    
  } catch (error) {
    console.error('Error finding similar content:', error);
    return NextResponse.json(
      { error: 'Failed to find similar content' },
      { status: 500 }
    );
  }
}