"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Calendar, Lock } from "lucide-react"
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
  banned?: boolean; // Added banned status
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
    userNotFound: "المستخدم غير موجود",
    errorLoadingUser: "حدث خطأ أثناء تحميل بيانات المستخدم",
    serverConnectionError: "حدث خطأ أثناء الاتصال بالخادم",
    backToHome: "العودة إلى الصفحة الرئيسية",
    accountSuspended: "تم تعليق الحساب",
    suspendedMessage: "هذا الحساب معلق ولا يمكن الوصول إلى الإعدادات. يرجى التواصل مع الدعم للمزيد من التفاصيل.",
    contactSupport: "تواصل مع الدعم",
    bannedStatus: "محظور"
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
    userNotFound: "User not found",
    errorLoadingUser: "Error loading user data",
    serverConnectionError: "Error connecting to server",
    backToHome: "Back to Home",
    accountSuspended: "Account Suspended",
    suspendedMessage: "This account is suspended and settings are inaccessible. Please contact support for more details.",
    contactSupport: "Contact Support",
    bannedStatus: "Banned"
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

  // --- Utility Component for Shared Glass Background ---
  const Background = ({ isBanned = false }) => (
    <>
      {/* Dynamic Star/Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 transition-colors duration-500 ${
          isBanned 
            ? 'bg-gradient-to-b from-red-900/10 via-black to-black'
            : 'bg-black'
        }`}></div>
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className={`absolute rounded-full transition-colors duration-500 ${
              isBanned ? 'bg-red-500/30' : 'bg-yellow-400/30'
            }`}
            style={{
              width: Math.random() * 3 + 'px',
              height: Math.random() * 3 + 'px',
              top: Math.random() * 100 + '%',
              left: Math.random() * 100 + '%',
              animation: `twinkle ${Math.random() * 5 + 5}s linear infinite`,
            }}
          />
        ))}
      </div>
      
      {/* Blur / Glow Accents */}
      <div className={`absolute top-0 w-full h-96 transition-colors duration-500 ${
        isBanned 
          ? 'bg-gradient-to-b from-red-800/20 to-transparent'
          : 'bg-gradient-to-b from-indigo-800/20 to-transparent'
      }`}></div>
      <div className={`absolute top-1/4 left-1/4 w-80 h-80 rounded-full blur-[100px] transition-colors duration-500 ${
        isBanned ? 'bg-red-600/20' : 'bg-yellow-400/20'
      }`}></div>
    </>
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
        <Background />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 z-10"></div>
      </div>
    )
  }

  if (error || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
        <Background />
        <div className="text-center z-10">
          <p className="text-red-500 mb-4">{error || t.userNotFound}</p>
          <Link href="/" className="text-blue-500 hover:underline">
            {t.backToHome}
          </Link>
        </div>
      </div>
    )
  }

  const isBanned = userData.banned || false;

  return (
    <div className={`min-h-screen relative overflow-hidden ${isRTL ? 'rtl' : 'ltr'}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Dynamic Background */}
      <Background isBanned={isBanned} />
      
      <div className="max-w-4xl mx-auto px-4 pt-20 pb-8 relative z-10">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className={`relative backdrop-blur-lg bg-white/10 dark:bg-gray-800/10 rounded-[2rem] shadow-2xl overflow-hidden mb-8 border transition-all duration-500 ${
            isBanned 
              ? 'border-red-600/50 shadow-[0_0_50px_-12px_rgba(220,38,38,0.5)]' 
              : 'border-yellow-400/20'
          }`}
        >
          {/* Header Banner */}
          <div className={`h-40 relative overflow-hidden transition-all duration-500 ${
            isBanned ? 'bg-red-900/80' : 'bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600'
          }`}>
            {userData.banner ? (
              <Image
                src={userData.banner}
                alt="Profile Banner"
                fill
                className={`object-cover transition-opacity duration-500 ${isBanned ? 'opacity-50' : 'opacity-100'}`}
              />
            ) : null}
            
            {/* Dynamic Overlay */}
            <div className={`absolute inset-0 transition-all duration-500 ${
              isBanned 
                ? 'bg-red-900/40' 
                : 'bg-gradient-to-t from-yellow-400/20 to-transparent'
            }`}></div>

            {/* Status Overlay (Lock) for Banned Users */}
            {isBanned && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
                <Lock className="w-16 h-16 text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,1)] animate-pulse" />
              </div>
            )}
          </div>
          
          {/* Profile Content */}
          <div className="px-6 pb-6">
            {/* Profile Image - Centered with Frame, Name, and Bio */}
            <div className="flex flex-col items-center -mt-20 mb-4">
              <div className={`relative p-1 rounded-full shadow-xl transition-all duration-500 ${
                isBanned 
                  ? 'bg-gradient-to-br from-red-600 to-red-800' 
                  : 'bg-gradient-to-br from-yellow-400 to-orange-500'
              }`}>
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
                {/* Lock icon overlay for banned users */}
                {isBanned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 rounded-full">
                    <Lock className="w-10 h-10 text-red-400 drop-shadow" />
                  </div>
                )}
              </div>
              
              {/* Name with dynamic color */}
              <h2 className={`text-2xl font-bold mt-4 transition-colors duration-500 ${
                isBanned 
                  ? 'text-red-400' 
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600'
              }`}>
                {userData.name || t.user}
              </h2>
              
              {/* Bio */}
              <p className={`text-center mt-2 max-w-md transition-colors duration-500 ${
                isBanned ? 'text-red-300/80' : 'text-gray-600 dark:text-gray-300'
              }`}>
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
          className={`relative backdrop-blur-lg bg-white/10 dark:bg-gray-800/10 rounded-[2rem] shadow-2xl overflow-hidden border transition-all duration-500 ${
            isBanned 
              ? 'border-red-600/50 opacity-90' 
              : 'border-yellow-400/20'
          }`}
        >
          {/* Card Background with gradient overlay */}
          <div className={`absolute inset-0 transition-colors duration-500 ${
            isBanned 
              ? 'bg-gradient-to-br from-red-900/20 to-red-800/10' 
              : 'bg-gradient-to-br from-yellow-400/10 to-orange-500/10'
          }`}></div>
          
          {/* Card Content */}
          <div className="relative z-10 p-8">
            {/* Header with gradient text */}
            <div className="flex items-center justify-between mb-8">
              <h3 className={`text-2xl font-bold transition-colors duration-500 ${
                isBanned 
                  ? 'text-red-300' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                {t.accountInfo}
              </h3>
            </div>

            {/* Banned User Alert */}
            {isBanned && (
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 100 }}
                className="mb-8 p-4 bg-red-900/50 rounded-xl text-center border border-red-700"
              >
                <h4 className="text-xl font-bold text-red-400 mb-2">{t.accountSuspended}</h4>
                <p className="text-sm text-red-300/80">{t.suspendedMessage}</p>
              </motion.div>
            )}
            
            {/* Info Items with enhanced styling */}
            <div className="space-y-6">
              {/* Primary Email */}
              <div className={`group/item flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                isBanned 
                  ? 'bg-red-900/30' 
                  : 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
              }`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg mr-4 group-hover/item:scale-110 transition-transform ${
                    isBanned 
                      ? 'bg-red-800/50 text-red-400' 
                      : 'bg-blue-100 dark:bg-blue-900/30'
                  }`}>
                    <Mail className={`h-6 w-6 ${isBanned ? 'text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-300 ${isBanned ? 'text-red-300' : 'text-gray-500 dark:text-gray-400'}`}>{t.primaryEmail}</p>
                    <p className={`font-medium transition-colors duration-300 ${isBanned ? 'text-red-200' : 'text-gray-900 dark:text-white'}`}>{userData.email}</p>
                  </div>
                </div>
                <span className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-300 ${
                  isBanned 
                    ? 'bg-red-800 text-red-100' 
                    : 'bg-green-600/20 text-green-400'
                }`}>
                  {isBanned ? t.bannedStatus : "Primary"}
                </span>
              </div>

              {/* Name */}
              <div className={`group/item flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                isBanned 
                  ? 'bg-red-900/30' 
                  : 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
              }`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg mr-4 group-hover/item:scale-110 transition-transform ${
                    isBanned 
                      ? 'bg-red-800/50 text-red-400' 
                      : 'bg-purple-100 dark:bg-purple-900/30'
                  }`}>
                    <User className={`h-6 w-6 ${isBanned ? 'text-red-400' : 'text-purple-600 dark:text-purple-400'}`} />
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-300 ${isBanned ? 'text-red-300' : 'text-gray-500 dark:text-gray-400'}`}>{t.name}</p>
                    <p className={`font-medium transition-colors duration-300 ${isBanned ? 'text-red-200' : 'text-gray-900 dark:text-white'}`}>{userData.name || t.user}</p>
                  </div>
                </div>
              </div>

              {/* Member Since */}
              <div className={`group/item flex items-center justify-between p-4 rounded-xl transition-all duration-300 ${
                isBanned 
                  ? 'bg-red-900/30' 
                  : 'bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50'
              }`}>
                <div className="flex items-center">
                  <div className={`p-3 rounded-lg mr-4 group-hover/item:scale-110 transition-transform ${
                    isBanned 
                      ? 'bg-red-800/50 text-red-400' 
                      : 'bg-green-100 dark:bg-green-900/30'
                  }`}>
                    <Calendar className={`h-6 w-6 ${isBanned ? 'text-red-400' : 'text-green-600 dark:text-green-400'}`} />
                  </div>
                  <div>
                    <p className={`text-sm transition-colors duration-300 ${isBanned ? 'text-red-300' : 'text-gray-500 dark:text-gray-400'}`}>{t.memberSince}</p>
                    <p className={`font-medium transition-colors duration-300 ${isBanned ? 'text-red-200' : 'text-gray-900 dark:text-white'}`}>
                      {userData.createdAt ? t.formatDate(new Date(userData.createdAt)) : "Unknown"}
                    </p>
                  </div>
                </div>
                {isBanned && (
                  <div className="px-4 py-2 bg-red-800 text-red-100 rounded-full font-bold">
                    <Lock className="h-4 w-4 inline-block" />
                  </div>
                )}
              </div>
            </div>

            {/* Contact Support Button for Banned User */}
            {isBanned && (
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full mt-6 py-3 px-6 rounded-xl bg-red-600 hover:bg-red-700 text-white font-semibold transition-all shadow-lg shadow-red-900/20"
              >
                {t.contactSupport}
              </motion.button>
            )}
          </div>
        </motion.div>
      </div>
      
      <style jsx>{`
        @keyframes twinkle {
          0% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
          100% { opacity: 0.2; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}