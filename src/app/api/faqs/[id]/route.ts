import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// جلب سؤال شائع بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const db = await getDatabase();
    const faq = await db.collection('faqs').findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!faq) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...faq,
        id: faq._id.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch FAQ' },
      { status: 500 }
    );
  }
}

// تحديث سؤال شائع
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
    const result = await db.collection('faqs').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found' },
        { status: 404 }
      );
    }
    
    // جلب المستند المحدث بعد التحديث
    const updatedFaq = await db.collection('faqs').findOne({ 
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
          collection: 'faqs',
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
        ...updatedFaq,
        id: updatedFaq?._id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update FAQ' },
      { status: 500 }
    );
  }
}

// حذف سؤال شائع
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const db = await getDatabase();
    const result = await db.collection('faqs').deleteOne({ 
      _id: new ObjectId(id) 
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'FAQ not found' },
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
          collection: 'faqs',
          operation: 'delete',
          id: id
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json(
      { success: true, message: 'FAQ deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting FAQ:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete FAQ' },
      { status: 500 }
    );
  }
}