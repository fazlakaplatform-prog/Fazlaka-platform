// src/app/verify-email-link/page.tsx
"use client"

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { CheckCircle, AlertTriangle, Loader2, Mail, RefreshCw, Home } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/Language/LanguageProvider"

const translations = {
  ar: {
    verifying: "جاري التحقق من الرابط...",
    verifyingEmail: "التحقق من البريد الإلكتروني",
    verificationSuccess: "تم التحقق بنجاح",
    verificationFailed: "فشل التحقق",
    invalidLink: "رابط التحقق غير صالح أو منتهي الصلاحية",
    primaryEmailVerified: "تم التحقق من بريدك الإلكتروني الأساسي بنجاح",
    secondaryEmailVerified: "تم التحقق من بريدك الإلكتروني الثانوي بنجاح",
    email: "البريد الإلكتروني",
    type: "النوع",
    primary: "أساسي",
    secondary: "ثانوي",
    backToHome: "العودة إلى الصفحة الرئيسية",
    backToSignIn: "العودة إلى تسجيل الدخول",
    redirectingIn: "سيتم إعادة التوجيه خلال {countdown} ثوانٍ",
    tryAgain: "حاول مرة أخرى",
    contactSupport: "تواصل مع الدعم",
    errorOccurred: "حدث خطأ ما",
    verificationComplete: "اكتمل التحقق بنجاح",
    nowYouCan: "الآن يمكنك",
    signInToAccount: "تسجيل الدخول إلى حسابك",
    useAllFeatures: "استخدام جميع ميزات المنصة",
    manageEmails: "إدارة رسائلك وإشعاراتك",
  },
  en: {
    verifying: "Verifying link...",
    verifyingEmail: "Email Verification",
    verificationSuccess: "Verification Successful",
    verificationFailed: "Verification Failed",
    invalidLink: "Invalid or expired verification link",
    primaryEmailVerified: "Your primary email has been verified successfully",
    secondaryEmailVerified: "Your secondary email has been verified successfully",
    email: "Email",
    type: "Type",
    primary: "Primary",
    secondary: "Secondary",
    backToHome: "Back to Home",
    backToSignIn: "Back to Sign In",
    redirectingIn: "You will be redirected in {countdown} seconds",
    tryAgain: "Try Again",
    contactSupport: "Contact Support",
    errorOccurred: "An error occurred",
    verificationComplete: "Verification completed successfully",
    nowYouCan: "Now you can",
    signInToAccount: "sign in to your account",
    useAllFeatures: "use all platform features",
    manageEmails: "manage your emails and notifications",
  }
}

export default function VerifyEmailLinkPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const { language, isRTL } = useLanguage()
  const t = translations[language as keyof typeof translations]
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')
  const [message, setMessage] = useState('')
  const [email, setEmail] = useState('')
  const [type, setType] = useState<'primary' | 'secondary'>('primary')
  const [countdown, setCountdown] = useState(10)
  const [redirectUrl, setRedirectUrl] = useState('')

  useEffect(() => {
    const token = searchParams.get('token')
    const emailParam = searchParams.get('email')
    const typeParam = searchParams.get('type') as 'primary' | 'secondary' || 'primary'

    if (!token || !emailParam) {
      setStatus('error')
      setMessage(t.invalidLink)
      return
    }

    setEmail(emailParam)
    setType(typeParam)

    // Verify the link
    verifyEmailLink(token, emailParam, typeParam)
  }, [searchParams])

  useEffect(() => {
    if (status === 'success') {
      // Set redirect URL based on type
      if (type === 'primary') {
        setRedirectUrl('/sign-in')
      } else {
        setRedirectUrl('/dashboard/profile')
      }

      // Start countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer)
            router.push(redirectUrl)
            return 0
          }
          return prev - 1
        })
      }, 1000)

      return () => clearInterval(timer)
    }
  }, [status, type, router, redirectUrl])

  const verifyEmailLink = async (token: string, email: string, type: 'primary' | 'secondary') => {
    try {
      const response = await fetch('/api/auth/verify-email-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          token,
          email,
          type
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setStatus('success')
        setMessage(type === 'primary' ? t.primaryEmailVerified : t.secondaryEmailVerified)
      } else {
        setStatus('error')
        setMessage(data.error || t.invalidLink)
      }
    } catch (error) {
      console.error('Error verifying email link:', error)
      setStatus('error')
      setMessage(t.errorOccurred)
    }
  }

  const handleTryAgain = () => {
    router.push('/sign-in')
  }

  if (status === 'loading') {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 dark:bg-blue-900 mb-4">
            <Loader2 className="h-8 w-8 text-blue-600 dark:text-blue-400 animate-spin" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t.verifying}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {t.verifyingEmail}...
          </p>
        </div>
      </div>
    )
  }

  if (status === 'error') {
    return (
      <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
        <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
          <div className="text-center">
            <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900 mb-4">
              <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t.verificationFailed}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {message}
            </p>
            <div className="flex flex-col space-y-3">
              <button
                onClick={handleTryAgain}
                className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <RefreshCw className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.tryAgain}
              </button>
              <Link
                href="/"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
              >
                <Home className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
                {t.backToHome}
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8">
        <div className="text-center">
          <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-green-100 dark:bg-green-900 mb-4">
            <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {t.verificationSuccess}
          </h1>
          
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            {message}
          </p>
          
          <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-4 mb-6">
            <div className="space-y-2">
              <div className="flex items-center justify-center">
                <Mail className="h-4 w-4 text-gray-500 ml-2" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t.email}: {email}
                </span>
              </div>
              <div className="flex items-center justify-center">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t.type}: {type === 'primary' ? t.primary : t.secondary}
                </span>
              </div>
            </div>
          </div>
          
          <div className="mb-6">
            <p className="text-gray-600 dark:text-gray-400">
              {t.nowYouCan} {type === 'primary' ? t.signInToAccount : t.useAllFeatures}
            </p>
          </div>
          
          <div className="mb-4">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {t.redirectingIn.replace('{countdown}', countdown.toString())}
            </p>
          </div>
          
          <div className="flex flex-col space-y-3">
            <Link
              href={redirectUrl}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              {type === 'primary' ? t.backToSignIn : 'backToProfile'}
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <Home className={`h-4 w-4 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t.backToHome}
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}