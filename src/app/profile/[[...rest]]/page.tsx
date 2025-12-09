"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Calendar, Settings, Lock, MailPlus } from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

// Translation object (kept the same)
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
    accountSuspended: "تم تعليق الحساب",
    suspendedMessage: "هذا الحساب معلق ولا يمكن الوصول إلى الإعدادات. يرجى التواصل مع الدعم للمزيد من التفاصيل.",
    contactSupport: "تواصل مع الدعم",
    bannedStatus: "محظور",
    verified: "موثق",
    notVerified: "غير موثق",
    primary: "أساسي",
    formatDate: (date: Date) => {
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
    accountSuspended: "Account Suspended",
    suspendedMessage: "This account is suspended and settings are inaccessible. Please contact support for more details.",
    contactSupport: "Contact Support",
    bannedStatus: "Banned",
    verified: "Verified",
    notVerified: "Not Verified",
    primary: "Primary",
    formatDate: (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    }
  }
};

const GlassCard = motion.div

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
  const [isBanned, setIsBanned] = useState(false)
  
  const t = translations[language]

  useEffect(() => {
    if (status === "loading") return
    
    if (!session) {
      router.push("/sign-in")
      return
    }

    const fetchUserData = async () => {
      try {
        const response = await fetch(`/api/user/${session.user.id}`)
        if (response.ok) {
          const userData = await response.json()
          setName(userData.name || "")
          setBio(userData.bio || "")
          setImage(userData.image || session.user?.image || "")
          setBanner(userData.banner || "")
          setCreatedAt(userData.createdAt ? new Date(userData.createdAt) : null)
          setSecondaryEmails(userData.secondaryEmails || [])
          setIsBanned(userData.banned || false)
        }
      } catch {
        console.error("Error fetching user data")
      }
    }

    fetchUserData()
  }, [session, status, router])

  // --- Utility Component for Shared Glass Background ---
  const Background = ({ isBanned = false }) => (
    <>
      {/* Dynamic Star/Glow Background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className={`absolute inset-0 transition-colors duration-500 ${
          isBanned 
            ? 'bg-gradient-to-b from-red-900/10 via-black to-black'
            : 'bg-gradient-to-b from-blue-900/10 via-gray-950 to-black'
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
        isBanned ? 'bg-red-600/20' : 'bg-blue-600/20'
      }`}></div>
    </>
  )

  // Loading State
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
        <Background />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 z-10"></div>
      </div>
    )
  }

  if (!session) return null

  // ---------------------------------------------------------
  // SHARED PROFILE CARD RENDERER
  // ---------------------------------------------------------
  const renderProfileContent = (isBanned: boolean) => (
    <>
      {/* Profile Card - Hero Section */}
      <GlassCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className={`relative backdrop-blur-lg bg-white/10 dark:bg-gray-800/10 rounded-[2rem] shadow-2xl overflow-hidden mb-8 border transition-all duration-500 ${
          isBanned 
            ? 'border-red-600/50 shadow-[0_0_50px_-12px_rgba(220,38,38,0.5)]' 
            : 'border-white/20 dark:border-gray-700/50'
        }`}
      >
        {/* Header Banner */}
        <div className={`h-40 relative overflow-hidden transition-all duration-500 ${
          isBanned ? 'bg-red-900/80' : 'bg-gradient-to-r from-violet-600 to-blue-600'
        }`}>
           {banner && (
              <Image
                src={banner}
                alt="Profile Banner"
                fill
                className={`object-cover transition-opacity duration-500 ${isBanned ? 'opacity-50' : 'opacity-100'}`} 
              />
            )}
          
          {/* Dynamic Overlay: Ensures no overlay for active user, and a clean overlay for banned user */}
          <div className={`absolute inset-0 transition-all duration-500 ${
              isBanned 
                  ? 'bg-red-900/40' // Lighter red tint over banner for banned
                  : 'bg-gradient-to-t from-black/10 to-transparent' // Very subtle gradient for active
          }`}></div>

          {/* Status Overlay (Lock) for Banned Users - Placed correctly over the banner ONLY */}
          {isBanned && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
                  <Lock className="w-16 h-16 text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,1)] animate-pulse" />
              </div>
          )}
        </div>
        
        {/* Content Section (Name, Bio, Image) */}
        <div className="px-8 pb-8 pt-4"> {/* Increased top padding to push content down slightly */}
          <div className="flex flex-col md:flex-row items-center md:items-end -mt-20 mb-6 gap-6">
            
            {/* Profile Image - Now correctly positioned under the banner */}
            <div className={`relative group transition-all duration-500 z-20`}> {/* Added z-20 to ensure it's above the banner overlay */}
              <div className={`relative h-32 w-32 rounded-full border-4 ${
                isBanned 
                  ? 'border-red-800 bg-red-950/50' 
                  : 'border-gray-900 dark:border-gray-800 bg-gray-900/50'
              } overflow-hidden shadow-xl`}>
                {image || session.user?.image ? (
                  <Image
                    src={image || session.user?.image || ""}
                    alt="User"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-700">
                    <User className="h-12 w-12 text-gray-400" />
                  </div>
                )}
                {/* Lock icon overlay for banned users - translucent to show face */}
                {isBanned && (
                   <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 rounded-full">
                       <Lock className="w-10 h-10 text-red-400 drop-shadow" />
                   </div>
                )}
              </div>
            </div>

            {/* Name & Bio */}
            <div className="text-center md:text-start flex-1 mb-2">
              <h2 className={`text-3xl font-bold mb-1 transition-colors duration-500 ${
                isBanned ? 'text-red-400' : 'text-white'
              }`}>
                {name || session.user?.name || t.user}
              </h2>
              <p className={`text-gray-400 max-w-lg text-lg transition-colors duration-500 ${
                isBanned ? 'text-red-300/80' : 'text-gray-400'
              }`}>
                {bio || t.noBio}
              </p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Account Information Section */}
      <GlassCard
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
        className={`bg-white/10 dark:bg-gray-800/10 backdrop-blur-lg rounded-[2rem] p-8 shadow-xl border transition-all duration-500 ${
          isBanned 
            ? 'border-red-600/50 opacity-90' 
            : 'border-white/20 dark:border-gray-700/50'
        }`}
      >
         {/* Settings Button - Moved to the top of the account information section */}
         <div className="flex justify-between items-center mb-6">
           <h3 className={`text-xl font-bold flex items-center gap-2 transition-colors duration-500 ${
             isBanned ? 'text-red-300' : 'text-white'
           }`}>
             <div className={`w-1 h-6 rounded-full transition-colors duration-500 ${
               isBanned ? 'bg-red-500' : 'bg-yellow-500'
             }`}></div>
             {t.accountInfo}
           </h3>
           
           {isBanned ? (
              <button 
                disabled 
                className="p-2 bg-black/40 text-gray-400 rounded-full cursor-not-allowed border border-gray-700"
              >
                <Lock className="h-5 w-5" />
              </button>
           ) : (
              <Link href="/settings">
                <button className="p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 text-white rounded-full transition-all border border-white/30">
                  <Settings className="h-5 w-5" />
                </button>
              </Link>
           )}
         </div>

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

        <div className="space-y-4">
          {/* Primary Email */}
          <div className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
             isBanned ? 'bg-red-900/30' : 'bg-white/10 hover:bg-white/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl transition-colors duration-300 ${
                isBanned ? 'bg-red-800/50 text-red-400' : 'bg-blue-600/20 text-blue-400'
              }`}>
                <Mail className="h-6 w-6" />
              </div>
              <div>
                <p className={`text-sm font-medium transition-colors duration-300 ${isBanned ? 'text-red-300' : 'text-gray-400'}`}>{t.primaryEmail}</p>
                <p className={`font-semibold transition-colors duration-300 ${isBanned ? 'text-red-200' : 'text-white'}`}>{session.user?.email}</p>
              </div>
            </div>
            <span className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-300 ${
              isBanned ? 'bg-red-800 text-red-100' : 'bg-green-600/20 text-green-400'
            }`}>
              {isBanned ? t.bannedStatus : t.primary}
            </span>
          </div>

          {/* Secondary Emails (Loop) */}
          {secondaryEmails.map((emailObj, index) => (
            <div key={index} className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
                isBanned ? 'bg-red-900/30 opacity-70' : 'bg-white/10 hover:bg-white/20'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors duration-300 ${
                    isBanned ? 'bg-red-800/50 text-red-400' : 'bg-purple-600/20 text-purple-400'
                }`}>
                  <MailPlus className="h-6 w-6" />
                </div>
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${isBanned ? 'text-red-300' : 'text-gray-400'}`}>{t.secondaryEmails}</p>
                  <p className={`font-semibold transition-colors duration-300 ${isBanned ? 'text-red-200' : 'text-white'}`}>{emailObj.email}</p>
                </div>
              </div>
              <span className={`px-3 py-1 text-sm font-medium rounded-full transition-colors duration-300 ${
                isBanned 
                    ? 'bg-red-800 text-red-100'
                    : emailObj.isVerified ? 'bg-green-600/20 text-green-400' : 'bg-yellow-600/20 text-yellow-400'
              }`}>
                {isBanned ? t.bannedStatus : (emailObj.isVerified ? t.verified : t.notVerified)}
              </span>
            </div>
          ))}

          {/* Member Since */}
          <div className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
             isBanned ? 'bg-red-900/30' : 'bg-white/10 hover:bg-white/20'
          }`}>
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-xl transition-colors duration-300 ${
                 isBanned ? 'bg-red-800/50 text-red-400' : 'bg-green-600/20 text-green-400'
              }`}>
                <Calendar className="h-6 w-6" />
              </div>
              <div>
                <p className={`text-sm font-medium transition-colors duration-300 ${isBanned ? 'text-red-300' : 'text-gray-400'}`}>{t.memberSince}</p>
                <p className={`font-semibold transition-colors duration-300 ${isBanned ? 'text-red-200' : 'text-white'}`}>
                  {createdAt ? t.formatDate(createdAt) : "Unknown"}
                </p>
              </div>
            </div>
             {isBanned && (
                <div className="px-4 py-2 bg-red-800 text-red-100 rounded-full font-bold">
                    <Lock className="h-4 w-4 inline-block" />
                </div>
             )}
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
      </GlassCard>
    </>
  )

  // ---------------------------------------------------------
  // MAIN RENDER
  // ---------------------------------------------------------
  return (
    <div className={`min-h-screen relative overflow-hidden bg-black ${isRTL ? 'rtl' : 'ltr'}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Dynamic Background */}
      <Background isBanned={isBanned} />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12 relative z-10">
        {renderProfileContent(isBanned)}
      </div>
      
      <style jsx global>{`
        /* Global Twinkle Keyframes */
        @keyframes twinkle {
          0% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
          100% { opacity: 0.2; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}