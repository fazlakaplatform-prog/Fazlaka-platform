// src/components/Auth/WelcomeModal.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import { X, AlertTriangle, Lock } from "lucide-react";
import { useLanguage } from "@/components/Language/LanguageProvider";

export default function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [isBanned, setIsBanned] = useState(false);
  const { data: session, status } = useSession();
  const { language, isRTL } = useLanguage();

  // --- نصوص الترجمة ---
  const translations = {
    ar: {
      welcome: "أهلاً بك في",
      platformName: "فذلكه",
      subWelcome: "نورت المنصة يا",
      friend: "صديقي",
      description:
        "سعداء جداً بوجودك معنا. كل الأدوات والمصادر التعليمية جاهزة لتكمل رحلتك نحو التميز.",
      cta: "ابدأ التصفح",
      bannedTitle: "حساب محظور",
      bannedSubtitle: "عذراً، تم حظر حسابك",
      bannedDescription:
        "لقد تم حظر حسابك بسبب انتهاك شروط الاستخدام. إذا كنت تعتقد أن هذا حدث عن طريق الخطأ، يرجى التواصل معنا عبر البريد الإلكتروني.",
      bannedMessage: "تم حظر حسابك. يرجى التواصل مع الإدارة.",
    },
    en: {
      welcome: "Welcome to",
      platformName: "Fazlaka",
      subWelcome: "Good to see you,",
      friend: "Friend",
      description:
        "We are glad to have you back. All tools and resources are ready for you to continue your journey.",
      cta: "Start Browsing",
      bannedTitle: "Account Suspended",
      bannedSubtitle: "Sorry, your account has been suspended",
      bannedDescription:
        "Your account has been suspended due to violation of our terms of service. If you believe this was done by mistake, please contact us via email.",
      bannedMessage: "Your account has been suspended. Please contact the administration.",
    },
  };

  const t = translations[language] ?? translations.en;

  // Helper: compute stable user key (prefer id if موجود)
  const getUserKey = () =>
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (session?.user as any)?.id || session?.user?.email || session?.user?.name || "anonymous-user";

  // --- المنطق البرمجي للتحقق من الجلسة والحالة ---
  useEffect(() => {
    // لو المستخدم خرج، نمسح علامات الـ localStorage عشان لما يرجع تظهر الرسائل من جديد
    if (status === "unauthenticated") {
      try {
        localStorage.removeItem("seenWelcomeFor");
        localStorage.removeItem("seenBannedFor");
      } catch {
        // تجاهل الأخطاء
      }
      setIsOpen(false);
      setIsBanned(false);
      return;
    }

    if (status !== "authenticated") return;

    let timer: ReturnType<typeof setTimeout> | null = null;

    const checkUserStatus = async () => {
      // تأكد إننا في بيئة المتصفح
      if (typeof window === "undefined") return;

      const userKey = getUserKey();

      try {
        const response = await fetch("/api/user/me");
        if (response.ok) {
          const userData = await response.json();

          if (userData.banned) {
            // لو محظور: نتحقق من localStorage الخاص بالحظر
            try {
              const seenBannedFor = localStorage.getItem("seenBannedFor");
              if (seenBannedFor !== userKey) {
                // **هنا التغيير المهم**: نكتب العلم فوراً عند العرض
                // عشان لو المستخدم عمل ريفرش قبل الإغلاق ما تظهرش مرة تانية.
                try {
                  localStorage.setItem("seenBannedFor", userKey);
                } catch {
                  // تجاهل أخطاء التخزين
                }

                timer = setTimeout(() => {
                  setIsBanned(true);
                  setIsOpen(true);
                }, 500);
              } else {
                // تم مشاهدتها سابقاً => لا نعيد الفتح
                setIsBanned(true);
                setIsOpen(false);
              }
            } catch (err) {
              // لو فيه مشكلة في localStorage، نعرضها مرة واحدة كحل احتياطي
              setIsBanned(true);
              setIsOpen(true);
            }
            return;
          }
        }
      } catch (error) {
        console.error("Error checking user status:", error);
        // لو فشل الطلب إلى /api/user/me، نكمل لمنطق الترحيب (لا نكسر التجربة)
      }

      // لو المستخدم مش محظور، نطبق منطق الترحيب (مره واحدة لكل تسجيل دخول)
      try {
        const seenFor = localStorage.getItem("seenWelcomeFor");
        if (seenFor !== userKey) {
          // عرض الترحيب (لن نخزن العلامة هنا — سنخزنها عند إغلاق النافذة في handleClose)
          timer = setTimeout(() => {
            setIsBanned(false);
            setIsOpen(true);
          }, 1000);
        } else {
          setIsBanned(false);
          setIsOpen(false);
        }
      } catch {
        // لو فشل قراءة localStorage نعرض الترحيب على الأقل مرة
        setIsBanned(false);
        setIsOpen(true);
      }
    };

    checkUserStatus();

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [status, session]);

  const handleClose = () => {
    // عند غلق النافذة نكتب الـ flag المناسب (حظر أم ترحيب)
    try {
      const userKey = getUserKey();

      if (isBanned) {
        // fallback — غالباً سيكون موجود بالفعل لأننا نخزن عند العرض، لكن نحتاط
        localStorage.setItem("seenBannedFor", userKey);
      } else {
        // للترحيب نخزن هنا عند الإغلاق (نعتبرها مشاهدة فعلية)
        localStorage.setItem("seenWelcomeFor", userKey);
      }
    } catch {
      // تجاهل أخطاء التخزين
    }

    setIsOpen(false);
    // لو حبيت ترجّع حالة isBanned بعد الإغلاق:
    // setTimeout(() => setIsBanned(false), 200);
  };

  // --- عناصر الخلفية المتحركة ---
  const FloatingShape = ({ delay, className }: { delay: number; className: string }) => (
    <motion.div
      initial={{ y: 0, opacity: 0 }}
      animate={{
        y: [0, -20, 0],
        opacity: [0.3, 0.6, 0.3],
        rotate: [0, 10, -10, 0],
      }}
      transition={{
        duration: 5,
        repeat: Infinity,
        delay: delay,
        ease: "easeInOut",
      }}
      className={`absolute rounded-full blur-xl ${className}`}
    />
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 font-sans" dir={isRTL ? "rtl" : "ltr"}>
          {/* طبقة الخلفية المعتمة */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={handleClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />

          {/* النافذة المنبثقة */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 30 }}
            transition={{ type: "spring", duration: 0.6, bounce: 0.3 }}
            className="relative w-full max-w-md overflow-hidden rounded-[2rem] border border-white/10 bg-[#0f0f13] shadow-2xl"
          >
            {/* خلفيات وأشكال */}
            <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-full h-32 ${isBanned ? "bg-red-600/20" : "bg-indigo-600/20"} blur-[60px]`} />

            {/* أشكال طافية */}
            <FloatingShape delay={0} className={`top-10 left-10 w-16 h-16 ${isBanned ? "bg-red-500/20" : "bg-purple-500/20"}`} />
            <FloatingShape delay={1} className="bottom-20 right-10 w-24 h-24 bg-blue-500/10" />
            <FloatingShape delay={2} className="top-1/2 left-1/2 w-12 h-12 bg-yellow-500/10" />

            {/* زر الإغلاق */}
            <button
              onClick={handleClose}
              className={`absolute top-4 z-20 p-2 text-white/40 transition-colors rounded-full hover:bg-white/10 hover:text-white ${isRTL ? "left-4" : "right-4"}`}
            >
              <X className="w-5 h-5" />
            </button>

            <div className="relative z-10 flex flex-col items-center px-6 py-10 text-center sm:px-8">
              {/* المنطقة العلوية: الأيقونة */}
              <div className="mb-6 relative">
                {/* تأثير توهج خلف الأيقونة */}
                <div className={`absolute inset-0 ${isBanned ? "bg-gradient-to-tr from-red-500 to-orange-500" : "bg-gradient-to-tr from-indigo-500 to-purple-500"} rounded-full blur-lg opacity-40 animate-pulse`} />

                <motion.div
                  initial={{ scale: 0, rotate: -10 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", duration: 0.5 }}
                  className={`relative w-20 h-20 p-1 ${isBanned ? "bg-gradient-to-tr from-red-500/20 to-orange-500/20" : "bg-gradient-to-tr from-white/20 to-white/5"} rounded-full ring-1 ring-white/20 backdrop-blur-md flex items-center justify-center`}
                >
                  {isBanned ? (
                    <Lock className="w-10 h-10 text-red-400" />
                  ) : session?.user?.image ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={session.user.image} alt="User" className="w-full h-full object-cover rounded-full" />
                  ) : (
                    <div className="flex items-center justify-center w-full h-full">
                      <AlertTriangle className="w-10 h-10 text-yellow-400" />
                    </div>
                  )}
                </motion.div>
              </div>

              {/* النصوص */}
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="space-y-3">
                <h2 className={`text-3xl font-bold ${isBanned ? "text-red-400" : "text-white"}`}>
                  {isBanned ? t.bannedTitle : (
                    <>
                      {t.welcome}{" "}
                      <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">{t.platformName}</span>
                    </>
                  )}
                </h2>

                <div className="flex flex-wrap items-center justify-center gap-x-2 text-lg font-medium text-gray-200">
                  <span>{isBanned ? t.bannedSubtitle : t.subWelcome}</span>
                  {!isBanned && (
                    <span className="text-indigo-300 font-bold dir-ltr">{session?.user?.name?.split(" ")[0] || t.friend}</span>
                  )}
                </div>
              </motion.div>

              {/* الوصف */}
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="mt-4 mb-8 text-sm leading-relaxed text-gray-400 max-w-[90%]">
                {isBanned ? t.bannedDescription : t.description}
              </motion.p>

              {/* زر الإجراء */}
              <motion.button
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  handleClose();
                }}
                className={`group relative w-full overflow-hidden rounded-xl p-[1px] shadow-lg transition-all ${isBanned ? "hover:shadow-red-500/20" : "hover:shadow-indigo-500/20"}`}
              >
                <div className={`absolute inset-0 ${isBanned ? "bg-gradient-to-r from-red-600 via-orange-600 to-red-600" : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600"} opacity-100`} />
                <div className="relative flex items-center justify-center w-full px-6 py-3.5 bg-black/20 backdrop-blur-sm rounded-xl transition-all group-hover:bg-transparent">
                  <span className="font-bold text-white mx-2">{isBanned ? "إغلاق" : t.cta}</span>
                  {isBanned ? null : (
                    isRTL ? (
                      <svg className="w-5 h-5 text-white transition-transform group-hover:-translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                      </svg>
                    ) : (
                      <svg className="w-5 h-5 text-white transition-transform group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    )
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
