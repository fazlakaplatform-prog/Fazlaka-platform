import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  markNotificationAsRead, 
  deleteNotification 
} from '@/services/notifications';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // استدعاء getServerSession بشكل مباشر مع authOptions
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { markAsRead } = body;
    
    if (markAsRead) {
      const success = await markNotificationAsRead(id, session.user.id);
      if (success) {
        return NextResponse.json({ 
          success: true, 
          message: 'Notification marked as read' 
        });
      }
      return NextResponse.json({ 
        success: false,
        error: 'Failed to mark notification as read' 
      }, { status: 400 });
    }
    
    return NextResponse.json({ 
      success: false,
      error: 'Invalid request' 
    }, { status: 400 });
  } catch (error) {
    console.error('Error updating notification:', error);
    
    let errorMessage = 'Failed to update notification';
    if (error instanceof Error) {
      errorMessage = error.message;
    }
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage 
    }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // استدعاء getServerSession بشكل مباشر مع authOptions
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ 
        success: false,
        error: 'Unauthorized' 
      }, { status: 401 });
    }

    const { id } = await params;
    
    // التحقق من صحة المعرف
    if (!id || typeof id !== 'string') {
      return NextResponse.json({ 
        success: false,
        error: 'Invalid notification ID' 
      }, { status: 400 });
    }
    
    const success = await deleteNotification(id, session.user.id);
    
    if (success) {
      return NextResponse.json({ 
        success: true, 
        message: 'Notification deleted successfully' 
      });
    }
    
    // إذا لم يتم حذف أي سجل، قد يكون المعرف غير صحيح أو الإشعار لا يخص المستخدم
    return NextResponse.json({ 
      success: false,
      error: 'Notification not found or you do not have permission to delete it' 
    }, { status: 404 });
  } catch (error) {
    console.error('Error deleting notification:', error);
    
    // تحديد نوع الخطأ بشكل أفضل
    let errorMessage = 'Failed to delete notification';
    let statusCode = 500;
    
    if (error instanceof Error) {
      errorMessage = error.message;
      if (error.message.includes('Cast to ObjectId failed')) {
        errorMessage = 'Invalid notification ID format';
        statusCode = 400;
      } else if (error.message.includes('validation')) {
        errorMessage = 'Invalid notification data';
        statusCode = 400;
      }
    }
    
    return NextResponse.json({ 
      success: false,
      error: errorMessage 
    }, { status: statusCode });
  }
}