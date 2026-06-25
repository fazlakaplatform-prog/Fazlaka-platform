"use client"

import { useState, useEffect } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { User, Mail, Calendar, Settings, Lock, MailPlus, MessageCircle, Users, UserPlus, Check, X, Search, Copy, UserCheck, Eye, Share2, Link2 } from "lucide-react"
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
    accountSuspended: "تم تعليق الحساب",
    suspendedMessage: "هذا الحساب معلق ولا يمكن الوصول إلى الإعدادات. يرجى التواصل مع الدعم للمزيد من التفاصيل.",
    contactSupport: "تواصل مع الدعم",
    bannedStatus: "محظور",
    verified: "موثق",
    notVerified: "غير موثق",
    primary: "أساسي",
    goToChat: "الذهاب للمحادثات",
    friendsTitle: "الأصدقاء",
    pendingRequests: "طلبات الصداقة المعلقة",
    noFriends: "لا يوجد أصدقاء بعد.",
    noRequests: "لا توجد طلبات معلقة.",
    accept: "قبول",
    reject: "رفض",
    // New Keys
    userCode: "كود المستخدم",
    copyCode: "نسخ الكود",
    copied: "تم النسخ!",
    addFriend: "إضافة صديق",
    searchFriends: "البحث عن أصدقاء",
    searchPlaceholder: "ابحث بالاسم أو الكود...",
    noUsersFound: "لا يوجد مستخدمين بهذا الاسم أو الكود.",
    sendRequest: "إرسال طلب",
    requestSent: "تم الإرسال",
    viewProfile: "عرض الملف",
    shareProfile: "مشاركة الملف",
    copyLink: "نسخ الرابط",
    linkCopied: "تم نسخ الرابط!",
    newsletter: "النشرة البريدية",
    newsletterActive: "مشترك",
    newsletterNotSubscribed: "غير مشترك",
    unsubscribe: "إلغاء الاشتراك",
    newsletterStatus: "حالة الاشتراك",
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
    goToChat: "Go to Chats",
    friendsTitle: "Friends",
    pendingRequests: "Pending Friend Requests",
    noFriends: "No friends yet.",
    noRequests: "No pending requests.",
    accept: "Accept",
    reject: "Reject",
    // New Keys
    userCode: "User Code",
    copyCode: "Copy Code",
    copied: "Copied!",
    addFriend: "Add Friend",
    searchFriends: "Find Friends",
    searchPlaceholder: "Search by name or code...",
    noUsersFound: "No users found with that name or code.",
    sendRequest: "Send Request",
    requestSent: "Sent",
    viewProfile: "View Profile",
    shareProfile: "Share Profile",
    copyLink: "Copy Link",
    linkCopied: "Link Copied!",
    newsletter: "Newsletter",
    newsletterActive: "Subscribed",
    newsletterNotSubscribed: "Not subscribed",
    unsubscribe: "Unsubscribe",
    newsletterStatus: "Subscription Status",
    formatDate: (date: Date) => {
      return new Intl.DateTimeFormat('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }).format(date)
    }
  }
};

// Interface for Friendship objects returned from API
interface Friendship {
  id: string;
  status: string;
  requesterId: string;
  receiverId: string;
  requester: { id: string; name: string | null; image: string | null; };
  receiver: { id: string; name: string | null; image: string | null; };
}

