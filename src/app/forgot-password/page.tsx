// src/app/forgot-password/page.tsx
"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, Shield, Key, CheckCircle, AlertCircle, Lock, Eye, EyeOff, ArrowRight } from "lucide-react"
import { Facebook, Instagram, Youtube, Users, BookOpen } from "lucide-react"
import { FaTiktok, FaXTwitter } from "react-icons/fa6"

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [showOtpSent, setShowOtpSent] = useState(false)
  const [resetMethod, setResetMethod] = useState("link")
  const [isVisible, setIsVisible] = useState(false)
  const [isRTL, setIsRTL] = useState(true)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isOtpFocused, setIsOtpFocused] = useState(false)
  const [primaryEmail, setPrimaryEmail] = useState("")
  
  const router = useRouter()

  // تهيئة الصفحة والتحقق من اللغة
  useEffect(() => {
    setIsVisible(true)
    
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
      const shouldBeRTL = savedLanguage === 'ar';
      setIsRTL(shouldBeRTL);
    } else {
      const browserLang = navigator.language || (navigator.languages && navigator.languages[0]) || '';
      const shouldBeRTL = browserLang.includes('ar');
      setIsRTL(shouldBeRTL);
    }
    
    const handleLanguageChange = () => {
      const currentLanguage = localStorage.getItem('language');
      if (currentLanguage !== null) {
        const shouldBeRTL = currentLanguage === 'ar';
        setIsRTL(shouldBeRTL);
      }
    };
    
    window.addEventListener('storage', handleLanguageChange);
    
    const checkLanguageInterval = setInterval(() => {
      const currentLanguage = localStorage.getItem('language');
      if (currentLanguage !== null) {
        const shouldBeRTL = currentLanguage === 'ar';
        if (shouldBeRTL !== isRTL) {
          setIsRTL(shouldBeRTL);
        }
      }
    }, 500);
    
    return () => {
      window.removeEventListener('storage', handleLanguageChange);
      clearInterval(checkLanguageInterval);
    };
  }, [isRTL]);

  const texts = {
    ar: {
      title: "نسيت كلمة المرور",
      subtitle: "اختر طريقة استعادة كلمة المرور",
      featuresTitle: "مميزات منصتنا",
      educationalContent: "محتوى تعليمي",
      educationalContentDesc: "دروس شاملة في مختلف المجالات العلمية",
      interactiveCommunity: "مجتمع تفاعلي",
      interactiveCommunityDesc: "تواصل مع زملائك وشارك المعرفة",
      followUs: "تابعنا على",
      whyChooseUs: "لماذا تختار منصتنا؟",
      reliableContent: "محتوى علمي موثوق ومحدث باستمرار",
      supportiveCommunity: "مجتمع تعليمي تفاعلي وداعم",
      resourceLibrary: "وصول لمكتبة ضخمة من الموارد التعليمية",
      backToSignIn: "العودة إلى تسجيل الدخول",
      platformName: "فذلكه",
      platformDesc: "منصة تعليمية رائدة تقدم محتوى علمي مميز وتفاعلي",
      emailField: "البريد الإلكتروني",
      newPasswordField: "كلمة المرور الجديدة",
      confirmPasswordField: "تأكيد كلمة المرور الجديدة",
      linkMethod: "رابط إعادة التعيين",
      otpMethod: "كود التحقق",
      sendResetLink: "إرسال رابط إعادة التعيين",
      sendOtp: "إرسال كود التحقق",
      verifyCode: "تحقق من الكود",
      enterVerificationCode: "أدخل كود التحقق",
      codeSentTo: "تم إرسال كود مكون من 6 أرقام إلى",
      resendCode: "لم تستلم الكود؟ أعد الإرسال",
      changeEmail: "تغيير البريد الإلكتروني",
      resetPassword: "إعادة تعيين كلمة المرور",
      resetting: "جاري إعادة التعيين...",
      sending: "جاري الإرسال...",
      verifying: "جاري التحقق...",
      redirecting: "جاري التوجيه...",
      enterEmail: "الرجاء إدخال البريد الإلكتروني",
      enterOtpCode: "الرجاء إدخال كود التحقق المكون من 6 أرقام",
      passwordsNotMatch: "كلمات المرور غير متطابقة",
      passwordTooShort: "كلمة المرور يجب أن تكون 8 أحرف على الأقل",
      resetLinkSent: "تم إرسال رابط إعادة التعيين إلى بريدك الإلكتروني",
      otpSent: "تم إرسال كود التحقق إلى",
      codeVerified: "تم التحقق من الكود بنجاح. سيتم توجيهك إلى صفحة إعادة تعيين كلمة المرور.",
      passwordResetSuccess: "تم إعادة تعيين كلمة المرور بنجاح!",
      somethingWentWrong: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      invalidOtp: "كود التحقق غير صالح",
      resetFailed: "فشل إعادة تعيين كلمة المرور",
      userNotFound: "لم يتم العثور على مستخدم بهذا البريد الإلكتروني",
      otpExpired: "انتهت صلاحية كود التحقق. يرجى طلب كود جديد",
      otpNotVerified: "لم يتم التحقق من الكود. يرجى التحقق من الكود أولاً",
      samePassword: "لا يمكن استخدام كلمة المرور الحالية. يرجى اختيار كلمة مرور جديدة",
      passwordComplexity: "كلمة المرور يجب أن تحتوي على حرف كبير واحد على الأقل، حرف صغير واحد، رقم واحد، وحرف خاص واحد",
      primaryEmailNote: "ملاحظة: سيتم إعادة تعيين كلمة المرور لحسابك الأساسي"
    },
    en: {
      title: "Forgot Password",
      subtitle: "Choose a password recovery method",
      featuresTitle: "Our Platform Features",
      educationalContent: "Educational Content",
      educationalContentDesc: "Comprehensive lessons in various scientific fields",
      interactiveCommunity: "Interactive Community",
      interactiveCommunityDesc: "Connect with colleagues and share knowledge",
      followUs: "Follow Us On",
      whyChooseUs: "Why Choose Our Platform?",
      reliableContent: "Reliable and constantly updated scientific content",
      supportiveCommunity: "Interactive and supportive educational community",
      resourceLibrary: "Access to a huge library of educational resources",
      backToSignIn: "Back to Sign In",
      platformName: "fazlaka",
      platformDesc: "A leading educational platform offering distinctive and interactive scientific content",
      emailField: "Email Address",
      newPasswordField: "New Password",
      confirmPasswordField: "Confirm New Password",
      linkMethod: "Reset Link",
      otpMethod: "Verification Code",
      sendResetLink: "Send Reset Link",
      sendOtp: "Send Verification Code",
      verifyCode: "Verify Code",
      enterVerificationCode: "Enter Verification Code",
      codeSentTo: "A 6-digit code has been sent to",
      resendCode: "Didn't receive code? Resend",
      changeEmail: "Change Email",
      resetPassword: "Reset Password",
      resetting: "Resetting...",
      sending: "Sending...",
      verifying: "Verifying...",
      redirecting: "Redirecting...",
      enterEmail: "Please enter your email",
      enterOtpCode: "Please enter 6-digit verification code",
      passwordsNotMatch: "Passwords do not match",
      passwordTooShort: "Password must be at least 8 characters",
      resetLinkSent: "Password reset link has been sent to your email",
      otpSent: "Verification code sent to",
      codeVerified: "Code verified successfully. You will be redirected to the password reset page.",
      passwordResetSuccess: "Password has been reset successfully!",
      somethingWentWrong: "Something went wrong. Please try again.",
      invalidOtp: "Invalid verification code",
      resetFailed: "Failed to reset password",
      userNotFound: "User not found with this email",
      otpExpired: "OTP code has expired. Please request a new code",
      otpNotVerified: "OTP not verified. Please verify your OTP first",
      samePassword: "Cannot use current password. Please choose a new password",
      passwordComplexity: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character",
      primaryEmailNote: "Note: Password will be reset for your primary account"
    }
  };
  
  const t = texts[isRTL ? 'ar' : 'en'];

  const socialLinks = [
    {
      href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA",
      icon: <Youtube className="w-6 h-6" />,
      label: "YouTube",
      color: "hover:bg-red-500/20 hover:text-red-400",
    },
    {
      href: "https://www.instagram.com/fazlaka_platform/",
      icon: <Instagram className="w-6 h-6" />,
      label: "Instagram",
      color: "hover:bg-pink-500/20 hover:text-pink-400",
    },
    {
      href: "https://www.facebook.com/profile.php?id=61579582675453",
      icon: <Facebook className="w-6 h-6" />,
      label: "Facebook",
      color: "hover:bg-blue-500/20 hover:text-blue-400",
    },
    {
      href: "https://www.tiktok.com/@fazlaka_platform",
      icon: <FaTiktok className="w-6 h-6" />,
      label: "TikTok",
      color: "hover:bg-gray-500/20 hover:text-gray-300",
    },
    {
      href: "https://x.com/FazlakaPlatform",
      icon: <FaXTwitter className="w-6 h-6" />,
      label: "Twitter",
      color: "hover:bg-blue-400/20 hover:text-blue-300",
    },
  ];

  const features = [
    {
      icon: <BookOpen className="w-8 h-8" />,
      title: t.educationalContent,
      description: t.educationalContentDesc,
      color: "from-blue-500 to-cyan-500",
    },
    {
      icon: <Users className="w-8 h-8" />,
      title: t.interactiveCommunity,
      description: t.interactiveCommunityDesc,
      color: "from-purple-500 to-indigo-500",
    },
  ];

  const handleSendLink = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t.resetLinkSent)
      } else {
        setError(data.error || t.somethingWentWrong)
      }
    } catch (error) {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendOtp = async () => {
    if (!email) {
      setError(t.enterEmail)
      return
    }
    
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          purpose: "reset"
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowOtpSent(true)
        setShowOtpForm(true)
        setSuccess(`${t.otpSent} ${email}`)
        
        // إذا كان هناك بريد إلكتروني أساسي مختلف، قم بتخزينه
        if (data.primaryEmail) {
          setPrimaryEmail(data.primaryEmail)
        }
      } else {
        setError(data.error || t.somethingWentWrong)
      }
    } catch (error) {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleVerifyOtp = async () => {
    if (!otpCode || otpCode.length !== 6) {
      setError(t.enterOtpCode)
      return
    }

    setIsLoading(true)
    setError("")

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          otpCode,
          purpose: "reset"
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t.codeVerified)
        
        // إذا كان الإيميل المستخدم هو إيميل ثانوي، عرض معلومات الإيميل الأساسي
        if (data.user && data.user.email !== email) {
          setPrimaryEmail(data.user.email)
          setSuccess(prev => prev + ` (الإيميل الأساسي: ${data.user.email})`)
        }
        
        // توجيه المستخدم إلى صفحة إعادة تعيين كلمة المرور
        if (data.redirectUrl) {
          setTimeout(() => {
            router.push(data.redirectUrl)
          }, 2000)
        }
      } else {
        switch (data.error) {
          case "User not found":
            setError(t.userNotFound)
            break
          case "Invalid OTP code":
            setError(t.invalidOtp)
            break
          case "OTP code has expired":
            setError(t.otpExpired)
            break
          default:
            setError(data.error || t.invalidOtp)
        }
      }
    } catch (error) {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (value: string) => {
    const numericValue = value.replace(/[^0-9]/g, '')
    setOtpCode(numericValue)
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* دوائر زخرفية متحركة فقط */}
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-2xl animate-pulse shadow-xl shadow-blue-500/10"></div>
      <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-gradient-to-r from-purple-400/15 to-blue-400/15 blur-3xl animate-pulse shadow-xl shadow-purple-500/10"></div>
      <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-blue-300/30 dark:bg-blue-300/10 blur-xl animate-bounce shadow-lg shadow-blue-400/20"></div>
      <div className="absolute bottom-1/3 left-1/3 w-24 h-24 rounded-full bg-purple-300/30 dark:bg-purple-300/10 blur-lg animate-ping shadow-lg shadow-purple-400/20"></div>
      <div className="absolute top-1/2 left-1/4 w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/25 to-purple-500/25 blur-lg animate-pulse shadow-lg shadow-blue-500/20"></div>
      <div className="absolute bottom-1/4 right-1/3 w-28 h-28 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl animate-bounce shadow-lg shadow-purple-500/20"></div>
      
      <div className="w-full max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-10 items-center justify-center">
          {/* قسم استعادة كلمة المرور - تم تعديله للموبايل */}
          <div className={`w-full lg:w-2/5 transition-all duration-700 transform ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-20 opacity-0'} order-1 lg:order-2`}>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg rounded-2xl shadow-xl dark:shadow-2xl dark:shadow-blue-500/20 border border-gray-200 dark:border-gray-800 p-6 sm:p-8"
            >
              {/* Header */}
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.5 }}
                className="text-center mb-8"
              >
                <div className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
                  <Mail className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {t.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.subtitle}
                </p>
              </motion.div>

              {/* Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="forgot-password-error"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl flex items-center space-x-reverse space-x-3"
                  >
                    <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0" />
                    <span className="text-red-700 dark:text-red-300 text-sm">{error}</span>
                  </motion.div>
                )}

                {success && (
                  <motion.div
                    key="forgot-password-success"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="mb-6 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl flex items-center space-x-reverse space-x-3"
                  >
                    <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0" />
                    <span className="text-green-700 dark:text-green-300 text-sm">{success}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Reset Method Selector */}
              <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setResetMethod("link")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    resetMethod === "link"
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Mail className="w-4 h-4 inline ml-1" />
                  {t.linkMethod}
                </button>
                <button
                  type="button"
                  onClick={() => setResetMethod("otp")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    resetMethod === "otp"
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Key className="w-4 h-4 inline ml-1" />
                  {t.otpMethod}
                </button>
              </div>

              {/* Link Reset Form */}
              {resetMethod === "link" && !success && (
                <form onSubmit={handleSendLink} className="space-y-6">
                  <motion.div 
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t.emailField}
                    </label>
                    <div className={`relative transition-all duration-300 ${isEmailFocused ? 'transform scale-105' : ''}`}>
                      <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                        <Mail className={`h-5 w-5 transition-colors duration-300 ${isEmailFocused ? 'text-blue-600' : 'text-gray-400'}`} />
                      </div>
                      <input
                        id="email"
                        name="email"
                        type="email"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        onFocus={() => setIsEmailFocused(true)}
                        onBlur={() => setIsEmailFocused(false)}
                        className={`appearance-none block w-full pr-10 pl-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                          isEmailFocused ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-300 dark:border-gray-600'
                        }`}
                        placeholder="example@email.com"
                      />
                    </div>
                  </motion.div>

                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                  >
                    <button
                      type="submit"
                      disabled={isLoading}
                      className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                    >
                      {isLoading ? (
                        <div className="flex items-center space-x-reverse space-x-2">
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                          <span>{t.sending}</span>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-reverse space-x-2">
                          <span>{t.sendResetLink}</span>
                          <ArrowRight className="w-4 h-4" />
                        </div>
                      )}
                    </button>
                  </motion.div>
                </form>
              )}

              {/* OTP Reset Form */}
              {resetMethod === "otp" && (
                <div className="space-y-6">
                  {!showOtpForm ? (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.3 }}
                    >
                      <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {t.emailField}
                      </label>
                      <div className={`relative transition-all duration-300 ${isEmailFocused ? 'transform scale-105' : ''}`}>
                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                          <Mail className={`h-5 w-5 transition-colors duration-300 ${isEmailFocused ? 'text-blue-600' : 'text-gray-400'}`} />
                        </div>
                        <input
                          id="email"
                          name="email"
                          type="email"
                          autoComplete="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          onFocus={() => setIsEmailFocused(true)}
                          onBlur={() => setIsEmailFocused(false)}
                          className={`appearance-none block w-full pr-10 pl-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                            isEmailFocused ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="example@email.com"
                        />
                      </div>

                      <motion.button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isLoading || !email}
                        className="w-full mt-4 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-reverse space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{t.sending}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-reverse space-x-2">
                            <Shield className="w-4 h-4" />
                            <span>{t.sendOtp}</span>
                          </div>
                        )}
                      </motion.button>
                    </motion.div>
                  ) : (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      className="text-center"
                    >
                      <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                          <Key className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {t.enterVerificationCode}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {t.codeSentTo} {email}
                        </p>
                      </div>

                      <div className="mb-6">
                        <input
                          type="text"
                          value={otpCode}
                          onChange={(e) => handleOtpChange(e.target.value)}
                          onFocus={() => setIsOtpFocused(true)}
                          onBlur={() => setIsOtpFocused(false)}
                          maxLength={6}
                          className={`w-full text-center text-2xl font-bold tracking-widest py-3 px-4 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                            isOtpFocused ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-300 dark:border-gray-600'
                          }`}
                          placeholder="000000"
                        />
                      </div>

                      <motion.button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otpCode.length !== 6}
                        className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-reverse space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{t.verifying}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-reverse space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>{t.verifyCode}</span>
                          </div>
                        )}
                      </motion.button>

                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300"
                        >
                          {t.resendCode}
                        </button>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowOtpForm(false)
                            setShowOtpSent(false)
                            setOtpCode("")
                            setPrimaryEmail("")
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {t.changeEmail}
                        </button>
                      </div>
                    </motion.div>
                  )}
                </div>
              )}

              {/* Back to Sign In Link */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 text-center"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <Link href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200">
                    {t.backToSignIn}
                  </Link>
                </span>
              </motion.p>
            </motion.div>
          </div>
          
          {/* بقية الأقسام */}
          <div className={`w-full lg:w-3/5 transition-all duration-700 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'} order-2 lg:order-1`}>
            {/* قسم العنوان الرئيسي */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.8 }}
              className="text-center mb-10"
            >
              <motion.h1 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 100 }}
                className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4 drop-shadow-lg"
              >
                 {t.platformName}
              </motion.h1>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-xl text-gray-700 dark:text-gray-200 max-w-2xl mx-auto drop-shadow"
              >
                {t.platformDesc}
              </motion.p>
            </motion.div>
            
            {/* قسم المميزات */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mb-10"
            >
              <motion.h2 
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 1, duration: 0.6 }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-center drop-shadow-md"
              >
                <span className="mr-3 text-3xl">🎓</span> {t.featuresTitle}
              </motion.h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                {features.map((feature, index) => (
                  <motion.div
                    key={index}
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 1.2 + index * 0.2, duration: 0.6 }}
                    whileHover={{ y: -10, scale: 1.03 }}
                    className={`bg-gradient-to-br ${feature.color} p-1 rounded-2xl shadow-lg ${index % 2 === 0 ? 'shadow-blue-500/30' : 'shadow-purple-500/30'}`}
                  >
                    <div className="bg-white dark:bg-gray-800 h-full p-5 rounded-2xl shadow-md dark:shadow-gray-900/50">
                      <div className={`w-14 h-14 rounded-full bg-gradient-to-r ${feature.color} flex items-center justify-center mb-4 shadow-lg ${index % 2 === 0 ? 'shadow-blue-500/40' : 'shadow-purple-500/40'}`}>
                        <div className="text-white">{feature.icon}</div>
                      </div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2 drop-shadow-sm">{feature.title}</h3>
                      <p className="text-gray-600 dark:text-gray-200">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
            
            {/* قسم تابعنا على */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.8 }}
              className="mb-10"
            >
              <motion.h2 
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 2.2, duration: 0.6 }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center justify-center drop-shadow-md"
              >
                <span className="mr-3 text-3xl">📱</span> {t.followUs}
              </motion.h2>
              <div className="flex justify-center flex-wrap gap-6">
                {socialLinks.map((social, index) => (
                  <motion.a
                    key={index}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 2.4 + index * 0.1, type: "spring", stiffness: 100 }}
                    whileHover={{ y: -10, scale: 1.2 }}
                    whileTap={{ scale: 0.95 }}
                    className={`w-14 h-14 rounded-full bg-white dark:bg-gray-800 flex items-center justify-center transition-all duration-300 ${social.color} border-2 border-gray-200 dark:border-gray-700 relative group overflow-hidden shadow-lg hover:shadow-xl dark:shadow-gray-900/50`}
                    aria-label={social.label}
                  >
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                    {social.icon}
                    <span className="absolute -bottom-10 left-1/2 transform -translate-x-1/2 text-xs bg-gray-900 dark:bg-gray-700 text-white px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap z-10 shadow-lg">
                      {social.label}
                    </span>
                  </motion.a>
                ))}
              </div>
            </motion.div>
            
            {/* قسم لماذا تختار منصتنا */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 3, duration: 0.8 }}
              className="bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 rounded-3xl p-6 border-2 border-blue-200 dark:border-blue-800 shadow-lg dark:shadow-gray-900/50"
            >
              <motion.h2 
                initial={{ x: -20 }}
                animate={{ x: 0 }}
                transition={{ delay: 3.2, duration: 0.6 }}
                className="text-2xl font-bold text-gray-900 dark:text-white mb-4 flex items-center drop-shadow-md"
              >
                <span className="mr-3 text-3xl">💎</span> {t.whyChooseUs}
              </motion.h2>
              <ul className="space-y-3">
                {[
                  t.reliableContent,
                  t.supportiveCommunity,
                  t.resourceLibrary
                ].map((item, index) => (
                  <motion.li 
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 3.4 + index * 0.1, duration: 0.6 }}
                    className="flex items-start"
                  >
                    <span className={`mr-3 text-xl ${index % 2 === 0 ? 'text-blue-500' : 'text-purple-500'} animate-pulse drop-shadow`}>✓</span>
                    <span className="text-gray-700 dark:text-gray-200 text-lg drop-shadow-sm">{item}</span>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  )
}