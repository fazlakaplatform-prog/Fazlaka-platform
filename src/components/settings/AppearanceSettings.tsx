"use client"

import { useState, useEffect } from "react"
import { useLanguage } from "@/components/Language/LanguageProvider"
import { motion } from "framer-motion"
import { Globe, Sun, Moon, Type } from "lucide-react"

// Text translations
const translations = {
  ar: {
    appearanceSettings: "إعدادات المظهر",
    theme: "المظهر",
    darkMode: "الوضع الليلي",
    lightMode: "الوضع النهاري",
    languageSettings: "إعدادات اللغة",
    arabic: "العربية",
    english: "English",
    fontSize: "حجم الخط",
    small: "صغير",
    medium: "متوسط",
    large: "كبير",
    darkModeToggle: "تبديل الوضع الليلي",
    languageToggle: "تبديل اللغة",
  },
  en: {
    appearanceSettings: "Appearance Settings",
    theme: "Theme",
    darkMode: "Dark Mode",
    lightMode: "Light Mode",
    languageSettings: "Language Settings",
    arabic: "العربية",
    english: "English",
    fontSize: "Font Size",
    small: "Small",
    medium: "Medium",
    large: "Large",
    darkModeToggle: "Toggle Dark Mode",
    languageToggle: "Toggle Language",
  }
};

export default function AppearanceSettings() {
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  const [isDark, setIsDark] = useState(false)
  const [fontSize, setFontSize] = useState('medium')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    
    // Check if dark mode is saved in localStorage first
    const savedDarkMode = localStorage.getItem('darkMode')
    
    if (savedDarkMode !== null) {
      // Use saved preference
      setIsDark(savedDarkMode === 'true')
      if (savedDarkMode === 'true') {
        document.documentElement.classList.add("dark")
      }
    } else {
      // Only use system preference if no saved preference
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
      setIsDark(prefersDark)
      if (prefersDark) {
        document.documentElement.classList.add("dark")
      }
    }
    
    // Check font size
    const savedFontSize = localStorage.getItem('fontSize')
    if (savedFontSize) {
      setFontSize(savedFontSize)
      document.documentElement.classList.add(`font-${savedFontSize}`)
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    
    // Apply dark mode
    localStorage.setItem('darkMode', isDark.toString())
    
    if (isDark) {
      document.documentElement.classList.add("dark")
    } else {
      document.documentElement.classList.remove("dark")
    }
  }, [isDark, mounted])

  useEffect(() => {
    if (!mounted) return
    
    // Apply font size
    document.documentElement.classList.remove('font-small', 'font-medium', 'font-large')
    document.documentElement.classList.add(`font-${fontSize}`)
    localStorage.setItem('fontSize', fontSize)
  }, [fontSize, mounted])

  const toggleDarkMode = () => {
    setIsDark(!isDark)
  }

  const toggleLanguage = () => {
    localStorage.setItem('language', isRTL ? 'en' : 'ar')
    window.location.reload()
  }

  if (!mounted) return null

  return (
    <div className="space-y-8">
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">{t.appearanceSettings}</h2>
      
      <div className="space-y-6">
        {/* Theme Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t.theme}</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setIsDark(false)}
              className={`p-4 rounded-xl border-2 transition-all ${
                !isDark ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="w-full h-16 bg-white rounded mb-2 flex items-center justify-center">
                <Sun className="h-8 w-8 text-yellow-500" />
              </div>
              <p className="text-sm font-medium">{t.lightMode}</p>
            </button>
            <button
              onClick={() => setIsDark(true)}
              className={`p-4 rounded-xl border-2 transition-all ${
                isDark ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <div className="w-full h-16 bg-gray-800 rounded mb-2 flex items-center justify-center">
                <Moon className="h-8 w-8 text-blue-300" />
              </div>
              <p className="text-sm font-medium">{t.darkMode}</p>
            </button>
          </div>
        </div>
        
        {/* Language Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t.languageSettings}</h3>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={toggleLanguage}
              className={`p-4 rounded-xl border-2 transition-all ${
                isRTL ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <p className="text-lg font-medium">{t.arabic}</p>
            </button>
            <button
              onClick={toggleLanguage}
              className={`p-4 rounded-xl border-2 transition-all ${
                !isRTL ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600'
              }`}
            >
              <p className="text-lg font-medium">{t.english}</p>
            </button>
          </div>
        </div>

        {/* Font Size Settings */}
        <div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t.fontSize}</h3>
          <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
            <div className="flex items-center gap-3">
              <Type className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t.fontSize}
              </span>
            </div>
            <div className="flex items-center gap-1 bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
              {['small', 'medium', 'large'].map((size) => (
                <button
                  key={size}
                  onClick={() => setFontSize(size)}
                  className={`px-2 py-1 rounded-md text-xs font-medium transition-all duration-300 ${
                    fontSize === size
                      ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                      : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
                  }`}
                >
                  {size === 'small' ? 'A' : size === 'medium' ? 'A' : 'A'}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}