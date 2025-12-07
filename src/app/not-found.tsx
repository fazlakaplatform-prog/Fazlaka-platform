// app/not-found.tsx

"use client";

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/components/Language/LanguageProvider';

// تعريف المكون كـ React.FC (Functional Component)
const NotFound: React.FC = () => {
  const { isRTL, language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const texts = {
    ar: {
      title: '404',
      heading: 'الصفحة غير موجودة',
      message: 'عذرًا، يبدو أنك ضللت طريقك قليلاً.',
      buttonText: 'العودة إلى الصفحة الرئيسية',
      additionalInfo: 'الرابط الذي تبحث عنه قد يكون قد تغير أو لم يعد موجوداً.'
    },
    en: {
      title: '404',
      heading: 'Page Not Found',
      message: 'Oops! It looks like you\'ve taken a wrong turn.',
      buttonText: 'Back to Homepage',
      additionalInfo: 'The link you are looking for might have been changed or no longer exists.'
    }
  };

  const currentTexts = texts[language];

  if (!mounted) {
    return null;
  }

  return (
    <>
      {/* تعريف الأنيميشن المخصص */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(-20px) translateX(10px); }
          66% { transform: translateY(10px) translateX(-10px); }
        }
        @keyframes float-reverse {
          0%, 100% { transform: translateY(0px) translateX(0px); }
          33% { transform: translateY(20px) translateX(-10px); }
          66% { transform: translateY(-10px) translateX(10px); }
        }
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.3; transform: scale(1.05); }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes twinkle {
          0%, 100% { opacity: 0; transform: scale(0.5); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>

      <main 
        className={`flex flex-col items-center justify-center min-h-screen text-center px-4 relative overflow-hidden ${
          isRTL ? 'rtl' : 'ltr'
        } bg-gradient-to-br from-slate-50 via-gray-50 to-slate-100 dark:from-gray-900 dark:via-slate-900 dark:to-gray-800`}
      >
        {/* خلفية رسومية متحركة */}
        <div className="absolute inset-0 overflow-hidden">
          {/* كرات ضبابية متحركة */}
          <div className={`absolute -top-10 ${isRTL ? '-right-10' : '-left-10'} w-40 h-40 bg-indigo-400 dark:bg-indigo-600 rounded-full opacity-20 blur-3xl animate-pulse-slow`}></div>
          <div className={`absolute top-1/3 ${isRTL ? '-left-20' : '-right-20'} w-60 h-60 bg-purple-400 dark:bg-purple-600 rounded-full opacity-20 blur-3xl animate-float`}></div>
          <div className={`absolute bottom-10 ${isRTL ? 'left-1/4' : 'right-1/4'} w-72 h-72 bg-pink-400 dark:bg-pink-600 rounded-full opacity-20 blur-3xl animate-pulse-slow`}></div>

          {/* أشكال هندسية عائمة */}
          <div className={`absolute top-20 ${isRTL ? 'left-10' : 'right-10'} w-16 h-16 bg-indigo-300 dark:bg-indigo-800 opacity-30 animate-float-reverse`} style={{ clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)' }}></div>
          <div className={`absolute bottom-20 ${isRTL ? 'right-20' : 'left-20'} w-20 h-20 bg-purple-300 dark:bg-purple-800 opacity-30 rotate-45 animate-float`}></div>
          <div className={`absolute top-1/2 ${isRTL ? 'left-1/3' : 'right-1/3'} w-12 h-12 border-4 border-pink-300 dark:border-pink-700 opacity-40 animate-spin-slow`}></div>

          {/* تأثير النجوم المتلألئة */}
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-twinkle"
              style={{
                top: `${Math.random() * 100}%`,
                [isRTL ? 'right' : 'left']: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 5}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            ></div>
          ))}
        </div>

        {/* المحتوى الرئيسي مع ظل خلفي */}
        <div className="relative z-10 max-w-2xl mx-auto bg-white/10 dark:bg-black/10 backdrop-blur-sm rounded-3xl p-8 sm:p-12 shadow-2xl">
          {/* الرقم الكبير 404 مع تأثيرات */}
          <div className="relative">
            <h1 className="text-9xl font-extrabold text-gray-200 dark:text-gray-700 select-none">
              {currentTexts.title}
            </h1>
            <div 
              className="absolute inset-0 flex items-center justify-center text-indigo-400 dark:text-indigo-600 select-none"
              style={{
                transform: 'translateY(10px)',
                filter: 'blur(8px)',
                opacity: 0.4
              }}
            >
              <h1 className="text-9xl font-extrabold">
                {currentTexts.title}
              </h1>
            </div>
          </div>

          {/* عنوان الصفحة */}
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl drop-shadow-lg">
            {currentTexts.heading}
          </h2>

          {/* رسالة توضيحية للمستخدم */}
          <p className="mt-6 text-lg leading-7 text-gray-600 dark:text-gray-300">
            {currentTexts.message}
          </p>

          {/* معلومات إضافية */}
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {currentTexts.additionalInfo}
          </p>

          {/* زر العودة للصفحة الرئيسية مع تحسينات */}
          <div className="mt-10">
            <Link
              href="/"
              className="group relative inline-flex items-center justify-center rounded-full px-10 py-4 text-base font-semibold text-white shadow-2xl transition-all duration-500 ease-out overflow-hidden"
            >
              {/* خلفية متدرجة متحركة */}
              <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 group-hover:from-indigo-600 group-hover:via-purple-600 group-hover:to-pink-600 transition-all duration-500"></span>
              
              {/* توهج عند التمرير */}
              <span className="absolute inset-0 w-full h-full opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <span className="absolute inset-0 w-full h-full bg-gradient-to-br from-white/20 to-transparent blur-xl"></span>
              </span>

              {/* نص الزر */}
              <span className="relative flex items-center">
                {currentTexts.buttonText}
                <svg className={`w-5 h-5 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'} transition-transform duration-300 group-hover:translate-x-1`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
              </span>
            </Link>
          </div>
        </div>
      </main>
    </>
  );
};

export default NotFound;