// app/admin/components/AdminSidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  BarChart3,
  FileText, 
  Play, 
  Users, 
  Layers,
  ListVideo,
  HelpCircle,
  Shield,
  FileCheck,
  Activity,
  Settings,
  LogOut,
  X
} from 'lucide-react';
import { useLanguage } from '@/components/Language/LanguageProvider';

interface NavItem {
  title: string;
  titleEn: string;
  icon: React.ReactNode;
  link: string;
  count?: number;
  color: string;
}

interface AdminSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  isRTL: boolean;
}

export default function AdminSidebar({ isOpen, onClose, isRTL }: AdminSidebarProps) {
  const { language } = useLanguage();
  const pathname = usePathname();

  const navigationLinks: NavItem[] = [
    { title: 'لوحة التحكم', titleEn: 'Dashboard', icon: <BarChart3 size={20} />, link: '/admin', color: 'bg-indigo-500' },
    { title: 'المقالات', titleEn: 'Articles', icon: <FileText size={20} />, link: '/admin/articles', color: 'bg-blue-500' },
    { title: 'الحلقات', titleEn: 'Episodes', icon: <Play size={20} />, link: '/admin/episodes', color: 'bg-green-500' },
    { title: 'المواسم', titleEn: 'Seasons', icon: <Layers size={20} />, link: '/admin/seasons', color: 'bg-orange-500' },
    { title: 'قوائم التشغيل', titleEn: 'Playlists', icon: <ListVideo size={20} />, link: '/admin/playlists', color: 'bg-pink-500' },
    { title: 'أعضاء الفريق', titleEn: 'Team Members', icon: <Users size={20} />, link: '/admin/team', color: 'bg-purple-500' },
    { title: 'أسئلة الشائعة', titleEn: 'FAQs', icon: <HelpCircle size={20} />, link: '/admin/faqs', color: 'bg-cyan-500' },
    { title: 'الشروط والأحكام', titleEn: 'Terms & Conditions', icon: <FileCheck size={20} />, link: '/admin/terms', color: 'bg-red-500' },
    { title: 'سياسة الخصوصية', titleEn: 'Privacy Policy', icon: <Shield size={20} />, link: '/admin/privacy', color: 'bg-amber-500' },
    { title: 'التحليلات', titleEn: 'Analytics', icon: <Activity size={20} />, link: '/admin/analytics', color: 'bg-teal-500' },
    { title: 'الإعدادات', titleEn: 'Settings', icon: <Settings size={20} />, link: '/admin/settings', color: 'bg-gray-500' },
    { title: 'تسجيل الخروج', titleEn: 'Logout', icon: <LogOut size={20} />, link: '/admin/logout', color: 'bg-red-600' }
  ];

  return (
    // الناف بار الجانبي العائم
    <div
      className={`fixed top-0 ${isRTL ? 'right-0' : 'left-0'} z-50 h-screen w-64 bg-white dark:bg-gray-800 shadow-2xl transform ${
        isOpen ? 'translate-x-0' : isRTL ? 'translate-x-full' : '-translate-x-full'
      } transition-transform duration-300 ease-in-out`}
    >
      {/* رأس الناف بار مع زر الإغلاق */}
      <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">
          {language === 'ar' ? 'لوحة التحكم' : 'Admin Panel'}
        </h1>
        <button
          onClick={onClose}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
        >
          <X size={24} />
        </button>
      </div>
      
      {/* قائمة الروابط */}
      <nav className="mt-6 px-3 h-full pb-20 overflow-y-auto">
        <div className="space-y-1">
          {navigationLinks.map((link, index) => {
            const isActive = pathname === link.link;
            return (
              <Link
                key={index}
                href={link.link}
                onClick={onClose} // إغلاق القائمة عند اختيار رابط
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
              >
                <div className={`p-2 rounded-full ${link.color} bg-opacity-10 mr-3`}>
                  <div className={`${link.color.replace('bg-', 'text-')}`}>
                    {link.icon}
                  </div>
                </div>
                <span className="flex-1">
                  {language === 'ar' ? link.title : link.titleEn}
                </span>
                {link.count && link.count > 0 && (
                  <span className="px-2 py-0.5 text-xs font-bold text-white bg-blue-600 rounded-full">
                    {link.count}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}