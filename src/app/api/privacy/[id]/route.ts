import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// --- GET Method ---
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const db = await getDatabase();
    const privacy = await db.collection('privacyContent').findOne({
      _id: new ObjectId(id)
    });

    if (!privacy) {
      return NextResponse.json(
        { success: false, error: 'Privacy content not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: { ...privacy, id: privacy._id.toString() }
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
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    
    const db = await getDatabase();
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    // استخدام updateOne لتجنب المشاكل
    const updateResult = await db.collection('privacyContent').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );

    if (updateResult.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Privacy content not found' },
        { status: 404 }
      );
    }

    // جلب المستند المحدث لإعادته
    const updatedDoc = await db.collection('privacyContent').findOne({
      _id: new ObjectId(id)
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
          collection: 'privacyContent',
          operation: 'update',
          id: id
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }

    return NextResponse.json({
      success: true,
      data: {
        ...updatedDoc,
        id: updatedDoc?._id.toString()
      }
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
    
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const result = await db.collection('privacyContent').deleteOne({
      _id: new ObjectId(id)
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Privacy content not found' },
        { status: 404 }
      );
    }
    
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
          collection: 'privacyContent',
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