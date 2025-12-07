import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import HeroSlider from '@/models/HeroSlider';

// جلب هيرو سلايدر بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();
    const slider = await HeroSlider.findById(id);
    
    if (!slider) {
      return NextResponse.json(
        { success: false, error: 'Hero slider not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      slider: {
        ...slider.toJSON(),
        id: slider._id.toString()
      }
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
    
    await connectDB();
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    const result = await HeroSlider.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Hero slider not found' },
        { status: 404 }
      );
    }
    
    // إرسال إشعار بالتحديث عبر SSE
    try {
      await fetch('/api/stream/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'heroSliderUpdated',
          data: {
            ...result.toJSON(),
            id: result._id.toString()
          }
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      slider: {
        ...result.toJSON(),
        id: result._id.toString()
      }
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
    
    await connectDB();
    const result = await HeroSlider.findByIdAndDelete(id);
    
    if (!result) {
      return NextResponse.json(
        { success: false, error: 'Hero slider not found' },
        { status: 404 }
      );
    }
    
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