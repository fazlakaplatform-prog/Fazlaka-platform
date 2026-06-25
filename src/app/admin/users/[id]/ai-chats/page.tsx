"use client"

import { useState, useEffect, useCallback, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  Bot, 
  User, 
  Clock, 
  Loader2,
  MessageSquareText,
  Sparkles
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

// --- Interfaces ---
interface AIChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp?: string;
  language?: string;
}

interface AIChat {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

interface ChatDetail extends AIChat {
  messages: AIChatMessage[];
}

interface Params {
  id: string; // The ID of the user being monitored
}

// --- Translations ---
const translations = {
  ar: {
    title: "سجل محادثات الذكاء الاصطناعي",
    back: "العودة للملف الشخصي",
    loading: "جاري التحميل...",
    noChats: "لا توجد محادثات ذكاء اصطناعي لهذا المستخدم",
    selectChat: "اختر محادثة لعرض الرسائل",
    emptyChat: "المحادثة فارغة",
    user: "المستخدم",
    assistant: "المساعد الذكي",
    today: "اليوم",
    yesterday: "أمس",
    daysAgo: "منذ {days} أيام",
    aiChats: "محادثات AI"
  },
  en: {
    title: "AI Chat History",
    back: "Back to Profile",
    loading: "Loading...",
    noChats: "No AI conversations found for this user",
    selectChat: "Select a conversation to view messages",
    emptyChat: "Conversation is empty",
    user: "User",
    assistant: "AI Assistant",
    today: "Today",
    yesterday: "Yesterday",
    daysAgo: "{days} days ago",
    aiChats: "AI Chats"
  }
}

export default function UserAIChatsPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = use(params)
  const targetUserId = resolvedParams.id
  
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  
  const [chats, setChats] = useState<AIChat[]>([])
  const [selectedChat, setSelectedChat] = useState<ChatDetail | null>(null)
  const [loadingChats, setLoadingChats] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)

  // Fetch Chat List
  useEffect(() => {
    const fetchChats = async () => {
      try {
        setLoadingChats(true)
        const res = await fetch(`/api/admin/users/${targetUserId}/ai-chats`)
        if (res.ok) {
          const data = await res.json()
          setChats(data.chats)
        }
      } catch (error) {
        console.error("Error fetching AI chats", error)
      } finally {
        setLoadingChats(false)
      }
    }
    
    fetchChats()
  }, [targetUserId])

  // Fetch Chat Detail
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedChat?.id) return
      
      try {
        setLoadingMessages(true)
        const res = await fetch(`/api/admin/users/${targetUserId}/ai-chats?chatId=${selectedChat.id}`)
        if (res.ok) {
          const data = await res.json()
          // Update selected chat with messages
          setSelectedChat(prev => prev ? { ...prev, messages: data.messages } : null)
        }
      } catch (error) {
        console.error("Error fetching messages", error)
      } finally {
        setLoadingMessages(false)
      }
    }
    
    // Only fetch if messages are empty (initial load)
    if (selectedChat && (!selectedChat.messages || selectedChat.messages.length === 0)) {
       fetchMessages()
    }
  }, [selectedChat?.id, targetUserId])

  const handleSelectChat = async (chat: AIChat) => {
    // Set basic info first
    setSelectedChat({
      ...chat,
      messages: [] // Clear messages to trigger loading state
    })
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return t.today
    if (days === 1) return t.yesterday
    return t.daysAgo.replace('{days}', days.toString())
  }

  const formatTime = (dateString?: string) => {
    if (!dateString) return ''
    try {
      return new Date(dateString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return ''
    }
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
              <Sparkles className="w-6 h-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">{t.aiChats}</p>
            </div>
          </div>

          <Link href={`/admin/users/${targetUserId}`}>
            <motion.button 
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              <ArrowLeft className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
              {t.back}
            </motion.button>
          </Link>
        </motion.div>

        {/* Main Content */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-[70vh] flex">
          
          {/* Sidebar */}
          <div className={`w-full md:w-80 border-r border-gray-100 dark:border-gray-700 flex flex-col ${selectedChat ? 'hidden md:flex' : 'flex'}`}>
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <h3 className="font-semibold text-gray-700 dark:text-gray-200 flex items-center gap-2">
                <MessageSquareText className="w-4 h-4" />
                {t.aiChats}
              </h3>
            </div>

            <div className="flex-1 overflow-y-auto">
              {loadingChats ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                </div>
              ) : chats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400 px-4 text-center">
                  <Bot className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">{t.noChats}</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {chats.map((chat) => (
                    <motion.button
                      key={chat.id}
                      onClick={() => handleSelectChat(chat)}
                      className={`w-full flex items-start gap-3 p-3 rounded-xl transition-colors text-left ${
                        selectedChat?.id === chat.id 
                          ? 'bg-purple-50 dark:bg-purple-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      whileHover={{ x: isRTL ? -4 : 4 }}
                    >
                      <div className="mt-1">
                        <Sparkles className="w-4 h-4 text-purple-500" />
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <h4 className="font-medium text-sm text-gray-900 dark:text-white truncate">
                          {chat.title}
                        </h4>
                        <p className="text-xs text-gray-400 mt-1">
                          {formatDate(chat.updatedAt)}
                        </p>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Chat View */}
          <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 ${!selectedChat ? 'hidden md:flex' : 'flex'}`}>
            
            <AnimatePresence mode="wait">
              {selectedChat ? (
                <motion.div 
                  key={selectedChat.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full"
                >
                  {/* Header */}
                  <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedChat(null)}
                      className="md:hidden p-1 text-gray-500"
                    >
                      <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedChat.title}
                      </h3>
                      <p className="text-xs text-gray-400">{formatDate(selectedChat.createdAt)}</p>
                    </div>
                  </div>

                  {/* Messages */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {loadingMessages ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
                      </div>
                    ) : selectedChat.messages && selectedChat.messages.length > 0 ? (
                      selectedChat.messages.map((msg, index) => {
                        const isUser = msg.role === 'user'
                        
                        return (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.02 }}
                            className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-end gap-2 max-w-[80%] ${isUser ? 'flex-row-reverse' : ''}`}>
                              <div className={`w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center ${isUser ? 'bg-blue-600' : 'bg-purple-600'}`}>
                                {isUser 
                                  ? <User className="w-4 h-4 text-white" />
                                  : <Bot className="w-4 h-4 text-white" />
                                }
                              </div>
                              
                              <div className={`rounded-2xl p-3 shadow-sm ${
                                isUser 
                                  ? 'bg-blue-600 text-white rounded-br-sm' 
                                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                              }`}>
                                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                                {msg.timestamp && (
                                  <p className={`text-[10px] mt-1 text-right ${isUser ? 'text-blue-200' : 'text-gray-400'}`}>
                                    {formatTime(msg.timestamp)}
                                  </p>
                                )}
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-400">
                        <MessageSquareText className="w-10 h-10 mb-2" />
                        <p>{t.emptyChat}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="placeholder"
                  initial={{ opacity: 0 }} 
                  animate={{ opacity: 1 }} 
                  className="flex-1 flex items-center justify-center"
                >
                  <div className="text-center px-4">
                    <Bot className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t.selectChat}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  )
}