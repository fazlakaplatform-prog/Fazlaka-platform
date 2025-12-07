import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// جلب محتوى شروط وأحكام بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const db = await getDatabase();
    const term = await db.collection('termsContent').findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!term) {
      return NextResponse.json(
        { success: false, error: 'Terms content not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...term,
        id: term._id.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching terms content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch terms content' },
      { status: 500 }
    );
  }
}

// تحديث محتوى شروط وأحكام
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    const db = await getDatabase();
    const updateData = {
      ...body,
      updatedAt: new Date()
    };
    
    // استخدام updateOne بدلاً من findOneAndUpdate
    const result = await db.collection('termsContent').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Terms content not found' },
        { status: 404 }
      );
    }
    
    // جلب المستند المحدث بعد التحديث
    const updatedTerm = await db.collection('termsContent').findOne({ 
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
          collection: 'termsContent',
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
        ...updatedTerm,
        id: updatedTerm?._id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating terms content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update terms content' },
      { status: 500 }
    );
  }
}

// حذف محتوى شروط وأحكام
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const db = await getDatabase();
    const result = await db.collection('termsContent').deleteOne({ 
      _id: new ObjectId(id) 
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Terms content not found' },
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
          collection: 'termsContent',
          operation: 'delete',
          id: id
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json(
      { success: true, message: 'Terms content deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting terms content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete terms content' },
      { status: 500 }
    );
  }
}