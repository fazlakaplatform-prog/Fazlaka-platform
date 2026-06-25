"use client"

import { useState, useEffect, useCallback, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  History, 
  Shield, 
  Ticket, 
  MessageSquare, 
  Monitor, 
  Clock, 
  MapPin,
  Loader2,
  AlertTriangle
} from "lucide-react"
import Link from "next/link"
import { useLanguage } from "@/components/Language/LanguageProvider"

// --- Interfaces ---
interface LoginHistoryItem {
  id: string;
  ip: string | null;
  userAgent: string | null;
  createdAt: string;
}

interface TicketItem {
  id: string;
  ticketNumber: string;
  subject: string;
  status: string;
  createdAt: string;
}

interface CommentItem {
  id: string;
  content: string;
  createdAt: string;
  episodeId: string | null;
  articleId: string | null;
}

interface ActivityData {
  loginHistory: LoginHistoryItem[];
  verificationAttempts: { id: string; createdAt: string }[];
  passwordResetAttempts: { id: string; createdAt: string }[];
  tickets: TicketItem[];
  comments: CommentItem[];
  userActivities: { id: string; createdAt: string }[];
}

// --- Translations ---
const translations = {
  ar: {
    title: "سجل نشاط المستخدم",
    back: "العودة للتفاصيل",
    loading: "جاري تحميل السجل...",
    noData: "لا توجد بيانات",
    error: "حدث خطأ في تحميل البيانات",
    tabs: {
      login: "تسجيل الدخول",
      security: "الأمان",
      tickets: "التذاكر",
      comments: "التعليقات",
      raw: "النشاط العام"
    },
    table: {
      date: "التاريخ",
      ip: "عنوان IP",
      device: "الجهاز/المتصفح",
      subject: "الموضوع",
      status: "الحالة",
      content: "المحتوى",
      action: "الإجراء"
    },
    status: {
      OPEN: "مفتوح",
      IN_PROGRESS: "قيد المعالجة",
      CLOSED: "مغلق",
      RESOLVED: "تم الحل"
    }
  },
  en: {
    title: "User Activity Log",
    back: "Back to Details",
    loading: "Loading logs...",
    noData: "No data available",
    error: "Error loading data",
    tabs: {
      login: "Login History",
      security: "Security",
      tickets: "Tickets",
      comments: "Comments",
      raw: "Raw Activity"
    },
    table: {
      date: "Date",
      ip: "IP Address",
      device: "Device/User Agent",
      subject: "Subject",
      status: "Status",
      content: "Content",
      action: "Action"
    },
    status: {
      OPEN: "Open",
      IN_PROGRESS: "In Progress",
      CLOSED: "Closed",
      RESOLVED: "Resolved"
    }
  }
}

