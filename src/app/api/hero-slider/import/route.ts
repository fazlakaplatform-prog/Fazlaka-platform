import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
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
        const existingSlider = await prisma.heroSlider.findFirst({ 
          where: {
            OR: [
              { title: sliderData.title },
              { titleEn: sliderData.titleEn }
            ]
          }
        });
        
        // تجهيز البيانات مع تسطيح كائن link
        const sliderUpdateData = {
          title: sliderData.title,
          titleEn: sliderData.titleEn || sliderData.title,
          description: sliderData.description || '',
          descriptionEn: sliderData.descriptionEn || sliderData.description || '',
          mediaType: sliderData.mediaType || 'IMAGE',
          image: sliderData.image,
          imageEn: sliderData.imageEn || sliderData.image,
          videoUrl: sliderData.videoUrl,
          videoUrlEn: sliderData.videoUrlEn || sliderData.videoUrl,
          // تحويل link المتداخل إلى حقول مسطحة
          linkText: sliderData.link?.text,
          linkTextEn: sliderData.link?.textEn,
          linkUrl: sliderData.link?.url,
          orderRank: sliderData.orderRank || 0,
          updatedAt: new Date()
        };
        
        if (existingSlider) {
          // Update existing slider
          await prisma.heroSlider.update({
            where: { id: existingSlider.id },
            data: sliderUpdateData
          });
          imported++;
        } else {
          // Create new slider
          await prisma.heroSlider.create({
            data: {
              ...sliderUpdateData,
              createdAt: sliderData.createdAt ? new Date(sliderData.createdAt) : new Date()
            }
          });
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