import { NextRequest, NextResponse } from 'next/server';
import { broadcastNotification } from '@/services/sseService'; // تحديث مسار الاستيراد

/**
 * POST /api/notifications/broadcast
 * Sends a notification to all connected users
 */
export async function POST(request: NextRequest) {
  try {
    const notificationData = await request.json();
    
    // التحقق من صحة البيانات
    if (!notificationData || typeof notificationData !== 'object') {
      return NextResponse.json(
        { error: 'بيانات الإشعار غير صالحة' },
        { status: 400 }
      );
    }
    
    // إنشاء معرف فريد للإشعار إذا لم يتم توفيره
    const notificationId = notificationData._id || new Date().getTime().toString();
    
    // إرسال الإشعار لجميع المستخدمين المتصلين
    const sentCount = broadcastNotification({
      ...notificationData,
      _id: notificationId,
      createdAt: notificationData.createdAt || new Date().toISOString(),
      updatedAt: notificationData.updatedAt || new Date().toISOString()
    });
    
    return NextResponse.json({ 
      message: 'تم إرسال الإشعار بنجاح',
      sentTo: sentCount
    });
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    return NextResponse.json(
      { error: 'فشل في إرسال الإشعار' },
      { status: 500 }
    );
  }
}