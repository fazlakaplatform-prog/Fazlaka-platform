"use client";

import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { Bell, Check, Trash2, ExternalLink, RefreshCw } from 'lucide-react';
import Link from 'next/link';
import { useNotifications } from '@/components/Notifications/NotificationsProvider';

export default function NotificationsPage() {
  const { data: session } = useSession();
  const { language } = useLanguage();
  const { 
    notifications, 
    loading, 
    error, 
    handleMarkAsRead, 
    handleMarkAllAsRead, 
    handleDelete,
    fetchNotifications // نستخدمها لزر التحديث اليدوي
  } = useNotifications();

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return language === 'ar' ? 'الآن' : 'Just now';
    if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return language === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
    }
    if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return language === 'ar' ? `منذ ${hours} ساعة` : `${hours} hour${hours > 1 ? 's' : ''} ago`;
    }
    const days = Math.floor(diffInSeconds / 86400);
    return language === 'ar' ? `منذ ${days} يوم` : `${days} day${days > 1 ? 's' : ''} ago`;
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300"><Check className="h-4 w-4" /></div>;
      case 'warning':
        return <div className="p-2 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300"><Bell className="h-4 w-4" /></div>;
      case 'error':
        return <div className="p-2 rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300"><Bell className="h-4 w-4" /></div>;
      default:
        return <div className="p-2 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300"><Bell className="h-4 w-4" /></div>;
    }
  };

  if (!session) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold mb-6">{language === 'ar' ? 'الإشعارات' : 'Notifications'}</h1>
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md p-4">
            <p className="text-yellow-800 dark:text-yellow-200">
              {language === 'ar' ? 'يجب تسجيل الدخول لعرض الإشعارات' : 'You must be logged in to view notifications'}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">{language === 'ar' ? 'الإشعارات' : 'Notifications'}</h1>
          <div className="flex gap-2">
            {notifications.length > 0 && (
              <button onClick={handleMarkAllAsRead} className="px-4 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-md hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-400 dark:hover:bg-blue-900/30">
                {language === 'ar' ? 'تعيين الكل كمقروء' : 'Mark all as read'}
              </button>
            )}
            <button onClick={fetchNotifications} className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-50 rounded-md hover:bg-gray-100 dark:bg-gray-900/20 dark:text-gray-400 dark:hover:bg-gray-900/30 flex items-center gap-2">
              <RefreshCw className="h-4 w-4" />
              {language === 'ar' ? 'تحديث' : 'Refresh'}
            </button>
          </div>
        </div>
        
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-4">
            <p className="text-red-800 dark:text-red-200">{error}</p>
          </div>
        ) : notifications.length === 0 ? (
          <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-md p-8 text-center">
            <Bell className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}</h3>
            <p className="text-gray-500 dark:text-gray-400">{language === 'ar' ? 'ستظهر هنا جميع الإشعارات الخاصة بك' : 'All your notifications will appear here'}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {notifications.map((notification) => (
              <div key={notification._id} className={`bg-white dark:bg-gray-800 border rounded-md p-4 shadow-sm transition-all duration-300 ${notification.isRead ? 'border-gray-200 dark:border-gray-700' : 'border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/10'}`}>
                <div className="flex items-start">
                  <div className="flex-shrink-0 mr-3">{getNotificationIcon(notification.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className={`text-sm font-medium ${notification.isRead ? 'text-gray-900 dark:text-white' : 'text-blue-900 dark:text-blue-100'}`}>{notification.localizedTitle}</h4>
                        <p className={`mt-1 text-sm ${notification.isRead ? 'text-gray-600 dark:text-gray-300' : 'text-blue-800 dark:text-blue-200'}`}>{notification.localizedMessage}</p>
                      </div>
                      <div className="flex items-center space-x-2 mr-2">
                        {!notification.isRead && (
                          <button onClick={() => handleMarkAsRead(notification._id)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={language === 'ar' ? 'تعيين كمقروء' : 'Mark as read'}>
                            <Check className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                          </button>
                        )}
                        <button onClick={() => handleDelete(notification._id)} className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700" title={language === 'ar' ? 'حذف' : 'Delete'}>
                          <Trash2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(notification.createdAt)}</span>
                      {notification.actionUrl && (
                        <Link href={notification.actionUrl} className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                          {language === 'ar' ? 'عرض' : 'View'}
                          <ExternalLink className="h-3 w-3 mr-1" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}