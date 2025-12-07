import { NextRequest, NextResponse } from 'next/server';
import { sendNotificationToUser } from '@/services/sseService'; // تحديث مسار الاستيراد

/**
 * POST /api/notifications/send
 * Sends a notification to a specific user
 */
export async function POST(request: NextRequest) {
  try {
    const { userId, notification } = await request.json();
    
    // التحقق من صحة البيانات
    if (!userId || !notification) {
      return NextResponse.json(
        { error: 'معرف المستخدم وبيانات الإشعار مطلوبان' },
        { status: 400 }
      );
    }
    
    // إنشاء معرف فريد للإشعار إذا لم يتم توفيره
    const notificationId = notification._id || new Date().getTime().toString();
    
    // إرسال الإشعار للمستخدم المحدد
    const success = sendNotificationToUser(userId, {
      ...notification,
      _id: notificationId,
      createdAt: notification.createdAt || new Date().toISOString(),
      updatedAt: notification.updatedAt || new Date().toISOString()
    });
    
    if (success) {
      return NextResponse.json({ 
        message: 'تم إرسال الإشعار بنجاح'
      });
    } else {
      return NextResponse.json(
        { error: 'المستخدم غير متصل حالياً' },
        { status: 404 }
      );
    }
  } catch (error) {
    console.error('Error sending notification:', error);
    return NextResponse.json(
      { error: 'فشل في إرسال الإشعار' },
      { status: 500 }
    );
  }
}