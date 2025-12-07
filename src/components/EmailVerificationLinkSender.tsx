"use client"

import { useState } from "react" // <-- ADDED useState
import { Mail, Send, CheckCircle, AlertCircle } from "lucide-react"
import { useLanguage } from "@/components/Language/LanguageProvider"

const translations = {
  ar: {
    sendVerificationLink: "إرسال رابط التحقق",
    email: "البريد الإلكتروني",
    primaryEmail: "البريد الإلكتروني الأساسي",
    secondaryEmail: "البريد الإلكتروني الثانوي",
    send: "إرسال",
    sending: "جاري الإرسال...",
    sent: "تم الإرسال بنجاح",
    error: "حدث خطأ",
    verificationLinkSent: "تم إرسال رابط التحقق بنجاح",
    checkYourEmail: "يرجى التحقق من بريدك الإلكتروني",
    linkExpiresIn: "ينتهي صلاحية الرابط خلال 24 ساعة",
  },
  en: {
    sendVerificationLink: "Send Verification Link",
    email: "Email",
    primaryEmail: "Primary Email",
    secondaryEmail: "Secondary Email",
    send: "Send",
    sending: "Sending...",
    sent: "Sent Successfully",
    error: "Error",
    verificationLinkSent: "Verification link sent successfully",
    checkYourEmail: "Please check your email",
    linkExpiresIn: "Link expires in 24 hours",
  }
}

interface EmailVerificationLinkSenderProps {
  email: string
  type: "primary" | "secondary"
  onSuccess?: () => void
}

export default function EmailVerificationLinkSender({ 
  email, 
  type, 
  onSuccess 
}: EmailVerificationLinkSenderProps) {
  const { language, isRTL } = useLanguage()
  const t = translations[language as keyof typeof translations]
  const [isSending, setIsSending] = useState(false) // <-- useState is now defined
  const [isSent, setIsSent] = useState(false) // <-- useState is now defined
  const [error, setError] = useState<string | null>(null) // <-- useState is now defined

  const handleSendVerificationLink = async () => {
    setIsSending(true)
    setError(null)

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
        setIsSent(true)
        if (onSuccess) onSuccess()
      } else {
        setError(data.error || t.error)
      }
    } catch (error) {
      setError(t.error)
    } finally {
      setIsSending(false)
    }
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center">
          <Mail className="h-5 w-5 text-gray-400 ml-2" />
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">
              {type === "primary" ? t.primaryEmail : t.secondaryEmail}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {email}
            </p>
          </div>
        </div>
        
        {isSent ? (
          <div className="flex items-center text-green-600 dark:text-green-400">
            <CheckCircle className="h-5 w-5 ml-1" />
            <span className="text-sm">{t.sent}</span>
          </div>
        ) : (
          <button
            onClick={handleSendVerificationLink}
            disabled={isSending}
            className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
          >
            {isSending ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-t-2 border-b-2 border-white ml-1"></div>
                {t.sending}
              </>
            ) : (
              <>
                <Send className="h-3 w-3 ml-1" />
                {t.send}
              </>
            )}
          </button>
        )}
      </div>
      
      {error && (
        <div className="mt-3 flex items-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 ml-1" />
          <span className="text-xs">{error}</span>
        </div>
      )}
      
      {isSent && (
        <div className="mt-3 text-xs text-gray-500 dark:text-gray-400">
          {t.checkYourEmail}. {t.linkExpiresIn}.
        </div>
      )}
    </div>
  )
}