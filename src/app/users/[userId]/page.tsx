"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Calendar, ArrowLeft } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

// تعريف واجهة بيانات المستخدم بدلاً من استخدام any
interface UserData {
  _id: string;
  name: string;
  email: string;
  primaryEmail: string;
  image?: string;
  banner?: string;
  bio?: string;
  createdAt: string;
}

// Translation object
const translations = {
  ar: {
    profile: "الملف الشخصي",
    name: "الاسم",
    bio: "نبذة شخصية",
    noBio: "لا توجد نبذة شخصية",
    user: "مستخدم",
    email: "البريد الإلكتروني",
    primaryEmail: "البريد الأساسي",
    memberSince: "عضو منذ",
    accountInfo: "معلومات الحساب",
    formatDate: (date: Date) => {
      const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
      ];
      
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    },
    backToProfile: "العودة إلى ملفي الشخصي",
    userNotFound: "المستخدم غير موجود",
    errorLoadingUser: "حدث خطأ أثناء تحميل بيانات المستخدم",
    serverConnectionError: "حدث خطأ أثناء الاتصال بالخادم",
    backToHome: "العودة إلى الصفحة الرئيسية"
  },
  en: {
    profile: "Profile",
    name: "Name",
    bio: "Bio",
    noBio: "No bio available",
    user: "User",
    email: "Email",
    primaryEmail: "Primary Email",
    memberSince: "Member Since",
    accountInfo: "Account Information",
    formatDate: (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    },
    backToProfile: "Back to My Profile",
    userNotFound: "User not found",
    errorLoadingUser: "Error loading user data",
    serverConnectionError: "Error connecting to server",
    backToHome: "Back to Home"
  }
};

export default function UserProfilePage() {
  const { data: session, status } = useSession()
  const params = useParams()
  const { isRTL, language } = useLanguage()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = translations[language]

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = params.userId as string
        console.log("Fetching user with ID:", userId); // للتصحيح
        
        const response = await fetch(`/api/user/${userId}`)
        
        if (response.ok) {
          const data = await response.json()
          console.log("User data:", data); // للتصحيح
          setUserData(data)
        } else if (response.status === 404) {
          setError(t.userNotFound)
        } else {
          const errorData = await response.json()
          setError(errorData.error || t.errorLoadingUser)
        }
      } catch (err) {
        setError(t.serverConnectionError)
        console.error("Error fetching user data:", err)
      } finally {
        setLoading(false)
      }
    }

    if (params.userId) {
      fetchUserData()
    }
  }, [params.userId, t])

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400"></div>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-500 mb-4">{error || t.userNotFound}</p>
          <Link href="/" className="text-blue-500 hover:underline">
            {t.backToHome}
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Animated stars background */}
      <div className="absolute inset-0">
        {[...Array(100)].map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full bg-white"
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              opacity: Math.random() * 0.8 + 0.2,
              animation: `twinkle ${Math.random() * 5 + 5}s linear infinite`,
            }}
          />
        ))}
      </div>
      
      {/* Golden accent elements */}
      <div className="absolute top-20 left-10 w-64 h-64 bg-yellow-400 rounded-full filter blur-3xl opacity-10"></div>
      <div className="absolute bottom-20 right-10 w-96 h-96 bg-yellow-400 rounded-full filter blur-3xl opacity-10"></div>
      
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-8 relative z-10">
        {/* Back button */}
        {session && (
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="mb-6"
          >
            <Link 
              href="/profile"
              className="inline-flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {t.backToProfile}
            </Link>
          </motion.div>
        )}

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden mb-8 border border-yellow-400/20"
        >
          {/* Content */}
          <div className="relative z-10">
            {/* Background Gradient with gold accent */}
            <div className="h-40 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
              {userData.banner ? (
                <Image
                  src={userData.banner}
                  alt="Profile Banner"
                  fill
                  className="object-cover"
                />
              ) : null}
              <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/20 to-transparent"></div>
              <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-400 rounded-full filter blur-3xl opacity-20"></div>
            </div>
            
            {/* Profile Content */}
            <div className="px-6 pb-6">
              {/* Profile Image - Centered with Frame */}
              <div className="flex flex-col items-center -mt-20 mb-4">
                <div className="relative p-1 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-xl">
                  <div className="p-1 bg-white dark:bg-gray-800 rounded-full">
                    {userData.image ? (
                      <Image
                        src={userData.image}
                        alt={userData.name || "User"}
                        width={120}
                        height={120}
                        className="rounded-full"
                      />
                    ) : (
                      <div className="w-30 h-30 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                        <User className="h-16 w-16 text-gray-500 dark:text-gray-400" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Name with golden color */}
              <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mt-4">
                {userData.name || t.user}
              </h2>
              
              {/* Bio */}
              <p className="text-gray-600 dark:text-gray-300 text-center mt-2 max-w-md">
                {userData.bio || t.noBio}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Account Information */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden border border-yellow-400/20"
        >
          {/* Card Background with gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-br from-yellow-400/10 to-orange-500/10 opacity-50"></div>
          
          {/* Card Content */}
          <div className="relative z-10 p-8">
            {/* Header with gradient text */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.accountInfo}
              </h3>
            </div>
            
            {/* Info Items with enhanced styling */}
            <div className="space-y-6">
              {/* Primary Email */}
              <div className="group/item flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg mr-4 group-hover/item:scale-110 transition-transform">
                    <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.primaryEmail}</p>
                    <p className="text-gray-900 dark:text-white font-medium">{userData.email}</p>
                  </div>
                </div>
              </div>

              <div className="group/item flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4 group-hover/item:scale-110 transition-transform">
                    <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.name}</p>
                    <p className="text-gray-900 dark:text-white font-medium">{userData.name || t.user}</p>
                  </div>
                </div>
              </div>

              <div className="group/item flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg mr-4 group-hover/item:scale-110 transition-transform">
                    <Calendar className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.memberSince}</p>
                    <p className="text-gray-900 dark:text-white font-medium">
                      {userData.createdAt ? t.formatDate(new Date(userData.createdAt)) : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
      
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.2; }
          50% { opacity: 0.8; }
          100% { opacity: 0.2; }
        }
      `}</style>
    </div>
  )
}