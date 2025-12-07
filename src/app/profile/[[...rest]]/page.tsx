"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Calendar, Settings, Star, MailPlus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

// Translation object
const translations = {
  ar: {
    profile: "الملف الشخصي",
    name: "الاسم",
    bio: "نبذة شخصية",
    settings: "الإعدادات",
    noBio: "لا توجد نبذة شخصية",
    user: "مستخدم",
    email: "البريد الإلكتروني",
    primaryEmail: "البريد الأساسي",
    secondaryEmails: "البريد الإلكتروني الثانوي",
    memberSince: "عضو منذ",
    accountInfo: "معلومات الحساب",
    memberSinceDate: "عضو منذ {date}",
    formatDate: (date: Date) => {
      // Using Gregorian calendar with Arabic month names
      const months = [
        "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
        "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
      ];
      
      const day = date.getDate();
      const month = months[date.getMonth()];
      const year = date.getFullYear();
      
      return `${day} ${month} ${year}`;
    }
  },
  en: {
    profile: "Profile",
    name: "Name",
    bio: "Bio",
    settings: "Settings",
    noBio: "No bio available",
    user: "User",
    email: "Email",
    primaryEmail: "Primary Email",
    secondaryEmails: "Secondary Emails",
    memberSince: "Member Since",
    accountInfo: "Account Information",
    memberSinceDate: "Member since {date}",
    formatDate: (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    }
  }
};

export default function ProfilePage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { isRTL, language } = useLanguage()
  const [name, setName] = useState("")
  const [bio, setBio] = useState("")
  const [image, setImage] = useState("")
  const [banner, setBanner] = useState("")
  const [createdAt, setCreatedAt] = useState<Date | null>(null)
  const [secondaryEmails, setSecondaryEmails] = useState<Array<{email: string, isVerified: boolean}>>([])
  const t = translations[language]

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/sign-in")
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user/${session!.user.id}`)
        if (response.ok) {
          const userData = await response.json()
          setName(userData.name || "")
          setBio(userData.bio || "")
          setImage(userData.image || session.user?.image || "")
          setBanner(userData.banner || "")
          setCreatedAt(userData.createdAt ? new Date(userData.createdAt) : null)
          setSecondaryEmails(userData.secondaryEmails || [])
        }
      } catch {
        console.error("Error fetching user data")
      }
    }

    fetchUserData()
  }, [session, status, router])

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* Animated stars background */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
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
        
        <div className="text-center z-10">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 mx-auto"></div>
          <p className="mt-4 text-gray-300">Loading...</p>
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

  if (!session) {
    return null
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
        {/* Profile Card - Hero Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-2xl overflow-hidden mb-8 border border-yellow-400/20"
          style={{
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(251, 191, 36, 0.1)'
          }}
        >
          {/* Content */}
          <div className="relative z-10">
            {/* Background Gradient with gold accent */}
            <div className="h-40 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 relative overflow-hidden">
              {banner ? (
                <Image
                  src={banner}
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
                    {image || session.user?.image ? (
                      <Image
                        src={image || session.user?.image || ""}
                        alt={session.user?.name || "User"}
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
                
                {/* Name with golden color */}
                <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600 mt-4">
                  {name || session.user?.name || t.user}
                </h2>
                
                {/* Bio */}
                <p className="text-gray-600 dark:text-gray-300 text-center mt-2 max-w-md">
                  {bio || t.noBio}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Information - Enhanced Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="relative group"
        >
          {/* Card Background with gradient overlay */}
          <div className="absolute inset-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl border border-yellow-400/20"></div>
          
          {/* Card Content */}
          <div className="relative bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm rounded-3xl shadow-xl border border-gray-200/50 dark:border-gray-700/50 p-8">
            {/* Header with gradient text */}
            <div className="flex items-center justify-between mb-8">
              <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {t.accountInfo}
              </h3>
              <Link href="/settings">
                <motion.button
                  whileHover={{ scale: 1.05, boxShadow: "0 10px 20px rgba(59, 130, 246, 0.3)" }}
                  whileTap={{ scale: 0.95 }}
                  className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all font-medium shadow-lg"
                >
                  <Settings className="h-4 w-4 inline mr-2" />
                  {t.settings}
                </motion.button>
              </Link>
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
                    <p className="text-gray-900 dark:text-white font-medium">{session.user?.email}</p>
                  </div>
                </div>
                <div className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                  {language === 'ar' ? 'أساسي' : 'Primary'}
                </div>
              </div>

              {/* Secondary Emails */}
              {secondaryEmails && secondaryEmails.length > 0 && (
                <div className="group/item p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                  <div className="flex items-center mb-3">
                    <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4 group-hover/item:scale-110 transition-transform">
                      <MailPlus className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t.secondaryEmails}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mr-16">
                    {secondaryEmails.map((emailObj, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <p className="text-gray-900 dark:text-white font-medium">{emailObj.email}</p>
                        <div className={`px-3 py-1 rounded-full text-sm font-medium ${
                          emailObj.isVerified 
                            ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' 
                            : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400'
                        }`}>
                          {emailObj.isVerified 
                            ? (language === 'ar' ? 'موثق' : 'Verified') 
                            : (language === 'ar' ? 'غير موثق' : 'Not Verified')
                          }
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="group/item flex items-center justify-between p-4 rounded-xl bg-gray-50/50 dark:bg-gray-800/50 hover:bg-gray-100/50 dark:hover:bg-gray-700/50 transition-all duration-300">
                <div className="flex items-center">
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg mr-4 group-hover/item:scale-110 transition-transform">
                    <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{t.name}</p>
                    <p className="text-gray-900 dark:text-white font-medium">{name || session.user?.name || t.user}</p>
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
                      {createdAt ? t.formatDate(createdAt) : "Unknown"}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Quick Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-8"
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 text-center border border-yellow-400/20"
          >
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-full">
                <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{1 + secondaryEmails.length}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {language === 'ar' ? 'البريد الإلكتروني' : 'Email(s)'}
            </p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 text-center border border-yellow-400/20"
          >
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-full">
                <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">Active</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Account Status</p>
          </motion.div>

          <motion.div
            whileHover={{ scale: 1.02 }}
            className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-2xl shadow-xl p-6 text-center border border-yellow-400/20"
          >
            <div className="flex justify-center mb-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-full">
                <User className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">Verified</p>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">Email Verified</p>
          </motion.div>
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