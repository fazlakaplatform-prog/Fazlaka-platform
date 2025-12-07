import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { 
  fetchUserNotifications, 
  fetchUnreadNotificationsCount,
  markAllNotificationsAsRead 
} from '@/services/notifications';

export async function GET(request: NextRequest) {
  try {
    // استدعاء getServerSession بشكل مباشر مع authOptions
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');
    const skip = parseInt(searchParams.get('skip') || '0');
    const language = searchParams.get('language') || 'ar';
    
    const notifications = await fetchUserNotifications(session.user.id, language, limit, skip);
    const unreadCount = await fetchUnreadNotificationsCount(session.user.id);
    
    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    // استدعاء getServerSession بشكل مباشر مع authOptions
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { markAllAsRead } = body;
    
    if (markAllAsRead) {
      const success = await markAllNotificationsAsRead(session.user.id);
      if (success) {
        return NextResponse.json({ success: true, message: 'All notifications marked as read' });
      }
      return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 400 });
    }
    
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  } catch (error) {
    console.error('Error updating notifications:', error);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}