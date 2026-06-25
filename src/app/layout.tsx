// src/app/layout.tsx
import './globals.css'
import { Inter } from 'next/font/google'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from "@/components/AuthProvider/AuthProvider"
import NavbarWrapper from "@/components/layout/NavbarWrapper"
import FooterWrapper from "@/components/layout/FooterWrapper"
import LanguageProvider from "@/components/Language/LanguageProvider"
import ChatbotWidget from "@/components/Chatbot/ChatbotWidget"
import AuthFieldChecker from "@/components/AuthProvider/AuthFieldChecker"
import { NotificationsProvider } from "@/components/Notifications/NotificationsProvider"
import NotificationToastsContainer from "@/components/Notifications/NotificationToastsContainer"
import WelcomeModal from "@/components/Auth/WelcomeModal"
// تم إزالة سطر استيراد connectDB

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: "فذلكه",
  description: "موقع فذلكه",
  manifest: '/manifest.json',
  icons: {
    icon: '/logo.ico',
    shortcut: '/logo.ico',
    apple: '/logo.png'
  },
  appleWebApp: {
    title: "فذلكة",
    statusBarStyle: 'black-translucent'
  }
}

export default function RootLayout({ // تمت إزالة async لأنه لم يعد هناك انتظار لقاعدة البيانات
  children,
}: {
  children: React.ReactNode
}) {
  // تمت إزالة await connectDB();
  
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth" suppressHydrationWarning>
      <body className={`${inter.className} bg-white dark:bg-gray-800 text-black dark:text-white min-h-screen flex flex-col`}>
        <AuthProvider>
          <LanguageProvider>
            <NotificationsProvider>
              <Toaster position="top-center" />
              <div className="flex flex-col min-h-screen">
                <NavbarWrapper />
                <main className="flex-1 relative">
                  {children}
                </main>
                <FooterWrapper />
              </div>
              <ChatbotWidget />
              <AuthFieldChecker />
              <NotificationToastsContainer />
              <WelcomeModal />
            </NotificationsProvider>
          </LanguageProvider>
        </AuthProvider>
      </body>
    </html>
  )
}