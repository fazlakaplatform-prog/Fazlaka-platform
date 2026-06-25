"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { useNotifications } from './NotificationsProvider';
import NotificationToast from './NotificationToast';
import { isRtl } from '@/lib/utils';

interface NotificationItem {
  id: string; // تم التغيير من _id
  localizedTitle: string;
  localizedMessage: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | string;
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

  useEffect(() => {
    const latestNotification = notifications[0];
    
    if (latestNotification && 
        !latestNotification.isRead && 
        !processedIds.has(latestNotification.id)) { // تم التغيير من _id
      
      const newToast: QueuedNotification = {
        id: `${latestNotification.id}-${Date.now()}`, // تم التغيير من _id
        notification: latestNotification,
        timestamp: Date.now()
      };

      setActiveToasts(prev => [...prev, newToast]);
      setProcessedIds(prev => new Set(prev).add(latestNotification.id)); // تم التغيير من _id

      setTimeout(() => {
        setActiveToasts(prev => prev.filter(toast => toast.id !== newToast.id));
      }, 60000);
    }
  }, [notifications, processedIds]);

  useEffect(() => {
    const interval = setInterval(() => {
      setProcessedIds(prev => {
        const currentIds = new Set(notifications.map(n => n.id)); // تم التغيير من _id
        return new Set([...prev].filter(id => currentIds.has(id)));
      });
    }, 300000);

    return () => clearInterval(interval);
  }, [notifications]);

  useEffect(() => {
    setActiveToasts(prev => {
      return prev.filter(toast => {
        const notification = notifications.find(n => n.id === toast.notification.id); // تم التغيير من _id
        return notification && !notification.isRead;
      });
    });
  }, [notifications]);

  const handleClose = (toastId: string) => {
    setActiveToasts(prev => prev.filter(toast => toast.id !== toastId));
  };

  const handleMarkAsRead = (notificationId: string) => {
    markNotificationAsRead(notificationId);
    setActiveToasts(prev => prev.filter(toast => toast.notification.id !== notificationId)); // تم التغيير من _id
  };

  if (activeToasts.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 pointer-events-none z-50">
      <div className={`flex flex-col gap-3 p-4 ${isRtl(language) ? 'items-start' : 'items-end'}`}>
        {activeToasts.map((toast, index) => (
          <div
            key={toast.id}
            className="pointer-events-auto"
            style={{ zIndex: 50 - index }}
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