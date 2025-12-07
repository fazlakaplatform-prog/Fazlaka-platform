import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
import { ObjectId } from 'mongodb';

// جلب رابط اجتماعي بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const db = await getDatabase();
    const socialLink = await db.collection('socialLinks').findOne({ 
      _id: new ObjectId(id) 
    });
    
    if (!socialLink) {
      return NextResponse.json(
        { success: false, error: 'Social link not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...socialLink,
        id: socialLink._id.toString()
      }
    });
  } catch (error) {
    console.error('Error fetching social link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social link' },
      { status: 500 }
    );
  }
}

// تحديث رابط اجتماعي
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
    const result = await db.collection('socialLinks').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Social link not found' },
        { status: 404 }
      );
    }
    
    // جلب المستند المحدث بعد التحديث
    const updatedSocialLink = await db.collection('socialLinks').findOne({ 
      _id: new ObjectId(id) 
    });
    
    // إرسال إشعار بالتحديث عبر SSE
    try {
      await fetch('/api/stream/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'socialLinkUpdated',
          data: {
            ...updatedSocialLink,
            id: updatedSocialLink?._id.toString()
          }
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...updatedSocialLink,
        id: updatedSocialLink?._id.toString()
      }
    });
  } catch (error) {
    console.error('Error updating social link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update social link' },
      { status: 500 }
    );
  }
}

// حذف رابط اجتماعي
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const db = await getDatabase();
    const result = await db.collection('socialLinks').deleteOne({ 
      _id: new ObjectId(id) 
    });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Social link not found' },
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
          type: 'socialLinkDeleted',
          data: { id }
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json(
      { success: true, message: 'Social link deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting social link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete social link' },
      { status: 500 }
    );
  }
}