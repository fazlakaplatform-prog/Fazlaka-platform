"use client"

import { useLanguage } from "@/components/Language/LanguageProvider"
import Link from "next/link"

// Text translations
const translations = {
  ar: {
    aboutSettings: "حول",
    version: "الإصدار",
    reportProblem: "الإبلاغ عن مشكلة",
    reportProblemDesc: "واجهت مشكلة؟ ساعدنا في إصلاحها بالإبلاغ عنها",
    suggestions: "اقتراحات",
    suggestionsDesc: "شاركنا أفكارك واقتراحاتك لتحسين الخدمة",
    faq: "الأسئلة الشائعة",
    faqDesc: "ابحث عن إجابات للأسئلة الأكثر شيوعًا",
    privacy: "سياسة الخصوصية",
    privacyDesc: "تعرف على كيفية حماية بياناتك",
    terms: "الشروط والأحكام",
    termsDesc: "اقرأ شروط استخدام الخدمة",
    helpSection: "المساعدة والدعم",
    legalSection: "قانوني",
    systemInfo: "معلومات النظام"
  },
  en: {
    aboutSettings: "About",
    version: "Version",
    reportProblem: "Report a Problem",
    reportProblemDesc: "Facing an issue? Help us fix it by reporting it",
    suggestions: "Suggestions",
    suggestionsDesc: "Share your ideas and suggestions to improve our service",
    faq: "Frequently Asked Questions",
    faqDesc: "Find answers to the most common questions",
    privacy: "Privacy Policy",
    privacyDesc: "Learn how we protect your data",
    terms: "Terms and Conditions",
    termsDesc: "Read our terms of service",
    helpSection: "Help & Support",
    legalSection: "Legal",
    systemInfo: "System Information"
  }
};

// SVG Icons with proper TypeScript types
interface IconProps {
  className?: string;
}

const BugReportIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
  </svg>
);

const LightbulbIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
  </svg>
);

const QuestionMarkCircleIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const ShieldCheckIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
  </svg>
);

const DocumentTextIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
  </svg>
);

const InformationCircleIcon = ({ className }: IconProps) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

export default function AboutSettings() {
  const { isRTL, language } = useLanguage()
  const t = translations[language]

  return (
    <div className={`max-w-4xl mx-auto p-6 ${isRTL ? 'text-right' : 'text-left'}`}>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{t.aboutSettings}</h1>
        <p className="text-gray-600 dark:text-gray-400">
          {language === 'ar' ? 'معلومات حول خدماتنا وكيفية التواصل معنا' : 'Information about our services and how to reach us'}
        </p>
      </div>

      {/* System Information Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4 flex items-center gap-2">
          <InformationCircleIcon className="w-5 h-5" />
          {t.systemInfo}
        </h2>
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-800/50 dark:to-gray-700/50 rounded-xl p-6 border border-blue-100 dark:border-gray-600">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t.version}</h3>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                {language === 'ar' ? 'الإصدار الحالي من التطبيق' : 'Current version of the application'}
              </p>
            </div>
            <div className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
              <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">1.0.0</span>
            </div>
          </div>
        </div>
      </div>

      {/* Help & Support Section */}
      <div className="mb-8">
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{t.helpSection}</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link 
            href="/support" 
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-red-300 dark:hover:border-red-600 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-red-100 dark:bg-red-900/30 rounded-lg group-hover:bg-red-200 dark:group-hover:bg-red-900/50 transition-colors">
                <BugReportIcon className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.reportProblem}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t.reportProblemDesc}</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/contact" 
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-green-300 dark:hover:border-green-600 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-green-100 dark:bg-green-900/30 rounded-lg group-hover:bg-green-200 dark:group-hover:bg-green-900/50 transition-colors">
                <LightbulbIcon className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.suggestions}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t.suggestionsDesc}</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/faq" 
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg hover:border-purple-300 dark:hover:border-purple-600 transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg group-hover:bg-purple-200 dark:group-hover:bg-purple-900/50 transition-colors">
                <QuestionMarkCircleIcon className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">{t.faq}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{t.faqDesc}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* Legal Section */}
      <div>
        <h2 className="text-lg font-semibold text-gray-700 dark:text-gray-300 mb-4">{t.legalSection}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link 
            href="/privacy-policy" 
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg group-hover:bg-blue-200 dark:group-hover:bg-blue-900/50 transition-colors">
                <ShieldCheckIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.privacy}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.privacyDesc}</p>
              </div>
            </div>
          </Link>

          <Link 
            href="/terms-conditions" 
            className="group bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex items-center gap-4">
              <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-lg group-hover:bg-orange-200 dark:group-hover:bg-orange-900/50 transition-colors">
                <DocumentTextIcon className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.terms}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{t.termsDesc}</p>
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}