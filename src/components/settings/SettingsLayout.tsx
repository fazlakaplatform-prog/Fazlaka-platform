// components/settings/SettingsLayout.tsx

"use client"

import { useSession, signOut } from "next-auth/react" // ← أضفنا signOut
import { useRouter } from "next/navigation" // ← أضفنا useRouter
import { Edit, Shield, Globe, HelpCircle, LogOut, LogIn } from "lucide-react" // ← أضفنا LogIn

import { useLanguage } from "@/components/Language/LanguageProvider"

// Text translations
const translations = {
  ar: {
    settings: "الإعدادات",
    backToProfile: "العودة إلى الملف الشخصي",
    editProfile: "تعديل الملف الشخصي",
    accountSettings: "إعدادات الحساب",
    appearanceSettings: "إعدادات المظهر",
    aboutSettings: "حول",
    signOut: "تسجيل الخروج",
    signIn: "تسجيل الدخول", // ← إضافة نص جديد
  },
  en: {
    settings: "Settings",
    backToProfile: "Back to Profile",
    editProfile: "Edit Profile",
    accountSettings: "Account Settings",
    appearanceSettings: "Appearance Settings",
    aboutSettings: "About",
    signOut: "Sign Out",
    signIn: "Sign In", // ← إضافة نص جديد
  }
};

// تحديث الواجهة لقبول prop جديد
interface SettingsLayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  authStatus: "loading" | "authenticated" | "unauthenticated"; // ← إضافة prop جديد
}

export default function SettingsLayout({ children, activeTab, setActiveTab, authStatus }: SettingsLayoutProps) {
  const router = useRouter() // ← استخدام useRouter
  const { isRTL, language } = useLanguage()
  const t = translations[language]

  return (
    <div className={`min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500 ${isRTL ? 'rtl' : ''}`}>
      {/* Empty space with header background at the top */}
      <div className="h-20 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm"></div>
      
      <div className="flex flex-col flex-1">
        {/* Header */}
        <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-center h-16">
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">{t.settings}</h1>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar */}
            <div className="md:w-64 flex-shrink-0">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg p-4 space-y-1">
                {/* ← عرض زر تعديل الملف الشخصي فقط إذا كان المستخدم مسجلاً */}
                {authStatus === "authenticated" && (
                  <button
                    onClick={() => setActiveTab("profile")}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === "profile"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <Edit className="h-5 w-5 mr-3" />
                    {t.editProfile}
                  </button>
                )}

                {/* ← عرض زر إعدادات الحساب فقط إذا كان المستخدم مسجلاً */}
                {authStatus === "authenticated" && (
                  <button
                    onClick={() => setActiveTab("security")}
                    className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                      activeTab === "security"
                        ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                    }`}
                  >
                    <Shield className="h-5 w-5 mr-3" />
                    {t.accountSettings}
                  </button>
                )}

                {/* ← زر المظهر متاح للجميع */}
                <button
                  onClick={() => setActiveTab("appearance")}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "appearance"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <Globe className="h-5 w-5 mr-3" />
                  {t.appearanceSettings}
                </button>

                {/* ← زر "حول" متاح للجميع */}
                <button
                  onClick={() => setActiveTab("about")}
                  className={`w-full flex items-center px-4 py-3 rounded-lg text-left transition-colors ${
                    activeTab === "about"
                      ? "bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700/50"
                  }`}
                >
                  <HelpCircle className="h-5 w-5 mr-3" />
                  {t.aboutSettings}
                </button>

                {/* ← عرض زر تسجيل الخروج أو تسجيل الدخول بناءً على الحالة */}
                <div className="pt-4 mt-4 border-t border-gray-200 dark:border-gray-700">
                  {authStatus === "authenticated" ? (
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-left text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <LogOut className="h-5 w-5 mr-3" />
                      {t.signOut}
                    </button>
                  ) : (
                    <button
                      onClick={() => router.push("/sign-in")}
                      className="w-full flex items-center px-4 py-3 rounded-lg text-left text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                    >
                      <LogIn className="h-5 w-5 mr-3" />
                      {t.signIn}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1">
              <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-lg rounded-xl shadow-lg p-6">
                {children}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}