// Interface for Search Result User
interface SearchResultUser {
  id: string;
  name: string | null;
  image: string | null;
  bio: string | null;
}

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
  
  // Friends State
  const [pendingRequests, setPendingRequests] = useState<Friendship[]>([])
  const [friends, setFriends] = useState<Friendship[]>([])

  // Search & Code State
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<SearchResultUser[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false) // New: to track if search happened
  const [sentRequests, setSentRequests] = useState<string[]>([])
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false) // New: for profile link
  const [nlSubscribed, setNlSubscribed] = useState<boolean | null>(null)
  const [nlUnsubscribing, setNlUnsubscribing] = useState(false)

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

    const fetchFriendsData = async () => {
      try {
        const res = await fetch('/api/friends')
        if (res.ok) {
          const data: Friendship[] = await res.json()
          setPendingRequests(data.filter((f) => f.status === 'PENDING' && f.receiverId === session?.user?.id))
          setFriends(data.filter((f) => f.status === 'ACCEPTED'))
          const sent = data.filter((f) => f.status === 'PENDING' && f.requesterId === session?.user?.id).map(f => f.receiverId)
          setSentRequests(sent)
        }
      } catch {
        console.error("Error fetching friends data")
      }
    }

    const fetchNLStatus = async () => {
      if (!session?.user?.email) return;
      try {
        const res = await fetch(`/api/newsletter/preferences?email=${encodeURIComponent(session.user.email)}`);
        const json = await res.json();
        setNlSubscribed(json.data?.status === 'ACTIVE');
      } catch { setNlSubscribed(false); }
    };

    fetchUserData()
    fetchFriendsData()
    fetchNLStatus()
  }, [session, status, router])

  // Copy User Code Function
  const handleCopyCode = () => {
    if (session?.user?.id) {
      navigator.clipboard.writeText(session.user.id)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    }
  }

  // New: Copy Profile Link Function
  const handleCopyLink = () => {
    if (typeof window !== 'undefined' && session?.user?.id) {
      const profileUrl = `${window.location.origin}/users/${session.user.id}`
      navigator.clipboard.writeText(profileUrl)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    }
  }

  // Search Users Function
  const handleSearch = async () => {
    if (!searchQuery) return
    
    setIsSearching(true)
    setHasSearched(true) // Set search attempted
    try {
      const res = await fetch(`/api/users/search?q=${searchQuery}`)
      if (res.ok) {
        const data = await res.json()
        setSearchResults(data.users)
      }
    } catch (error) {
      console.error("Search failed", error)
    } finally {
      setIsSearching(false)
    }
  }

  const handleSendRequest = async (receiverId: string) => {
    try {
      const res = await fetch('/api/friends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ receiverId })
      })
      
      if (res.ok) {
        setSentRequests(prev => [...prev, receiverId])
      } else {
        const data = await res.json()
        alert(data.error || "Error sending request")
      }
    } catch (error) {
      console.error("Error sending request", error)
    }
  }

  const handleAcceptRequest = async (requesterId: string) => {
    await fetch('/api/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ requesterId, action: 'ACCEPT' }),
      headers: { 'Content-Type': 'application/json' }
    })
    setPendingRequests(prev => prev.filter(r => r.requester.id !== requesterId))
    const res = await fetch('/api/friends')
    if(res.ok) {
       const data: Friendship[] = await res.json()
       setFriends(data.filter((f) => f.status === 'ACCEPTED'))
    }
  }

  const handleRejectRequest = async (requesterId: string) => {
    await fetch('/api/friends/accept', {
      method: 'POST',
      body: JSON.stringify({ requesterId, action: 'REJECT' }),
      headers: { 'Content-Type': 'application/json' }
    })
    setPendingRequests(prev => prev.filter(r => r.requester.id !== requesterId))
  }

  const Background = ({ isBanned = false }: { isBanned?: boolean }) => (
    <>
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

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-gray-900">
        <Background />
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-yellow-400 z-10"></div>
      </div>
    )
  }

  if (!session) return null

  return (
    <div className={`min-h-screen relative overflow-hidden bg-black ${isRTL ? 'rtl' : 'ltr'}`} style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <Background isBanned={isBanned} />

      <div className="max-w-4xl mx-auto px-4 pt-24 pb-12 relative z-10">
        
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
            
            <div className={`absolute inset-0 transition-all duration-500 ${
                isBanned 
                    ? 'bg-red-900/40'
                    : 'bg-gradient-to-t from-black/10 to-transparent'
            }`}></div>

            {isBanned && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
                    <Lock className="w-16 h-16 text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,1)] animate-pulse" />
                </div>
            )}
          </div>
          
          <div className="px-8 pb-8 pt-4">
            <div className="flex flex-col md:flex-row items-center md:items-end -mt-20 mb-6 gap-6">
              
              <div className={`relative group transition-all duration-500 z-20`}>
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
                  {isBanned && (
                     <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 rounded-full">
                         <Lock className="w-10 h-10 text-red-400 drop-shadow" />
                     </div>
                  )}
                </div>
              </div>

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

        {/* User Code & Share Link Card */}
        {!isBanned && (
          <GlassCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.05 }}
            className="bg-gradient-to-r from-indigo-900/40 to-purple-900/40 backdrop-blur-lg rounded-2xl p-6 shadow-xl border border-white/10 mb-8"
          >
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                   <UserCheck className="w-6 h-6 text-indigo-300" />
                </div>
                <div>
                   <h3 className="text-white font-bold">{t.userCode}</h3>
                   <p className="text-xs text-gray-400 font-mono">{session.user?.id}</p>
                </div>
              </div>
              
              <div className="flex gap-2 flex-wrap">
                <button 
                  onClick={handleCopyCode}
                  className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-all text-white text-sm border border-white/10"
                >
                   {copiedCode ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                   {copiedCode ? t.copied : t.copyCode}
                </button>

                <button 
                  onClick={handleCopyLink}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600/30 hover:bg-blue-600/50 rounded-lg transition-all text-blue-300 text-sm border border-blue-400/30"
                >
                   {copiedLink ? <Check className="w-4 h-4" /> : <Link2 className="w-4 h-4" />}
                   {copiedLink ? t.linkCopied : t.copyLink}
                </button>
              </div>
            </div>
          </GlassCard>
        )}

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
           <div className="flex justify-between items-center mb-6">
             <h3 className={`text-xl font-bold flex items-center gap-2 transition-colors duration-500 ${
               isBanned ? 'text-red-300' : 'text-white'
             }`}>
               <div className={`w-1 h-6 rounded-full transition-colors duration-500 ${
                 isBanned ? 'bg-red-500' : 'bg-yellow-500'
               }`}></div>
               {t.accountInfo}
             </h3>
             
              <div className="flex gap-2">
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

            <div className={`flex items-center justify-between p-4 rounded-2xl transition-all duration-300 ${
               isBanned ? 'bg-red-900/30' : 'bg-white/10 hover:bg-white/20'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-xl transition-colors duration-300 ${
                   isBanned ? 'bg-red-800/50 text-red-400' : 'bg-indigo-600/20 text-indigo-400'
                }`}>
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <p className={`text-sm font-medium transition-colors duration-300 ${isBanned ? 'text-red-300' : 'text-gray-400'}`}>{t.newsletterStatus}</p>
                  <p className={`font-semibold transition-colors duration-300 ${isBanned ? 'text-red-200' : 'text-white'}`}>
                    {nlSubscribed === null ? '...' : nlSubscribed ? t.newsletterActive : t.newsletterNotSubscribed}
                  </p>
                </div>
              </div>
              {nlSubscribed === true && !isBanned && (
                <button
                  onClick={async () => {
                    setNlUnsubscribing(true);
                    try {
                      await fetch('/api/newsletter/unsubscribe', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ email: session?.user?.email }),
                      });
                      setNlSubscribed(false);
                    } catch {}
                    setNlUnsubscribing(false);
                  }}
                  disabled={nlUnsubscribing}
                  className="px-3 py-1.5 text-xs font-medium rounded-full bg-red-600/20 text-red-400 hover:bg-red-600/40 transition-all disabled:opacity-50"
                >
                  {nlUnsubscribing ? '...' : t.unsubscribe}
                </button>
              )}
            </div>

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

        {/* Search & Add Friend Section */}
        {!isBanned && (
          <GlassCard
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/10 backdrop-blur-lg rounded-[2rem] p-8 shadow-xl border border-white/20 mt-8"
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-1 h-6 rounded-full bg-purple-500"></div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-purple-400" />
                {t.searchFriends}
              </h3>
            </div>

            <div className="flex gap-2 mb-4">
              <div className="relative flex-1">
                <Search className="absolute top-1/2 left-3 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input 
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500 transition-all"
                />
              </div>
              <button 
                onClick={handleSearch}
                disabled={isSearching}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-semibold disabled:opacity-50"
              >
                {isSearching ? "..." : t.searchFriends}
              </button>
            </div>

            {/* Search Results */}
            {searchResults.length > 0 ? (
              <div className="space-y-3 mt-4 border-t border-white/10 pt-4">
                {searchResults.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                        {user.image ? <Image src={user.image} alt="" width={40} height={40} /> : <User className="w-full h-full p-2 text-gray-400"/>}
                      </div>
                      <div>
                        <span className="font-medium text-white block">{user.name || "User"}</span>
                        <span className="text-xs text-gray-500 truncate max-w-[150px] block">{user.bio || user.id}</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2">
                       {/* View Profile Button */}
                       <Link href={`/users/${user.id}`}>
                         <button className="p-2 bg-white/10 hover:bg-white/20 rounded-full text-white transition-all" title={t.viewProfile}>
                           <Eye className="w-4 h-4" />
                         </button>
                       </Link>

                       {/* Add Friend Button Logic */}
                        {sentRequests.includes(user.id) ? (
                           <button disabled className="px-4 py-1 bg-gray-600 text-gray-300 rounded-full text-sm font-medium cursor-not-allowed">
                             {t.requestSent}
                           </button>
                        ) : friends.some(f => (f.requester.id === user.id || f.receiver.id === user.id)) ? (
                           <span className="text-xs text-green-400 bg-green-900/30 px-3 py-1 rounded-full flex items-center">
                             {t.friendsTitle}
                           </span>
                        ) : (
                          <button 
                            onClick={() => handleSendRequest(user.id)}
                            className="px-4 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full text-sm font-medium transition-all"
                          >
                            {t.sendRequest}
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
               // Only show "No users found" if search happened and results are empty
               hasSearched && !isSearching && (
                 <p className="text-center text-gray-500 mt-4 text-sm">{t.noUsersFound}</p>
               )
            )}
          </GlassCard>
        )}

        {/* Friends Section */}
        {!isBanned && (
          <div className="mt-8 space-y-8">
              {pendingRequests.length > 0 && (
                <GlassCard
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.3 }}
                  className="bg-white/10 backdrop-blur-lg rounded-[2rem] p-8 shadow-xl border border-yellow-400/20"
                >
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-1 h-6 rounded-full bg-yellow-500"></div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <UserPlus className="w-5 h-5 text-yellow-400" />
                      {t.pendingRequests} ({pendingRequests.length})
                    </h3>
                  </div>
                  
                  <div className="space-y-3">
                    {pendingRequests.map((req) => (
                      <div key={req.id} className="flex items-center justify-between p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gray-700 overflow-hidden">
                            {req.requester.image ? <Image src={req.requester.image} alt="" width={40} height={40} /> : <User className="w-full h-full p-2 text-gray-400"/>}
                          </div>
                          <span className="font-medium text-white">{req.requester.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <button onClick={() => handleAcceptRequest(req.requester.id)} className="p-2 bg-green-600 hover:bg-green-700 rounded-full text-white transition-colors"><Check className="w-4 h-4"/></button>
                          <button onClick={() => handleRejectRequest(req.requester.id)} className="p-2 bg-red-600 hover:bg-red-700 rounded-full text-white transition-colors"><X className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </GlassCard>
              )}

              <GlassCard
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="bg-white/10 backdrop-blur-lg rounded-[2rem] p-8 shadow-xl border border-white/20"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-1 h-6 rounded-full bg-blue-500"></div>
                    <h3 className="text-xl font-bold text-white flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      {t.friendsTitle} ({friends.length})
                    </h3>
                  </div>
                  <Link href="/chat_friends">
                     <button className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-full text-sm font-semibold transition-all shadow-lg">
                        <MessageCircle className="w-4 h-4" /> {t.goToChat}
                     </button>
                  </Link>
                </div>

                {friends.length === 0 ? (
                  <p className="text-gray-500 text-center py-4">{t.noFriends}</p>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {friends.map((friendship) => {
                      const friend = friendship.requester.id === session?.user?.id ? friendship.receiver : friendship.requester;
                      return (
                        <Link href={`/chat_friends?userId=${friend.id}`} key={friendship.id} className="flex items-center gap-3 p-3 bg-white/5 rounded-xl hover:bg-white/10 transition-colors group cursor-pointer">
                          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 p-[2px]">
                            <div className="w-full h-full rounded-full bg-gray-800 overflow-hidden">
                              {friend.image ? <Image src={friend.image} alt="" width={48} height={48} className="object-cover" /> : <User className="w-full h-full p-2 text-gray-400"/>}
                            </div>
                          </div>
                          <div>
                            <p className="font-semibold text-white group-hover:text-yellow-400 transition-colors">{friend.name}</p>
                            <p className="text-xs text-gray-500">{t.profile}</p>
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                )}
              </GlassCard>
          </div>
        )}
      </div>
      
      <style jsx global>{`
        @keyframes twinkle {
          0% { opacity: 0.2; transform: scale(0.8); }
          50% { opacity: 0.8; transform: scale(1.2); }
          100% { opacity: 0.2; transform: scale(0.8); }
        }
      `}</style>
    </div>
  )
}