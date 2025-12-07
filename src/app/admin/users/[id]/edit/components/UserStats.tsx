// src/app/admin/users/[id]/edit/components/UserStats.tsx

import { motion } from "framer-motion"
import { BarChart3, Calendar, Clock, Activity, Zap, ExternalLink, Mail, Key, Shield, FileText } from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/Language/LanguageProvider"

const translations = {
  ar: {
    userStatistics: "إحصائيات المستخدم",
    totalLogins: "إجمالي عمليات الدخول",
    lastLogin: "آخر عملية دخول",
    accountCreated: "تاريخ إنشاء الحساب",
    lastActivity: "آخر نشاط",
    verificationAttempts: "محاولات التحقق",
    passwordResets: "إعادة تعيين كلمة المرور",
    emailChanges: "تغييرات البريد الإلكتروني",
    viewFullProfile: "عرض الملف الشخصي الكامل",
    noDataAvailable: "لا توجد بيانات متاحة",
    accountStatus: "حالة الحساب",
    isActive: "نشط",
    isBanned: "محظور",
    emailVerified: "البريد الإلكتروني موثق",
    role: "الدور"
  },
  en: {
    userStatistics: "User Statistics",
    totalLogins: "Total Logins",
    lastLogin: "Last Login",
    accountCreated: "Account Created",
    lastActivity: "Last Activity",
    verificationAttempts: "Verification Attempts",
    passwordResets: "Password Resets",
    emailChanges: "Email Changes",
    viewFullProfile: "View Full Profile",
    noDataAvailable: "No data available",
    accountStatus: "Account Status",
    isActive: "Active",
    isBanned: "Banned",
    emailVerified: "Email Verified",
    role: "Role"
  }
};

// Define proper TypeScript interfaces
interface User {
  _id: string;
  isActive: boolean;
  banned: boolean;
  emailVerified: boolean;
  role: string;
  createdAt?: string;
  lastLogin?: string;
  lastActivity?: string;
}

interface UserStatsData {
  totalLogins?: number;
  lastLoginDate?: string;
  verificationAttempts?: number;
  passwordResets?: number;
  emailChanges?: number;
}

interface UserStatsProps {
  userStats: UserStatsData
  user: User
}

export default function UserStats({ userStats, user }: UserStatsProps) {
  const { language, isRTL } = useLanguage()
  const t = translations[language]

  const formatDate = (dateString?: string) => {
    if (!dateString) return t.noDataAvailable
    const date = new Date(dateString)
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-8"
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900 dark:text-white flex items-center">
          <BarChart3 className="h-5 w-5 mr-2" />
          {t.userStatistics}
        </h3>
        <Link 
          href={`/admin/users/${user._id}`}
          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300 flex items-center"
        >
          {t.viewFullProfile}
          <ExternalLink className="h-4 w-4 ml-1" />
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Activity className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className={`ml-4 ${isRTL ? 'mr-4' : ''}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.totalLogins}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{userStats.totalLogins || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
              <Clock className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div className={`ml-4 ${isRTL ? 'mr-4' : ''}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.lastLogin}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(userStats.lastLoginDate || user.lastLogin)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <Calendar className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className={`ml-4 ${isRTL ? 'mr-4' : ''}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.accountCreated}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(user.createdAt)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
              <Zap className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div className={`ml-4 ${isRTL ? 'mr-4' : ''}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.lastActivity}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{formatDate(user.lastActivity)}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-lg">
              <Activity className="h-6 w-6 text-red-600 dark:text-red-400" />
            </div>
            <div className={`ml-4 ${isRTL ? 'mr-4' : ''}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.verificationAttempts}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{userStats.verificationAttempts || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-indigo-100 dark:bg-indigo-900 rounded-lg">
              <Key className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div className={`ml-4 ${isRTL ? 'mr-4' : ''}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.passwordResets}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{userStats.passwordResets || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-teal-100 dark:bg-teal-900 rounded-lg">
              <Mail className="h-6 w-6 text-teal-600 dark:text-teal-400" />
            </div>
            <div className={`ml-4 ${isRTL ? 'mr-4' : ''}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.emailChanges}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">{userStats.emailChanges || 0}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 dark:bg-orange-900 rounded-lg">
              <Shield className="h-6 w-6 text-orange-600 dark:text-orange-400" />
            </div>
            <div className={`ml-4 ${isRTL ? 'mr-4' : ''}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.accountStatus}</p>
              <div className="flex items-center mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.isActive 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-gray-200 text-gray-800 dark:bg-gray-600 dark:text-gray-200'
                }`}>
                  {user.isActive ? t.isActive : 'Inactive'}
                </span>
                {user.banned && (
                  <span className="ml-2 inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200">
                    {t.isBanned}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
              <Mail className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div className={`ml-4 ${isRTL ? 'mr-4' : ''}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.emailVerified}</p>
              <div className="flex items-center mt-1">
                <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                  user.emailVerified 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                }`}>
                  {user.emailVerified ? 'Verified' : 'Not Verified'}
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div className={`ml-4 ${isRTL ? 'mr-4' : ''}`}>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{t.role}</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white capitalize">{user.role}</p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  )
}