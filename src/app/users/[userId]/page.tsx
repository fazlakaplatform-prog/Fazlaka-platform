"use client"

import { useState, useEffect, ReactNode } from "react"
import { useSession } from "next-auth/react"
import { useParams } from "next/navigation"
import { motion } from "framer-motion"
import { User, Calendar, Lock, UserPlus, UserMinus, UserCheck, Users, MessageCircle, Loader2 } from "lucide-react" // Removed Mail icon
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

// تعريف واجهات البيانات
interface UserData {
  id: string; 
  name: string;
  email: string; // Keep in interface for type safety if fetched, but don't display
  primaryEmail: string;
  image?: string;
  banner?: string;
  bio?: string;
  createdAt: string;
  banned?: boolean;
}

interface MutualFriend {
  id: string;
  name: string | null;
  image: string | null;
}

type FriendStatus = 'NONE' | 'PENDING_SENT' | 'PENDING_RECEIVED' | 'ACCEPTED';

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
    bannedStatus: "محظور",
    addFriend: "إضافة صديق",
    cancelRequest: "إلغاء الطلب",
    acceptRequest: "قبول الطلب",
    friends: "أصدقاء",
    message: "رسالة",
    mutualFriends: "أصدقاء مشتركين",
    unfriend: "إلغاء الصداقة",
    loading: "جاري التحميل..."
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
    bannedStatus: "Banned",
    addFriend: "Add Friend",
    cancelRequest: "Cancel Request",
    acceptRequest: "Accept Request",
    friends: "Friends",
    message: "Message",
    mutualFriends: "Mutual Friends",
    unfriend: "Unfriend",
    loading: "Loading..."
  }
};

