"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Shield, ChevronDown, ChevronUp, Check, X, Lock, Unlock } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"
import BanUserModal from "./BanUserModal"
import UnbanUserModal from "./UnbanUserModal"

const translations = {
  ar: {
    accountStatus: "حالة الحساب",
    isActive: "الحساب نشط",
    isBanned: "الحساب محظور",
    banUser: "حظر المستخدم",
    unbanUser: "فك حظر المستخدم",
    accountActive: "الحساب نشط حالياً",
    accountInactive: "الحساب غير نشط",
    accountBanned: "الحساب محظور حالياً",
    accountNotBanned: "الحساب غير محظور"
  },
  en: {
    accountStatus: "Account Status",
    isActive: "Account is Active",
    isBanned: "Account is Banned",
    banUser: "Ban User",
    unbanUser: "Unban User",
    accountActive: "Account is currently active",
    accountInactive: "Account is inactive",
    accountBanned: "Account is currently banned",
    accountNotBanned: "Account is not banned"
  }
};

// Define proper type for formData
interface AccountStatusFormData {
  isActive: boolean;
  banned: boolean;
}

interface AccountStatusSectionProps {
  formData: AccountStatusFormData
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleBanUser: (reason: string, notifyUser: boolean) => Promise<void>
  handleUnbanUser: (reason: string, notifyUser: boolean) => Promise<void>
  isOpen: boolean
  toggleOpen: () => void
}

export default function AccountStatusSection({
  formData,
  handleInputChange,
  handleBanUser,
  handleUnbanUser,
  isOpen,
  toggleOpen
}: AccountStatusSectionProps) {
  const { language } = useLanguage()
  const t = translations[language]
  const [showBanModal, setShowBanModal] = useState(false)
  const [showUnbanModal, setShowUnbanModal] = useState(false)

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
      >
        <button
          type="button"
          onClick={toggleOpen}
          className="w-full bg-gradient-to-r from-red-500 to-orange-600 px-6 py-4 flex items-center justify-between text-white"
        >
          <h3 className="text-lg font-medium flex items-center">
            <Shield className="h-5 w-5 mr-2" />
            {t.accountStatus}
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                        formData.isActive 
                          ? 'bg-green-100 dark:bg-green-900' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}>
                        <Check className={`h-5 w-5 ${
                          formData.isActive 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t.isActive}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.isActive 
                            ? t.accountActive
                            : t.accountInactive
                          }
                        </p>
                      </div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        name="isActive"
                        checked={formData.isActive}
                        onChange={handleInputChange}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div className="flex items-center">
                      <div className={`h-10 w-10 rounded-full flex items-center justify-center mr-3 ${
                        formData.banned 
                          ? 'bg-red-100 dark:bg-red-900' 
                          : 'bg-gray-200 dark:bg-gray-600'
                      }`}>
                        <X className={`h-5 w-5 ${
                          formData.banned 
                            ? 'text-red-600 dark:text-red-400' 
                            : 'text-gray-500 dark:text-gray-400'
                        }`} />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{t.isBanned}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formData.banned 
                            ? t.accountBanned
                            : t.accountNotBanned
                          }
                        </p>
                      </div>
                    </div>
                    {/* Ban/Unban Buttons */}
                    {formData.banned ? (
                      <button
                        type="button"
                        onClick={() => setShowUnbanModal(true)}
                        className="flex items-center px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors"
                      >
                        <Unlock className="h-4 w-4 mr-1" />
                        {t.unbanUser}
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowBanModal(true)}
                        className="flex items-center px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-md transition-colors"
                      >
                        <Lock className="h-4 w-4 mr-1" />
                        {t.banUser}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Ban User Modal */}
      {showBanModal && (
        <BanUserModal
          onClose={() => setShowBanModal(false)}
          onConfirm={(reason, notifyUser) => {
            handleBanUser(reason, notifyUser)
            setShowBanModal(false)
          }}
        />
      )}

      {/* Unban User Modal */}
      {showUnbanModal && (
        <UnbanUserModal
          onClose={() => setShowUnbanModal(false)}
          onConfirm={(reason, notifyUser) => {
            handleUnbanUser(reason, notifyUser)
            setShowUnbanModal(false)
          }}
        />
      )}
    </>
  )
}