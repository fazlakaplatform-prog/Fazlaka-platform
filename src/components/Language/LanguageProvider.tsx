// components/Language/LanguageProvider.tsx 

"use client";

import { useState, useEffect, createContext, useContext } from "react";

// إنشاء سياق اللغة
const LanguageContext = createContext<{
  isRTL: boolean;
  language: 'ar' | 'en';
  setLanguage: (lang: 'ar' | 'en') => void;
}>({
  isRTL: true,
  language: 'ar',
  setLanguage: () => {},
});

// Hook مخصص لاستخدام سياق اللغة
export const useLanguage = () => useContext(LanguageContext);

export default function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [isRTL, setIsRTL] = useState(true);
  const [language, setLanguageState] = useState<'ar' | 'en'>('ar');
  const [mounted, setMounted] = useState(false);

  // تم تعديل الدالة لإزالة منطق Clerk
  const setLanguage = (lang: 'ar' | 'en') => {
    setLanguageState(lang);
    setIsRTL(lang === 'ar');
    localStorage.setItem('language', lang);
    
    // إعادة تحميل الصفحة لتحديث جميع المكونات باللغة الجديدة
    window.location.reload();
  };

  useEffect(() => {
    setMounted(true);
    
    const savedLanguage = localStorage.getItem('language') as 'ar' | 'en' | null;
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      setLanguageState(savedLanguage);
      setIsRTL(savedLanguage === 'ar');
    } else {
      const browserLang = navigator.language || (navigator as Navigator & { userLanguage?: string }).userLanguage || '';
      const shouldBeRTL = browserLang.includes('ar');
      setLanguageState(shouldBeRTL ? 'ar' : 'en');
      setIsRTL(shouldBeRTL);
    }
  }, []);

  useEffect(() => {
    if (mounted) {
      document.documentElement.dir = isRTL ? 'rtl' : 'ltr';
      document.documentElement.lang = language;
    }
  }, [isRTL, language, mounted]);

  if (!mounted) return null;

  // تمت إزالة ClerkProvider
  return (
    <LanguageContext.Provider value={{ isRTL, language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}