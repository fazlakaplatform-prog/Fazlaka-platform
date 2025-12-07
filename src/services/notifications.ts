import { connectDB } from '@/lib/mongodb';
import Notification, { INotification } from '@/models/Notification';
import { Types } from 'mongoose';

// استيراد دوال البث من ملف الخدمة الجديد
import { sendNotificationToUser, broadcastNotification } from '@/services/sseService';

// Define an extended type that includes localized fields
export interface NotificationWithLocalized extends INotification {
  localizedTitle?: string;
  localizedMessage?: string;
}

/**
 * جلب إشعارات المستخدم مع دعم التصفح والترجمة
 */
export async function fetchUserNotifications(
  userId: string, 
  language: string = 'ar',
  limit: number = 20,
  skip: number = 0
): Promise<NotificationWithLocalized[]> {
  try {
    await connectDB();
    
    const notifications = await Notification.find({ userId })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip(skip);
    
    return notifications.map(notification => ({
      ...notification.toObject(),
      _id: notification._id.toString(),
      localizedTitle: language === 'ar' ? notification.title : notification.titleEn || notification.title,
      localizedMessage: language === 'ar' ? notification.message : notification.messageEn || notification.message
    }));
  } catch (error) {
    console.error('Error fetching user notifications from MongoDB:', error);
    return [];
  }
}

/**
 * جلب عدد الإشعارات غير المقروءة للمستخدم
 */
export async function fetchUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    await connectDB();
    const count = await Notification.countDocuments({ userId, isRead: false });
    return count;
  } catch (error) {
    console.error('Error fetching unread notifications count from MongoDB:', error);
    return 0;
  }
}

/**
 * إنشاء إشعار جديد لمستخدم واحد مع إرسال فوري
 */
export async function createAndSendNotification(
  notificationData: Omit<INotification, '_id' | 'createdAt' | 'updatedAt'>
): Promise<INotification | null> {
  try {
    await connectDB();
    const newNotification = new Notification(notificationData);
    await newNotification.save();
    
    // إرسال الإشعار فوراً عبر SSE باستخدام الدالة المستوردة من sseService
    const notificationObj = newNotification.toObject();
    sendNotificationToUser(notificationData.userId, {
      ...notificationObj,
      _id: notificationObj._id.toString()
    });
    
    return newNotification;
  } catch (error) {
    console.error('Error creating notification in MongoDB:', error);
    return null;
  }
}

/**
 * تحديث حالة قراءة إشعار معين
 */
export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    await connectDB();
    
    if (!Types.ObjectId.isValid(notificationId)) {
      console.error('Invalid ObjectId format:', notificationId);
      return false;
    }
    
    const result = await Notification.updateOne(
      { _id: new Types.ObjectId(notificationId), userId },
      { isRead: true }
    );
    
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error marking notification as read in MongoDB:', error);
    return false;
  }
}

/**
 * تحديث حالة قراءة جميع إشعارات المستخدم
 */
export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    await connectDB();
    const result = await Notification.updateMany(
      { userId, isRead: false },
      { isRead: true }
    );
    return result.modifiedCount > 0;
  } catch (error) {
    console.error('Error marking all notifications as read in MongoDB:', error);
    return false;
  }
}

/**
 * حذف إشعار معين
 */
export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
  try {
    await connectDB();
    
    if (!Types.ObjectId.isValid(notificationId)) {
      console.error('Invalid ObjectId format:', notificationId);
      return false;
    }
    
    const result = await Notification.deleteOne({ 
      _id: new Types.ObjectId(notificationId), 
      userId 
    });
    
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting notification in MongoDB:', error);
    return false;
  }
}

/**
 * دالة لإرسال إشعارات لجميع المستخدمين عند إضافة محتوى جديد
 */
export async function notifyAllUsers(
  title: string,
  titleEn: string,
  message: string,
  messageEn: string,
  relatedId: string,
  relatedType: 'article' | 'episode' | 'season' | 'playlist' | 'team' | 'faq' | 'privacy' | 'terms' | 'general',
  actionUrl: string
): Promise<void> {
  try {
    const { getDatabase } = await import('@/lib/mongodb');
    const db = await getDatabase();
    
    const users = await db.collection('users').find({ isActive: true }).toArray();
    
    for (const user of users) {
      const notification = new Notification({
        userId: user._id.toString(),
        title,
        titleEn,
        message,
        messageEn,
        type: 'info',
        relatedId,
        relatedType,
        actionUrl
      });
      
      await notification.save();
      
      // إرسال الإشعار فوراً عبر SSE باستخدام الدالة المستوردة من sseService
      const notificationObj = notification.toObject();
      broadcastNotification({
        ...notificationObj,
        _id: notificationObj._id.toString()
      });
    }
    
    console.log(`Notifications sent to ${users.length} users for new ${relatedType}`);
  } catch (error) {
    console.error('Error sending notifications to all users:', error);
  }
}

/**
 * دالة مساعدة للحصول على النص المناسب بناءً على اللغة
 */
export function getLocalizedText(arText?: string, enText?: string, language: string = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}