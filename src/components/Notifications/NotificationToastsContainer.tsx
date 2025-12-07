"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { useNotifications } from './NotificationsProvider';
import NotificationToast from './NotificationToast';
import { isRtl } from '@/lib/utils';

// تعريف واجهة للإشعار
interface NotificationItem {
  _id: string;
  localizedTitle: string;
  localizedMessage: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  relatedType?: string;
}

interface QueuedNotification {
  id: string;
  notification: NotificationItem;
  timestamp: number;
}

export default function NotificationToastsContainer() {
  const { language } = useLanguage();
  const { notifications, handleMarkAsRead: markNotificationAsRead } = useNotifications();
  const [activeToasts, setActiveToasts] = useState<QueuedNotification[]>([]);
  const [processedIds, setProcessedIds] = useState<Set<string>>(new Set());

  // مراقبة الإشعارات الجديدة وعرضها للإشعارات غير المقروءة فقط
  useEffect(() => {
    const latestNotification = notifications[0];
    
    // عرض البطاقة العائمة فقط للإشعارات الجديدة غير المقروءة
    if (latestNotification && 
        !latestNotification.isRead && 
        !processedIds.has(latestNotification._id)) {
      
      // إضافة الإشعار الجديد إلى قائمة الانتظار
      const newToast: QueuedNotification = {
        id: `${latestNotification._id}-${Date.now()}`,
        notification: latestNotification,
        timestamp: Date.now()
      };

      setActiveToasts(prev => [...prev, newToast]);
      setProcessedIds(prev => new Set(prev).add(latestNotification._id));

      // إزالة الإشعار من قائمة الانتظار بعد 60 ثانية
      setTimeout(() => {
        setActiveToasts(prev => prev.filter(toast => toast.id !== newToast.id));
      }, 60000);
    }
  }, [notifications, processedIds]);

  // تنظيف الإشعارات القديمة من processedIds
  useEffect(() => {
    const interval = setInterval(() => {
      setProcessedIds(prev => {
        const currentIds = new Set(notifications.map(n => n._id));
        return new Set([...prev].filter(id => currentIds.has(id)));
      });
    }, 300000); // كل 5 دقائق

    return () => clearInterval(interval);
  }, [notifications]);

  // إزالة البطاقات العائمة للإشعارات التي تم قراءتها
  useEffect(() => {
    // التحقق من الإشعارات النشطة وتحديثها
    setActiveToasts(prev => {
      return prev.filter(toast => {
        const notification = notifications.find(n => n._id === toast.notification._id);
        // إبقاء البطاقة فقط إذا كان الإشعار لا يزال غير مقروء
        return notification && !notification.isRead;
      });
    });
  }, [notifications]);

  const handleClose = (toastId: string) => {
    setActiveToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  const handleMarkAsRead = (notificationId: string) => {
    // استدعاء دالة تعليم الإشعار كمقروء من الـ Provider
    markNotificationAsRead(notificationId);
    
    // إزالة البطاقة العائمة فوراً بعد تعليمها كمقروءة
    setActiveToasts(prev => prev.filter(toast => toast.notification._id !== notificationId));
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-50">
      <div className={`flex flex-col gap-3 p-4 ${isRtl(language) ? 'items-start' : 'items-end'}`}>
        {activeToasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{
              zIndex: 50 - index
            }}
          >
            <NotificationToast
              notification={toast.notification}
              onClose={() => handleClose(toast.id)}
              onMarkAsRead={handleMarkAsRead}
              isRTL={isRtl(language)}
            />
          </div>
        ))}
      </div>
    </div>
  );
}