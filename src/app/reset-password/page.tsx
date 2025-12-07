"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { motion } from "framer-motion"
import { Eye, EyeOff, Lock, Sparkles, Shield, CheckCircle, User } from "lucide-react"

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState(false)
  const [token, setToken] = useState("")
  const [tokenValid, setTokenValid] = useState(true)
  const [isValidating, setIsValidating] = useState(true)
  const [passwordStrength, setPasswordStrength] = useState(0)
  const [stars, setStars] = useState<{x: number, y: number, size: number, opacity: number}[]>([])
  const [language, setLanguage] = useState<'ar' | 'en'>('ar')
  const [isRTL, setIsRTL] = useState(true)
  const [profilePicture, setProfilePicture] = useState<string | null>(null)
  const [userEmail, setUserEmail] = useState<string | null>(null)
  const [userName, setUserName] = useState<string | null>(null)
  
  const router = useRouter()
  const searchParams = useSearchParams()

  // Translation object
  const translations = {
    ar: {
      resetPassword: "إعادة تعيين كلمة المرور",
      enterNewPassword: "أدخل كلمة المرور الجديدة",
      newPassword: "كلمة المرور الجديدة",
      confirmNewPassword: "تأكيد كلمة المرور الجديدة",
      resetButton: "إعادة تعيين كلمة المرور",
      resetting: "جاري إعادة التعيين...",
      backToLogin: "العودة إلى تسجيل الدخول",
      passwordMismatch: "كلمات المرور غير متطابقة",
      passwordMinLength: "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
      passwordStrength: "قوة كلمة المرور",
      weak: "ضعيفة",
      medium: "متوسطة",
      good: "جيدة",
      strong: "قوية",
      passwordsMatch: "كلمات المرور متطابقة",
      passwordsNotMatch: "كلمات المرور غير متطابقة",
      resetSuccess: "تم إعادة تعيين كلمة المرور بنجاح",
      redirecting: "سيتم توجيهك إلى صفحة تسجيل الدخول خلال لحظات...",
      invalidLink: "رابط غير صالح",
      invalidLinkMessage: "رابط إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية",
      requestNewLink: "طلب رابط جديد",
      verifyingLink: "جاري التحقق من الرابط...",
      errorOccurred: "حدث خطأ ما. يرجى المحاولة مرة أخرى.",
      placeholder: "•••••••"
    },
    en: {
      resetPassword: "Reset Password",
      enterNewPassword: "Enter your new password",
      newPassword: "New Password",
      confirmNewPassword: "Confirm New Password",
      resetButton: "Reset Password",
      resetting: "Resetting...",
      backToLogin: "Back to Sign In",
      passwordMismatch: "Passwords do not match",
      passwordMinLength: "Password must be at least 6 characters",
      passwordStrength: "Password Strength",
      weak: "Weak",
      medium: "Medium",
      good: "Good",
      strong: "Strong",
      passwordsMatch: "Passwords match",
      passwordsNotMatch: "Passwords do not match",
      resetSuccess: "Password reset successfully",
      redirecting: "You will be redirected to sign-in page in a moment...",
      invalidLink: "Invalid Link",
      invalidLinkMessage: "The password reset link is invalid or has expired",
      requestNewLink: "Request a new link",
      verifyingLink: "Verifying link...",
      errorOccurred: "An error occurred. Please try again.",
      placeholder: "•••••••"
    }
  };
  
  const t = translations[language]

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
    
    return () => {
      window.removeEventListener('storage', handleLanguageChange);
      clearInterval(checkLanguageInterval);
    };
  }, [isRTL]);

  useEffect(() => {
    const tokenParam = searchParams.get("token")
    if (tokenParam) {
      setToken(tokenParam)
      
      // Fetch user details including profile picture
      fetchUserDetails(tokenParam)
      
      setIsValidating(false)
    } else {
      setTokenValid(false)
      setIsValidating(false)
    }

    // Generate random stars for space background
    const generatedStars = Array.from({ length: 100 }, () => ({
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: Math.random() * 2 + 0.5,
      opacity: Math.random() * 0.8 + 0.2
    }))
    setStars(generatedStars)
  }, [searchParams])

  // New function to fetch user details
  const fetchUserDetails = async (token: string) => {
    try {
      const response = await fetch("/api/auth/verify-reset-token", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token }),
      })

      if (response.ok) {
        const data = await response.json()
        if (data.user) {
          setProfilePicture(data.user.image || null)
          setUserEmail(data.user.email || null)
          setUserName(data.user.name || null)
        }
      } else {
        // If token is invalid, mark it as invalid
        if (response.status === 400) {
          setTokenValid(false)
        }
        console.error("Failed to fetch user details")
      }
    } catch (error) {
      console.error("Error fetching user details:", error)
      // Continue without user details - the page will still work
    }
  }

  useEffect(() => {
    // Calculate password strength
    if (password.length === 0) {
      setPasswordStrength(0)
      return
    }
    
    let strength = 0
    if (password.length >= 6) strength += 25
    if (password.length >= 10) strength += 25
    if (/[A-Z]/.test(password) && /[a-z]/.test(password)) strength += 25
    if (/[0-9]/.test(password)) strength += 12.5
    if (/[^A-Za-z0-9]/.test(password)) strength += 12.5
    
    setPasswordStrength(strength)
  }, [password])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    if (password !== confirmPassword) {
      setError(t.passwordMismatch)
      setIsLoading(false)
      return
    }

    if (password.length < 6) {
      setError(t.passwordMinLength)
      setIsLoading(false)
      return
    }

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSuccess(true)
        setTimeout(() => {
          router.push(`/sign-in?message=${encodeURIComponent(t.resetSuccess)}`)
        }, 3000)
      } else {
        setError(data.error || t.errorOccurred)
      }
    } catch (error) {
      setError(t.errorOccurred)
    } finally {
      setIsLoading(false)
    }
  }

  const getPasswordStrengthColor = () => {
    if (passwordStrength < 25) return "bg-red-500"
    if (passwordStrength < 50) return "bg-orange-500"
    if (passwordStrength < 75) return "bg-yellow-500"
    return "bg-green-500"
  }

  const getPasswordStrengthText = () => {
    if (passwordStrength < 25) return t.weak
    if (passwordStrength < 50) return t.medium
    if (passwordStrength < 75) return t.good
    return t.strong
  }

  // Function to get initials from name or email if no profile picture
  const getInitials = (name: string | null, email: string | null) => {
    if (name) {
      return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    }
    if (email) {
      return email.substring(0, 2).toUpperCase()
    }
    return "?"
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16 relative overflow-hidden">
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
        
        <div className="text-center z-10">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            className="w-20 h-20 mx-auto mb-6 relative"
          >
            <div className="absolute inset-0 rounded-full border-4 border-blue-200 dark:border-blue-800"></div>
            <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-blue-600"></div>
            <div className="absolute inset-2 rounded-full border-2 border-purple-200 dark:border-purple-800"></div>
            <div className="absolute inset-2 rounded-full border-2 border-transparent border-t-purple-600"></div>
          </motion.div>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-gray-600 dark:text-gray-400 text-lg"
          >
            {t.verifyingLink}
          </motion.p>
        </div>
      </div>
    )
  }

  if (!tokenValid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16 relative overflow-hidden">
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
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="w-full max-w-md z-10"
        >
          <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/30">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 20 }}
                className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4 shadow-lg"
              >
                <svg className="w-10 h-10 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </motion.div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {t.invalidLink}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {t.invalidLinkMessage}
              </p>
            </div>

            <div className="space-y-3">
              <Link
                href="/forgot-password"
                className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition hover:scale-105"
              >
                {t.requestNewLink}
              </Link>
              <Link
                href="/sign-in"
                className="w-full flex justify-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-xl shadow-lg text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition hover:scale-105"
              >
                {t.backToLogin}
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 px-4 sm:px-6 pt-32 pb-16 relative overflow-hidden" dir={isRTL ? 'rtl' : 'ltr'}>
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
      
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md z-10"
      >
        <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg shadow-2xl rounded-3xl p-8 border border-white/20 dark:border-gray-700/30">
          <div className="text-center mb-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="mx-auto w-20 h-20 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4 shadow-lg overflow-hidden"
            >
              {profilePicture ? (
                <img 
                  src={profilePicture} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-r from-blue-600 to-purple-600">
                  <span className="text-white text-xl font-bold">
                    {getInitials(userName, userEmail)}
                  </span>
                </div>
              )}
            </motion.div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t.resetPassword}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t.enterNewPassword}
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-xl mb-6 border border-red-200 dark:border-red-800/30"
            >
              {error}
            </motion.div>
          )}

          {success ? (
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
                {t.resetSuccess}
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                {t.redirecting}
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.newPassword}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className={`appearance-none block w-full ${isRTL ? 'pl-10 pr-10' : 'pr-10 pl-10'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                    placeholder={t.placeholder}
                  />
                  <button
                    type="button"
                    className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center`}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {password.length > 0 && (
                  <div className="mt-2">
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{t.passwordStrength}</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{getPasswordStrengthText()}</span>
                    </div>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <motion.div
                        className={`h-2 rounded-full ${getPasswordStrengthColor()}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${passwordStrength}%` }}
                        transition={{ duration: 0.3 }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.confirmNewPassword}
                </label>
                <div className="relative">
                  <div className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-3' : 'right-0 pr-3'} flex items-center pointer-events-none`}>
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className={`appearance-none block w-full ${isRTL ? 'pl-10 pr-10' : 'pr-10 pl-10'} py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 shadow-sm`}
                    placeholder={t.placeholder}
                  />
                  <button
                    type="button"
                    className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-3' : 'left-0 pl-3'} flex items-center`}
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-gray-400" />
                    ) : (
                      <Eye className="h-5 w-5 text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {confirmPassword.length > 0 && (
                  <div className="mt-2 flex items-center">
                    {password === confirmPassword ? (
                      <div className="flex items-center text-green-500 text-xs">
                        <CheckCircle className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} />
                        <span>{t.passwordsMatch}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-red-500 text-xs">
                        <svg className={`w-3 h-3 ${isRTL ? 'ml-1' : 'mr-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                        <span>{t.passwordsNotMatch}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <motion.button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transform transition hover:scale-105"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t.resetting}
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <Shield className={`${isRTL ? 'ml-2' : 'mr-2'} h-4 w-4`} />
                      {t.resetButton}
                    </span>
                  )}
                </motion.button>
              </div>
            </form>
          )}

          <div className="mt-6 text-center">
            <span className="text-sm text-gray-600 dark:text-gray-400">
              <Link href="/sign-in" className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center">
                <svg className={`w-4 h-4 ${isRTL ? 'mr-1' : 'ml-1'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {t.backToLogin}
              </Link>
            </span>
          </div>
        </div>
        
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
      </motion.div>
    </div>
  )
}