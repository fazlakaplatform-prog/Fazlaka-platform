import { prisma } from '@/lib/prisma';
import { Notification } from '@prisma/client';
import { sendNotificationToUser, broadcastNotification } from '@/services/sseService';

export interface NotificationWithLocalized {
  id: string;
  userId: string;
  title: string;
  titleEn: string | null;
  message: string;
  messageEn: string | null;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  isRead: boolean;
  relatedId: string | null;
  relatedType: string | null;
  actionUrl: string | null;
  createdAt: Date;
  updatedAt: Date;
  localizedTitle?: string;
  localizedMessage?: string;
}

export async function fetchUserNotifications(
  userId: string, 
  language: string = 'ar',
  limit: number = 20,
  skip: number = 0
): Promise<NotificationWithLocalized[]> {
  try {
    // [تشخيص] طباعة الـ ID الذي يبحث عنه المستخدم
    console.log(`%c[DEBUG] Fetching notifications for User ID: ${userId}`, 'color: blue; font-weight: bold;');

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      skip: skip,
    });

    // [تشخيص] طباعة النتيجة
    console.log(`%c[DEBUG] Found ${notifications.length} notifications.`, 'color: green;');

    if (notifications.length === 0) {
      // تحقق إضافي: هل يوجد أي إشعارات في النظام لأي مستخدم آخر؟
      const anyNotif = await prisma.notification.findFirst();
      if (anyNotif) {
        console.log(`%c[DEBUG] MISMATCH! Found notifications for User ID: ${anyNotif.userId}`, 'color: red; font-weight: bold;');
        console.log(`%c[DEBUG] But current user is: ${userId}`, 'color: red;');
      } else {
        console.log(`%c[DEBUG] Database is empty. No notifications exist.`, 'color: orange;');
      }
    }

    return notifications.map(notification => ({
      ...notification,
      localizedTitle: language === 'ar' ? notification.title : notification.titleEn || notification.title,
      localizedMessage: language === 'ar' ? notification.message : notification.messageEn || notification.message
    }));
  } catch (error) {
    console.error('Error fetching user notifications:', error);
    return [];
  }
}

export async function fetchUnreadNotificationsCount(userId: string): Promise<number> {
  try {
    return await prisma.notification.count({
      where: { userId, isRead: false },
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    return 0;
  }
}

export async function createAndSendNotification(
  notificationData: {
    userId: string;
    title: string;
    titleEn?: string;
    message: string;
    messageEn?: string;
    type?: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
    relatedId?: string;
    relatedType?: string;
    actionUrl?: string;
  }
): Promise<NotificationWithLocalized | null> {
  try {
    const typeValue = (notificationData.type || 'INFO').toUpperCase();
    const relatedTypeValue = notificationData.relatedType ? notificationData.relatedType.toUpperCase() : null;

    const newNotification = await prisma.notification.create({
      data: {
        userId: notificationData.userId,
        title: notificationData.title,
        titleEn: notificationData.titleEn,
        message: notificationData.message,
        messageEn: notificationData.messageEn,
        // تم إصلاح الخطأ: استخدام نوع الحقل من Prisma
        type: typeValue as Notification['type'],
        relatedId: notificationData.relatedId,
        // تم إصلاح الخطأ: استخدام نوع الحقل من Prisma
        relatedType: relatedTypeValue as Notification['relatedType'],
        actionUrl: notificationData.actionUrl,
      },
    });
    
    sendNotificationToUser(notificationData.userId, newNotification);
    
    return {
      ...newNotification,
      localizedTitle: newNotification.title,
      localizedMessage: newNotification.message
    };
  } catch (error) {
    console.error('Error creating notification:', error);
    return null;
  }
}

export async function markNotificationAsRead(notificationId: string, userId: string): Promise<boolean> {
  try {
    const result = await prisma.notification.updateMany({
      where: { id: notificationId, userId },
      data: { isRead: true },
    });
    return result.count > 0;
  } catch (error) {
    return false;
  }
}

export async function markAllNotificationsAsRead(userId: string): Promise<boolean> {
  try {
    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
    return result.count > 0;
  } catch (error) {
    return false;
  }
}

export async function deleteNotification(notificationId: string, userId: string): Promise<boolean> {
  try {
    const result = await prisma.notification.deleteMany({
      where: { id: notificationId, userId },
    });
    return result.count > 0;
  } catch (error) {
    return false;
  }
}

export async function notifyAllUsers(
  title: string,
  titleEn: string,
  message: string,
  messageEn: string,
  relatedId: string,
  relatedType: string,
  actionUrl: string
): Promise<void> {
  try {
    const users = await prisma.user.findMany({
      where: { isActive: true },
      select: { id: true },
    });

    const formattedRelatedType = relatedType.toUpperCase();

    console.log(`[DEBUG] notifyAllUsers: Preparing for ${users.length} users.`);
    
    if (users.length > 0) {
       console.log(`[DEBUG] notifyAllUsers: Target User ID: ${users[0].id}`);
    }

    const notificationsData = users.map(user => ({
      userId: user.id,
      title,
      titleEn,
      message,
      messageEn,
      type: 'INFO' as const,
      relatedId,
      // تم إصلاح الخطأ: استخدام نوع الحقل من Prisma
      relatedType: formattedRelatedType as Notification['relatedType'],
      actionUrl,
    }));

    await prisma.notification.createMany({
      data: notificationsData,
    });

    // تم إصلاح الخطأ: إزالة as any
    broadcastNotification({
      id: 'broadcast-' + Date.now(),
      title,
      titleEn,
      message,
      messageEn,
      type: 'INFO',
      isRead: false,
      relatedId,
      relatedType: formattedRelatedType,
      actionUrl,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    
    console.log(`Notifications inserted successfully.`);
  } catch (error) {
    console.error('Error sending notifications to all users:', error);
  }
}