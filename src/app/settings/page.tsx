"use client"

import { useState, useEffect } from "react" // <-- تم تصحيح السطر هنا
import { useSession } from "next-auth/react"
import SettingsLayout from "@/components/settings/SettingsLayout"
import ProfileSettings from "@/components/settings/ProfileSettings"
import SecuritySettings from "@/components/settings/SecuritySettings"
import AppearanceSettings from "@/components/settings/AppearanceSettings"
import AboutSettings from "@/components/settings/AboutSettings"

export default function SettingsPage() {
  const { status } = useSession()
  const [activeTab, setActiveTab] = useState("profile")

  // إذا كان المستخدم غير مسجل دخول، اجعل التبويب الافتراضي هو "appearance"
  useEffect(() => {
    if (status === "unauthenticated" && activeTab === "profile") {
      setActiveTab("appearance");
    }
  }, [status, activeTab, setActiveTab]);


  // Show loading state while checking authentication
  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-500">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    // نمرر حالة المصادقة (status) إلى الـ Layout
    <SettingsLayout activeTab={activeTab} setActiveTab={setActiveTab} authStatus={status}>
      {/* Profile Settings Tab */}
      {activeTab === "profile" && <ProfileSettings />}

      {/* Security Tab */}
      {activeTab === "security" && <SecuritySettings />}

      {/* Appearance Tab */}
      {activeTab === "appearance" && <AppearanceSettings />}

      {/* About Tab */}
      {activeTab === "about" && <AboutSettings />}
    </SettingsLayout>
  )
}