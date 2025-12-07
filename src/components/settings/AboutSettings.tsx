"use client"

import { useLanguage } from "@/components/Language/LanguageProvider"
import Link from "next/link"

// Text translations
const translations = {
  ar: {
    aboutSettings: "حول",
    version: "الإصدار",
    reportProblem: "الإبلاغ عن مشكلة",
    privacy: "الخصوصية",
    terms: "الشروط والأحكام",
  },
  en: {
    aboutSettings: "About",
    version: "Version",
    reportProblem: "Report a Problem",
    privacy: "Privacy",
    terms: "Terms and Conditions",
  }
};

export default function AboutSettings() {
  const { isRTL, language } = useLanguage()
  const t = translations[language]

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.aboutSettings}</h2>
      
      <div className="space-y-6">
        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t.version}</h3>
          <p className="text-gray-600 dark:text-gray-400">1.0.0</p>
        </div>
        
        <div className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t.reportProblem}</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">Help us improve by reporting any issues you encounter</p>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm">
            Report a Problem
          </button>
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Link href="/privacy-policy" className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.privacy}</h3>
          </Link>
          <Link href="/terms-conditions" className="p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors">
            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.terms}</h3>
          </Link>
        </div>
      </div>
    </div>
  )
}