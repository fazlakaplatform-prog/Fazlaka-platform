import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// --- GET Method ---
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || id.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const privacy = await prisma.privacy.findUnique({
      where: { id }
    });

    if (!privacy) {
      return NextResponse.json(
        { success: false, error: 'Privacy content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: privacy
    });
  } catch (error) {
    console.error('Error fetching privacy content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch privacy content' },
      { status: 500 }
    );
  }
}

// --- PUT Method ---
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || id.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    // التحقق من وجود العنصر أولاً
    const existingItem = await prisma.privacy.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Privacy content not found' },
        { status: 404 }
      );
    }

    // تحديث العنصر
    const updatedDoc = await prisma.privacy.update({
      where: { id },
      data: {
        ...body,
        lastUpdated: body.lastUpdated ? new Date(body.lastUpdated) : new Date()
      }
    });

    // إرسال إشعار بالتحديث - استخدام URL كامل
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
      
      await fetch(`${baseUrl}/api/stream/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'change',
          collection: 'privacy',
          operation: 'update',
          id: id
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }

    return NextResponse.json({
      success: true,
      data: updatedDoc
    });
  } catch (error) {
    console.error('Error updating privacy content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update privacy content' },
      { status: 500 }
    );
  }
}

// --- DELETE Method ---
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id || id.length < 10) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    // التحقق من وجود العنصر أولاً
    const existingItem = await prisma.privacy.findUnique({
      where: { id }
    });

    if (!existingItem) {
      return NextResponse.json(
        { success: false, error: 'Privacy content not found' },
        { status: 404 }
      );
    }
    
    // حذف العنصر
    await prisma.privacy.delete({
      where: { id }
    });
    
    // إرسال إشعار بالحذف - استخدام URL كامل
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
      
      await fetch(`${baseUrl}/api/stream/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'change',
          collection: 'privacy',
          operation: 'delete',
          id: id
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      message: 'Privacy content deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting privacy content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete privacy content' },
      { status: 500 }
    );
  }
}
