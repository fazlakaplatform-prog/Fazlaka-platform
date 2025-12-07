import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Season from '@/models/Season';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { seasons } = await request.json();
    
    if (!seasons || !Array.isArray(seasons) || seasons.length === 0) {
      return NextResponse.json(
        { error: 'No seasons provided' },
        { status: 400 }
      );
    }
    
    let imported = 0;
    const errors = []; // تم التغيير من let إلى const
    
    for (const seasonData of seasons) {
      try {
        // Skip if no title or slug
        if (!seasonData.title || !seasonData.slug) {
          errors.push(`Skipping season with missing title or slug`);
          continue;
        }
        
        // Check if season with this slug already exists
        const existingSeason = await Season.findOne({ slug: seasonData.slug });
        
        const seasonUpdateData = {
          title: seasonData.title,
          titleEn: seasonData.titleEn || seasonData['Title (EN)'] || seasonData.title,
          slug: seasonData.slug,
          description: seasonData.description || seasonData.Description,
          descriptionEn: seasonData.descriptionEn || seasonData['Description (EN)'] || seasonData.description,
          thumbnailUrl: seasonData.thumbnailUrl || seasonData['Thumbnail URL'],
          thumbnailUrlEn: seasonData.thumbnailUrlEn || seasonData['Thumbnail URL (EN)'] || seasonData.thumbnailUrl,
          publishedAt: seasonData.publishedAt || seasonData['Published At'] ? new Date(seasonData.publishedAt || seasonData['Published At']) : undefined,
          updatedAt: new Date()
        };
        
        if (existingSeason) {
          // Update existing season
          await Season.updateOne(
            { slug: seasonData.slug },
            { $set: seasonUpdateData }
          );
          imported++;
        } else {
          // Create new season
          const newSeason = new Season({
            ...seasonUpdateData,
            createdAt: seasonData.createdAt || seasonData['Created At'] ? new Date(seasonData.createdAt || seasonData['Created At']) : new Date()
          });
          
          await newSeason.save();
          imported++;
        }
      } catch (error) {
        console.error('Error importing season:', error);
        errors.push(`Error importing season: ${seasonData.title || seasonData.slug || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ 
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Failed to import seasons' },
      { status: 500 }
    );
  }
}