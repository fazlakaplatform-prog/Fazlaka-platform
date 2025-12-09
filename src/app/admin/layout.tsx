// app/admin/layout.tsx
'use client';

import { useState } from 'react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import AdminSidebar from './components/AdminSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { language, isRTL } = useLanguage();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 relative">
      {/* طبقة التعتيم (Overlay) عند فتح القائمة */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-50 transition-opacity"
          onClick={() => setSidebarOpen(false)}
        ></div>
      )}

      {/* مكون الناف بار الجانبي */}
      <AdminSidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)} 
        isRTL={isRTL} 
      />

      {/* المحتوى الرئيسي */}
      <main className="transition-all duration-300 ease-in-out">
        {/* زر فتح القائمة الجانبية (السهم) */}
        <button
          onClick={() => setSidebarOpen(true)}
          className={`fixed top-1/2 -translate-y-1/2 z-30 p-3 bg-blue-600 text-white rounded-r-lg shadow-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-all duration-300 ${
            isRTL ? 'right-0 rounded-l-lg rounded-r-none' : 'left-0'
          }`}
        >
          {isRTL ? <ChevronLeft size={24} /> : <ChevronRight size={24} />}
        </button>

        {/* محتوى الصفحة */}
        <div className="p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}