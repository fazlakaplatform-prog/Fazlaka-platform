"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import { motion } from "framer-motion"
import { CheckCircle, AlertCircle, Loader2, User, Mail, Lock, Eye, EyeOff } from "lucide-react"

// تعريف واجهة لبيانات المستخدم
interface UserData {
  email: string;
  name: string;
}

export default function VerifyMagicLinkPage() {
  const [status, setStatus] = useState<"loading" | "success" | "error" | "register">("loading")
  const [message, setMessage] = useState("")
  const [userData, setUserData] = useState<UserData | null>(null)
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [tokenVerified, setTokenVerified] = useState(false)
  
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const purpose = searchParams.get("purpose") || "login"
  const email = searchParams.get("email")
  const name = searchParams.get("name")

  // تعريف دالة verifyToken باستخدام useCallback لمنع إعادة التعريف
  const verifyToken = useCallback(async () => {
    try {
      console.log("التحقق من التوكن:", token?.substring(0, 10) + "...", "للغرض:", purpose)
      
      const response = await fetch("/api/auth/verify-magic-link", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, purpose }),
      })

      // التحقق من نوع المحتوى قبل تحليل JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("الخادم أرجع استجابة غير JSON")
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("خطأ في تحليل JSON:", parseError)
        const text = await response.text()
        console.error("نص الاستجابة:", text)
        throw new Error("فشل تحليل استجابة الخادم")
      }

      console.log("استجابة التحقق:", data)

      if (response.ok) {
        setTokenVerified(true)
        if (data.purpose === "register") {
          setStatus("register")
          setUserData(data.userData)
          setMessage("يرجى إكمال بيانات التسجيل")
        } else {
          setStatus("success")
          setMessage("تم تسجيل الدخول بنجاح!")
          
          // تسجيل الدخول باستخدام NextAuth
          const result = await signIn("credentials", {
            email: data.user.email,
            password: "", // كلمة مرور فارغة للرابط السحري
            redirect: false,
          })

          if (result?.ok) {
            setTimeout(() => {
              router.push("/")
            }, 2000)
          } else {
            setStatus("error")
            setMessage("فشل تسجيل الدخول")
          }
        }
      } else {
        setStatus("error")
        setMessage(data.error || "فشل التحقق من الرابط السحري")
      }
    } catch (error) {
      console.error("خطأ في التحقق:", error)
      setStatus("error")
      setMessage("حدث خطأ أثناء التحقق من الرابط السحري")
    }
  }, [token, purpose, router])

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setMessage("الرابط السحري غير صالح")
      return
    }

    // إذا كانت بيانات المستخدم موجودة في معلمات URL، استخدمها مباشرة
    if (purpose === "register" && email && name) {
      setUserData({ email, name })
      setStatus("register")
      setMessage("يرجى إكمال بيانات التسجيل")
      setTokenVerified(true)
      return
    }

    // التحقق من التوكن مرة واحدة فقط
    if (!tokenVerified) {
      verifyToken()
    }
  }, [token, purpose, email, name, tokenVerified, verifyToken])

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setMessage("كلمات المرور غير متطابقة")
      return
    }

    if (password.length < 8) {
      setMessage("كلمة المرور يجب أن تكون 8 أحرف على الأقل")
      return
    }

    setIsLoading(true)
    setMessage("")

    try {
      console.log("إنشاء حساب للمستخدم:", userData?.email)
      
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: userData?.name,
          email: userData?.email,
          password: password,
          emailVerified: true // التأكد من تفعيل البريد الإلكتروني
        }),
      })

      // التحقق من نوع المحتوى قبل تحليل JSON
      const contentType = response.headers.get("content-type")
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("الخادم أرجع استجابة غير JSON")
      }

      let data
      try {
        data = await response.json()
      } catch (parseError) {
        console.error("خطأ في تحليل JSON:", parseError)
        const text = await response.text()
        console.error("نص الاستجابة:", text)
        throw new Error("فشل تحليل استجابة الخادم")
      }

      console.log("استجابة التسجيل:", data)

      if (response.ok) {
        setStatus("success")
        setMessage("تم إنشاء حسابك بنجاح!")
        
        // تسجيل الدخول تلقائياً
        const result = await signIn("credentials", {
          email: userData?.email,
          password: password,
          redirect: false,
        })

        if (result?.ok) {
          setTimeout(() => {
            router.push("/")
          }, 2000)
        } else {
          console.error("فشل تسجيل الدخول التلقائي:", result?.error)
          setTimeout(() => {
            router.push("/sign-in?message=Account created successfully")
          }, 2000)
        }
      } else {
        setMessage(data.error || "فشل إنشاء الحساب")
      }
    } catch (error) {
      console.error("خطأ في التسجيل:", error)
      setMessage("حدث خطأ أثناء إنشاء الحساب")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-3xl shadow-2xl dark:shadow-blue-500/10 border border-white/20 dark:border-gray-700/50 p-8 max-w-md w-full mx-4"
      >
        <div className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-10 h-10 text-blue-600 dark:text-blue-400 animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                جاري التحقق...
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                يرجى الانتظار بينما نتحقق من رابط تسجيل الدخول الخاص بك
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto w-20 h-20 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="w-10 h-10 text-green-600 dark:text-green-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                تم التحقق بنجاح!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {message}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-500 mt-2">
                سيتم توجيهك إلى الصفحة الرئيسية قريباً...
              </p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto w-20 h-20 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center mb-4">
                <AlertCircle className="w-10 h-10 text-red-600 dark:text-red-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                فشل التحقق
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                {message}
              </p>
              <div className="space-y-3">
                <button
                  onClick={() => router.push("/sign-in")}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                >
                  العودة لتسجيل الدخول
                </button>
                <button
                  onClick={() => router.push("/sign-in?action=request-link")}
                  className="w-full flex justify-center items-center py-3 px-4 border border-gray-300 dark:border-gray-600 rounded-lg shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-300"
                >
                  طلب رابط تسجيل دخول جديد
                </button>
              </div>
            </>
          )}

          {status === "register" && userData && (
            <>
              <div className="mx-auto w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mb-4">
                <User className="w-10 h-10 text-blue-600 dark:text-blue-400" />
              </div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                إكمال التسجيل
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                مرحباً {userData.name}! يرجى إكمال بياناتك لإنشاء الحساب
              </p>

              {message && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-red-700 dark:text-red-300 text-sm">{message}</p>
                </div>
              )}

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    الاسم
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      value={userData.name}
                      disabled
                      className="appearance-none block w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    البريد الإلكتروني
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Mail className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      value={userData.email}
                      disabled
                      className="appearance-none block w-full pr-10 pl-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showPassword ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="appearance-none block w-full pr-10 pl-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="•••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 pl-3 flex items-center"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    تأكيد كلمة المرور
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                      <Lock className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      className="appearance-none block w-full pr-10 pl-12 py-3 border border-gray-300 dark:border-gray-600 rounded-xl bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="•••••••••"
                    />
                    <button
                      type="button"
                      className="absolute inset-y-0 left-0 pl-3 flex items-center"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      ) : (
                        <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
                      )}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full flex justify-center items-center py-3 px-4 border border-transparent rounded-xl shadow-lg text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300"
                >
                  {isLoading ? (
                    <div className="flex items-center space-x-reverse space-x-2">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>جاري إنشاء الحساب...</span>
                    </div>
                  ) : (
                    "إنشاء حساب"
                  )}
                </button>
              </form>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}