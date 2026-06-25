// src/app/admin/users/[id]/page.tsx
"use client"

import { useState, useEffect, useCallback, use } from "react"
import { motion } from "framer-motion"
import { 
  ArrowLeft, 
  Edit, 
  Mail, 
  Calendar, 
  User, 
  Check, 
  X, 
  UserCheck, 
  Shield,
  MapPin,
  Globe,
  FileText,
  Info,
  Clock,
  History,
  MessageCircle,
  Sparkles,
  MessageSquare
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

// تعريف واجهة للمستخدم
interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  bio?: string;
  location?: string;
  website?: string;
  image?: string;
  banner?: string;
  isActive: boolean;
  banned: boolean;
  emailVerified: boolean;
  createdAt?: string;
  lastLogin?: string;
  secondaryEmails?: Array<{
    id: string;
    email: string;
    isVerified: boolean;
  }>;
}

// Translation object
const translations = {
  ar: {
    title: "تفاصيل المستخدم",
    back: "العودة إلى المستخدمين",
    edit: "تعديل البيانات",
    name: "الاسم الكامل",
    email: "البريد الإلكتروني",
    role: "الدور الوظيفي",
    status: "الحالة",
    joined: "تاريخ الانضمام",
    lastLogin: "آخر نشاط",
    primaryEmail: "البريد الأساسي",
    secondaryEmails: "البريد الإلكتروني الثانوي",
    verified: "موثق",
    notVerified: "غير موثق",
    active: "نشط",
    inactive: "غير نشط",
    banned: "محظور",
    user: "مستخدم",
    owner: "مالك",
    editor: "محرر",
    admin: "مدير",
    noBio: "لا توجد نبذة شخصية",
    bio: "نبذة شخصية",
    location: "الموقع",
    website: "الموقع الإلكتروني",
    noLocation: "غير محدد",
    noWebsite: "غير محدد",
    error: "حدث خطأ ما",
    loading: "جاري تحميل البيانات...",
    userNotFound: "المستخدم غير موجود",
    basicInfo: "المعلومات الأساسية",
    profileInfo: "الملف الشخصي",
    contactInfo: "معلومات التواصل",
    accountStatus: "حالة الحساب",
    activityLog: "سجل النشاط",
    // --- أدوات الإدارة ---
    adminTools: "أدوات الإدارة",
    viewActivity: "عرض سجل النشاط",
    viewChats: "عرض سجل المحادثات",
    viewAIChats: "سجل محادثات الذكاء الاصطناعي",
    viewComments: "إدارة تعليقات المستخدم"
  },
  en: {
    title: "User Details",
    back: "Back to Users",
    edit: "Edit Data",
    name: "Full Name",
    email: "Email Address",
    role: "Role",
    status: "Status",
    joined: "Joined Date",
    lastLogin: "Last Activity",
    primaryEmail: "Primary Email",
    secondaryEmails: "Secondary Emails",
    verified: "Verified",
    notVerified: "Not Verified",
    active: "Active",
    inactive: "Inactive",
    banned: "Banned",
    user: "User",
    owner: "Owner",
    editor: "Editor",
    admin: "Admin",
    noBio: "No bio available",
    bio: "Bio",
    location: "Location",
    website: "Website",
    noLocation: "Not specified",
    noWebsite: "Not specified",
    error: "Something went wrong",
    loading: "Loading user data...",
    userNotFound: "User not found",
    basicInfo: "Basic Information",
    profileInfo: "Profile Information",
    contactInfo: "Contact Information",
    accountStatus: "Account Status",
    activityLog: "Activity Log",
    // --- Admin Tools ---
    adminTools: "Admin Tools",
    viewActivity: "View Activity Log",
    viewChats: "View Chat History",
    viewAIChats: "View AI Chats History",
    viewComments: "Manage User Comments"
  }
};

