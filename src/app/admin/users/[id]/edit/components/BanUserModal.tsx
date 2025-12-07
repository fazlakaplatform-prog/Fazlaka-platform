"use client"

import { useState } from "react" // <-- ADDED useState
import { motion } from "framer-motion"
import { Lock, X } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"

const translations = {
  ar: {
    confirmBan: "هل أنت متأكد من حظر هذا المستخدم؟",
    banReason: "سبب الحظر",
    optional: "اختياري",
    notifyUser: "إعلام المستخدم",
    banUser: "حظر المستخدم",
    banning: "جاري الحظر...",
    cancel: "إلغاء",
    enterBanReason: "أدخل سبب الحظر..."
  },
  en: {
    confirmBan: "Are you sure you want to ban this user?",
    banReason: "Ban Reason",
    optional: "Optional",
    notifyUser: "Notify User",
    banUser: "Ban User",
    banning: "Banning...",
    cancel: "Cancel",
    enterBanReason: "Enter ban reason..."
  }
};

interface BanUserModalProps {
  onClose: () => void
  onConfirm: (reason: string, notifyUser: boolean) => void
}

export default function BanUserModal({ onClose, onConfirm }: BanUserModalProps) {
  const { language } = useLanguage()
  const t = translations[language]
  const [banReason, setBanReason] = useState("") // <-- useState is now defined
  const [notifyOnBan, setNotifyOnBan] = useState(true) // <-- useState is now defined
  const [isBanning, setIsBanning] = useState(false) // <-- useState is now defined

  const handleBan = async () => {
    setIsBanning(true)
    await onConfirm(banReason, notifyOnBan)
    setIsBanning(false)
  }

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white dark:bg-gray-800"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
            {t.confirmBan}
          </h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        
        <div className="mt-2">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.banReason} ({t.optional})
            </label>
            <textarea
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              placeholder={t.enterBanReason}
            />
          </div>
          <div className="flex items-center mb-4">
            <input
              type="checkbox"
              id="notifyOnBan"
              checked={notifyOnBan}
              onChange={(e) => setNotifyOnBan(e.target.checked)}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            />
            <label htmlFor="notifyOnBan" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
              {t.notifyUser}
            </label>
          </div>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-800 dark:text-gray-200 text-base font-medium rounded-md hover:bg-gray-400 dark:hover:bg-gray-500"
          >
            {t.cancel}
          </button>
          <button
            onClick={handleBan}
            disabled={isBanning}
            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-base font-medium rounded-md disabled:opacity-50"
          >
            {isBanning ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                {t.banning}
              </div>
            ) : (
              <div className="flex items-center">
                <Lock className="h-4 w-4 mr-2" />
                {t.banUser}
              </div>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  )
}