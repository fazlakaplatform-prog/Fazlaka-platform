"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { Mail, ArrowRight, CheckCircle, AlertCircle } from "lucide-react"

export default function ResendVerificationPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [language, setLanguage] = useState<'ar' | 'en'>('ar')
  const [isRTL, setIsRTL] = useState(true)
  const [stars, setStars] = useState<{x: number, y: number, size: number, opacity: number}[]>([])
  
  const router = useRouter()

  // Translation object
  const translations = {
    ar: {
      title: "إعادة إرسال بريد التحقق",
      subtitle: "أدخل بريدك الإلكتروني لإعادة إرسال رابط التحقق",
      emailField: "البريد الإلكتروني",
      sendButton: "إرسال رابط التحقق",
      sending: "جاري الإرسال...",
      success: "تم إرسال رابط التحقق بنجاح",
      successMessage: "تم إرسال رابط التحقق إلى بريدك الإلكتروني. يرجى التحقق من بريدك الوارد.",
      error: "حدث خطأ",
      goToLogin: "العودة إلى تسجيل الدخول",
      platformName: "فذلكه",
      enterEmail: "الرجاء إدخال البريد الإلكتروني",
      invalidEmail: "البريد الإلكتروني غير صالح",
      placeholder: "example@email.com"
    },
    en: {
      title: "Resend Verification Email",
      subtitle: "Enter your email to resend the verification link",
      emailField: "Email Address",
      sendButton: "Send Verification Link",
      sending: "Sending...",
      success: "Verification link sent successfully",
      successMessage: "The verification link has been sent to your email. Please check your inbox.",
      error: "An error occurred",
      goToLogin: "Back to Login",
      platformName: "Fazlaka",
      enterEmail: "Please enter your email",
      invalidEmail: "Invalid email address",
      placeholder: "example@email.com"
    }
  };
  
  const t = translations[language];

  useEffect(() => {
    // Check for saved language preference
    const savedLanguage = localStorage.getItem('language') as 'ar' | 'en' | null;
    if (savedLanguage && (savedLanguage === 'ar' || savedLanguage === 'en')) {
      setLanguage(savedLanguage);
      setIsRTL(savedLanguage === 'ar');
    } else {
      // Use browser language as fallback
      const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || '';
      const shouldBeRTL = browserLang.includes('ar');
      setLanguage(shouldBeRTL ? 'ar' : 'en');
      setIsRTL(shouldBeRTL);
    }
    
    // Listen for language changes
    const handleLanguageChange = () => {
      const currentLanguage = localStorage.getItem('language') as 'ar' | 'en' | null;
      if (currentLanguage && (currentLanguage === 'ar' || currentLanguage === 'en')) {
        setLanguage(currentLanguage);
        setIsRTL(currentLanguage === 'ar');
      }
    };
    
    window.addEventListener('storage', handleLanguageChange);
    
    // Also check for local changes
    const checkLanguageInterval = setInterval(() => {
      const currentLanguage = localStorage.getItem('language') as 'ar' | 'en' | null;
      if (currentLanguage && (currentLanguage === 'ar' || currentLanguage === 'en')) {
        const shouldBeRTL = currentLanguage === 'ar';
        if (shouldBeRTL !== isRTL) {
          setLanguage(currentLanguage);
          setIsRTL(shouldBeRTL);
        }
      }
    }, 500);
    
    // Generate random stars for space background
    const generatedStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2
    }))
    setStars(generatedStars)
    
    return () => {
      window.removeEventListener('storage', handleLanguageChange);
      clearInterval(checkLanguageInterval);
    };
  }, [isRTL]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!email) {
      setError(t.enterEmail)
      return
    }
    
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      setError(t.invalidEmail)
      return
    }
    
    setIsLoading(true)
    setError("")
    setSuccess("")

    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t.successMessage)
        setEmail("")
      } else {
        setError(data.error || t.error)
      }
    } catch (error) {
      setError(t.error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Space Background */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-900/20 via-purple-900/10 to-transparent"></div>
        {stars.map((star, index) => (
          <div
            key={index}
            className="absolute rounded-full bg-white"
            style={{
              left: `${star.x}%`,
              top: `${star.y}%`,
              width: `${star.size}px`,
              height: `${star.size}px`,
              opacity: star.opacity,
              boxShadow: `0 0 ${star.size * 2}px rgba(255, 255, 255, ${star.opacity})`
            }}
          />
        ))}
        <motion.div
          className="absolute top-20 left-10 w-32 h-32 rounded-full bg-purple-500/10 blur-xl"
          animate={{
            x: [0, 30, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 10,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute top-40 right-20 w-40 h-40 rounded-full bg-blue-500/10 blur-xl"
          animate={{
            x: [0, -20, 0],
            y: [0, 30, 0],
          }}
          transition={{
            duration: 12,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
      
      <div className="w-full max-w-md mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-3xl shadow-2xl dark:shadow-blue-500/20 border border-white/20 dark:border-gray-700/50 p-8"
        >
          {/* Header */}
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg"
            >
              <Mail className="w-10 h-10 text-white" />
            </motion.div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              {t.title}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t.subtitle}
            </p>
          </div>

          {/* Messages */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center space-x-reverse space-x-3"
            >
              <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
              <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
            </motion.div>
          )}

          {success && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center space-x-reverse space-x-3"
            >
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
              <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
            </motion.div>
          )}

          {/* Form */}
          {!success ? (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.emailField}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                    <Mail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={`appearance-none block w-full ${isRTL ? 'pl-10 pr-4' : 'pr-10 pl-4'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300`}
                    placeholder={t.placeholder}
                  />
                </div>
              </div>

              <motion.button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {isLoading ? (
                  <div className="flex items-center space-x-reverse space-x-2">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{t.sending}</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-reverse space-x-2">
                    <span>{t.sendButton}</span>
                    <ArrowRight className="w-4 h-4" />
                  </div>
                )}
              </motion.button>
            </form>
          ) : (
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4 shadow-lg"
              >
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </motion.div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
                {t.success}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {t.successMessage}
              </p>
              <motion.button
                onClick={() => router.push("/sign-in")}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{t.goToLogin}</span>
              </motion.button>
            </div>
          )}

          {/* Back to Login */}
          {!success && (
            <div className="mt-6 text-center">
              <button
                onClick={() => router.push("/sign-in")}
                className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
              >
                {t.goToLogin}
              </button>
            </div>
          )}
        </motion.div>
        
        {/* Floating Elements */}
        <motion.div
          className="absolute -top-10 -right-10 w-20 h-20 bg-blue-200 dark:bg-blue-800 rounded-full opacity-30 blur-xl"
          animate={{
            x: [0, 20, 0],
            y: [0, 20, 0],
          }}
          transition={{
            duration: 5,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
        <motion.div
          className="absolute -bottom-10 -left-10 w-20 h-20 bg-purple-200 dark:bg-purple-800 rounded-full opacity-30 blur-xl"
          animate={{
            x: [0, -20, 0],
            y: [0, -20, 0],
          }}
          transition={{
            duration: 7,
            repeat: Infinity,
            repeatType: "reverse"
          }}
        />
      </div>
    </div>
  )
}