export default function UserActivityPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params)
  const id = resolvedParams.id
  
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  
  const [data, setData] = useState<ActivityData | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('login')

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true)
      const res = await fetch(`/api/admin/users/${id}/activity`)
      if (res.ok) {
        const result = await res.json()
        setData(result)
      } else {
        throw new Error("Failed to fetch")
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const tabs = [
    { id: 'login', label: t.tabs.login, icon: Monitor },
    { id: 'security', label: t.tabs.security, icon: Shield },
    { id: 'tickets', label: t.tabs.tickets, icon: Ticket },
    { id: 'comments', label: t.tabs.comments, icon: MessageSquare },
    { id: 'raw', label: t.tabs.raw, icon: History },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-blue-600 mx-auto" />
          <p className="mt-4 text-gray-500">{t.loading}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'} p-6`}>
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <History className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">ID: {id}</p>
            </div>
          </div>

          <Link href={`/admin/users/${id}`}>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t.back}
            </motion.button>
          </Link>
        </motion.div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
          <div className="border-b border-gray-100 dark:border-gray-700 overflow-x-auto">
            <div className="flex p-2">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all whitespace-nowrap ${
                    activeTab === tab.id 
                      ? 'bg-blue-600 text-white shadow-md' 
                      : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          <div className="p-6">
            <AnimatePresence mode="wait">
              {/* Login History Tab */}
              {activeTab === 'login' && (
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="overflow-x-auto"
                >
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead>
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.table.date}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.table.ip}</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t.table.device}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                      {data?.loginHistory.length ? data.loginHistory.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                          <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-200 flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            {formatDate(item.createdAt)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-300 font-mono">
                            {item.ip || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">
                            {item.userAgent || 'Unknown'}
                          </td>
                        </tr>
                      )) : (
                        <tr><td colSpan={3} className="text-center py-8 text-gray-400">{t.noData}</td></tr>
                      )}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {/* Security Tab */}
              {activeTab === 'security' && (
                <motion.div
                  key="security"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-1 md:grid-cols-2 gap-6"
                >
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-yellow-500" /> محاولات التحقق
                    </h3>
                    <div className="space-y-2">
                      {data?.verificationAttempts.length ? data.verificationAttempts.map(item => (
                        <div key={item.id} className="text-xs bg-white dark:bg-gray-800 p-2 rounded-lg flex justify-between">
                          <span className="text-gray-500">Attempt</span>
                          <span className="font-medium text-gray-700 dark:text-gray-200">{formatDate(item.createdAt)}</span>
                        </div>
                      )) : <p className="text-xs text-gray-400">{t.noData}</p>}
                    </div>
                  </div>

                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                    <h3 className="font-semibold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500" /> محاولات إعادة تعيين كلمة المرور
                    </h3>
                    <div className="space-y-2">
                      {data?.passwordResetAttempts.length ? data.passwordResetAttempts.map(item => (
                        <div key={item.id} className="text-xs bg-white dark:bg-gray-800 p-2 rounded-lg flex justify-between">
                          <span className="text-gray-500">Attempt</span>
                          <span className="font-medium text-gray-700 dark:text-gray-200">{formatDate(item.createdAt)}</span>
                        </div>
                      )) : <p className="text-xs text-gray-400">{t.noData}</p>}
                    </div>
                  </div>
                </motion.div>
              )}

              {/* Tickets Tab */}
              {activeTab === 'tickets' && (
                <motion.div
                  key="tickets"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {data?.tickets.length ? data.tickets.map(ticket => (
                    <div key={ticket.id} className="flex items-center justify-between bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                      <div>
                        <p className="font-medium text-sm text-gray-900 dark:text-white">{ticket.subject}</p>
                        <p className="text-xs text-gray-400 mt-1">#{ticket.ticketNumber}</p>
                      </div>
                      <div className="text-right">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          ticket.status === 'OPEN' ? 'bg-green-100 text-green-700' :
                          ticket.status === 'RESOLVED' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {t.status[ticket.status as keyof typeof t.status] || ticket.status}
                        </span>
                        <p className="text-xs text-gray-400 mt-1">{formatDate(ticket.createdAt)}</p>
                      </div>
                    </div>
                  )) : <p className="text-center text-gray-400 py-8">{t.noData}</p>}
                </motion.div>
              )}

              {/* Comments Tab */}
              {activeTab === 'comments' && (
                <motion.div
                  key="comments"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-3"
                >
                  {data?.comments.length ? data.comments.map(comment => (
                    <div key={comment.id} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl">
                      <p className="text-sm text-gray-700 dark:text-gray-200 mb-2 line-clamp-2">{comment.content}</p>
                      <div className="flex justify-between text-xs text-gray-400">
                        <span>{formatDate(comment.createdAt)}</span>
                        <span>
                          {comment.episodeId ? 'Episode' : comment.articleId ? 'Article' : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  )) : <p className="text-center text-gray-400 py-8">{t.noData}</p>}
                </motion.div>
              )}

              {/* Raw Activity Tab */}
              {activeTab === 'raw' && (
                <motion.div
                  key="raw"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2"
                >
                  {data?.userActivities.length ? data.userActivities.map(item => (
                    <div key={item.id} className="bg-gray-50 dark:bg-gray-700/50 p-2 rounded-lg text-center">
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </p>
                      <p className="text-[10px] text-gray-400">
                        {new Date(item.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                  )) : <p className="text-center text-gray-400 py-8 col-span-full">{t.noData}</p>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}