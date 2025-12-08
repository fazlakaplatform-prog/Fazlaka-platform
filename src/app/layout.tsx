// src/app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from "@/components/AuthProvider/AuthProvider"
import Navbar from "@/components/layout/Navbar"
import Footer from "@/components/layout/Footer"
import LanguageProvider from "@/components/Language/LanguageProvider"
import ChatbotWidget from "@/components/Chatbot/ChatbotWidget"
import AuthFieldChecker from "@/components/AuthProvider/AuthFieldChecker"
import { NotificationsProvider } from "@/components/Notifications/NotificationsProvider"
import NotificationToastsContainer from "@/components/Notifications/NotificationToastsContainer"
import WelcomeModal from "@/components/Auth/WelcomeModal" // استيراد المكون الجديد
import connectDB from '@/lib/mongoose'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "فذلكه",
  description: "موقع فذلكه",
  icons: {
    icon: '/logo.ico',
    shortcut: '/logo.ico',
    apple: '/logo.ico'
  }
}

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // الاتصال بقاعدة البيانات
  await connectDB();
  
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-800 text-black dark:text-white min-h-screen flex flex-col`}>
        <AuthProvider>
          <LanguageProvider>
            <NotificationsProvider>
              <Toaster position="top-center" />
              <div className="flex flex-col min-h-screen">
                <Navbar />
                <main className="flex-1 relative">
                  {children}
                </main>
                <Footer />
              </div>
              {/* إضافة النافذة العائمة هنا */}
              <ChatbotWidget />
              {/* إضافة مكون التحقق من الحقول هنا */}
              <AuthFieldChecker />
              {/* إضافة حاوية الإشعارات العائمة */}
              <NotificationToastsContainer />
              {/* إضافة مربع الترحيب الجديد */}
              <WelcomeModal />
            </NotificationsProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}