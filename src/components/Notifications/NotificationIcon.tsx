"use client";

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { Bell, BellRing } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';
import { useNotifications } from './NotificationsProvider';

export default function NotificationIcon() {
  const { language, isRTL } = useLanguage();
  const { 
    notifications, 
    unreadCount, 
    loading, 
    handleMarkAsRead, 
    handleMarkAllAsRead 
  } = useNotifications();
  const [isOpen, setIsOpen] = useState(false);
  const notificationRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        return <div className="p-1.5 rounded-full bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>;
      case 'warning':
        return <div className="p-1.5 rounded-full bg-yellow-100 text-yellow-600 dark:bg-yellow-900 dark:text-yellow-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        </div>;
      case 'error':
        return <div className="p-1.5 rounded-full bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-300">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        </div>;
      default:
        return <div className="p-1.5 rounded-full bg-blue-100 text-blue-600 dark:bg-blue-900 dark:text-blue-300">
          <Bell className="h-3 w-3" />
        </div>;
    }
  };

  const handleNotificationClick = (notificationId: string, actionUrl?: string) => {
    // تعليم الإشعار كمقروء
    if (!notifications.find(n => n._id === notificationId)?.isRead) {
      handleMarkAsRead(notificationId);
    }
    
    // إغلاق القائمة
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={notificationRef}>
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className={`relative p-2 rounded-full transition-all duration-300 ${
          isOpen 
            ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' 
            : 'hover:bg-gray-100/50 dark:hover:bg-gray-800/50'
        }`}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        aria-label={language === 'ar' ? 'الإشعارات' : 'Notifications'}
      >
        <AnimatePresence mode="wait">
          {unreadCount > 0 ? (
            <motion.div
              key="bell-ring"
              initial={{ rotate: 0 }}
              animate={{ rotate: [0, 15, -15, 0] }}
              transition={{ duration: 0.5, repeat: unreadCount > 0 ? 3 : 0, repeatDelay: 2 }}
            >
              <BellRing className="h-5 w-5" />
            </motion.div>
          ) : (
            <motion.div
              key="bell"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <Bell className="h-5 w-5" />
            </motion.div>
          )}
        </AnimatePresence>
        
        {unreadCount > 0 && (
          <motion.span 
            className="absolute bottom-0 right-0 inline-flex items-center justify-center px-1 py-0.5 text-[10px] font-bold leading-none text-white transform translate-x-1/2 translate-y-1/2 bg-gradient-to-r from-red-500/80 to-pink-500/80 rounded-full shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 500, damping: 30 }}
          >
            {unreadCount > 99 ? '99+' : unreadCount}
          </motion.span>
        )}
      </motion.button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-80 bg-white/85 dark:bg-gray-800/85 backdrop-blur-lg rounded-2xl shadow-2xl border border-white/20 dark:border-gray-700/30 overflow-hidden z-50`}
          >
            {/* رأس الإشعارات */}
            <div className="p-4 border-b border-gray-200/30 dark:border-gray-700/30 bg-gradient-to-r from-indigo-50/50 to-purple-50/50 dark:from-gray-700/30 dark:to-gray-800/30">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center">
                    <Bell className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">
                      {language === 'ar' ? 'الإشعارات' : 'Notifications'}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {unreadCount > 0 
                        ? (language === 'ar' ? `${unreadCount} إشعار غير مقروء` : `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}`)
                        : (language === 'ar' ? 'لا توجد إشعارات جديدة' : 'No new notifications')
                      }
                    </p>
                  </div>
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                  >
                    {language === 'ar' ? 'تعيين الكل كمقروء' : 'Mark all as read'}
                  </button>
                )}
              </div>
            </div>

            {/* قائمة الإشعارات */}
            <div className="max-h-96 overflow-y-auto">
              {loading ? (
                <div className="flex justify-center items-center p-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : notifications.length === 0 ? (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <Bell className="h-8 w-8 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {language === 'ar' ? 'لا توجد إشعارات' : 'No notifications'}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {language === 'ar' ? 'ستظهر هنا جميع الإشعارات الخاصة بك' : 'All your notifications will appear here'}
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-gray-200/30 dark:divide-gray-700/30">
                  {notifications.slice(0, 5).map((notification) => (
                    <motion.div
                      key={notification._id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                      className={`p-4 hover:bg-gray-50/50 dark:hover:bg-gray-700/30 transition-colors cursor-pointer ${
                        !notification.isRead ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''
                      }`}
                      onClick={() => !notification.isRead && handleMarkAsRead(notification._id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0">
                          {getNotificationIcon(notification.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <h4 className={`text-sm font-medium ${notification.isRead ? 'text-gray-900 dark:text-white' : 'text-blue-900 dark:text-blue-100'}`}>
                                {notification.localizedTitle}
                              </h4>
                              <p className={`mt-1 text-sm ${notification.isRead ? 'text-gray-600 dark:text-gray-300' : 'text-blue-800 dark:text-blue-200'}`}>
                                {notification.localizedMessage}
                              </p>
                              <div className="mt-2 flex items-center justify-between">
                                <span className="text-xs text-gray-500 dark:text-gray-400">
                                  {formatDate(notification.createdAt)}
                                </span>
                                {notification.actionUrl && (
                                  <Link 
                                    href={notification.actionUrl}
                                    className="inline-flex items-center text-xs text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleNotificationClick(notification._id, notification.actionUrl);
                                    }}
                                  >
                                    {language === 'ar' ? 'عرض' : 'View'}
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                      <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
                                      <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
                                    </svg>
                                  </Link>
                                )}
                              </div>
                            </div>
                            {!notification.isRead && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* تذييل الإشعارات */}
            <div className="p-3 border-t border-gray-200/30 dark:border-gray-700/30 bg-gray-50/20 dark:bg-gray-700/20">
              <Link 
                href="/notifications"
                className="block w-full text-center py-2 px-4 text-sm font-medium text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 rounded-lg hover:bg-indigo-50/30 dark:hover:bg-indigo-900/20 transition-colors"
                onClick={() => setIsOpen(false)}
              >
                {language === 'ar' ? 'عرض جميع الإشعارات' : 'View all notifications'}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}