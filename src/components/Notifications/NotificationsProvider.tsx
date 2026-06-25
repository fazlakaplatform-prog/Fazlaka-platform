"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { useServerSentEvents } from '@/hooks/useServerSentEvents';
import { toast } from 'react-hot-toast';

// تعريف واجهة الإشعار (تم تغيير _id إلى id)
interface Notification {
  id: string;
  localizedTitle: string;
  localizedMessage: string;
  type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  actionUrl?: string;
  createdAt: string;
  relatedType?: string;
}

// تعريف واجهة الـ Context
interface NotificationsContextType {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  fetchNotifications: () => Promise<void>;
  handleMarkAsRead: (notificationId: string) => Promise<void>;
  handleMarkAllAsRead: () => Promise<void>;
  handleDelete: (notificationId: string) => Promise<void>;
}

const NotificationsContext = createContext<NotificationsContextType | undefined>(undefined);

export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

interface NotificationsProviderProps {
  children: ReactNode;
}

export function NotificationsProvider({ children }: NotificationsProviderProps) {
  const { data: session } = useSession();
  const { language } = useLanguage();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // استخدام SSE للاستماع للإشعارات الفورية
  useServerSentEvents('/api/notifications/stream', {
    onMessage: (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'notification') {
          const newNotification = data.data;
          
          // تحديث الحقول المحلية
          newNotification.localizedTitle = language === 'ar' 
            ? newNotification.title 
            : newNotification.titleEn || newNotification.title;
          newNotification.localizedMessage = language === 'ar' 
            ? newNotification.message 
            : newNotification.messageEn || newNotification.message;
          
          // التأكد من أن الحقل isRead موجود
          if (newNotification.isRead === undefined) newNotification.isRead = false;
          
          setNotifications(prev => [newNotification, ...prev]);
          
          if (!newNotification.isRead) {
            setUnreadCount(prev => prev + 1);
            
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotification.localizedTitle, {
                body: newNotification.localizedMessage,
                icon: '/favicon.ico',
                tag: newNotification.id, // استخدام id
                requireInteraction: true
              });
            }
          }
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    },
    onError: (event) => {
      console.error('SSE error:', event);
      setError('Connection to notification stream failed');
    }
  });

  const fetchNotifications = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/notifications?language=${language}`);
      if (!response.ok) throw new Error('Failed to fetch notifications');
      
      const data = await response.json();
      setNotifications(data.notifications || []);
      setUnreadCount(data.unreadCount || 0);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setError('Failed to fetch notifications');
      toast.error(language === 'ar' ? 'فشل في جلب الإشعارات' : 'Failed to fetch notifications');
    } finally {
      setLoading(false);
    }
  }, [session?.user?.id, language]);

  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    if (!session?.user?.id) return;

    const notificationIndex = notifications.findIndex(n => n.id === notificationId);
    if (notificationIndex === -1) return;

    const notification = notifications[notificationIndex];
    if (notification.isRead) return;

    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;

    try {
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAsRead: true }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed');
      }
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      setNotifications(originalNotifications);
      setUnreadCount(originalUnreadCount);
      toast.error(language === 'ar' ? 'فشل في تحديث الإشعار' : 'Failed to update');
    }
  }, [session?.user?.id, notifications, unreadCount, language]);

  const handleMarkAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return;

    const originalNotifications = [...notifications];
    const unreadNotifications = originalNotifications.filter(n => !n.isRead);
    if (unreadNotifications.length === 0) return;
    
    try {
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      
      if (!response.ok) {
        throw new Error('Failed');
      }
      
      toast.success(language === 'ar' ? 'تم تحديث جميع الإشعارات' : 'All notifications updated');
    } catch (error) {
      setNotifications(originalNotifications);
      setUnreadCount(unreadNotifications.length);
      toast.error(language === 'ar' ? 'فشل' : 'Failed');
    }
  }, [session?.user?.id, notifications, language]);

  const handleDelete = useCallback(async (notificationId: string) => {
    if (!session?.user?.id) return;

    const originalNotifications = [...notifications];
    const deletedNotification = originalNotifications.find(n => n.id === notificationId);
    if (!deletedNotification) return;

    try {
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      if (!deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) throw new Error('Failed');
      
      toast.success(language === 'ar' ? 'تم حذف الإشعار' : 'Deleted');
    } catch (error) {
      setNotifications(originalNotifications);
      if (!deletedNotification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
      toast.error(language === 'ar' ? 'فشل الحذف' : 'Failed');
    }
  }, [session?.user?.id, notifications, language]);

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  useEffect(() => {
    if (session?.user?.id) {
      fetchNotifications();
    }
  }, [session?.user?.id, fetchNotifications]);

  const value = {
    notifications,
    unreadCount,
    loading,
    error,
    fetchNotifications,
    handleMarkAsRead,
    handleMarkAllAsRead,
    handleDelete
  };

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}