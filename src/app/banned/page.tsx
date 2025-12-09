// src/app/banned/page.tsx

"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useLanguage } from "../../components/Language/LanguageProvider";
import { 
  ArrowRightOnRectangleIcon, 
  EnvelopeIcon, 
  ExclamationTriangleIcon,
  LifebuoyIcon // أيقونة زر الدعم الجديد
} from "@heroicons/react/24/outline"; 

const translations = {
  ar: {
    title: "تم تعليق الحساب",
    description: "نأسف لإبلاغك بأنه تم حظر حسابك بشكل دائم بسبب انتهاك شروط الخدمة الخاصة بنا.",
    subDescription: "لا يمكنك استخدام ميزات الموقع أو التفاعل مع المحتوى في الوقت الحالي.",
    reviewMessage: "هل تعتقد أن هذا خطأ؟",
    links: {
      terms: "شروط الخدمة",
      privacy: "الخصوصية",
    },
    signOut: "تسجيل الخروج",
    contactBtn: "تواصل مع العدعم الفني ",
    supportBtn: "نواصل مباشر ", // النص الجديد
  },
  en: {
    title: "Account Suspended",
    description: "We regret to inform you that your account has been permanently suspended due to a violation of our Terms of Service.",
    subDescription: "You cannot use the site features or interact with content at this time.",
    reviewMessage: "Think this is a mistake?",
    links: {
      terms: "Terms of Service",
      privacy: "Privacy Policy",
    },
    signOut: "Sign Out",
    contactBtn: "Contact Administration",
    supportBtn: "Help Center", // النص الجديد
  }
};

export default function BannedPage() {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const router = useRouter();
  const t = translations[language];

  const handleSignOut = () => {
    signOut({ callbackUrl: "/sign-in" });
  };

  const userImage = session?.user?.image || "https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y";

  return (
    // تمت إضافة pt-32 هنا لعمل مسافة فارغة كبيرة في أول الصفحة
    <div className="relative flex min-h-screen w-full flex-col items-center justify-start overflow-hidden bg-gray-50 p-4 pt-32 dark:bg-gray-950">
      
      {/* --- الخلفية الجمالية (Blobs) --- */}
      <div className="absolute top-[-10%] left-[-10%] h-96 w-96 rounded-full bg-blue-400/30 blur-[100px] mix-blend-multiply dark:bg-blue-900/20"></div>
      <div className="absolute bottom-[-10%] right-[-10%] h-96 w-96 rounded-full bg-red-400/30 blur-[100px] mix-blend-multiply dark:bg-red-900/20"></div>
      <div className="absolute top-[40%] left-[40%] h-72 w-72 -translate-x-1/2 -translate-y-1/2 rounded-full bg-purple-400/20 blur-[80px] mix-blend-multiply dark:bg-purple-900/20"></div>

      {/* --- البطاقة الزجاجية --- */}
      <div className="relative z-10 w-full max-w-lg overflow-hidden rounded-3xl border border-white/40 bg-white/60 p-8 shadow-2xl backdrop-blur-xl transition-all dark:border-white/10 dark:bg-gray-900/60 dark:shadow-black/50">
        
        {/* قسم الصورة */}
        <div className="mb-6 flex flex-col items-center">
          <div className="relative mb-4">
            <div className="absolute -inset-1 rounded-full bg-gradient-to-tr from-red-500 to-orange-500 blur opacity-40"></div>
            <img 
              src={userImage} 
              alt="User" 
              className="relative h-28 w-28 rounded-full border-4 border-white object-cover shadow-lg dark:border-gray-800"
            />
            <div className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-red-100 ring-4 ring-white dark:bg-red-900 dark:ring-gray-800">
               <ExclamationTriangleIcon className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
          </div>

          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            {t.title}
          </h1>
          <p className="mt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
            {session?.user?.email}
          </p>
        </div>

        {/* النصوص */}
        <div className="text-center">
          <p className="mb-6 text-base leading-relaxed text-gray-600 dark:text-gray-300">
            {t.description}
          </p>
          
          <div className="mb-8 rounded-2xl bg-red-50/80 p-4 text-sm font-medium text-red-700 ring-1 ring-red-100 dark:bg-red-900/30 dark:text-red-300 dark:ring-red-900/50">
             {t.subDescription}
          </div>
        </div>

        {/* الأزرار */}
        <div className="space-y-3">
          {/* 1. زر التواصل (Primary) */}
          <button
            onClick={() => router.push('/support')}
            className="group relative flex w-full items-center justify-center overflow-hidden rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-blue-500/30 transition-all hover:scale-[1.02] hover:shadow-blue-500/50 active:scale-95"
          >
            <EnvelopeIcon className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            {t.contactBtn}
          </button>

          {/* 2. زر الدعم الجديد (Secondary) -> /support */}
          <button
            onClick={() => router.push('/contact')}
            className="flex w-full items-center justify-center rounded-xl bg-blue-50 px-6 py-3 text-sm font-bold text-blue-700 transition-all hover:bg-blue-100 active:scale-95 dark:bg-blue-900/20 dark:text-blue-300 dark:hover:bg-blue-900/40"
          >
            <LifebuoyIcon className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0" />
            {t.supportBtn}
          </button>

          {/* 3. زر الخروج (Outline) */}
          <button
            onClick={handleSignOut}
            className="flex w-full items-center justify-center rounded-xl border border-gray-200 bg-white/50 px-6 py-3 text-sm font-semibold text-gray-700 transition-all hover:bg-red-50 hover:text-red-600 hover:border-red-100 dark:border-gray-700 dark:bg-gray-800/50 dark:text-gray-300 dark:hover:bg-red-900/20 dark:hover:text-red-400"
          >
            <ArrowRightOnRectangleIcon className="mr-2 h-5 w-5 rtl:ml-2 rtl:mr-0 rtl:rotate-180" />
            {t.signOut}
          </button>
        </div>

        {/* الروابط السفلية */}
        <div className="mt-8 flex justify-center gap-6 border-t border-gray-200/50 pt-6 text-xs font-medium text-gray-500 dark:border-gray-700/50 dark:text-gray-400">
          <span className="text-gray-400">{t.reviewMessage}</span>
          <a href="/terms-conditions" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">{t.links.terms}</a>
          <a href="/privacy-policy" className="transition-colors hover:text-blue-600 dark:hover:text-blue-400">{t.links.privacy}</a>
        </div>

      </div>
    </div>
  );
}