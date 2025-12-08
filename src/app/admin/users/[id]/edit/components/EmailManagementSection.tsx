"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Mail, ChevronDown, ChevronUp, Star, Send, CheckCircle, AlertCircle } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"

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
    invalidEmail: "صيغة البريد الإلكتروني غير صحيحة",
    sending: "جاري الإرسال...",
    sent: "تم الإرسال بنجاح",
    error: "حدث خطأ",
    verificationLinkSent: "تم إرسال رابط التحقق بنجاح",
    checkYourEmail: "يرجى التحقق من بريدك الإلكتروني",
    linkExpiresIn: "ينتهي صلاحية الرابط خلال 24 ساعة",
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
    invalidEmail: "Invalid email format",
    sending: "Sending...",
    sent: "Sent Successfully",
    error: "Error",
    verificationLinkSent: "Verification link sent successfully",
    checkYourEmail: "Please check your email",
    linkExpiresIn: "Link expires in 24 hours",
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
  
  // State for email verification link sender
  const [sendingStates, setSendingStates] = useState<{[key: string]: {isSending: boolean, isSent: boolean, error: string | null}}>({})

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

  // Function to handle sending verification link
  const handleSendVerificationLink = async (email: string, type: "primary" | "secondary", emailId?: string) => {
    const key = emailId || email; // Use emailId for secondary emails, email for primary
    
    // Initialize state if not exists
    if (!sendingStates[key]) {
      setSendingStates(prev => ({
        ...prev,
        [key]: { isSending: false, isSent: false, error: null }
      }));
    }
    
    // Update state to sending
    setSendingStates(prev => ({
      ...prev,
      [key]: { ...prev[key], isSending: true, error: null }
    }));

    try {
      const response = await fetch('/api/auth/send-verification-link', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          type
        }),
      })

      const data = await response.json()

      if (response.ok) {
        setSendingStates(prev => ({
          ...prev,
          [key]: { ...prev[key], isSending: false, isSent: true }
        }));
      } else {
        setSendingStates(prev => ({
          ...prev,
          [key]: { ...prev[key], isSending: false, error: data.error || t.error }
        }));
      }
    } catch (error) {
      setSendingStates(prev => ({
        ...prev,
        [key]: { ...prev[key], isSending: false, error: t.error }
      }));
    }
  }

  // Function to render the verification link sender UI
  const renderVerificationLinkSender = (email: string, type: "primary" | "secondary", emailId?: string) => {
    const key = emailId || email;
    const state = sendingStates[key] || { isSending: false, isSent: false, error: null };
    
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Mail className="h-5 w-5 text-gray-400 ml-2" />
            <div>
              <p className="text-sm font-medium text-gray-900 dark:text-white">
                {type === "primary" ? t.email : t.secondaryEmails}
              </p>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {email}
              </p>
            </div>
          </div>
          
          {state.isSent ? (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <CheckCircle className="h-5 w-5 ml-1" />
              <span className="text-sm">{t.sent}</span>
            </div>
          ) : (
            <button
              onClick={() => handleSendVerificationLink(email, type, emailId)}
              disabled={state.isSending}
              className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            >
              {state.isSending ? (
                <>
                  <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white ml-1"></div>
                  {t.sending}
                </>
              ) : (
                <>
                  <Send className="h-3 w-3 ml-1" />
                  {t.sendVerificationLink}
                </>
              )}
            </button>
          )}
        </div>
        
        {state.error && (
          <div className="mt-3 flex items-center text-red-600 dark:text-red-400">
            <AlertCircle className="h-4 w-4 ml-1" />
            <span className="text-xs">{state.error}</span>
          </div>
        )}
        
        {state.isSent && (
          <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
            {t.checkYourEmail}. {t.linkExpiresIn}.
          </div>
        )}
      </div>
    );
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
                  {renderVerificationLinkSender(formData.email, "primary")}
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
                        {renderVerificationLinkSender(email.email, "secondary", email._id)}
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