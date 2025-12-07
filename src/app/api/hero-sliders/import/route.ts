import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import HeroSlider from '@/models/HeroSlider';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { heroSliders } = await request.json();
    
    if (!heroSliders || !Array.isArray(heroSliders) || heroSliders.length === 0) {
      return NextResponse.json(
        { error: 'No hero sliders provided' },
        { status: 400 }
      );
    }
    
    let imported = 0;
    const errors = [];
    
    for (const sliderData of heroSliders) {
      try {
        // Skip if no title
        if (!sliderData.title || !sliderData.titleEn) {
          errors.push(`Skipping slider with missing title`);
          continue;
        }
        
        // Check if slider with this title already exists
        const existingSlider = await HeroSlider.findOne({ 
          $or: [
            { title: sliderData.title },
            { titleEn: sliderData.titleEn }
          ]
        });
        
        const sliderUpdateData = {
          title: sliderData.title,
          titleEn: sliderData.titleEn || sliderData.title,
          description: sliderData.description || '',
          descriptionEn: sliderData.descriptionEn || sliderData.description || '',
          mediaType: sliderData.mediaType || 'image',
          image: sliderData.image,
          imageEn: sliderData.imageEn || sliderData.image,
          videoUrl: sliderData.videoUrl,
          videoUrlEn: sliderData.videoUrlEn || sliderData.videoUrl,
          link: sliderData.link,
          orderRank: sliderData.orderRank || 0,
          updatedAt: new Date()
        };
        
        if (existingSlider) {
          // Update existing slider
          await HeroSlider.updateOne(
            { _id: existingSlider._id },
            { $set: sliderUpdateData }
          );
          imported++;
        } else {
          // Create new slider
          const newSlider = new HeroSlider({
            ...sliderUpdateData,
            createdAt: sliderData.createdAt || new Date()
          });
          
          await newSlider.save();
          imported++;
        }
      } catch (error) {
        console.error('Error importing hero slider:', error);
        errors.push(`Error importing hero slider: ${sliderData.title || sliderData.titleEn || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ 
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Failed to import hero sliders' },
      { status: 500 }
    );
  }
}