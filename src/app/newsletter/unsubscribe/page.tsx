'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle } from 'lucide-react';

function UnsubscribeContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');
  const expired = searchParams.get('expired');
  const error = searchParams.get('error');
  const [isRTL, setIsRTL] = useState(true);

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    setIsRTL(savedLang !== 'en');
  }, []);

  const t = isRTL ? {
    title: 'إلغاء الاشتراك',
    successMsg: 'تم إلغاء اشتراكك بنجاح من النشرة البريدية.',
    expiredMsg: 'رابط إلغاء الاشتراك منتهي الصلاحية.',
    errorMsg: 'حدث خطأ أثناء إلغاء الاشتراك.',
    back: 'العودة للرئيسية',
    resubscribe: 'إعادة الاشتراك',
  } : {
    title: 'Unsubscribe',
    successMsg: 'You have been successfully unsubscribed from the newsletter.',
    expiredMsg: 'The unsubscribe link has expired.',
    errorMsg: 'An error occurred while unsubscribing.',
    back: 'Back to Home',
    resubscribe: 'Resubscribe',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 text-center"
      >
        {success ? (
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
        ) : (
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        )}

        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.title}</h1>

        {success && <p className="text-gray-500 dark:text-gray-400 mb-6">{t.successMsg}</p>}
        {expired && <p className="text-gray-500 dark:text-gray-400 mb-6">{t.expiredMsg}</p>}
        {error && <p className="text-gray-500 dark:text-gray-400 mb-6">{t.errorMsg}</p>}

        <div className="flex gap-3 justify-center">
          <Link href="/" className="px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 text-sm font-medium">
            {t.back}
          </Link>
          {success && (
            <Link href="/" className="px-6 py-2.5 text-indigo-500 border border-indigo-200 dark:border-indigo-800 rounded-xl hover:bg-indigo-50 dark:hover:bg-indigo-900/20 text-sm font-medium">
              {t.resubscribe}
            </Link>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default function UnsubscribePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <UnsubscribeContent />
    </Suspense>
  );
}
