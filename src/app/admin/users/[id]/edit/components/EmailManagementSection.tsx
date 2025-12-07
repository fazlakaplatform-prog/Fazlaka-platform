"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, ChevronDown, ChevronUp, Star } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"
import EmailVerificationLinkSender from "@/components/EmailVerificationLinkSender"

const translations = {
  ar: {
    emailManagement: "إدارة البريد الإلكتروني",
    email: "البريد الإلكتروني الأساسي",
    secondaryEmails: "البريد الإلكتروني الثانوي",
    addSecondaryEmail: "إضافة بريد إلكتروني ثانوي",
    makePrimary: "جعل هذا البريد أساسيًا",
    removeEmail: "إزالة البريد",
    emailVerified: "موثق",
    notVerified: "غير موثق",
    verifyEmail: "تفعيل البريد مباشرة",
    verificationMethod: "طريقة التحقق",
    directVerification: "التحقق المباشر",
    emailVerification: "التحقق عبر البريد",
    sendVerificationLink: "إرسال رابط التحقق",
    invalidEmail: "صيغة البريد الإلكتروني غير صحيحة"
  },
  en: {
    emailManagement: "Email Management",
    email: "Primary Email",
    secondaryEmails: "Secondary Emails",
    addSecondaryEmail: "Add Secondary Email",
    makePrimary: "Make Primary",
    removeEmail: "Remove Email",
    emailVerified: "Verified",
    notVerified: "Not Verified",
    verifyEmail: "Verify Email Directly",
    verificationMethod: "Verification Method",
    directVerification: "Direct Verification",
    emailVerification: "Email Verification",
    sendVerificationLink: "Send Verification Link",
    invalidEmail: "Invalid email format"
  }
};

// Define proper TypeScript interfaces
interface SecondaryEmail {
  _id: string;
  email: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
}

interface EmailFormData {
  email: string;
  emailVerified: boolean;
}

interface EmailManagementSectionProps {
  formData: EmailFormData
  secondaryEmails: SecondaryEmail[]
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void
  handleAddSecondaryEmail: (email: string) => void
  handleMakePrimaryEmail: (emailId: string) => Promise<void>
  handleRemoveSecondaryEmail: (emailId: string) => Promise<void>
  handleVerifyEmailDirectly: (emailId: string) => Promise<void>
  isOpen: boolean
  toggleOpen: () => void
}

export default function EmailManagementSection({
  formData,
  secondaryEmails,
  handleInputChange,
  handleAddSecondaryEmail,
  handleMakePrimaryEmail,
  handleRemoveSecondaryEmail,
  handleVerifyEmailDirectly,
  isOpen,
  toggleOpen
}: EmailManagementSectionProps) {
  const { language } = useLanguage()
  const t = translations[language]
  const [newSecondaryEmail, setNewSecondaryEmail] = useState("")

  const handleAddEmail = () => {
    if (!newSecondaryEmail.trim()) return
    
    if (!/^\S+@\S+\.\S+$/.test(newSecondaryEmail)) {
      alert(t.invalidEmail)
      return
    }
    
    handleAddSecondaryEmail(newSecondaryEmail)
    setNewSecondaryEmail("")
  }

  // Create a proper event object for email change
  const handleEmailChange = (value: string) => {
    const syntheticEvent = {
      target: {
        name: 'email',
        value: value
      }
    } as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(syntheticEvent);
  }

  // Create a proper event object for email verification toggle
  const toggleEmailVerification = () => {
    // Fixed: Use 'unknown' conversion as suggested by TypeScript
    const syntheticEvent = {
      target: {
        name: 'emailVerified',
        value: !formData.emailVerified
      }
    } as unknown as React.ChangeEvent<HTMLInputElement>;
    
    handleInputChange(syntheticEvent);
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden"
    >
      <button
        type="button"
        onClick={toggleOpen}
        className="w-full bg-gradient-to-r from-green-500 to-teal-600 px-6 py-4 flex items-center justify-between text-white"
      >
        <h3 className="text-lg font-medium flex items-center">
          <Mail className="h-5 w-5 mr-2" />
          {t.emailManagement}
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
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                    {t.email}
                  </label>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    formData.emailVerified
                      ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                      : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                  }`}>
                    {formData.emailVerified ? t.emailVerified : t.notVerified}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleEmailChange(e.target.value)}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  <div className="h-10 w-10 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                    <Star className="h-5 w-5 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                
                {/* Email Verification Link Sender for Primary Email */}
                <div className="mt-3">
                  <EmailVerificationLinkSender 
                    email={formData.email} 
                    type="primary" 
                  />
                </div>
                
                {/* Actions for primary email */}
                <div className="mt-3 flex space-x-2">
                  {!formData.emailVerified && (
                    <button
                      type="button"
                      onClick={toggleEmailVerification}
                      className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                    >
                      {t.verifyEmail}
                    </button>
                  )}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.secondaryEmails}
                </label>
                <div className="space-y-3 mb-4">
                  {secondaryEmails.map((email: SecondaryEmail) => (
                    <div key={email._id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center space-x-3">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-900 dark:text-white">{email.email}</span>
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            email.isVerified
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                          }`}>
                            {email.isVerified ? t.emailVerified : t.notVerified}
                          </span>
                        </div>
                      </div>
                      
                      {/* Email Verification Link Sender for Secondary Email */}
                      <div className="mb-3">
                        <EmailVerificationLinkSender 
                          email={email.email} 
                          type="secondary" 
                        />
                      </div>
                      
                      <div className="flex space-x-2">
                        <button
                          type="button"
                          onClick={() => handleMakePrimaryEmail(email._id)}
                          className="text-indigo-600 hover:text-indigo-900 dark:text-indigo-400 dark:hover:text-indigo-300"
                        >
                          {t.makePrimary}
                        </button>
                        {!email.isVerified && (
                          <button
                            type="button"
                            onClick={() => handleVerifyEmailDirectly(email._id)}
                            className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-300"
                          >
                            {t.verifyEmail}
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleRemoveSecondaryEmail(email._id)}
                          className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                        >
                          {t.removeEmail}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex space-x-2">
                  <input
                    type="email"
                    value={newSecondaryEmail}
                    onChange={(e) => setNewSecondaryEmail(e.target.value)}
                    placeholder={t.addSecondaryEmail}
                    className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                  />
                  <button
                    type="button"
                    onClick={handleAddEmail}
                    className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md transition-colors"
                  >
                    {t.addSecondaryEmail}
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