// Animation Variants
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${id}`)
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error("Error fetching user:", error)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchUser()
  }, [fetchUser])

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">{t.loading}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <User className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.userNotFound}</h1>
          <p className="text-gray-500 mb-6">{t.error}</p>
          <Link href="/admin/users">
            <button className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors font-medium">
              {t.back}
            </button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Back Button */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link href="/admin/users" className="inline-flex items-center text-gray-600 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 transition-colors group">
            <ArrowLeft className={`h-5 w-5 ${isRTL ? 'rotate-180' : ''} group-hover:-translate-x-1 transition-transform`} />
            <span className="ml-2 font-medium">{t.back}</span>
          </Link>
        </motion.div>

        {/* Profile Header Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden mb-8"
        >
          {/* Banner */}
          <div className="relative h-48 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600">
            {user.banner && (
              <Image
                src={user.banner}
                alt="Profile Banner"
                fill
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
          </div>

          <div className="relative px-6 pb-6">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between -mt-16">
              {/* Avatar & Info */}
              <div className="flex flex-col md:flex-row items-center md:items-end space-y-4 md:space-y-0 md:space-x-4">
                <div className="relative">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={128}
                      height={128}
                      className="rounded-2xl border-4 border-white dark:border-gray-800 shadow-lg object-cover"
                    />
                  ) : (
                    <div className="h-32 w-32 rounded-2xl bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center border-4 border-white dark:border-gray-800 shadow-lg">
                      <span className="text-5xl font-bold text-white">
                        {user.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div className={`absolute bottom-2 right-2 h-5 w-5 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-gray-400'} border-2 border-white dark:border-gray-800`}></div>
                </div>
                
                <div className="text-center md:text-left pb-2">
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h1>
                  <p className="text-gray-500 dark:text-gray-400">{user.email}</p>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2 mt-3">
                    <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${
                      user.role === 'OWNER' 
                        ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-300'
                        : user.role === 'EDITOR'
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                        : user.role === 'ADMIN'
                        ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                        : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                    }`}>
                      {user.role === 'OWNER' ? t.owner : 
                       user.role === 'EDITOR' ? t.editor : 
                       user.role === 'ADMIN' ? t.admin : t.user}
                    </span>
                    <span className={`inline-flex items-center px-3 py-1 text-xs font-semibold rounded-full ${
                      user.banned 
                        ? 'bg-red-50 text-red-700 dark:bg-red-900/50 dark:text-red-300'
                        : user.isActive
                        ? 'bg-green-50 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                        : 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/50 dark:text-yellow-300'
                    }`}>
                       <span className={`w-2 h-2 rounded-full mr-1.5 ${user.banned ? 'bg-red-500' : user.isActive ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                      {user.banned ? t.banned : user.isActive ? t.active : t.inactive}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="mt-4 md:mt-0 flex justify-center md:justify-end">
                <Link href={`/admin/users/${user.id}/edit`}>
                  <motion.button 
                    whileHover={{ scale: 1.02 }} 
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center px-6 py-2.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl shadow-sm font-medium hover:bg-gray-800 dark:hover:bg-gray-100 transition-colors"
                  >
                    <Edit className="h-4 w-4 mr-2" />
                    {t.edit}
                  </motion.button>
                </Link>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Content Grid */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        >
          {/* Left Column - Main Info */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* Basic Info Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <div className="flex items-center mb-6">
                <div className="p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <Info className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">{t.basicInfo}</h3>
              </div>

              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.name}</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{user.name}</dd>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.role}</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white">
                    {user.role === 'OWNER' ? t.owner : user.role === 'EDITOR' ? t.editor : user.role === 'ADMIN' ? t.admin : t.user}
                  </dd>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.joined}</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white flex items-center">
                    <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDate(user.createdAt)}
                  </dd>
                </div>
                <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.lastLogin}</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white flex items-center">
                    <Clock className="h-4 w-4 mr-2 text-gray-400" />
                    {formatDateTime(user.lastLogin)}
                  </dd>
                </div>
              </dl>
            </motion.div>

            {/* Profile Info Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <div className="flex items-center mb-6">
                <div className="p-2 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <FileText className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">{t.profileInfo}</h3>
              </div>

              <div className="space-y-6">
                <div>
                  <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">{t.bio}</dt>
                  <dd className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                    {user.bio || t.noBio}
                  </dd>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t.location}</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                      {user.location || t.noLocation}
                    </dd>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                    <dt className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">{t.website}</dt>
                    <dd className="mt-1 text-sm font-medium text-gray-900 dark:text-white flex items-center">
                      <Globe className="h-4 w-4 mr-2 text-gray-400" />
                      {user.website ? (
                        <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          {user.website}
                        </a>
                      ) : t.noWebsite}
                    </dd>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Right Column - Sidebar */}
          <div className="space-y-6">
            
            {/* Admin Tools Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <div className="flex items-center mb-6">
                <div className="p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded-lg">
                  <Shield className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">{t.adminTools}</h3>
              </div>

              <div className="space-y-3">
                {/* View Activity Link */}
                <Link href={`/admin/users/${user.id}/activity`}>
                  <motion.div 
                    whileHover={{ scale: 1.02, x: isRTL ? -5 : 5 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <History className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.viewActivity}</span>
                    </div>
                    <ArrowLeft className={`w-4 h-4 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                  </motion.div>
                </Link>

                {/* View Chats Link */}
                <Link href={`/admin/users/${user.id}/chats`}>
                  <motion.div 
                    whileHover={{ scale: 1.02, x: isRTL ? -5 : 5 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.viewChats}</span>
                    </div>
                    <ArrowLeft className={`w-4 h-4 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                  </motion.div>
                </Link>

                {/* View AI Chats Link */}
                <Link href={`/admin/users/${user.id}/ai-chats`}>
                  <motion.div 
                    whileHover={{ scale: 1.02, x: isRTL ? -5 : 5 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.viewAIChats}</span>
                    </div>
                    <ArrowLeft className={`w-4 h-4 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                  </motion.div>
                </Link>

                {/* View User Comments Link */}
                <Link href={`/admin/users/${user.id}/comments`}>
                  <motion.div 
                    whileHover={{ scale: 1.02, x: isRTL ? -5 : 5 }}
                    className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <MessageSquare className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-200">{t.viewComments}</span>
                    </div>
                    <ArrowLeft className={`w-4 h-4 text-gray-400 ${isRTL ? 'rotate-180' : ''}`} />
                  </motion.div>
                </Link>
              </div>
            </motion.div>

            {/* Contact Info Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <div className="flex items-center mb-6">
                <div className="p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <Mail className="h-5 w-5 text-green-600 dark:text-green-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">{t.contactInfo}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.primaryEmail}</label>
                  <div className="mt-2 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                    <div className="flex items-center">
                      <Mail className="h-4 w-4 text-gray-400 mr-2" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white">{user.email}</span>
                    </div>
                    <span className={`flex items-center text-xs font-medium ${user.emailVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                      {user.emailVerified ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                      {user.emailVerified ? t.verified : t.notVerified}
                    </span>
                  </div>
                </div>

                {user.secondaryEmails && user.secondaryEmails.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">{t.secondaryEmails}</label>
                    <div className="mt-2 space-y-2">
                      {user.secondaryEmails.map((email, index) => (
                        <div key={index} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-3 rounded-xl">
                          <span className="text-sm text-gray-700 dark:text-gray-300">{email.email}</span>
                          <span className={`flex items-center text-xs font-medium ${email.isVerified ? 'text-green-600' : 'text-yellow-600'}`}>
                            {email.isVerified ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />}
                            {email.isVerified ? t.verified : t.notVerified}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Account Status Card */}
            <motion.div
              variants={itemVariants}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6"
            >
              <div className="flex items-center mb-6">
                <div className="p-2 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <Shield className="h-5 w-5 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white ml-3">{t.accountStatus}</h3>
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Account Active</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.isActive
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                  }`}>
                    {user.isActive ? t.active : t.inactive}
                  </span>
                </div>
                
                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Ban Status</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.banned
                      ? 'bg-red-100 text-red-800 dark:bg-red-900/50 dark:text-red-300'
                      : 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                  }`}>
                    {user.banned ? t.banned : t.active}
                  </span>
                </div>

                <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
                  <span className="text-sm text-gray-600 dark:text-gray-300">Verification</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    user.emailVerified
                      ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300'
                  }`}>
                    {user.emailVerified ? t.verified : t.notVerified}
                  </span>
                </div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  )
}