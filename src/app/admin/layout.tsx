// app/admin/layout.tsx
'use client';

import { useLanguage } from '@/components/Language/LanguageProvider';
import AdminSidebar from './components/AdminSidebar';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isRTL } = useLanguage();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative font-sans">
      
      {/* القائمة الجانبية */}
      <AdminSidebar isRTL={isRTL} />

      {/* المحتوى الرئيسي */}
      {/* قللنا الـ padding-top قليلاً لأن الزر الجديد يطفو في المنتصف ولا يحتاج مساحة علوية كبيرة */}
      <main className={`transition-all duration-300 ease-in-out p-4 sm:p-8 lg:p-12`}>
        <div className="max-w-7xl mx-auto">
            {children}
        </div>
      </main>
      
    </div>
  );
}