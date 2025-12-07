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
  UserX,
  Shield,
  MapPin,
  Globe,
  FileText
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

// تعريف واجهة للمستخدم
interface User {
  _id: string;
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
    _id: string;
    email: string;
    isVerified: boolean;
  }>;
}

// Translation object
const translations = {
  ar: {
    title: "تفاصيل المستخدم",
    back: "العودة إلى قائمة المستخدمين",
    edit: "تعديل المستخدم",
    name: "الاسم",
    email: "البريد الإلكتروني",
    role: "الدور",
    status: "الحالة",
    joined: "تاريخ الانضمام",
    lastLogin: "آخر تسجيل دخول",
    primaryEmail: "البريد الإلكتروني الأساسي",
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
    noLocation: "لا يوجد موقع",
    noWebsite: "لا يوجد موقع إلكتروني",
    bio: "نبذة شخصية", // Added missing translation
    location: "الموقع", // Added missing translation
    website: "الموقع الإلكتروني", // Added missing translation
    banUser: "حظر المستخدم",
    unbanUser: "إلغاء حظر المستخدم",
    confirmBan: "هل أنت متأكد من حظر هذا المستخدم؟",
    confirmUnban: "هل أنت متأكد من إلغاء حظر هذا المستخدم؟",
    userBanned: "تم حظر المستخدم بنجاح",
    userUnbanned: "تم إلغاء حظر المستخدم بنجاح",
    error: "حدث خطأ ما",
    loading: "جاري التحميل...",
    userNotFound: "لم يتم العثور على المستخدم",
    basicInfo: "المعلومات الأساسية",
    profileInfo: "معلومات الملف الشخصي",
    contactInfo: "معلومات الاتصال",
    accountStatus: "حالة الحساب"
  },
  en: {
    title: "User Details",
    back: "Back to Users List",
    edit: "Edit User",
    name: "Name",
    email: "Email",
    role: "Role",
    status: "Status",
    joined: "Joined",
    lastLogin: "Last Login",
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
    noLocation: "No location",
    noWebsite: "No website",
    bio: "Bio", // Added missing translation
    location: "Location", // Added missing translation
    website: "Website", // Added missing translation
    banUser: "Ban User",
    unbanUser: "Unban User",
    confirmBan: "Are you sure you want to ban this user?",
    confirmUnban: "Are you sure you want to unban this user?",
    userBanned: "User banned successfully",
    userUnbanned: "User unbanned successfully",
    error: "Something went wrong",
    loading: "Loading...",
    userNotFound: "User not found",
    basicInfo: "Basic Information",
    profileInfo: "Profile Information",
    contactInfo: "Contact Information",
    accountStatus: "Account Status"
  }
};

