"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Bell, ChevronDown, ChevronUp, Send } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"

const translations = {
  ar: {
    notificationsSection: "الإشعارات والرسائل",
    sendNotification: "إرسال إشعار",
    notificationTitle: "عنوان الإشعار",
    notificationMessage: "رسالة الإشعار",
    notificationType: "نوع الإشعار",
    info: "معلومات",
    success: "نجاح",
    warning: "تحذير",
    error: "خطأ",
    sendEmail: "إرسال بريد إلكتروني",
    emailSubject: "عنوان البريد الإلكتروني",
    emailMessage: "رسالة البريد الإلكتروني",
    sending: "جاري الإرسال..."
  },
  en: {
    notificationsSection: "Notifications & Messages",
    sendNotification: "Send Notification",
    notificationTitle: "Notification Title",
    notificationMessage: "Notification Message",
    notificationType: "Notification Type",
    info: "Info",
    success: "Success",
    warning: "Warning",
    error: "Error",
    sendEmail: "Send Email",
    emailSubject: "Email Subject",
    emailMessage: "Email Message",
    sending: "Sending..."
  }
};

// Define proper TypeScript interfaces
interface NotificationData {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "error";
  sendEmail: boolean;
  emailSubject: string;
  emailMessage: string;
}

interface NotificationsSectionProps {
  notificationData: NotificationData
  setNotificationData: (data: NotificationData | ((prev: NotificationData) => NotificationData)) => void
  handleSendNotification: (data: NotificationData) => Promise<void>
  isOpen: boolean
  toggleOpen: () => void
}

export default function NotificationsSection({
  notificationData,
  setNotificationData,
  handleSendNotification,
  isOpen,
  toggleOpen
}: NotificationsSectionProps) {
  const { language } = useLanguage()
  const t = translations[language]
  const [actionLoading, setActionLoading] = useState(false)

  const handleSend = async () => {
    setActionLoading(true)
    await handleSendNotification(notificationData)
    setActionLoading(false)
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.45 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
    >
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex items-center justify-between text-white"
      >
        <h3 className="text-lg font-medium flex items-center">
          <Bell className="h-5 w-5 mr-2" />
          {t.notificationsSection}
        </h3>
        {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label htmlFor="notificationTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.notificationTitle}
                  </label>
                  <input
                    type="text"
                    id="notificationTitle"
                    value={notificationData.title}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="notificationMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.notificationMessage}
                  </label>
                  <textarea
                    id="notificationMessage"
                    rows={3}
                    value={notificationData.message}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                </div>
                
                <div>
                  <label htmlFor="notificationType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t.notificationType}
                  </label>
                  <select
                    id="notificationType"
                    value={notificationData.type}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, type: e.target.value as NotificationData['type'] }))}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="info">{t.info}</option>
                    <option value="success">{t.success}</option>
                    <option value="warning">{t.warning}</option>
                    <option value="error">{t.error}</option>
                  </select>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="sendEmail"
                    checked={notificationData.sendEmail}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, sendEmail: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="sendEmail" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                    {t.sendEmail}
                  </label>
                </div>
                
                {notificationData.sendEmail && (
                  <>
                    <div>
                      <label htmlFor="emailSubject" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t.emailSubject}
                      </label>
                      <input
                        type="text"
                        id="emailSubject"
                        value={notificationData.emailSubject}
                        onChange={(e) => setNotificationData(prev => ({ ...prev, emailSubject: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                    
                    <div>
                      <label htmlFor="emailMessage" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                        {t.emailMessage}
                      </label>
                      <textarea
                        id="emailMessage"
                        rows={4}
                        value={notificationData.emailMessage}
                        onChange={(e) => setNotificationData(prev => ({ ...prev, emailMessage: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </>
                )}
                
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={handleSend}
                    disabled={actionLoading || !notificationData.title || !notificationData.message}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors disabled:opacity-50"
                  >
                    {actionLoading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                        {t.sending}
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        {t.sendNotification}
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}