import { NextRequest, NextResponse } from 'next/server';
import { getSocialLinkById, updateSocialLink, deleteSocialLink } from '@/services/socialLinks';

// جلب رابط اجتماعي بالمعرف
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const socialLink = await getSocialLinkById(id);
    
    if (!socialLink) {
      return NextResponse.json(
        { success: false, error: 'Social link not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: socialLink
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
    
    const updatedSocialLink = await updateSocialLink(id, body);
    
    // إرسال إشعار بالتحديث عبر SSE
    try {
      await fetch('/api/stream/notify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'socialLinkUpdated',
          data: updatedSocialLink
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: updatedSocialLink
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
    
    await deleteSocialLink(id);
    
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