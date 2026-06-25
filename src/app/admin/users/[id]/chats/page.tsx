"use client"

import { useState, useEffect, useCallback, use } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { 
  ArrowLeft, 
  MessageCircle, 
  User, 
  Clock, 
  Loader2,
  Search,
  Eye,
  Image as ImageIcon
} from "lucide-react"
import Link from "next/link"
import Image from "next/image"
import { useLanguage } from "@/components/Language/LanguageProvider"

// --- Interfaces ---
interface ChatUser {
  id: string;
  name: string | null;
  image: string | null;
  email?: string;
}

interface LastMessage {
  content: string;
  senderName: string | null;
  createdAt: string;
}

interface Conversation {
  id: string;
  otherUser: ChatUser | null;
  lastMessage: LastMessage | null;
  updatedAt: string;
}

interface Message {
  id: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  senderId: string;
  sender: { id: string; name: string | null; image: string | null };
}

interface Params {
  id: string; // The ID of the user being monitored
}

// --- Translations ---
const translations = {
  ar: {
    title: "سجل المحادثات",
    back: "العودة للملف الشخصي",
    loading: "جاري التحميل...",
    noChats: "لا توجد محادثات لهذا المستخدم",
    selectChat: "اختر محادثة لعرض الرسائل",
    lastMessage: "آخر رسالة",
    searchPlaceholder: "بحث في المحادثات...",
    viewImage: "عرض الصورة",
    adminView: "وضع المسؤول (للقراءة فقط)"
  },
  en: {
    title: "Chat History",
    back: "Back to Profile",
    loading: "Loading...",
    noChats: "No conversations found for this user",
    selectChat: "Select a conversation to view messages",
    lastMessage: "Last message",
    searchPlaceholder: "Search conversations...",
    viewImage: "View Image",
    adminView: "Admin View (Read Only)"
  }
}

