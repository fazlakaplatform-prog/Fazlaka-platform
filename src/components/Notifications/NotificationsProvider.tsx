"use client";

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { useServerSentEvents } from '@/hooks/useServerSentEvents';
import { toast } from 'react-hot-toast';

// تعريف واجهة الإشعار
interface Notification {
  _id: string;
  localizedTitle: string;
  localizedMessage: string;
  type: 'info' | 'success' | 'warning' | 'error';
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

// Hook مخصص لاستخدام الـ Context
export function useNotifications() {
  const context = useContext(NotificationsContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationsProvider');
  }
  return context;
}

// تعريف props للـ Provider
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
          // إضافة الإشعار الجديد إلى القائمة
          const newNotification = data.data;
          
          // تحديث الحقول المحلية بناءً على اللغة الحالية
          newNotification.localizedTitle = language === 'ar' 
            ? newNotification.title 
            : newNotification.titleEn || newNotification.title;
          newNotification.localizedMessage = language === 'ar' 
            ? newNotification.message 
            : newNotification.messageEn || newNotification.message;
          
          // إضافة الإشعار الجديد في بداية القائمة
          setNotifications(prev => [newNotification, ...prev]);
          
          // زيادة عدد الإشعارات غير المقروءة إذا كان الإشعار الجديد غير مقروء
          if (!newNotification.isRead) {
            setUnreadCount(prev => prev + 1);
            
            // عرض إشعار المتصفح الأصلي (اختياري)
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification(newNotification.localizedTitle, {
                body: newNotification.localizedMessage,
                icon: '/favicon.ico',
                tag: newNotification._id,
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

  // دالة جلب الإشعارات (مغلفة بـ useCallback لمنع إعادة إنشائها)
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

  // دالة تعيين إشعار كمقروء (مع تحسين معالجة الأخطاء)
  const handleMarkAsRead = useCallback(async (notificationId: string) => {
    if (!session?.user?.id) return;

    // البحث عن الإشعار قبل التحديث
    const notificationIndex = notifications.findIndex(n => n._id === notificationId);
    if (notificationIndex === -1) {
      console.warn('Notification not found:', notificationId);
      return;
    }

    const notification = notifications[notificationIndex];
    
    // إذا كان الإشعار مقروءاً بالفعل، لا تفعل شيئاً
    if (notification.isRead) {
      return;
    }

    // حفظ الحالة الأصلية للاسترجاع عند الحاجة
    const originalNotifications = [...notifications];
    const originalUnreadCount = unreadCount;

    try {
      // 1. تحديث تفاؤلي للواجهة
      setNotifications(prev => 
        prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));

      // 2. إرسال الطلب للخادم
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAsRead: true }),
      });

      // 3. التحقق من الاستجابة
      if (!response.ok) {
        // محاولة قراءة رسالة الخطأ من الخادم
        let errorMessage = 'Failed to mark as read';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      // 4. التحقق من نجاح العملية
      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Operation failed');
      }

      console.log('Notification marked as read successfully:', notificationId);
      
    } catch (error) {
      console.error('Error marking notification as read:', error);
      
      // استرجاع الحالة الأصلية عند الفشل
      setNotifications(originalNotifications);
      setUnreadCount(originalUnreadCount);
      
      // عرض رسالة خطأ للمستخدم
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(
        language === 'ar' 
          ? `فشل في تحديث حالة الإشعار: ${errorMessage}` 
          : `Failed to update notification: ${errorMessage}`
      );
    }
  }, [session?.user?.id, notifications, unreadCount, language]);

  // دالة تعيين الكل كمقروء (مع تحسين معالجة الأخطاء)
  const handleMarkAllAsRead = useCallback(async () => {
    if (!session?.user?.id) return;

    const originalNotifications = [...notifications];
    const unreadNotifications = originalNotifications.filter(n => !n.isRead);
    
    // إذا لم تكن هناك إشعارات غير مقروءة، لا تفعل شيئاً
    if (unreadNotifications.length === 0) {
      return;
    }
    
    try {
      // 1. تحديث تفاؤلي
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
      
      const response = await fetch('/api/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ markAllAsRead: true }),
      });
      
      if (!response.ok) {
        // استرجاع الحالة عند الفشل
        setNotifications(originalNotifications);
        setUnreadCount(unreadNotifications.length);
        
        let errorMessage = 'Failed to mark all as read';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Operation failed');
      }
      
      toast.success(language === 'ar' ? 'تم تحديث جميع الإشعارات' : 'All notifications updated');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      
      // استرجاع الحالة عند الفشل
      setNotifications(originalNotifications);
      setUnreadCount(unreadNotifications.length);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(
        language === 'ar' 
          ? `فشل في تحديث جميع الإشعارات: ${errorMessage}` 
          : `Failed to update all notifications: ${errorMessage}`
      );
    }
  }, [session?.user?.id, notifications, language]);

  // دالة حذف إشعار (مع تحسين معالجة الأخطاء)
  const handleDelete = useCallback(async (notificationId: string) => {
    if (!session?.user?.id) return;

    const originalNotifications = [...notifications];
    const deletedNotification = originalNotifications.find(n => n._id === notificationId);

    if (!deletedNotification) {
      console.warn('Notification not found for deletion:', notificationId);
      return;
    }

    try {
      // 1. تحديث تفاؤلي
      setNotifications(prev => prev.filter(n => n._id !== notificationId));
      if (!deletedNotification.isRead) {
        setUnreadCount(prev => Math.max(0, prev - 1));
      }
      
      const response = await fetch(`/api/notifications/${notificationId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        // استرجاع الحالة عند الفشل
        setNotifications(originalNotifications);
        if (!deletedNotification.isRead) {
          setUnreadCount(prev => prev + 1);
        }
        
        let errorMessage = 'Failed to delete notification';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      if (!result.success) {
        throw new Error(result.error || 'Operation failed');
      }
      
      // عرض رسالة نجاح
      toast.success(language === 'ar' ? 'تم حذف الإشعار بنجاح' : 'Notification deleted successfully');
    } catch (error) {
      console.error('Error deleting notification:', error);
      
      // استرجاع الحالة في حالة الخطأ
      setNotifications(originalNotifications);
      if (!deletedNotification.isRead) {
        setUnreadCount(prev => prev + 1);
      }
      
      // عرض رسالة خطأ للمستخدم
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(
        language === 'ar' 
          ? `فشل في حذف الإشعار: ${errorMessage}` 
          : `Failed to delete notification: ${errorMessage}`
      );
    }
  }, [session?.user?.id, notifications, language]);

  // طلب إذن الإشعارات من المتصفح
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  // هذا الـ Effect سيقوم بجلب الإشعارات فقط عند تسجيل الدخول أو تغيير اللغة
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