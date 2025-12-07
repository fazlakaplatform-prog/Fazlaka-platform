"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { CheckCircle, AlertCircle } from "lucide-react"
import { signIn } from "next-auth/react"

// Translation object for all text content
const translations = {
  ar: {
    loading: "جاري تسجيل الدخول...",
    loginSuccess: "تم تسجيل الدخول بنجاح",
    loginFailed: "فشل تسجيل الدخول",
    redirecting: "سيتم توجيهك إلى الصفحة الرئيسية خلال لحظات...",
    errorOccurred: "حدث خطأ أثناء محاولة تسجيل الدخول.",
    goToHome: "الذهاب إلى الصفحة الرئيسية",
    backToLogin: "العودة إلى تسجيل الدخول",
    requestNewLink: "طلب رابط تسجيل دخول جديد",
    invalidLink: "رابط تسجيل الدخول غير صالح",
    signInError: "فشل تسجيل الدخول",
    verifyError: "فشل التحقق من الرابط السحري",
    genericError: "حدث خطأ. يرجى المحاولة مرة أخرى."
  },
  en: {
    loading: "Signing in...",
    loginSuccess: "Login successful",
    loginFailed: "Login failed",
    redirecting: "You will be redirected to home page in a moment...",
    errorOccurred: "An error occurred while trying to sign in.",
    goToHome: "Go to Home Page",
    backToLogin: "Back to Sign In",
    requestNewLink: "Request New Sign-in Link",
    invalidLink: "Invalid sign-in link",
    signInError: "Failed to sign in",
    verifyError: "Failed to verify magic link",
    genericError: "An error occurred. Please try again."
  }
}

export default function MagicLinkPage() {
  const [isLoading, setIsLoading] = useState(true)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState("")
  // Explicitly type language as 'ar' | 'en' to fix TypeScript error
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [isRTL, setIsRTL] = useState(true);
  const router = useRouter()
  const searchParams = useSearchParams()
  // Now TypeScript knows that language is a valid key for translations
  const t = translations[language]

  useEffect(() => {
    // Get saved language or default to Arabic
    const savedLanguage = localStorage.getItem('language') as 'ar' | 'en' || 'ar';
    setLanguage(savedLanguage);
    setIsRTL(savedLanguage === 'ar');
  }, []);

  // Memoize the verifyMagicLink function to prevent unnecessary re-renders
  const verifyMagicLink = useCallback(async (token: string) => {
    try {
      const response = await fetch(`/api/auth/verify-magic-link?token=${token}`)
      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        // Sign in using NextAuth
        const result = await signIn("credentials", {
          email: data.user.email,
          password: "", // Empty password because we're using magic link
          redirect: false,
        })

        if (result?.ok) {
          setTimeout(() => {
            router.push("/")
          }, 3000)
        } else {
          setError(t.signInError)
        }
      } else {
        setError(data.error || t.verifyError)
      }
    } catch (error) {
      setError(t.genericError)
    } finally {
      setIsLoading(false)
    }
  }, [router, t.signInError, t.verifyError, t.genericError])

  useEffect(() => {
    const token = searchParams.get("token")
    
    if (!token) {
      setError(t.invalidLink)
      setIsLoading(false)
      return
    }

    verifyMagicLink(token)
  }, [searchParams, t.invalidLink, verifyMagicLink])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md"
      >
        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-2xl p-8">
          <div className="text-center mb-8">
            {success ? (
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-8 h-8 text-green-600 dark:text-green-400" />
              </div>
            ) : (
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-8 h-8 text-red-600 dark:text-red-400" />
              </div>
            )}
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {success ? t.loginSuccess : t.loginFailed}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {success 
                ? t.redirecting
                : error || t.errorOccurred
              }
            </p>
          </div>

          <div className="space-y-3">
            {success ? (
              <Link
                href="/"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {t.goToHome}
              </Link>
            ) : (
              <>
                <Link
                  href="/sign-in"
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t.backToLogin}
                </Link>
                <Link
                  href="/sign-in"
                  className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                >
                  {t.requestNewLink}
                </Link>
              </>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}