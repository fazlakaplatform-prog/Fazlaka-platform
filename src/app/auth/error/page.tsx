// src/app/auth/error/page.tsx
"use client"

import { useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/Language/LanguageProvider"

const translations = {
  ar: {
    error: "خطأ",
    verificationError: "خطأ في التحقق",
    invalidLink: "رابط التحقق غير صالح أو منتهي الصلاحية",
    serverError: "خطأ في الخادم",
    missingParams: "معلمات مفقودة",
    somethingWentWrong: "حدث خطأ ما",
    tryAgain: "حاول مرة أخرى",
    backToHome: "العودة إلى الصفحة الرئيسية",
    contactSupport: "تواصل مع الدعم",
    countdown: "سيتم إعادة التوجيه خلال {countdown} ثوانٍ",
  },
  en: {
    error: "Error",
    verificationError: "Verification Error",
    invalidLink: "Invalid or expired verification link",
    serverError: "Server Error",
    missingParams: "Missing Parameters",
    somethingWentWrong: "Something went wrong",
    tryAgain: "Try Again",
    backToHome: "Back to Home",
    contactSupport: "Contact Support",
    countdown: "You will be redirected in {countdown} seconds",
  }
}

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error') || 'unknown'
  const { language, isRTL } = useLanguage()
  const t = translations[language as keyof typeof translations]
  const [countdown, setCountdown] = useState(10)

  const getErrorMessage = (errorType: string) => {
    switch (errorType) {
      case 'invalid-or-expired-link':
        return t.invalidLink
      case 'server-error':
        return t.serverError
      case 'missing-params':
        return t.missingParams
      default:
        return t.somethingWentWrong
    }
  }

  useEffect(() => {
    // العد التنازلي للإعادة التلقائية
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer)
          window.location.href = '/'
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t.verificationError}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {getErrorMessage(error)}
          </p>
          
          <div className="mb-6">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.countdown.replace('{countdown}', countdown.toString())}
            </p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Home className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.backToHome}
            </Link>
            
            <Link
              href="/contact"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {t.contactSupport}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}