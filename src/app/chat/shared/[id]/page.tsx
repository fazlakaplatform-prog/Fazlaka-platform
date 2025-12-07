'use client';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  language?: 'ar' | 'en';
  timestamp?: Date;
}

interface SharedChat {
  _id: string;
  title: string;
  messages: Message[];
  sharedAt: string;
  sharerName?: string;
  sharerImage?: string;
}

export default function SharedChatPage() {
  const { language, isRTL } = useLanguage();
  const params = useParams();
  const shareId = params.id as string;
  
  const [chat, setChat] = useState<SharedChat | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSharedChat = async () => {
    try {
      console.log(`Fetching shared chat with ID: ${shareId}`);
      const response = await fetch(`/api/chat/shared/${shareId}`);
      
      console.log(`Response status: ${response.status}`);
      console.log(`Response ok: ${response.ok}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log('Shared chat data received successfully:', data);
        setChat(data);
        setError(null);
      } else {
        let errorMessage = language === 'ar' ? 'فشل في تحميل المحادثة المشتركة' : 'Failed to load shared chat';
        
        if (response.status === 403) {
          errorMessage = language === 'ar' 
            ? 'المحادثة المشتركة غير متاحة للعامة' 
            : 'The shared chat is not public';
        } else if (response.status === 404) {
          errorMessage = language === 'ar' 
            ? 'المحادثة المشتركة غير موجودة' 
            : 'The shared chat does not exist';
        }
        
        try {
          const responseText = await response.text();
          console.error('Error response (Text):', responseText);
          
          const cleanText = responseText.replace(/^"|"$/g, '');
          
          try {
            const errorData = JSON.parse(cleanText);
            if (errorData.error) {
              errorMessage = errorData.error;
            }
          } catch (parseError) {
            if (responseText.includes('<!DOCTYPE html>')) {
              // Using status code based error message
            } else if (responseText.trim()) {
              errorMessage = responseText;
            }
          }
        } catch (textError) {
          console.error('Could not get error response text either.');
        }
        
        setError(errorMessage);
        setChat(null);
      }
    } catch (error) {
      console.error('Network or other error fetching shared chat:', error);
      setError(language === 'ar' ? 'حدث خطأ أثناء تحميل المحادثة المشتركة' : 'An error occurred while loading the shared chat');
      setChat(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (shareId) {
      fetchSharedChat();
    }
  }, [shareId]);

  const texts = {
    ar: {
      title: 'محادثة مشتركة',
      loading: 'جاري تحميل المحادثة...',
      error: 'حدث خطأ أثناء تحميل المحادثة',
      notFound: 'المحادثة المشتركة غير موجودة أو تم حذفها',
      notPublic: 'المحادثة المشتركة غير متاحة للعامة',
      sharedBy: 'تمت المشاركة بواسطة',
      sharedAt: 'تمت المشاركة في',
      backToHome: 'العودة إلى الصفحة الرئيسية',
      startChat: 'بدء محادثة جديدة',
      genericError: 'حدث خطأ ما. يرجى المحاولة مرة أخرى لاحقًا.',
      assistant: 'مساعد فذلكه',
      user: 'مستخدم',
      copyLink: 'نسخ الرابط',
      linkCopied: 'تم نسخ الرابط!',
      openInChat: 'فتح في المحادثة',
      conversationWith: 'محادثة مع',
      poweredBy: 'مدعوم بواسطة فذلكه'
    },
    en: {
      title: 'Shared Chat',
      loading: 'Loading chat...',
      error: 'An error occurred while loading chat',
      notFound: 'The shared chat does not exist or has been deleted',
      notPublic: 'The shared chat is not public',
      sharedBy: 'Shared by',
      sharedAt: 'Shared at',
      backToHome: 'Back to Home',
      startChat: 'Start a new chat',
      genericError: 'Something went wrong. Please try again later.',
      assistant: 'Fazlaka Assistant',
      user: 'User',
      copyLink: 'Copy Link',
      linkCopied: 'Link Copied!',
      openInChat: 'Open in Chat',
      conversationWith: 'Conversation with',
      poweredBy: 'Powered by Fazlaka'
    }
  };

  const t = texts[language];

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatMessageTime = (date: Date | string) => {
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date;
      
      if (isNaN(dateObj.getTime())) {
        return '';
      }
      
      return dateObj.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting time:', error);
      return '';
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShowLinkCopiedAnimation(true);
    setTimeout(() => setShowLinkCopiedAnimation(false), 2000);
  };

  const [showLinkCopiedAnimation, setShowLinkCopiedAnimation] = useState(false);

  if (isLoading) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${isRTL ? 'rtl' : ''}`}
           style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'}}>
        <div className="text-center">
          <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-6 bg-slate-800/50 p-1">
            <Image
              src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
              alt="Fazlaka AI Assistant"
              width={76}
              height={76}
              className="object-cover rounded-full"
              priority
            />
          </div>
          <p className="text-lg text-gray-300">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error || !chat) {
    return (
      <div className={`flex flex-col items-center justify-center min-h-screen ${isRTL ? 'rtl' : ''}`}
           style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'}}>
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-slate-800/30 backdrop-blur-sm rounded-2xl p-8">
            <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-6 bg-slate-800/50 p-1">
              <Image
                src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
                alt="Fazlaka AI Assistant"
                width={76}
                height={76}
                className="object-cover rounded-full"
                priority
              />
            </div>
            <h2 className="text-xl font-semibold text-gray-100 mb-2">
              {t.error}
            </h2>
            <p className="text-gray-300 mb-6">
              {error || t.genericError}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link
                href="/"
                className="bg-slate-700/50 hover:bg-slate-600/50 text-blue-400 px-6 py-3 rounded-xl inline-flex items-center justify-center transition-all font-medium"
              >
                {t.backToHome}
              </Link>
              <Link
                href="/chat"
                className="bg-slate-700/50 hover:bg-slate-600/50 text-gray-300 px-6 py-3 rounded-xl inline-flex items-center justify-center transition-all font-medium"
              >
                {t.startChat}
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-screen ${isRTL ? 'rtl' : ''}`}
         style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'}}>
      
      {/* Simple Header - Empty for floating navbar */}
      <div className="h-16 bg-slate-900/30 backdrop-blur-sm border-b border-slate-700/30 relative z-20">
        {/* Empty header for floating navbar */}
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
        <div className="flex-1 flex flex-col min-w-0">
          {/* Simple Chat Header with User Info */}
          <div className="bg-slate-900/30 backdrop-blur-sm border-b border-slate-700/30 p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center">
              <div className="flex items-center">
                <div className="w-10 h-10 rounded-full overflow-hidden mr-3 border border-slate-600/50">
                  <Image
                    src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
                    alt="Fazlaka AI"
                    width={40}
                    height={40}
                    className="object-cover rounded-full"
                  />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-100">
                    {chat.title}
                  </h2>
                  <div className="flex items-center text-sm text-gray-300">
                    <span>{t.sharedBy}: </span>
                    <div className="flex items-center ml-1">
                      {chat.sharerImage ? (
                        <Image
                          src={chat.sharerImage}
                          alt={chat.sharerName || 'User'}
                          width={16}
                          height={16}
                          className="rounded-full mr-1"
                        />
                      ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                        </svg>
                      )}
                      <span className="font-medium">{chat.sharerName || 'مستخدم فذلكه'}</span>
                    </div>
                    <span className="mx-1">•</span>
                    <span>{formatDate(chat.sharedAt)}</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={copyShareLink}
                className="p-2 rounded-lg bg-slate-700/50 hover:bg-slate-600/50 transition-all"
                title={t.copyLink}
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                </svg>
              </button>
              <Link
                href="/chat"
                className="bg-blue-600/50 hover:bg-blue-700/50 text-white px-4 py-2 rounded-xl text-sm transition-all font-medium"
              >
                {t.openInChat}
              </Link>
            </div>
          </div>
          
          {/* Messages Container with Better Spacing */}
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <div className="max-w-4xl mx-auto space-y-8">
              {chat.messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} fade-in`}>
                  <div className={`max-w-[85%] p-5 rounded-2xl shadow-lg backdrop-blur-sm ${
                    msg.role === 'user' 
                      ? 'bg-blue-600/20 text-white border border-blue-500/30' 
                      : 'bg-slate-800/30 text-gray-100 border border-slate-600/30'
                  }`}>
                    <div className={`flex items-center mb-4 ${isRTL ? 'space-x-reverse' : ''}`}>
                      {msg.role === 'assistant' && (
                        <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-600/50">
                          <Image
                            src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
                            alt="Fazlaka AI"
                            width={32}
                            height={32}
                            className="object-cover rounded-full"
                          />
                        </div>
                      )}
                      {msg.role === 'user' && chat.sharerImage && (
                        <Image
                          src={chat.sharerImage}
                          alt={chat.sharerName || 'User'}
                          width={32}
                          height={32}
                          className="rounded-full"
                        />
                      )}
                      <p className={`text-xs font-medium opacity-80 ${isRTL ? 'mr-3' : 'ml-3'}`}>
                        {msg.role === 'user' ? (chat.sharerName || 'User') : t.assistant}
                      </p>
                    </div>
                    
                    <p className="text-sm whitespace-pre-wrap leading-relaxed mb-4">{msg.content}</p>
                    
                    {msg.timestamp && (
                      <div className="flex justify-end">
                        <p className="text-xs opacity-60">
                          {formatMessageTime(msg.timestamp)}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* Simple Footer */}
          <div className="bg-slate-900/30 backdrop-blur-sm border-t border-slate-700/30 p-4 flex-shrink-0">
            <div className="max-w-4xl mx-auto text-center">
              <p className="text-sm text-gray-300 mb-3">
                {t.poweredBy} • {t.conversationWith} {t.assistant}
              </p>
              <Link
                href="/chat"
                className="bg-blue-600/50 hover:bg-blue-700/50 text-white px-6 py-3 rounded-xl inline-flex items-center justify-center transition-all font-medium"
              >
                {t.startChat}
              </Link>
            </div>
          </div>
        </div>
      </div>
      
      {/* Link Copied Animation */}
      {showLinkCopiedAnimation && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-green-600/90 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-bounce-in">
          <div className="flex items-center space-x-2">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span className="font-medium">{t.linkCopied}</span>
          </div>
        </div>
      )}
      
      <style jsx>{`
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-bounce-in {
          animation: bounceIn 0.5s ease-out;
        }
        
        @keyframes bounceIn {
          0% {
            opacity: 0;
            transform: scale(0.3);
          }
          50% {
            opacity: 1;
            transform: scale(1.05);
          }
          70% {
            transform: scale(0.9);
          }
          100% {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(59, 130, 246, 0.3);
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(59, 130, 246, 0.5);
        }
      `}</style>
    </div>
  );
}