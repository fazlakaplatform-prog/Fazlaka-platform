"use client";

import Link from "next/link";
import { useLanguage } from "@/components/Language/LanguageProvider";
import { useState, useEffect, use } from "react";
import { motion } from "framer-motion";

// تعريف نوع الخاصيات التي تستقبلها الصفحة
type Props = {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default function AuthErrorPage({ searchParams }: Props) {
  // فك شفرة searchParams باستخدام React.use()
  const resolvedSearchParams = use(searchParams);
  const error = resolvedSearchParams.error as string;
  const { language, isRTL } = useLanguage();
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [stars, setStars] = useState<{x: number, y: number, size: number, opacity: number}[]>([]);

  // التحقق من تفضيلات الوضع الليلي عند تحميل المكون
  useEffect(() => {
    // التحقق من وجود تفضيل محفوظ في localStorage
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (savedTheme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      // إذا لم يكن هناك تفضيل محفوظ، استخدم تفضيل النظام
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      if (prefersDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
    }
    
    // Generate random stars for space background
    const generatedStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2
    }));
    setStars(generatedStars);
  }, []);

  // قاموس يحتوي على رسائل الأخطاء المختلفة باللغتين
  const errorMessages: { [key: string]: { ar: { title: string; message: string }; en: { title: string; message: string } } } = {
    AccessDenied: {
      ar: {
        title: "غير مصرح لك بالدخول",
        message: "ليس لديك الصلاحيات اللازمة لعرض هذه الصفحة. إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع المسؤول.",
      },
      en: {
        title: "Access Denied",
        message: "You don't have the necessary permissions to view this page. If you believe this is an error, please contact the administrator.",
      },
    },
    MiddlewareError: {
      ar: {
        title: "حدث خطأ ما",
        message: "حدث خطأ أثناء التحقق من هويتك. يرجى المحاولة مرة أخرى لاحقًا.",
      },
      en: {
        title: "Something Went Wrong",
        message: "An error occurred while verifying your identity. Please try again later.",
      },
    },
    // رسالة افتراضية لأي خطأ آخر غير متوقع
    Default: {
      ar: {
        title: "خطأ في المصادقة",
        message: "حدث خطأ غير متوقع أثناء محاولة الوصول إلى هذه الصفحة.",
      },
      en: {
        title: "Authentication Error",
        message: "An unexpected error occurred while trying to access this page.",
      },
    },
  };

  // اختيار الرسالة المناسبة بناءً على نوع الخطأ واللغة الحالية
  const { title, message } = errorMessages[error]?.[language] || errorMessages.Default[language];

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Space Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-transparent"></div>
        {stars.map((star, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, ${star.opacity})`
            }}
          />
        ))}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-purple-500/10 blur-xl"
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-40 h-40 rounded-full bg-blue-500/10 blur-xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/50">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-6 shadow-lg"
            >
              <svg
                className="h-12 w-12 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </motion.div>

            {/* عنوان الخطأ */}
            <h1 className="text-3xl font-bold mb-3 text-gray-900 dark:text-white">{title}</h1>

            {/* رسالة توضيحية */}
            <p className="mt-2 text-sm mb-8 text-gray-600 dark:text-gray-300">{message}</p>

            {/* زر للعودة للصفحة الرئيسية */}
            <Link
              href="/"
              className="w-full inline-flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium transition-all duration-200 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:ring-blue-500"
            >
              {language === 'ar' ? 'العودة إلى الصفحة الرئيسية' : 'Back to Home'}
            </Link>
          </div>
          
          {/* إضافة معلومات إضافية داخل المربع */}
          <div className="border-t border-gray-200 dark:border-gray-600 pt-6 mt-6">
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
              {language === 'ar' ? 'رمز الخطأ:' : 'Error code:'} {error || 'Unknown'}
            </p>
            
            {/* قسم المساعدة داخل المربع */}
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {language === 'ar' 
                  ? 'هل تحتاج إلى مساعدة؟ ' 
                  : 'Need help? '}
                <Link 
                  href="/support"
                  className="font-medium text-blue-600 dark:text-blue-400 hover:text-blue-500 dark:hover:text-blue-300 transition-colors duration-200"
                >
                  {language === 'ar' ? 'تواصل مع الدعم' : 'Contact Support'}
                </Link>
              </p>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <motion.div
          className="absolute -top-10 -right-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-30 blur-xl"
          animate={{
            x: [0, 20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-20 h-20 bg-purple-200 dark:bg-purple-800 rounded-full opacity-30 blur-xl"
          animate={{
            x: [0, -20, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </motion.div>
    </div>
  );
}