export default function UserChatsPage({ params }: { params: Promise<Params> }) {
  const resolvedParams = use(params)
  const targetUserId = resolvedParams.id
  
  const { isRTL, language } = useLanguage()
  const t = translations[language]
  
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [loadingConvos, setLoadingConvos] = useState(true)
  const [loadingMessages, setLoadingMessages] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [viewingImage, setViewingImage] = useState<string | null>(null)

  // Fetch Conversations List
  useEffect(() => {
    const fetchConversations = async () => {
      try {
        setLoadingConvos(true)
        const res = await fetch(`/api/admin/users/${targetUserId}/chats`)
        if (res.ok) {
          const data = await res.json()
          setConversations(data.conversations)
        }
      } catch (error) {
        console.error("Error fetching chats", error)
      } finally {
        setLoadingConvos(false)
      }
    }
    
    fetchConversations()
  }, [targetUserId])

  // Fetch Messages for selected conversation
  useEffect(() => {
    const fetchMessages = async () => {
      if (!selectedConv) return
      
      try {
        setLoadingMessages(true)
        const res = await fetch(`/api/admin/users/${targetUserId}/chats?conversationId=${selectedConv.id}`)
        if (res.ok) {
          const data = await res.json()
          setMessages(data.messages)
        }
      } catch (error) {
        console.error("Error fetching messages", error)
      } finally {
        setLoadingMessages(false)
      }
    }
    
    fetchMessages()
  }, [selectedConv, targetUserId])

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    
    if (days === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    if (days === 1) return language === 'ar' ? 'أمس' : 'Yesterday'
    if (days < 7) return date.toLocaleDateString([], { weekday: 'long' })
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' })
  }

  const filteredConversations = conversations.filter(conv => 
    conv.otherUser?.name?.toLowerCase().includes(searchQuery.toLowerCase())
  )

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
            <div className="p-3 bg-blue-100 dark:bg-blue-900/30 rounded-xl">
              <MessageCircle className="w-6 h-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">{t.title}</h1>
              <p className="text-xs text-amber-500 font-medium mt-1">{t.adminView}</p>
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

        {/* Main Content Container */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden h-[70vh] flex">
          
          {/* Sidebar: Conversations List */}
          <div className={`w-full md:w-80 border-r border-gray-100 dark:border-gray-700 flex flex-col ${selectedConv ? 'hidden md:flex' : 'flex'}`}>
            
            {/* Search */}
            <div className="p-4 border-b border-gray-100 dark:border-gray-700">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl py-2 pl-10 pr-4 text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto">
              {loadingConvos ? (
                <div className="flex justify-center items-center h-32">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              ) : filteredConversations.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-gray-400 px-4 text-center">
                  <MessageCircle className="w-8 h-8 mb-2 opacity-30" />
                  <p className="text-sm">{t.noChats}</p>
                </div>
              ) : (
                <div className="space-y-1 p-2">
                  {filteredConversations.map((conv) => (
                    <motion.button
                      key={conv.id}
                      onClick={() => setSelectedConv(conv)}
                      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                        selectedConv?.id === conv.id 
                          ? 'bg-blue-50 dark:bg-blue-900/20' 
                          : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'
                      }`}
                      whileHover={{ x: isRTL ? -4 : 4 }}
                    >
                      <div className="relative">
                        <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                          {conv.otherUser?.image ? (
                            <Image src={conv.otherUser.image} alt="" width={48} height={48} className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <User className="w-5 h-5 text-gray-400" />
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 text-left overflow-hidden">
                        <h4 className="font-semibold text-sm text-gray-900 dark:text-white truncate">
                          {conv.otherUser?.name || 'Unknown'}
                        </h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                          {conv.lastMessage?.content || '...'}
                        </p>
                      </div>
                      
                      <div className="text-right flex-shrink-0">
                        <span className="text-[10px] text-gray-400">
                          {conv.lastMessage ? formatTime(conv.lastMessage.createdAt) : ''}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Main: Chat View */}
          <div className={`flex-1 flex flex-col bg-gray-50 dark:bg-gray-900 ${!selectedConv ? 'hidden md:flex' : 'flex'}`}>
            
            <AnimatePresence mode="wait">
              {selectedConv ? (
                <motion.div 
                  key={selectedConv.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="flex flex-col h-full"
                >
                  {/* Chat Header */}
                  <div className="p-4 bg-white dark:bg-gray-800 border-b border-gray-100 dark:border-gray-700 flex items-center gap-3">
                    <button 
                      onClick={() => setSelectedConv(null)}
                      className="md:hidden p-1 text-gray-500"
                    >
                      <ArrowLeft className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
                    </button>
                    
                    <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-600">
                      {selectedConv.otherUser?.image ? (
                        <Image src={selectedConv.otherUser.image} alt="" width={40} height={40} className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-4 h-4 text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {selectedConv.otherUser?.name}
                      </h3>
                      <p className="text-xs text-gray-400">
                        {selectedConv.otherUser?.email}
                      </p>
                    </div>
                    
                    <Link href={`/admin/users/${selectedConv.otherUser?.id}`} target="_blank">
                      <motion.button 
                        whileHover={{ scale: 1.1 }}
                        className="p-2 text-gray-500 hover:text-blue-600 bg-gray-100 dark:bg-gray-700 rounded-full"
                        title="View Profile"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                    </Link>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {loadingMessages ? (
                      <div className="flex justify-center items-center h-full">
                        <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isTargetUser = msg.senderId === targetUserId
                        
                        return (
                          <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, y: 5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className={`flex ${isTargetUser ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`flex items-end gap-2 max-w-[70%] ${isTargetUser ? 'flex-row-reverse' : ''}`}>
                              <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0 bg-gray-200 dark:bg-gray-600">
                                {msg.sender.image ? (
                                  <Image src={msg.sender.image} alt="" width={24} height={24} className="object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <User className="w-3 h-3 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              
                              <div className={`rounded-2xl p-2.5 ${
                                isTargetUser 
                                  ? 'bg-blue-600 text-white rounded-br-sm' 
                                  : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                              }`}>
                                {msg.imageUrl && (
                                  <div 
                                    className="relative w-48 h-48 rounded-lg overflow-hidden mb-1 cursor-pointer"
                                    onClick={() => setViewingImage(msg.imageUrl!)}
                                  >
                                    <Image src={msg.imageUrl} alt="Attachment" fill className="object-cover" />
                                    <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                      <ImageIcon className="w-6 h-6 text-white" />
                                    </div>
                                  </div>
                                )}
                                {msg.content && (
                                  <p className="text-sm">{msg.content}</p>
                                )}
                                <p className={`text-[10px] mt-1 ${isTargetUser ? 'text-blue-200' : 'text-gray-400'}`}>
                                  {formatTime(msg.createdAt)}
                                </p>
                              </div>
                            </div>
                          </motion.div>
                        )
                      })
                    )}
                  </div>

                  {/* Footer: Read Only Notice */}
                  <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 text-center">
                    <p className="text-xs text-gray-400 italic">
                      {t.adminView}
                    </p>
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
                    <MessageCircle className="w-16 h-16 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">{t.selectChat}</p>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Image Viewer Lightbox */}
      <AnimatePresence>
        {viewingImage && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }} 
            className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-pointer" 
            onClick={() => setViewingImage(null)}
          >
            <motion.img 
              src={viewingImage} 
              initial={{ scale: 0.8, opacity: 0 }} 
              animate={{ scale: 1, opacity: 1 }} 
              exit={{ scale: 0.8, opacity: 0 }} 
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}