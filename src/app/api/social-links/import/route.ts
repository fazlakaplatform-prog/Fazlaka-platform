import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { socialLinks } = await request.json();
    
    if (!socialLinks || !Array.isArray(socialLinks) || socialLinks.length === 0) {
      return NextResponse.json(
        { error: 'No social links provided' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    let imported = 0;
    const errors = []; // تم التغيير من let إلى const
    
    for (const linkData of socialLinks) {
      try {
        // Skip if no platform or url
        if (!linkData.platform || !linkData.url) {
          errors.push(`Skipping social link with missing platform or url`);
          continue;
        }
        
        // Create new social link
        const newSocialLink = {
          platform: linkData.platform,
          url: linkData.url,
          isActive: linkData.isActive !== undefined ? linkData.isActive : true,
          order: linkData.order || 0,
          createdAt: linkData.createdAt ? new Date(linkData.createdAt) : new Date(),
          updatedAt: new Date()
        };
        
        await db.collection('socialLinks').insertOne(newSocialLink);
        imported++;
      } catch (error) {
        console.error('Error importing social link:', error);
        errors.push(`Error importing social link: ${linkData.platform || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ 
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Failed to import social links' },
      { status: 500 }
    );
  }
}