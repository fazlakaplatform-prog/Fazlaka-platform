// src/components/Auth/WelcomeModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { X, ArrowRight, ArrowLeft, Sparkles, PartyPopper } from "lucide-react";
import { useLanguage } from "@/components/Language/LanguageProvider";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: session, status } = useSession();
  const { language, isRTL } = useLanguage();

  // --- نصوص الترجمة ---
  const translations = {
    ar: {
      welcome: "أهلاً بك في",
      platformName: "فذلكه",
      subWelcome: "نورت المنصة يا",
      friend: "صديقي",
      description: "سعداء جداً بوجودك معنا. كل الأدوات والمصادر التعليمية جاهزة لتكمل رحلتك نحو التميز.",
      cta: "ابدأ التصفح",
    },
    en: {
      welcome: "Welcome to",
      platformName: "Fazlaka",
      subWelcome: "Good to see you,",
      friend: "Friend",
      description: "We are glad to have you back. All tools and resources are ready for you to continue your journey.",
      cta: "Start Browsing",
    },
  };

  const t = translations[language];

  // --- المنطق البرمجي للتحقق من الجلسة ---
  useEffect(() => {
    if (status === "unauthenticated") {
      try {
        localStorage.removeItem("seenWelcomeFor");
      } catch {
        // تم تجاهل الخطأ عمداً
      }
      setIsOpen(false);
      return;
    }

    if (status !== "authenticated") return;

    // تم التعديل هنا لتجنب خطأ Linter
    // استخدام (session.user as any) يسمح بالوصول لـ id دون الحاجة لـ ts-ignore
    const userKey =
      session?.user?.email ||
      session?.user?.name ||
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (session?.user as any)?.id ||
      "anonymous-user";

    try {
      const seenFor = localStorage.getItem("seenWelcomeFor");
      if (seenFor !== userKey) {
        const timer = setTimeout(() => {
          setIsOpen(true);
          try {
            localStorage.setItem("seenWelcomeFor", userKey);
          } catch {
            // تم تجاهل الخطأ عمداً
          }
        }, 1000);
        return () => clearTimeout(timer);
      }
    } catch {
      setIsOpen(true);
    }
  }, [status, session]);

  const handleClose = () => {
    setIsOpen(false);
  };

  // --- عناصر الخلفية المتحركة (احتفال بسيط) ---
  const FloatingShape = ({ delay, className }: { delay: number; className: string }) => (
    <motion.div
      initial={{ y: 0, opacity: 0 }}
      animate={{ 
        y: [0, -20, 0], 
        opacity: [0.3, 0.6, 0.3],
        rotate: [0, 10, -10, 0]
      }}
      transition={{ 
        duration: 5, 
        repeat: Infinity, 
        delay: delay,
        ease: "easeInOut" 
      }}
      className={`absolute rounded-full blur-xl ${className}`}
    />
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div 
          className="fixed inset-0 z-[999] flex items-center justify-center p-4 font-sans"
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* طبقة الخلفية المعتمة */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* النافذة المنبثقة */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f0f13] shadow-2xl"
          >
            {/* خلفيات وأشكال احتفالية ناعمة */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 bg-indigo-600/20 blur-[60px]" />
            
            {/* أشكال طافية (احتفال بسيط) */}
            <FloatingShape delay={0} className="top-10 left-10 w-16 h-16 bg-purple-500/20" />
            <FloatingShape delay={1} className="bottom-20 right-10 w-24 h-24 bg-blue-500/10" />
            <FloatingShape delay={2} className="top-1/2 left-1/2 w-12 h-12 bg-yellow-500/10" />

            {/* زر الإغلاق */}
            <button
              onClick={handleClose}
              className={`absolute top-4 z-20 p-2 text-white/40 transition-colors rounded-full hover:bg-white/10 hover:text-white ${isRTL ? 'left-4' : 'right-4'}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex flex-col items-center px-6 py-10 text-center sm:px-8">
              
              {/* المنطقة العلوية: الصورة أو الأيقونة */}
              <div className="mb-6 relative">
                {/* تأثير توهج خلف الصورة */}
                <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500 to-purple-500 rounded-full blur-lg opacity-40 animate-pulse" />
                
                {session?.user?.image ? (
                  // حالة وجود صورة مستخدم
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", duration: 0.5 }}
                    className="relative w-20 h-20 p-1 bg-gradient-to-tr from-white/20 to-white/5 rounded-full ring-1 ring-white/20 backdrop-blur-md"
                  >
                     {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={session.user.image}
                      alt="User"
                      className="w-full h-full object-cover rounded-full"
                    />
                    {/* أيقونة احتفال صغيرة على زاوية الصورة */}
                    <div className="absolute -bottom-1 -right-1 bg-[#0f0f13] rounded-full p-1 border border-white/10">
                        <Sparkles className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                    </div>
                  </motion.div>
                ) : (
                  // حالة عدم وجود صورة (عرض أيقونة)
                  <motion.div
                    initial={{ scale: 0, y: -20 }}
                    animate={{ scale: 1, y: 0 }}
                    className="relative flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/25"
                  >
                    <PartyPopper className="w-10 h-10 text-white" />
                  </motion.div>
                )}
              </div>

              {/* النصوص */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-3"
              >
                <h2 className="text-3xl font-bold text-white">
                  {t.welcome} <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{t.platformName}</span>
                </h2>
                
                <div className="flex flex-wrap items-center justify-center gap-x-2 text-lg font-medium text-gray-200">
                  <span>{t.subWelcome}</span>
                  <span className="text-indigo-300 font-bold dir-ltr">
                     {/* فرض اتجاه الاسم LTR لضمان عدم تداخل الحروف الإنجليزية مع العربية بشكل خاطئ */}
                    {session?.user?.name?.split(" ")[0] || t.friend}
                  </span>
                  <Sparkles className="w-5 h-5 text-yellow-400 animate-pulse" />
                </div>
              </motion.div>

              {/* الوصف */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="mt-4 mb-8 text-sm leading-relaxed text-gray-400 max-w-[90%]"
              >
                {t.description}
              </motion.p>

              {/* زر الإجراء */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClose}
                className="group relative w-full overflow-hidden rounded-xl bg-white p-[1px] shadow-lg transition-all hover:shadow-indigo-500/20"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 opacity-100" />
                <div className="relative flex items-center justify-center w-full px-6 py-3.5 bg-black/20 backdrop-blur-sm rounded-xl transition-all group-hover:bg-transparent">
                  <span className="font-bold text-white mx-2">
                    {t.cta}
                  </span>
                  {/* تغيير اتجاه السهم بناءً على اللغة */}
                  {isRTL ? (
                    <ArrowLeft className="w-5 h-5 text-white transition-transform group-hover:-translate-x-1" />
                  ) : (
                    <ArrowRight className="w-5 h-5 text-white transition-transform group-hover:translate-x-1" />
                  )}
                </div>
              </motion.button>

            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}