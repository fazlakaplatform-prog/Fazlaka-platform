// src/app/auth/verification-success/page.tsx
"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { CheckCircle, Mail, ArrowLeft } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/Language/LanguageProvider"

const translations = {
  ar: {
    title: "تم التحقق بنجاح",
    primaryEmailVerified: "تم التحقق من بريدك الإلكتروني الأساسي بنجاح",
    secondaryEmailVerified: "تم التحقق من بريدك الإلكتروني الثانوي بنجاح",
    email: "البريد الإلكتروني",
    backToSignIn: "العودة إلى تسجيل الدخول",
    backToProfile: "العودة إلى الملف الشخصي",
    nowYouCan: "الآن يمكنك",
    signIn: "تسجيل الدخول",
    useFeatures: "استخدام جميع ميزات المنصة",
    manageEmails: "إدارة رسائلك وإشعاراتك",
  },
  en: {
    title: "Verification Successful",
    primaryEmailVerified: "Your primary email has been verified successfully",
    secondaryEmailVerified: "Your secondary email has been verified successfully",
    email: "Email",
    backToSignIn: "Back to Sign In",
    backToProfile: "Back to Profile",
    nowYouCan: "Now you can",
    signIn: "sign in",
    useFeatures: "use all platform features",
    manageEmails: "manage your emails and notifications",
  }
}

export default function VerificationSuccessPage() {
  const searchParams = useSearchParams()
  const type = searchParams.get('type') || 'primary'
  const email = searchParams.get('email') || ''
  const { language, isRTL } = useLanguage()
  const t = translations[language as keyof typeof translations]
  const [countdown, setCountdown] = useState(10)
  const [redirectUrl, setRedirectUrl] = useState('')

  useEffect(() => {
    // تحديد رابط إعادة التوجيه بناءً على نوع التحقق
    if (type === 'primary') {
      setRedirectUrl('/sign-in')
    } else {
      setRedirectUrl('/dashboard/profile')
    }

    // العد التنازلي للإعادة التلقائية
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = redirectUrl
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [type, redirectUrl])

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t.title}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {type === 'primary' ? t.primaryEmailVerified : t.secondaryEmailVerified}
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center">
              <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400 ml-2" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t.email}: {email}
              </span>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              {t.nowYouCan} {type === 'primary' ? t.signIn : t.useFeatures}
            </p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {language === 'ar' ? `سيتم إعادة التوجيه تلقائياً خلال ${countdown} ثوانٍ` : `You will be redirected automatically in ${countdown} seconds`}
            </p>
          </div>
          
          <Link
            href={redirectUrl}
            className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <ArrowLeft className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
            {type === 'primary' ? t.backToSignIn : t.backToProfile}
          </Link>
        </div>
      </div>
    </div>
  )
}