export default function UserDetailPage({ params }: { params: Promise<{ id: string }> }) {
  // فك params باستخدام use
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showBanModal, setShowBanModal] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  // استخدام useCallback لتثبيت الدالة
  const fetchUser = useCallback(async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/admin/users/${id}`)
      
      if (response.ok) {
        const userData = await response.json()
        setUser(userData)
      } else {
        console.error("Failed to fetch user")
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

  const handleBanUser = async () => {
    if (!user) return
    
    try {
      setActionLoading(true)
      const response = await fetch(`/api/admin/users/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          banned: !user.banned
        })
      })
      
      if (response.ok) {
        setShowBanModal(false)
        fetchUser()
        // إظهار رسالة نجاح
        alert(user.banned ? t.userUnbanned : t.userBanned)
      } else {
        alert(t.error)
      }
    } catch (error) {
      console.error("Error banning/unbanning user:", error)
      alert(t.error)
    } finally {
      setActionLoading(false)
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return "N/A"
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-4 text-gray-500">{t.loading}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.userNotFound}</h1>
          <Link href="/admin/users">
            <button className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors">
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
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8 flex items-center justify-between"
        >
          <div>
            <Link href="/admin/users" className="flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 mb-4">
              <ArrowLeft className="h-5 w-5 mr-2" />
              {t.back}
            </Link>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
          </div>
          <div className="flex space-x-4">
            <Link href={`/admin/users/${user._id}/edit`}>
              <button className="flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors">
                <Edit className="h-5 w-5 mr-2" />
                {t.edit}
              </button>
            </Link>
            <button
              onClick={() => setShowBanModal(true)}
              className={`flex items-center px-4 py-2 rounded-md transition-colors ${
                user.banned 
                  ? 'bg-green-600 hover:bg-green-700 text-white' 
                  : 'bg-red-600 hover:bg-red-700 text-white'
              }`}
            >
              {user.banned ? (
                <>
                  <UserCheck className="h-5 w-5 mr-2" />
                  {t.unbanUser}
                </>
              ) : (
                <>
                  <UserX className="h-5 w-5 mr-2" />
                  {t.banUser}
                </>
              )}
            </button>
          </div>
        </motion.div>

        {/* User Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden mb-8"
        >
          <div className="relative h-32 bg-gradient-to-r from-blue-500 to-indigo-600">
            {user.banner ? (
              <Image
                src={user.banner}
                alt="Profile Banner"
                fill
                className="object-cover"
              />
            ) : null}
          </div>
          <div className="px-6 pb-6">
            <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between -mt-16 sm:-mt-8">
              <div className="flex flex-col sm:flex-row items-center sm:items-end space-y-4 sm:space-y-0 sm:space-x-4">
                <div className="relative">
                  {user.image ? (
                    <Image
                      src={user.image}
                      alt={user.name}
                      width={120}
                      height={120}
                      className="rounded-full border-4 border-white dark:border-gray-800"
                    />
                  ) : (
                    <div className="h-30 w-30 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center border-4 border-white dark:border-gray-800">
                      <User className="h-16 w-16 text-gray-500 dark:text-gray-400" />
                    </div>
                  )}
                  <div className={`absolute bottom-0 right-0 h-6 w-6 rounded-full ${user.isActive ? 'bg-green-400' : 'bg-gray-400'} border-2 border-white dark:border-gray-800`}></div>
                </div>
                <div className="text-center sm:text-left">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{user.name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 mt-4 sm:mt-0">
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  user.role === 'owner' 
                    ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                    : user.role === 'editor'
                    ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                    : user.role === 'admin'
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}>
                  {user.role === 'owner' ? t.owner : 
                   user.role === 'editor' ? t.editor : 
                   user.role === 'admin' ? t.admin : t.user}
                </span>
                <span className={`inline-flex px-3 py-1 text-sm font-semibold rounded-full ${
                  user.banned 
                    ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                    : user.isActive
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {user.banned ? t.banned : 
                   user.isActive ? t.active : t.inactive}
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* User Details */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 px-6 py-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <User className="h-5 w-5 mr-2" />
                  {t.basicInfo}
                </h3>
              </div>
              <div className="p-6">
                <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.name}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">{user.name}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.email}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user.email}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.role}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.role === 'owner' 
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200'
                          : user.role === 'editor'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : user.role === 'admin'
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {user.role === 'owner' ? t.owner : 
                         user.role === 'editor' ? t.editor : 
                         user.role === 'admin' ? t.admin : t.user}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.status}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        user.banned 
                          ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          : user.isActive
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                      }`}>
                        {user.banned ? t.banned : 
                         user.isActive ? t.active : t.inactive}
                      </span>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.joined}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(user.createdAt)}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.lastLogin}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                      {formatDate(user.lastLogin)}
                    </dd>
                  </div>
                </dl>
              </div>
            </motion.div>

            {/* Profile Information */}
            {(user.bio || user.location || user.website) && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
              >
                <div className="bg-gradient-to-r from-purple-500 to-pink-600 px-6 py-4">
                  <h3 className="text-lg font-medium text-white flex items-center">
                    <FileText className="h-5 w-5 mr-2" />
                    {t.profileInfo}
                  </h3>
                </div>
                <div className="p-6">
                  <dl className="grid grid-cols-1 gap-x-4 gap-y-6 sm:grid-cols-2">
                    {user.bio && (
                      <div className="sm:col-span-2">
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.bio}</dt>
                        <dd className="mt-1 text-sm text-gray-600 dark:text-gray-400">{user.bio}</dd>
                      </div>
                    )}
                    {user.location && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.location}</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {user.location}
                        </dd>
                      </div>
                    )}
                    {user.website && (
                      <div>
                        <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.website}</dt>
                        <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                          <Globe className="h-4 w-4 mr-2 text-gray-400" />
                          <a href={user.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300">
                            {user.website}
                          </a>
                        </dd>
                      </div>
                    )}
                  </dl>
                </div>
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Email Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <Mail className="h-5 w-5 mr-2" />
                  {t.contactInfo}
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div>
                    <dt className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.primaryEmail}</dt>
                    <dd className="mt-1 text-sm text-gray-900 dark:text-white flex items-center">
                      <Mail className="h-4 w-4 mr-2 text-gray-400" />
                      {user.email}
                      <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                        <Check className="h-3 w-3 mr-1" />
                        {t.verified}
                      </span>
                    </dd>
                  </div>
                  
                  {user.secondaryEmails && user.secondaryEmails.length > 0 && (
                    <div>
                      <dt className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">{t.secondaryEmails}</dt>
                      <dd className="space-y-2">
                        {user.secondaryEmails.map((email, index) => (
                          <div key={index} className="flex items-center justify-between text-sm text-gray-900 dark:text-white bg-gray-50 dark:bg-gray-700 p-2 rounded">
                            <div className="flex items-center">
                              <Mail className="h-4 w-4 mr-2 text-gray-400" />
                              {email.email}
                            </div>
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              email.isVerified
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}>
                              {email.isVerified ? (
                                <>
                                  <Check className="h-3 w-3 mr-1" />
                                  {t.verified}
                                </>
                              ) : (
                                <>
                                  <X className="h-3 w-3 mr-1" />
                                  {t.notVerified}
                                </>
                              )}
                            </span>
                          </div>
                        ))}
                      </dd>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Account Status */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
            >
              <div className="bg-gradient-to-r from-red-500 to-orange-600 px-6 py-4">
                <h3 className="text-lg font-medium text-white flex items-center">
                  <Shield className="h-5 w-5 mr-2" />
                  {t.accountStatus}
                </h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Account Active</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.isActive
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {user.isActive ? t.active : t.inactive}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Banned</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.banned
                        ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                        : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                    }`}>
                      {user.banned ? t.banned : t.active}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Email Verified</span>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      user.emailVerified
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                    }`}>
                      {user.emailVerified ? t.verified : t.notVerified}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Ban/Unban Confirmation Modal */}
      {showBanModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
          >
            <div className="mt-3 text-center">
              <div className={`mx-auto flex items-center justify-center h-12 w-12 rounded-full ${user.banned ? 'bg-green-100 dark:bg-green-900' : 'bg-red-100 dark:bg-red-900'}`}>
                {user.banned ? (
                  <UserCheck className="h-6 w-6 text-green-600 dark:text-green-400" />
                ) : (
                  <UserX className="h-6 w-6 text-red-600 dark:text-red-400" />
                )}
              </div>
              <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white mt-4">
                {user.banned ? t.confirmUnban : t.confirmBan}
              </h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {user.name} ({user.email})
                </p>
              </div>
              <div className="items-center px-4 py-3">
                <button
                  onClick={() => setShowBanModal(false)}
                  className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md w-24 mr-2 hover:bg-gray-400 dark:hover:bg-gray-500"
                >
                  Cancel
                </button>
                <button
                  onClick={handleBanUser}
                  disabled={actionLoading}
                  className={`px-4 py-2 text-white text-base font-medium rounded-md w-24 disabled:opacity-50 ${
                    user.banned 
                      ? 'bg-green-600 hover:bg-green-700' 
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {actionLoading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    user.banned ? t.unbanUser : t.banUser
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}