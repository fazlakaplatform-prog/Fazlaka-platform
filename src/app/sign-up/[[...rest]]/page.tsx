// File: src/app/sign-up/[[...rest]]/page.tsx
"use client"

import { useState, useEffect } from "react"
import { signIn, signOut, useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { motion, AnimatePresence } from "framer-motion"
import { Eye, EyeOff, Mail, Lock, User, Shield, CheckCircle, AlertCircle, Home, ArrowRight, Link2 } from "lucide-react"
import { Facebook, Instagram, Youtube, Users, BookOpen } from "lucide-react"
import { FaTiktok, FaXTwitter } from "react-icons/fa6"

export default function SignUpPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [otpCode, setOtpCode] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")
  const [showOtpForm, setShowOtpForm] = useState(false)
  const [showMagicLinkSent, setShowMagicLinkSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [authMethod, setAuthMethod] = useState("magiclink") // magiclink, otp, google
  const [isVisible, setIsVisible] = useState(false)
  const [language, setLanguage] = useState<'ar' | 'en'>('ar')
  const [isRTL, setIsRTL] = useState(true)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isNameFocused, setIsNameFocused] = useState(false)
  const [isEmailFocused, setIsEmailFocused] = useState(false)
  const [isPasswordFocused, setIsPasswordFocused] = useState(false)
  const [isConfirmPasswordFocused, setIsConfirmPasswordFocused] = useState(false)
  const [emailVerified, setEmailVerified] = useState(false)
  
  const router = useRouter()
  const { data: session, status } = useSession()

  // Translation object for all text content
  const translations = {
    ar: {
      title: "إنشاء حساب جديد",
      subtitle: "انضم إلى مجتمعنا العلمي",
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
      haveAccount: "لديك حساب بالفعل؟",
      signIn: "تسجيل الدخول",
      platformName: "فذلكه",
      platformDesc: "منصة تعليمية رائدة تقدم محتوى علمي مميز وتفاعلي",
      welcome: "مرحباً بك",
      joinCommunity: "انضم إلى مجتمع فذلكه التعليمي",
      chooseAuthMethod: "اختر طريقة التحقق المناسبة لك",
      nameField: "الاسم",
      emailField: "البريد الإلكتروني",
      passwordField: "كلمة المرور",
      confirmPasswordField: "تأكيد كلمة المرور",
      magicLinkMethod: "الرابط السحري",
      otpMethod: "كود التحقق",
      signUpWithGoogle: "التسجيل باستخدام Google",
      or: "أو",
      sendMagicLink: "إرسال الرابط السحري",
      sendOtp: "إرسال كود التحقق",
      verifyCode: "تحقق من الكود",
      enterVerificationCode: "أدخل كود التحقق",
      codeSentTo: "تم إرسال كود مكون من 6 أرقام إلى",
      magicLinkSentTo: "تم إرسال رابط تسجيل الدخول إلى",
      resendIn: "إعادة الإرسال خلال",
      resendCode: "لم تستلم الكود؟ أعد الإرسال",
      resendMagicLink: "لم تستلم الرابط؟ أعد الإرسال",
      changeData: "تغيير البيانات",
      createAccount: "إنشاء حساب",
      creatingAccount: "جاري إنشاء الحساب...",
      sending: "جاري الإرسال...",
      verifying: "جاري التحقق...",
      nameEmailRequired: "الرجاء إدخال الاسم والبريد الإلكتروني",
      enterOtpCode: "الرجاء إدخال كود التحقق المكون من 6 أرقام",
      passwordsNotMatch: "كلمات المرور غير متطابقة",
      accountCreated: "تم إنشاء حسابك بنجاح!",
      accountCreatedVerify: "تم إنشاء حسابك بنجاح! يرجى التحقق من بريدك الإلكتروني لتفعيل حسابك.",
      otpSent: "تم إرسال كود التحقق إلى",
      magicLinkSent: "تم إرسال الرابط السحري إلى",
      googleSignUpFailed: "فشل التسجيل باستخدام Google",
      somethingWentWrong: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      alreadyHaveAccount: "لديك حساب بالفعل!",
      welcomeUser: "مرحباً بك",
      youHaveAccount: "لديك حساب بالفعل في منصة فذلكه.",
      goToHome: "الذهاب إلى الصفحة الرئيسية",
      logout: "تسجيل الخروج",
      checkingSession: "جاري التحقق من حالة الجلسة...",
      code: "(الكود:",
      termsAndConditions: "الشروط والأحكام",
      privacyPolicy: "سياسة الخصوصية",
      acceptTerms: "أوافق على",
      and: "و",
      acceptTermsError: "يجب الموافقة على الشروط والأحكام وسياسة الخصوصية",
      seconds: "ثانية",
      emailExists: "هذا البريد الإلكتروني مسجل بالفعل كبريد أساسي أو ثانوي",
      emailVerified: "تم التحقق من البريد الإلكتروني بنجاح",
      verificationRequired: "يجب التحقق من البريد الإلكتروني أولاً"
    },
    en: {
      title: "Create New Account",
      subtitle: "Join our scientific community",
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
      haveAccount: "Already have an account?",
      signIn: "Sign In",
      platformName: "fazlaka",
      platformDesc: "A leading educational platform offering distinctive and interactive scientific content",
      welcome: "Welcome",
      joinCommunity: "Join the Fazlaka educational community",
      chooseAuthMethod: "Choose your preferred verification method",
      nameField: "Name",
      emailField: "Email Address",
      passwordField: "Password",
      confirmPasswordField: "Confirm Password",
      magicLinkMethod: "Magic Link",
      otpMethod: "Verification Code",
      signUpWithGoogle: "Sign Up with Google",
      or: "Or",
      sendMagicLink: "Send Magic Link",
      sendOtp: "Send Verification Code",
      verifyCode: "Verify Code",
      enterVerificationCode: "Enter Verification Code",
      codeSentTo: "A 6-digit code has been sent to",
      magicLinkSentTo: "A magic link has been sent to",
      resendIn: "Resend in",
      resendCode: "Didn't receive the code? Resend",
      resendMagicLink: "Didn't receive the link? Resend",
      changeData: "Change Data",
      createAccount: "Create Account",
      creatingAccount: "Creating account...",
      sending: "Sending...",
      verifying: "Verifying...",
      nameEmailRequired: "Please enter name and email",
      enterOtpCode: "Please enter the 6-digit verification code",
      passwordsNotMatch: "Passwords do not match",
      accountCreated: "Your account has been created successfully!",
      accountCreatedVerify: "Your account has been created successfully! Please check your email to activate your account.",
      otpSent: "Verification code sent to",
      magicLinkSent: "Magic link sent to",
      googleSignUpFailed: "Failed to sign up with Google",
      somethingWentWrong: "Something went wrong. Please try again.",
      alreadyHaveAccount: "You already have an account!",
      welcomeUser: "Welcome",
      youHaveAccount: "You already have an account on the Fazlaka platform.",
      goToHome: "Go to Homepage",
      logout: "Logout",
      checkingSession: "Checking session status...",
      code: "(Code:",
      termsAndConditions: "Terms and Conditions",
      privacyPolicy: "Privacy Policy",
      acceptTerms: "I agree to",
      and: "and",
      acceptTermsError: "You must agree to the Terms and Conditions and Privacy Policy",
      seconds: "seconds",
      emailExists: "This email is already registered as a primary or secondary email",
      emailVerified: "Email verified successfully",
      verificationRequired: "Email verification is required first"
    }
  };
  
  const t = translations[language];

  // Check session status and redirect if needed
  useEffect(() => {
    if (status === "loading") return
    
    if (session) {
      // User is already logged in
      router.push("/")
    }
  }, [session, status, router])

  // Countdown timer for OTP resend
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000)
      return () => clearTimeout(timer)
    }
  }, [countdown])

  // Initialize page and check language
  useEffect(() => {
    setIsVisible(true)
    
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
    
    return () => {
      window.removeEventListener('storage', handleLanguageChange);
      clearInterval(checkLanguageInterval);
    };
  }, [isRTL]);

  // Social media links
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

  // Features data
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

  const handleGoogleSignUp = async () => {
    // Check terms acceptance
    if (!acceptTerms) {
      setError(t.acceptTermsError)
      return
    }
    
    setIsLoading(true)
    setError("")
    
    try {
      const result = await signIn("google", {
        redirect: false,
      })

      if (result?.error) {
        setError(t.googleSignUpFailed)
      } else if (result?.ok) {
        setSuccess(t.accountCreated)
        setTimeout(() => {
          router.push("/")
        }, 1500)
      }
    } catch (error) {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSendMagicLink = async () => {
    if (!email || !name) {
      setError(t.nameEmailRequired)
      return
    }
    
    // Check terms acceptance
    if (!acceptTerms) {
      setError(t.acceptTermsError)
      return
    }
    
    setIsLoading(true)
    setError("")
    
    try {
      const response = await fetch("/api/auth/send-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          name,
          purpose: "register"
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowMagicLinkSent(true)
        setSuccess(`${t.magicLinkSent} ${email}`)
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
    if (!email || !name) {
      setError(t.nameEmailRequired)
      return
    }
    
    // Check terms acceptance
    if (!acceptTerms) {
      setError(t.acceptTermsError)
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
          name,
          purpose: "register"
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setShowOtpForm(true)
        setCountdown(60)
        setSuccess(`${t.otpSent} ${email}`)
        if (process.env.NODE_ENV === 'development' && data.otpCode) {
          setSuccess(prev => prev + ` ${t.code} ${data.otpCode})`)
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

    if (!password || password !== confirmPassword) {
      setError(t.passwordsNotMatch)
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
          name,
          password,
          purpose: "register"
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setEmailVerified(true)
        setSuccess(t.emailVerified)
        
        // Now create the account after verification
        const createResponse = await fetch("/api/auth/register", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            email,
            password,
            emailVerified: true
          }),
        })

        const createData = await createResponse.json()

        if (createResponse.ok) {
          setSuccess(t.accountCreated)
          setTimeout(() => {
            router.push("/sign-in?message=Account created successfully")
          }, 2000)
        } else {
          setError(createData.error || t.somethingWentWrong)
        }
      } else {
        setError(data.error || "Invalid OTP code")
      }
    } catch (error) {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  const handleOtpChange = (value: string) => {
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '')
    setOtpCode(numericValue)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Check if email is verified
    if (!emailVerified) {
      setError(t.verificationRequired)
      return
    }
    
    setIsLoading(true)
    setError("")
    setSuccess("")

    // Check terms acceptance
    if (!acceptTerms) {
      setError(t.acceptTermsError)
      setIsLoading(false)
      return
    }

    if (password !== confirmPassword) {
      setError(t.passwordsNotMatch)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password,
          emailVerified: true
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(t.accountCreated)
        setName("")
        setEmail("")
        setPassword("")
        setConfirmPassword("")
      } else {
        setError(data.error || t.somethingWentWrong)
      }
    } catch (error) {
      setError(t.somethingWentWrong)
    } finally {
      setIsLoading(false)
    }
  }

  // Show loading state or redirect
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.checkingSession}</p>
        </div>
      </div>
    )
  }

  // If user is already logged in, show message
  if (session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
        <motion.div
          initial={{ opacity: 1, y: 0 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-blue-500/10 border border-white/20 dark:border-gray-700/50 p-8 max-w-md w-full mx-4"
        >
          <div className="text-center">
            <div className="mx-auto w-20 h-20 bg-gradient-to-r from-green-500 to-green-600 rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <CheckCircle className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              {t.alreadyHaveAccount}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              {t.welcomeUser} {session.user?.name}، {t.youHaveAccount}
            </p>
            <div className="space-y-3">
              <button
                onClick={() => router.push("/")}
                className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
              >
                <Home className="w-4 h-4 ml-2" />
                {t.goToHome}
              </button>
              <button
                onClick={() => signOut({ callbackUrl: "/sign-up" })}
                className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
              >
                {t.logout}
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Decorative animated circles */}
      <div className="absolute top-10 left-10 w-40 h-40 rounded-full bg-gradient-to-r from-blue-400/20 to-purple-400/20 blur-2xl animate-pulse shadow-xl shadow-blue-500/10"></div>
      <div className="absolute bottom-20 right-10 w-60 h-60 rounded-full bg-gradient-to-r from-purple-400/15 to-blue-400/15 blur-3xl animate-pulse shadow-xl shadow-purple-500/10"></div>
      <div className="absolute top-1/4 right-1/4 w-32 h-32 rounded-full bg-blue-300/30 dark:bg-blue-300/10 blur-xl animate-bounce shadow-lg shadow-blue-400/20"></div>
      <div className="absolute bottom-1/3 left-1/3 w-24 h-24 rounded-full bg-purple-300/30 dark:bg-purple-300/10 blur-lg animate-pulse shadow-lg shadow-purple-400/20"></div>
      <div className="absolute top-1/2 left-1/4 w-20 h-20 rounded-full bg-gradient-to-r from-blue-500/25 to-purple-500/25 blur-lg animate-pulse shadow-lg shadow-blue-500/20"></div>
      <div className="absolute bottom-1/4 right-1/3 w-28 h-28 rounded-full bg-gradient-to-r from-purple-500/20 to-blue-500/20 blur-xl animate-bounce shadow-lg shadow-purple-500/20"></div>
      
      <div className="w-full max-w-7xl mx-auto relative z-10">
        <div className="flex flex-col lg:flex-row gap-10 items-center justify-center">
          {/* Account creation section - modified for mobile */}
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
                  <User className="w-10 h-10 text-white" />
                </div>
                <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
                  {t.title}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {t.joinCommunity}
                </p>
              </motion.div>

              {/* Messages */}
              <AnimatePresence>
                {error && (
                  <motion.div
                    key="error-message" // مفتاح فريد
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
                    key="success-message" // مفتاح فريد
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

              {/* Google Sign Up Button */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mb-6"
              >
                <button
                  onClick={handleGoogleSignUp}
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-reverse space-x-2">
                      <div className="w-4 h-4 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
                      <span>{t.creatingAccount}</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-reverse space-x-2">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                      </svg>
                      <span>{t.signUpWithGoogle}</span>
                    </div>
                  )}
                </button>
              </motion.div>

              <div className="relative mb-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300 dark:border-gray-600"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                    {t.or}
                  </span>
                </div>
              </div>

              {/* Auth Method Selector */}
              <div className="flex mb-6 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                <button
                  type="button"
                  onClick={() => setAuthMethod("magiclink")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    authMethod === "magiclink"
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Link2 className="w-4 h-4 inline ml-1" />
                  {t.magicLinkMethod}
                </button>
                <button
                  type="button"
                  onClick={() => setAuthMethod("otp")}
                  className={`flex-1 py-2 px-3 rounded-md text-sm font-medium transition-colors ${
                    authMethod === "otp"
                      ? "bg-white dark:bg-gray-600 text-blue-600 dark:text-blue-400 shadow-sm"
                      : "text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                  }`}
                >
                  <Shield className="w-4 h-4 inline ml-1" />
                  {t.otpMethod}
                </button>
              </div>

              {/* Magic Link Registration Form */}
              {authMethod === "magiclink" && (
                <div className="space-y-6">
                  {!showMagicLinkSent ? (
                    <div>
                      {/* Name Field */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.nameField}
                        </label>
                        <div className={`relative transition-all duration-300 ${isNameFocused ? 'transform scale-105' : ''}`}>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <User className={`h-5 w-5 transition-colors duration-300 ${isNameFocused ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onFocus={() => setIsNameFocused(true)}
                            onBlur={() => setIsNameFocused(false)}
                            className={`appearance-none block w-full pr-10 pl-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                              isNameFocused ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder={isRTL ? "أدخل اسمك" : "Enter your name"}
                          />
                        </div>
                      </motion.div>

                      {/* Email Field */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-4"
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

                      {/* Password Field */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.5 }}
                        className="mt-4"
                      >
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.passwordField}
                        </label>
                        <div className={`relative transition-all duration-300 ${isPasswordFocused ? 'transform scale-105' : ''}`}>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Lock className={`h-5 w-5 transition-colors duration-300 ${isPasswordFocused ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <input
                            id="password"
                            name="password"
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            onFocus={() => setIsPasswordFocused(true)}
                            onBlur={() => setIsPasswordFocused(false)}
                            className={`appearance-none block w-full pr-10 pl-12 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                              isPasswordFocused ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="••••••••••"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 left-0 pl-3 flex items-center"
                            onClick={() => setShowPassword(!showPassword)}
                          >
                            {showPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                            )}
                          </button>
                        </div>
                      </motion.div>

                      {/* Confirm Password Field */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.6 }}
                        className="mt-4"
                      >
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.confirmPasswordField}
                        </label>
                        <div className={`relative transition-all duration-300 ${isConfirmPasswordFocused ? 'transform scale-105' : ''}`}>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <Lock className={`h-5 w-5 transition-colors duration-300 ${isConfirmPasswordFocused ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <input
                            id="confirmPassword"
                            name="confirmPassword"
                            type={showConfirmPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            onFocus={() => setIsConfirmPasswordFocused(true)}
                            onBlur={() => setIsConfirmPasswordFocused(false)}
                            className={`appearance-none block w-full pr-10 pl-12 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                              isConfirmPasswordFocused ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder="••••••••••"
                          />
                          <button
                            type="button"
                            className="absolute inset-y-0 left-0 pl-3 flex items-center"
                            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                            ) : (
                              <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                            )}
                          </button>
                        </div>
                      </motion.div>

                      {/* Terms and Conditions */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.65 }}
                        className="flex items-start mt-4"
                      >
                        <input
                          id="accept-terms-magiclink"
                          name="accept-terms-magiclink"
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mt-1"
                        />
                        <label htmlFor="accept-terms-magiclink" className="mr-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed">
                          {t.acceptTerms}{" "}
                          <Link href="/terms-conditions" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">
                            {t.termsAndConditions}
                          </Link>{" "}
                          {t.and}{" "}
                          <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">
                            {t.privacyPolicy}
                          </Link>
                        </label>
                      </motion.div>

                      <motion.button
                        type="button"
                        onClick={handleSendMagicLink}
                        disabled={isLoading || !email || !name || !password || !confirmPassword || password !== confirmPassword || !acceptTerms}
                        className="w-full mt-4 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-reverse space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{t.sending}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-reverse space-x-2">
                            <Link2 className="w-4 h-4" />
                            <span>{t.sendMagicLink}</span>
                          </div>
                        )}
                      </motion.button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                          <Link2 className="w-8 h-8 text-blue-600 dark:text-blue-400" />
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                          {t.magicLinkSentTo}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {email}
                        </p>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowMagicLinkSent(false)
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {t.changeData}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* OTP Registration Form */}
              {authMethod === "otp" && (
                <div className="space-y-6">
                  {!showOtpForm ? (
                    <div>
                      {/* Name Field */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                      >
                        <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          {t.nameField}
                        </label>
                        <div className={`relative transition-all duration-300 ${isNameFocused ? 'transform scale-105' : ''}`}>
                          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                            <User className={`h-5 w-5 transition-colors duration-300 ${isNameFocused ? 'text-blue-600' : 'text-gray-400'}`} />
                          </div>
                          <input
                            id="name"
                            name="name"
                            type="text"
                            required
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onFocus={() => setIsNameFocused(true)}
                            onBlur={() => setIsNameFocused(false)}
                            className={`appearance-none block w-full pr-10 pl-4 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                              isNameFocused ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-300 dark:border-gray-600'
                            }`}
                            placeholder={isRTL ? "أدخل اسمك" : "Enter your name"}
                          />
                        </div>
                      </motion.div>

                      {/* Email Field */}
                      <motion.div 
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.4 }}
                        className="mt-4"
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

                      {/* Terms and Conditions */}
                      <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.45 }}
                        className="flex items-start mt-4"
                      >
                        <input
                          id="accept-terms-otp"
                          name="accept-terms-otp"
                          type="checkbox"
                          checked={acceptTerms}
                          onChange={(e) => setAcceptTerms(e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 dark:border-gray-600 rounded mt-1"
                        />
                        <label htmlFor="accept-terms-otp" className="mr-2 block text-sm text-gray-700 dark:text-gray-300 cursor-pointer leading-relaxed">
                          {t.acceptTerms}{" "}
                          <Link href="/terms-conditions" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">
                            {t.termsAndConditions}
                          </Link>{" "}
                          {t.and}{" "}
                          <Link href="/privacy-policy" className="text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 underline">
                            {t.privacyPolicy}
                          </Link>
                        </label>
                      </motion.div>

                      <motion.button
                        type="button"
                        onClick={handleSendOtp}
                        disabled={isLoading || !email || !name || !acceptTerms}
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
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="mb-6">
                        <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                          <Shield className="w-8 h-8 text-blue-600 dark:text-blue-400" />
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
                          maxLength={6}
                          className="w-full text-center text-2xl font-bold tracking-widest py-3 px-4 border-2 border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="000000"
                        />
                      </div>

                      <div className="space-y-4">
                        {/* Password Field */}
                        <div>
                          <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t.passwordField}
                          </label>
                          <div className={`relative transition-all duration-300 ${isPasswordFocused ? 'transform scale-105' : ''}`}>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <Lock className={`h-5 w-5 transition-colors duration-300 ${isPasswordFocused ? 'text-blue-600' : 'text-gray-400'}`} />
                            </div>
                            <input
                              id="password"
                              name="password"
                              type={showPassword ? "text" : "password"}
                              required
                              value={password}
                              onChange={(e) => setPassword(e.target.value)}
                              onFocus={() => setIsPasswordFocused(true)}
                              onBlur={() => setIsPasswordFocused(false)}
                              className={`appearance-none block w-full pr-10 pl-12 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                                isPasswordFocused ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-300 dark:border-gray-600'
                              }`}
                              placeholder="••••••••••"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 left-0 pl-3 flex items-center"
                              onClick={() => setShowPassword(!showPassword)}
                            >
                              {showPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                              )}
                            </button>
                          </div>
                        </div>

                        {/* Confirm Password Field */}
                        <div>
                          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {t.confirmPasswordField}
                          </label>
                          <div className={`relative transition-all duration-300 ${isConfirmPasswordFocused ? 'transform scale-105' : ''}`}>
                            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                              <Lock className={`h-5 w-5 transition-colors duration-300 ${isConfirmPasswordFocused ? 'text-blue-600' : 'text-gray-400'}`} />
                            </div>
                            <input
                              id="confirmPassword"
                              name="confirmPassword"
                              type={showConfirmPassword ? "text" : "password"}
                              required
                              value={confirmPassword}
                              onChange={(e) => setConfirmPassword(e.target.value)}
                              onFocus={() => setIsConfirmPasswordFocused(true)}
                              onBlur={() => setIsConfirmPasswordFocused(false)}
                              className={`appearance-none block w-full pr-10 pl-12 py-3 border-2 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 ${
                                isConfirmPasswordFocused ? 'border-blue-500 shadow-lg shadow-blue-500/20' : 'border-gray-300 dark:border-gray-600'
                              }`}
                              placeholder="••••••••••"
                            />
                            <button
                              type="button"
                              className="absolute inset-y-0 left-0 pl-3 flex items-center"
                              onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                            >
                              {showConfirmPassword ? (
                                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                              ) : (
                                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600 transition-colors" />
                              )}
                            </button>
                          </div>
                        </div>
                      </div>

                      <motion.button
                        type="button"
                        onClick={handleVerifyOtp}
                        disabled={isLoading || otpCode.length !== 6 || !password || password !== confirmPassword}
                        className="w-full mt-6 flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 transform hover:scale-105 hover:shadow-xl"
                      >
                        {isLoading ? (
                          <div className="flex items-center space-x-reverse space-x-2">
                            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>{t.verifying}</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-reverse space-x-2">
                            <CheckCircle className="w-4 h-4" />
                            <span>{t.createAccount}</span>
                          </div>
                        )}
                      </motion.button>

                      <div className="mt-4 text-center">
                        <button
                          type="button"
                          onClick={handleSendOtp}
                          disabled={countdown > 0}
                          className="text-sm text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 disabled:text-gray-400 disabled:cursor-not-allowed"
                        >
                          {countdown > 0 
                            ? `${t.resendIn} ${countdown} ${t.seconds}` 
                            : t.resendCode
                          }
                        </button>
                      </div>

                      <div className="mt-4">
                        <button
                          type="button"
                          onClick={() => {
                            setShowOtpForm(false)
                            setOtpCode("")
                          }}
                          className="text-sm text-gray-600 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-200"
                        >
                          {t.changeData}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Sign In Link */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="mt-8 text-center"
              >
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {t.haveAccount}{" "}
                  <Link
                    href="/sign-in"
                    className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-200"
                  >
                    {t.signIn}
                  </Link>
                </span>
              </motion.p>
            </motion.div>
          </div>
          
          {/* Other sections */}
          <div className={`w-full lg:w-3/5 transition-all duration-700 transform ${isVisible ? 'translate-x-0 opacity-100' : '-translate-x-20 opacity-0'} order-2 lg:order-1`}>
            {/* Main title section */}
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
            
            {/* Features section */}
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
            
            {/* Follow us section */}
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
            
            {/* Why choose us section */}
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