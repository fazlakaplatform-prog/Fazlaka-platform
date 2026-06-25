"use client";

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { X, ExternalLink, Clock, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Link from 'next/link';

interface NotificationToastProps {
  notification: {
    id: string; // تم التغيير من _id
    localizedTitle: string;
    localizedMessage: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR' | string;
    actionUrl?: string;
    relatedType?: string;
    createdAt: string;
    isRead: boolean;
  };
  onClose: () => void;
  onMarkAsRead?: (notificationId: string) => void;
  isRTL?: boolean;
}

export default function NotificationToast({ 
  notification, 
  onClose, 
  onMarkAsRead,
  isRTL = true 
}: NotificationToastProps) {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(true);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const duration = 60000;
    const interval = 50;
    const step = (100 * interval) / duration;
    
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev <= step) {
          setIsVisible(false);
          setTimeout(onClose, 300);
          return 0;
        }
        return prev - step;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [onClose]);

  const getNotificationIcon = () => {
    const iconClass = "w-5 h-5";
    switch (notification.type?.toUpperCase()) {
      case 'SUCCESS':
        return <CheckCircle className={`${iconClass} text-green-500`} />;
      case 'WARNING':
        return <AlertTriangle className={`${iconClass} text-yellow-500`} />;
      case 'ERROR':
        return <AlertCircle className={`${iconClass} text-red-500`} />;
      default:
        return <Info className={`${iconClass} text-blue-500`} />;
    }
  };

  const getNotificationGradient = () => {
    switch (notification.type?.toUpperCase()) {
      case 'SUCCESS':
        return 'from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-green-200 dark:border-green-800';
      case 'WARNING':
        return 'from-yellow-50 to-amber-50 dark:from-yellow-900/20 dark:to-amber-900/20 border-yellow-200 dark:border-yellow-800';
      case 'ERROR':
        return 'from-red-50 to-rose-50 dark:from-red-900/20 dark:to-rose-900/20 border-red-200 dark:border-red-800';
      default:
        return 'from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800';
    }
  };

  const getRelatedTypeIcon = () => {
    switch (notification.relatedType?.toUpperCase()) {
      case 'ARTICLE':
        return '📝';
      case 'EPISODE':
        return '🎬';
      case 'SEASON':
        return '📺';
      case 'PLAYLIST':
        return '🎵';
      case 'TEAM':
        return '👥';
      default:
        return '🔔';
    }
  };

  const handleViewClick = () => {
    if (!notification.isRead && onMarkAsRead) {
      onMarkAsRead(notification.id); // تم التغيير من _id
    }
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(onClose, 300);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ x: isRTL ? 400 : -400, opacity: 0, scale: 0.8 }}
          animate={{ x: 0, opacity: 1, scale: 1 }}
          exit={{ x: isRTL ? 400 : -400, opacity: 0, scale: 0.8 }}
          transition={{ type: "spring", stiffness: 300, damping: 30, mass: 0.8 }}
          className={`fixed bottom-4 ${isRTL ? 'left-4' : 'right-4'} z-50 max-w-sm w-full`}
        >
          <div className={`bg-gradient-to-br ${getNotificationGradient()} backdrop-blur-lg rounded-2xl shadow-2xl border p-4 relative overflow-hidden`}>
            <div className="absolute top-0 left-0 w-full h-1 bg-gray-200/30 dark:bg-gray-700/30">
              <motion.div 
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
                style={{ width: `${progress}%` }}
              />
            </div>

            <button onClick={handleClose} className="absolute top-3 right-3 p-1 rounded-full hover:bg-white/50 dark:hover:bg-gray-800/50 transition-colors">
              <X className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>

            <div className="flex gap-3">
              <div className="flex-shrink-0">
                <div className="w-10 h-10 rounded-full bg-white/80 dark:bg-gray-800/80 flex items-center justify-center shadow-lg">
                  {getNotificationIcon()}
                </div>
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{getRelatedTypeIcon()}</span>
                  <h4 className="font-semibold text-sm truncate text-gray-900 dark:text-white">
                    {notification.localizedTitle}
                  </h4>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                </div>
                
                <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 mb-2">
                  {notification.localizedMessage}
                </p>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{language === 'ar' ? 'الآن' : 'Just now'}</span>
                  </div>

                  {notification.actionUrl && (
                    <Link
                      href={notification.actionUrl}
                      onClick={handleViewClick}
                      className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                    >
                      {language === 'ar' ? 'عرض' : 'View'}
                      <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}