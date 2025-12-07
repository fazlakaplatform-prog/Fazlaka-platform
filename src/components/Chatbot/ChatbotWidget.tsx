'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { motion, AnimatePresence } from 'framer-motion';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  isTyping?: boolean;
}

export default function ChatbotWidget() {
  const { data: session } = useSession();
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();

  const [isOpen, setIsOpen] = useState(false);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [isDark, setIsDark] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // استماع لتغييرات الثيم
  useEffect(() => {
    const updateTheme = () => {
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        setIsDark(savedDarkMode === 'true');
      } else {
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        setIsDark(prefersDark);
      }
    };

    // التحقق الأولي
    updateTheme();

    // الاستماع للتغييرات
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'darkMode') {
        updateTheme();
      }
    };

    // الاستماع لتغييرات الكلاس في HTML
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });

    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const detectLanguage = (text: string): 'ar' | 'en' => {
    const cleanText = text.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
    const arabicChars = cleanText.match(/[\u0600-\u06FF]/g);
    const arabicCount = arabicChars ? arabicChars.length : 0;
    const englishChars = cleanText.match(/[a-zA-Z]/g);
    const englishCount = englishChars ? englishChars.length : 0;
    const totalChars = cleanText.length;
    
    if (totalChars === 0) return language === 'ar' ? 'ar' : 'en';
    
    const arabicRatio = arabicCount / totalChars;
    const englishRatio = englishCount / totalChars;
    
    if (arabicRatio > 0.3) return 'ar';
    if (englishRatio > 0.3) return 'en';
    
    return language === 'ar' ? 'ar' : 'en';
  };

  const simulateTyping = (fullText: string, messageIndex: number) => {
    let currentText = '';
    let charIndex = 0;

    const typeChar = () => {
      if (charIndex < fullText.length) {
        currentText += fullText[charIndex];
        
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[messageIndex]) {
            newMessages[messageIndex] = {
              ...newMessages[messageIndex],
              content: currentText,
              isTyping: true
            };
          }
          return newMessages;
        });

        charIndex++;
        typingTimeoutRef.current = setTimeout(typeChar, 20);
      } else {
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[messageIndex]) {
            newMessages[messageIndex] = {
              ...newMessages[messageIndex],
              isTyping: false
            };
          }
          return newMessages;
        });
        setIsTyping(false);
      }
    };

    typeChar();
  };

  const createNewChat = async () => {
    try {
      const response = await fetch('/api/chat/history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: language === 'ar' ? 'محادثة جديدة' : 'New Chat',
        }),
      });
      
      if (response.ok) {
        const newChat = await response.json();
        setCurrentChatId(newChat._id);
        return newChat._id;
      }
    } catch (error) {
      console.error('Error creating new chat in widget:', error);
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || isTyping) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    let chatId = currentChatId;
    if (!chatId) {
      chatId = await createNewChat();
      if (!chatId) {
        console.error("Failed to create chat, sending message without saving.");
      }
    }

    const userLanguage = detectLanguage(input);
    const userMessage: Message = { role: 'user', content: input };
    
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);
    setIsTyping(false);
    
    const currentInput = input;
    
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMessage],
          userName: session?.user?.name,
          hasGreeted: messages.length > 0,
          userContext: {
            userId: session?.user?.id,
            language: language,
            userLanguage: userLanguage,
          },
          chatId: chatId,
        }),
      });

      if (!response.ok) throw new Error('Failed to send message');

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          fullResponse += decoder.decode(value, { stream: true });
        }
      }

      setMessages(prev => {
        const newMessages = [...prev];
        const assistantMessage: Message = { role: 'assistant', content: '', isTyping: true };
        newMessages.push(assistantMessage);
        const messageIndex = newMessages.length - 1;
        
        setTimeout(() => {
          setIsTyping(true);
          simulateTyping(fullResponse, messageIndex);
        }, 300);
        
        return newMessages;
      });
      
    } catch (error) {
      console.error(error);
      const errorMessage = userLanguage === 'ar' 
        ? 'عذراً، حدث خطأ ما. حاول مرة أخرى.' 
        : 'Sorry, something went wrong. Please try again.';
        
      setMessages(prev => [
        ...prev, 
        { role: 'assistant', content: errorMessage, isTyping: false }
      ]);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleChatbot = () => {
    setIsOpen(!isOpen);
  };

  const openFullChat = () => {
    if (currentChatId) {
      router.push(`/chat?chatId=${currentChatId}`);
    } else {
      router.push('/chat');
    }
  };

  const texts = {
    ar: {
      title: 'مساعد فذلكه',
      placeholder: 'اكتب سؤالك...',
      openFullChat: 'فتح في نافذة كاملة',
      welcome: 'أهلاً بك! أنا مساعدك الذكي، كيف يمكنني مساعدتك؟'
    },
    en: {
      title: 'Fazlaka Assistant',
      placeholder: 'Type your question...',
      openFullChat: 'Open in full screen',
      welcome: 'Welcome! I am your smart assistant, how can I help you?'
    }
  };

  const t = texts[language];

  return (
    <>
      {pathname !== '/chat' && pathname !== '/chat/shared' && (
        <div className={`fixed bottom-4 ${isRTL ? 'right-4 left-auto' : 'left-4'} z-50 flex flex-col items-end`}>
          <AnimatePresence>
            {isOpen && (
              <motion.div
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className={`backdrop-blur-xl rounded-2xl shadow-2xl w-96 h-[500px] flex flex-col mb-4 border ${
                  isDark 
                    ? 'bg-gray-900/80 border-gray-700/30' 
                    : 'bg-white/80 border-gray-200/30'
                }`}
              >
                <div className={`p-4 rounded-t-2xl flex justify-between items-center ${
                  isDark 
                    ? 'bg-gray-800/50 border-b border-gray-700/30' 
                    : 'bg-gray-50/50 border-b border-gray-200/30'
                }`}>
                  <div className="flex items-center">
                    <div className={`w-8 h-8 rounded-full overflow-hidden mr-2 ${
                      isDark ? 'border-gray-600' : 'border-gray-300'
                    }`}>
                      <Image
                        src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
                        alt="Fazlaka AI Assistant"
                        width={32}
                        height={32}
                        className="object-cover rounded-full"
                      />
                    </div>
                    <h3 className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h3>
                  </div>
                  <div className="flex items-center space-x-2">
                    <motion.button
                      onClick={openFullChat}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDark 
                          ? 'hover:bg-gray-700/50 text-gray-300' 
                          : 'hover:bg-gray-200/50 text-gray-600'
                      }`}
                      title={t.openFullChat}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5 5m0 0v-4m0 4h-4" />
                      </svg>
                    </motion.button>
                    <motion.button
                      onClick={toggleChatbot}
                      className={`p-1.5 rounded-lg transition-colors ${
                        isDark 
                          ? 'hover:bg-gray-700/50 text-gray-300' 
                          : 'hover:bg-gray-200/50 text-gray-600'
                      }`}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
                
                <div className={`flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar ${
                  isDark ? 'bg-gray-900/30' : 'bg-white/30'
                }`}>
                  {messages.length === 0 && (
                    <div className="text-center py-6">
                      <div className={`w-16 h-16 rounded-full overflow-hidden mx-auto mb-3 p-1 ${
                        isDark ? 'bg-gray-800/50' : 'bg-gray-100/50'
                      }`}>
                        <Image
                          src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
                          alt="Fazlaka AI Assistant"
                          width={60}
                          height={60}
                          className="object-cover rounded-full"
                        />
                      </div>
                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{t.welcome}</p>
                    </div>
                  )}
                  
                  {messages.map((msg, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.1 }}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[80%] p-4 rounded-2xl ${
                        msg.role === 'user' 
                          ? isDark
                            ? 'bg-gray-700/70 text-white'
                            : 'bg-gray-200/70 text-gray-900'
                          : isDark
                            ? 'bg-gray-800/70 text-gray-100'
                            : 'bg-gray-100/70 text-gray-800'
                      }`}>
                        {msg.role === 'assistant' && msg.isTyping ? (
                          <div>
                            <p className="text-sm whitespace-pre-wrap">
                              {msg.content}
                              <span className="cursor-blink">|</span>
                            </p>
                          </div>
                        ) : (
                          <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                        )}
                      </div>
                    </motion.div>
                  ))}
                  
                  {isLoading && (
                    <div className="flex justify-start">
                      <div className={`p-4 rounded-2xl ${
                        isDark ? 'bg-gray-800/70' : 'bg-gray-100/70'
                      }`}>
                        <div className="typing-indicator">
                          <span></span>
                          <span></span>
                          <span></span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
                
                <div className={`p-4 rounded-b-2xl ${
                  isDark 
                    ? 'bg-gray-800/50 border-t border-gray-700/30' 
                    : 'bg-gray-50/50 border-t border-gray-200/30'
                }`}>
                  <div className="flex items-center space-x-2">
                    <input
                      ref={inputRef}
                      type="text"
                      className={`flex-1 p-3 rounded-full focus:outline-none focus:ring-2 focus:ring-gray-400/50 focus:border-transparent text-sm ${
                        isDark 
                          ? 'bg-gray-700/60 border-gray-600/50 text-gray-100 placeholder-gray-400' 
                          : 'bg-white/60 border-gray-300/50 text-gray-900 placeholder-gray-500'
                      } border`}
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyPress={handleKeyPress}
                      disabled={isLoading || isTyping}
                      placeholder={t.placeholder}
                    />
                    <motion.button
                      onClick={handleSendMessage}
                      disabled={isLoading || isTyping || !input.trim()}
                      className={`p-3 rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-all ${
                        isDark
                          ? 'bg-gray-700/80 hover:bg-gray-600/80 text-gray-200'
                          : 'bg-gray-200/80 hover:bg-gray-300/80 text-gray-700'
                      }`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                      </svg>
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
          
          {!isOpen && (
            <motion.button
              onClick={toggleChatbot}
              className={`backdrop-blur-xl p-4 rounded-full shadow-xl border ${
                isDark
                  ? 'bg-gray-800/80 border-gray-700/50 hover:bg-gray-700/80'
                  : 'bg-white/80 border-gray-200/50 hover:bg-gray-50/80'
              }`}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 rounded-full overflow-hidden">
                <Image
                  src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
                  alt="Fazlaka AI Assistant"
                  width={32}
                  height={32}
                  className="object-cover rounded-full"
                />
              </div>
            </motion.button>
          )}
        </div>
      )}
      
      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
        }
        
        .typing-indicator span {
          height: 8px;
          width: 8px;
          background-color: ${isDark ? '#9CA3AF' : '#6B7280'};
          border-radius: 50%;
          display: inline-block;
          margin: 0 2px;
          animation: bounce 1.4s infinite ease-in-out both;
        }
        
        .typing-indicator span:nth-child(1) {
          animation-delay: -0.32s;
        }
        
        .typing-indicator span:nth-child(2) {
          animation-delay: -0.16s;
        }
        
        @keyframes bounce {
          0%, 80%, 100% {
            transform: scale(0);
          }
          40% {
            transform: scale(1);
          }
        }
        
        .cursor-blink {
          animation: blink 1s infinite;
        }
        
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
        
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: ${isDark ? 'rgba(156, 163, 175, 0.3)' : 'rgba(107, 114, 128, 0.3)'};
          border-radius: 3px;
        }
        
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: ${isDark ? 'rgba(156, 163, 175, 0.5)' : 'rgba(107, 114, 128, 0.5)'};
        }
      `}</style>
    </>
  );
}