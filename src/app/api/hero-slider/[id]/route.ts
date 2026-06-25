import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// جلب هيرو سلايدر بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const slider = await prisma.heroSlider.findUnique({
      where: { id }
    });
    
    if (!slider) {
      return NextResponse.json(
        { success: false, error: 'Hero slider not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      slider
    });
  } catch (error) {
    console.error('Error fetching hero slider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch hero slider' },
      { status: 500 }
    );
  }
}

// تحديث هيرو سلايدر
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const updateData = {
      title: body.title,
      titleEn: body.titleEn,
      description: body.description,
      descriptionEn: body.descriptionEn,
      mediaType: body.mediaType,
      image: body.image,
      imageEn: body.imageEn,
      videoUrl: body.videoUrl,
      videoUrlEn: body.videoUrlEn,
      // تسطيح link للتحديث
      linkText: body.link?.text,
      linkTextEn: body.link?.textEn,
      linkUrl: body.link?.url,
      orderRank: body.orderRank,
      updatedAt: new Date()
    };
    
    const result = await prisma.heroSlider.update({
      where: { id },
      data: updateData
    });
    
    // إرسال إشعار بالتحديث عبر SSE
    try {
      await fetch('/api/stream/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'heroSliderUpdated',
          data: result
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      slider: result
    });
  } catch (error) {
    console.error('Error updating hero slider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update hero slider' },
      { status: 500 }
    );
  }
}

// حذف هيرو سلايدر
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.heroSlider.delete({
      where: { id }
    });
    
    // إرسال إشعار بالحذف عبر SSE
    try {
      await fetch('/api/stream/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'heroSliderDeleted',
          data: { id }
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json(
      { success: true, message: 'Hero slider deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting hero slider:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete hero slider' },
      { status: 500 }
    );
  }
}