export default function UserProfilePage() {
  const { data: session } = useSession()
  const params = useParams()
  const { isRTL, language } = useLanguage()
  const [userData, setUserData] = useState<UserData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const t = translations[language]

  // --- Friends State ---
  const [friendStatus, setFriendStatus] = useState<FriendStatus>('NONE')
  const [mutualFriends, setMutualFriends] = useState<MutualFriend[]>([])
  const [isProcessing, setIsProcessing] = useState(false)
  
  const isOwnProfile = session?.user?.id === (params.userId as string);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userId = params.userId as string
        
        const response = await fetch(`/api/user/${userId}`)
        
        if (response.ok) {
          const data: UserData = await response.json()
          setUserData(data)

          if (session?.user && !isOwnProfile) {
            const statusRes = await fetch(`/api/friends/status?userId=${userId}`)
            if (statusRes.ok) {
              const statusData = await statusRes.json()
              setFriendStatus(statusData.status)
              setMutualFriends(statusData.mutualFriends || [])
            }
          }
        } else if (response.status === 404) {
          setError(t.userNotFound)
        } else {
          try {
            const errorData = await response.json()
            setError(errorData.error || t.errorLoadingUser)
          } catch {
            setError(t.errorLoadingUser)
          }
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
  }, [params.userId, t, session, isOwnProfile])

  const handleFriendAction = async (action: 'add' | 'cancel' | 'accept' | 'unfriend') => {
    if (!session || !userData) return;
    setIsProcessing(true);

    try {
      if (action === 'add') {
        await fetch('/api/friends', {
          method: 'POST',
          body: JSON.stringify({ receiverId: userData.id }),
          headers: { 'Content-Type': 'application/json' }
        });
        setFriendStatus('PENDING_SENT');
      } else if (action === 'cancel') {
        await fetch(`/api/friends/cancel?userId=${userData.id}`, { method: 'DELETE' });
        setFriendStatus('NONE');
      } else if (action === 'accept') {
        await fetch('/api/friends/accept', {
          method: 'POST',
          body: JSON.stringify({ requesterId: userData.id, action: 'ACCEPT' }),
          headers: { 'Content-Type': 'application/json' }
        });
        setFriendStatus('ACCEPTED');
      } else if (action === 'unfriend') {
        await fetch(`/api/friends?friendId=${userData.id}`, { method: 'DELETE' });
        setFriendStatus('NONE');
      }
    } catch (error) {
      console.error("Friend action error", error);
    } finally {
      setIsProcessing(false);
    }
  };

  // --- Render Friend Buttons Logic ---
  const renderFriendButtons = () => {
    if (isOwnProfile || !session || !userData) return null;

    if (friendStatus === 'ACCEPTED') {
      return (
        <div className="flex gap-2 items-center">
            <Link href={`/chat_friends?userId=${userData.id}`}>
              <motion.button 
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-full text-sm font-semibold shadow-lg shadow-green-900/30"
              >
                <MessageCircle className="w-4 h-4" /> {t.message}
              </motion.button>
            </Link>
             <motion.button 
                onClick={() => handleFriendAction('unfriend')}
                disabled={isProcessing}
                whileHover={{ scale: 1.05 }}
                className="flex items-center gap-2 px-4 py-2 bg-red-900/50 hover:bg-red-900 text-red-400 rounded-full text-sm font-semibold transition-all border border-red-800"
              >
                <UserMinus className="w-4 h-4" />
             </motion.button>
        </div>
      );
    }

    let icon: ReactNode;
    let text: string;
    let classes: string;
    let action: 'add' | 'cancel' | 'accept' | 'unfriend';

    if (friendStatus === 'PENDING_SENT') {
      icon = <UserMinus className="w-4 h-4" />;
      text = t.cancelRequest;
      classes = "bg-gray-600 hover:bg-gray-700 text-white";
      action = 'cancel';
    } else if (friendStatus === 'PENDING_RECEIVED') {
      icon = <UserCheck className="w-4 h-4" />;
      text = t.acceptRequest;
      classes = "bg-green-600 hover:bg-green-700 text-white animate-pulse";
      action = 'accept';
    } else {
      icon = <UserPlus className="w-4 h-4" />;
      text = t.addFriend;
      classes = "bg-yellow-500 hover:bg-yellow-600 text-black font-bold";
      action = 'add';
    }

    return (
      <motion.button 
        onClick={() => handleFriendAction(action)}
        disabled={isProcessing}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        className={`flex items-center gap-2 px-6 py-2 rounded-full text-sm font-semibold transition-all shadow-lg ${classes}`}
      >
        {isProcessing ? <Loader2 className="w-4 h-4 animate-spin" /> : icon}
        {text}
      </motion.button>
    )
  }

  const Background = ({ isBanned = false }: { isBanned?: boolean }) => (
    <>
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
            
            <div className={`absolute inset-0 transition-all duration-500 ${
              isBanned 
                ? 'bg-red-900/40' 
                : 'bg-gradient-to-t from-yellow-400/20 to-transparent'
            }`}></div>

            {isBanned && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/30 backdrop-blur-sm z-10">
                <Lock className="w-16 h-16 text-red-500 drop-shadow-[0_0_20px_rgba(255,0,0,1)] animate-pulse" />
              </div>
            )}
          </div>
          
          <div className="px-6 pb-6">
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
                {isBanned && (
                  <div className="absolute inset-0 flex items-center justify-center bg-red-900/40 rounded-full">
                    <Lock className="w-10 h-10 text-red-400 drop-shadow" />
                  </div>
                )}
              </div>
              
              <h2 className={`text-2xl font-bold mt-4 transition-colors duration-500 ${
                isBanned 
                  ? 'text-red-400' 
                  : 'text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-yellow-600'
              }`}>
                {userData.name || t.user}
              </h2>
              
              <p className={`text-center mt-2 max-w-md transition-colors duration-500 ${
                isBanned ? 'text-red-300/80' : 'text-gray-600 dark:text-gray-300'
              }`}>
                {userData.bio || t.noBio}
              </p>

              <div className="flex items-center gap-4 mt-4">
                {renderFriendButtons()}
              </div>

              {!isOwnProfile && mutualFriends.length > 0 && friendStatus !== 'ACCEPTED' && (
                <div className="mt-4 w-full max-w-md">
                  <div className="flex items-center gap-2 text-gray-400 text-xs mb-2 justify-center">
                    <Users className="w-3 h-3" />
                    <span>{t.mutualFriends}</span>
                  </div>
                  <div className="flex justify-center -space-x-2 rtl:space-x-reverse">
                    {mutualFriends.slice(0, 5).map(friend => (
                      <div key={friend.id} className="w-8 h-8 rounded-full border-2 border-gray-900 overflow-hidden bg-gray-700">
                        {friend.image ? (
                          <Image src={friend.image} alt={friend.name || ""} width={32} height={32} />
                        ) : (
                          <User className="w-full h-full p-1 text-gray-400"/>
                        )}
                      </div>
                    ))}
                    {mutualFriends.length > 5 && (
                       <div className="w-8 h-8 rounded-full border-2 border-gray-900 bg-gray-800 flex items-center justify-center text-xs text-white">
                         +{mutualFriends.length - 5}
                       </div>
                    )}
                  </div>
                </div>
              )}
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
          <div className={`absolute inset-0 transition-colors duration-500 ${
            isBanned 
              ? 'bg-gradient-to-br from-red-900/20 to-red-800/10' 
              : 'bg-gradient-to-br from-yellow-400/10 to-orange-500/10'
          }`}></div>
          
          <div className="relative z-10 p-8">
            <div className="flex items-center justify-between mb-8">
              <h3 className={`text-2xl font-bold transition-colors duration-500 ${
                isBanned 
                  ? 'text-red-300' 
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent'
              }`}>
                {t.accountInfo}
              </h3>
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
            
            <div className="space-y-6">
              {/* Email Section Removed Here */}

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