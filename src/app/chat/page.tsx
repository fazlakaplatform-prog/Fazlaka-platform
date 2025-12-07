// src/app/chat/page.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  suggestions?: string[];
  isTyping?: boolean;
  language?: 'ar' | 'en';
  timestamp?: Date | string;
}

interface ChatHistory {
  _id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
  shareId?: string;
  isPublic?: boolean;
}

export default function ChatPage() {
  const { data: session } = useSession();
  const { language, isRTL } = useLanguage();
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [chatHistory, setChatHistory] = useState<ChatHistory[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [currentChatTitle, setCurrentChatTitle] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [hasGreeted, setHasGreeted] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [pendingResponse, setPendingResponse] = useState<string | null>(null);
  const [showRenameModal, setShowRenameModal] = useState(false);
  const [newChatTitle, setNewChatTitle] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareLink, setShareLink] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [shareId, setShareId] = useState<string | null>(null);
  const [showNewChatAnimation, setShowNewChatAnimation] = useState(false);
  const [showLinkCopiedAnimation, setShowLinkCopiedAnimation] = useState(false);
  const [showLinkGeneratingAnimation, setShowLinkGeneratingAnimation] = useState(false);
  
  const inputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const processedQueryRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  const texts = {
    ar: {
      title: 'مساعد فذلكه الذكي',
      subtitle: 'جزء من فريق فذلكه',
      welcome: session?.user?.name ? `مرحباً بك يا ${session.user.name}!` : 'مرحباً بك في فذلكه!',
      description: 'أنا مساعدك الذكي في فذلكه، هنا لمساعدتك في استكشاف محتوى المنصة',
      placeholder: 'اكتب سؤالك...',
      suggestions: 'قد تهمك أيضاً:',
      newChat: 'محادثة جديدة',
      chatHistory: 'سجل المحادثات',
      deleteChat: 'حذف المحادثة',
      confirmDelete: 'هل أنت متأكد من حذف هذه المحادثة؟',
      noChats: 'لا توجد محادثات سابقة',
      renameChat: 'تغيير اسم المحادثة',
      shareChat: 'مشاركة المحادثة',
      vision: 'رؤية الفريق',
      latestEpisodes: 'أحدث الحلقات',
      latestArticles: 'أحدث المقالات',
      team: 'فريق العمل',
      close: 'إغلاق',
      visionQuestion: 'ما هي رؤية فريق فذلكه؟',
      episodesQuestion: 'ما هي أحدث الحلقات؟',
      articlesQuestion: 'ما هي أحدث المقالات؟',
      teamQuestion: 'من هم أعضاء الفريق؟',
      errorMessage: 'عذراً، حدث خطأ ما. حاول مرة أخرى.',
      today: 'اليوم',
      yesterday: 'أمس',
      daysAgo: 'منذ {days} أيام',
      copyLink: 'نسخ الرابط',
      linkCopied: 'تم نسخ الرابط!',
      publicShare: 'مشاركة عامة',
      privateShare: 'مشاركة خاصة',
      shareDescription: 'يمكن لأي شخص لديه الرابط مشاهدة هذه المحادثة',
      generateLink: 'إنشاء رابط المشاركة',
      shareType: 'نوع المشاركة',
      privateDescription: 'يمكن فقط للأشخاص الذين تشارك معهم الرابط رؤية هذه المحادثة',
      searchPromptTemplate: "أنا أبحث عن: \"{query}\". هل هذا المحتوى متاح على منصة فذلكه؟",
      typingIndicator: 'يكتب...',
      smartTitle: 'عنوان ذكي',
      save: 'حفظ',
      cancel: 'إلغاء',
      assistant: 'مساعد فذلكه'  // Added this line
    },
    en: {
      title: 'Fazlaka AI Assistant',
      subtitle: 'Part of Fazlaka team',
      welcome: session?.user?.name ? `Welcome ${session.user.name}!` : 'Welcome to Fazlaka!',
      description: 'I am your smart assistant at Fazlaka, here to help you explore platform content',
      placeholder: 'Type your question...',
      suggestions: 'You might also be interested in:',
      newChat: 'New Chat',
      chatHistory: 'Chat History',
      deleteChat: 'Delete Chat',
      confirmDelete: 'Are you sure you want to delete this chat?',
      noChats: 'No previous chats',
      renameChat: 'Rename Chat',
      shareChat: 'Share Chat',
      vision: 'Team Vision',
      latestEpisodes: 'Latest Episodes',
      latestArticles: 'Latest Articles',
      team: 'Team',
      close: 'Close',
      visionQuestion: 'What is Fazlaka team\'s vision?',
      episodesQuestion: 'What are latest episodes?',
      articlesQuestion: 'What are latest articles?',
      teamQuestion: 'Who are team members?',
      errorMessage: 'Sorry, something went wrong. Please try again.',
      today: 'Today',
      yesterday: 'Yesterday',
      daysAgo: '{days} days ago',
      copyLink: 'Copy Link',
      linkCopied: 'Link Copied!',
      publicShare: 'Public Share',
      privateShare: 'Private Share',
      shareDescription: 'Anyone with link can view this conversation',
      generateLink: 'Generate Share Link',
      shareType: 'Share Type',
      privateDescription: 'Only people you share link with can view this conversation',
      searchPromptTemplate: "I am searching for: \"{query}\". Is this content available on the Fazlaka platform?",
      typingIndicator: 'Typing...',
      smartTitle: 'Smart Title',
      save: 'Save',
      cancel: 'Cancel',
      assistant: 'Fazlaka Assistant'  // Added this line
    }
  };

  const t = texts[language];

  useEffect(() => {
    if (session?.user?.id) {
      fetchChatHistory();
    }
  }, [session]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const chatIdFromUrl = searchParams.get('chatId');
    if (chatIdFromUrl) {
      loadChat(chatIdFromUrl);
    }
  }, [searchParams]);

  useEffect(() => {
    const queryFromUrl = searchParams.get('q');
    
    if (queryFromUrl && queryFromUrl !== processedQueryRef.current && !isLoading) {
      processedQueryRef.current = queryFromUrl;
      
      const processAndSend = async () => {
        setIsLoading(true);
        
        const newChatId = await createNewChat();
        
        if (newChatId) {
          const userMessage: Message = { 
            role: 'user', 
            content: queryFromUrl,
            language: language,
            timestamp: new Date()
          };
          
          setMessages([userMessage]);
          setHasGreeted(true);
          
          await handleSendMessageWithQuery(queryFromUrl, [userMessage], newChatId);
        }
        
        setIsLoading(false);
      };

      processAndSend();
    }
  }, [searchParams, isLoading]);

  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (
      lastMessage && 
      lastMessage.role === 'assistant' && 
      lastMessage.isTyping && 
      lastMessage.content === '' && 
      pendingResponse
    ) {
      const messageIndex = messages.length - 1;
      setIsTyping(true);
      simulateTyping(pendingResponse, messageIndex);
      setPendingResponse(null);
    }
  }, [messages, pendingResponse]);

  useEffect(() => {
    if (!isTyping && !isLoading) {
      scrollToBottom();
    }
  }, [messages, isTyping, isLoading]);

  const scrollToBottom = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  };

  const fetchChatHistory = async () => {
    try {
      const response = await fetch('/api/chat/history');
      if (response.ok) {
        const history = await response.json();
        const uniqueHistory = history.filter((chat: ChatHistory, index: number, self: ChatHistory[]) => 
          index === self.findIndex((c: ChatHistory) => c._id === chat._id)
        );
        setChatHistory(uniqueHistory);
      }
    } catch (error) {
      console.error('Error fetching chat history:', error);
    }
  };

  const createNewChat = async () => {
    try {
      setShowNewChatAnimation(true);
      setTimeout(() => setShowNewChatAnimation(false), 500);
      
      const response = await fetch('/api/chat/history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: language === 'ar' ? 'محادثة جديدة' : 'New Chat',
        }),
      });
      
      if (response.ok) {
        const newChat = await response.json();
        setChatHistory(prev => {
          const filtered = prev.filter(chat => chat._id !== newChat._id);
          return [newChat, ...filtered];
        });
        setCurrentChatId(newChat._id);
        setCurrentChatTitle(newChat.title);
        setIsPublic(newChat.isPublic || false);
        setShareId(newChat.shareId || null);
        setMessages([]);
        setHasGreeted(false);
        setSuggestions([]);
        
        return newChat._id;
      }
    } catch (error) {
      console.error('Error creating new chat:', error);
    }
    return null;
  };

  const loadChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/history/${chatId}`);
      if (response.ok) {
        const chat = await response.json();
        setCurrentChatId(chat._id);
        setCurrentChatTitle(chat.title);
        setIsPublic(chat.isPublic || false);
        setShareId(chat.shareId || null);
        
        const chatMessages = Array.isArray(chat.messages) ? chat.messages : [];
        setMessages(chatMessages);
        
        setHasGreeted(chatMessages.length > 0);
        setSuggestions([]);

        setChatHistory(prev => {
          const filtered = prev.filter(c => c._id !== chat._id);
          return [chat, ...filtered];
        });
      }
    } catch (error) {
      console.error('Error loading chat:', error);
    }
  };

  const deleteChat = async (chatId: string) => {
    try {
      const response = await fetch(`/api/chat/history/${chatId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        setChatHistory(prev => prev.filter(chat => chat._id !== chatId));
        
        if (currentChatId === chatId) {
          setCurrentChatId(null);
          setCurrentChatTitle('');
          setMessages([]);
          setHasGreeted(false);
          setSuggestions([]);
          setShareId(null);
        }
      }
    } catch (error) {
      console.error('Error deleting chat:', error);
    }
  };

  const renameChat = async () => {
    if (!currentChatId || !newChatTitle.trim()) return;
    
    try {
      const response = await fetch(`/api/chat/history/${currentChatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: newChatTitle,
          messages: messages,
        }),
      });
      
      if (response.ok) {
        setCurrentChatTitle(newChatTitle);
        setChatHistory(prev => prev.map(chat => 
          chat._id === currentChatId ? { ...chat, title: newChatTitle } : chat
        ));
        setShowRenameModal(false);
        setNewChatTitle('');
      }
    } catch (error) {
      console.error('Error renaming chat:', error);
    }
  };

  const generateSmartTitle = async (userMessage: string) => {
    try {
      const response = await fetch('/api/chat/generate-title', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          language: language
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        return data.title;
      }
    } catch (error) {
      console.error('Error generating smart title:', error);
    }
    
    return userMessage.substring(0, 30) + (userMessage.length > 30 ? '...' : '');
  };

  const openShareModal = () => {
    if (!currentChatId) return;
    
    const currentChat = chatHistory.find(chat => chat._id === currentChatId);
    if (currentChat && currentChat.shareId) {
      setIsPublic(currentChat.isPublic || false);
      setShareLink(`${window.location.origin}/chat/shared/${currentChat.shareId}`);
    } else {
      setIsPublic(false);
      setShareLink('');
    }
    
    setShowShareModal(true);
  };

  const handleShareTypeChange = (newIsPublic: boolean) => {
    setIsPublic(newIsPublic);
    setShareLink('');
  };

  const generateShareLink = async () => {
    if (!currentChatId) return;
    
    setShowLinkGeneratingAnimation(true);
    
    try {
      const response = await fetch(`/api/chat/share/${currentChatId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isPublic: isPublic
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        const newShareLink = `${window.location.origin}/chat/shared/${data.shareId}`;
        setShareLink(newShareLink);
        setShareId(data.shareId);
        
        setChatHistory(prev => prev.map(chat => 
          chat._id === currentChatId ? { ...chat, shareId: data.shareId, isPublic: data.isPublic } : chat
        ));
      }
    } catch (error) {
      console.error('Error generating share link:', error);
    } finally {
      setShowLinkGeneratingAnimation(false);
    }
  };

  const copyShareLink = () => {
    navigator.clipboard.writeText(shareLink);
    setShowLinkCopiedAnimation(true);
    setTimeout(() => setShowLinkCopiedAnimation(false), 2000);
  };

  const detectLanguage = (text: string): 'ar' | 'en' => {
    const cleanText = text.replace(/[^\w\s]/gi, '').replace(/\s+/g, ' ').trim();
    const arabicChars = cleanText.match(/[\u0600-\u06FF]/g);
    const arabicCount = arabicChars ? arabicChars.length : 0;
    const englishChars = cleanText.match(/[a-zA-Z]/g);
    const englishCount = englishChars ? englishChars.length : 0;
    const totalChars = cleanText.length;
    
    if (totalChars === 0) {
      return language === 'ar' ? 'ar' : 'en';
    }
    
    const arabicRatio = arabicCount / totalChars;
    const englishRatio = englishCount / totalChars;
    
    if (arabicRatio > 0.3) {
      return 'ar';
    }
    
    if (englishRatio > 0.3) {
      return 'en';
    }
    
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
        typingTimeoutRef.current = setTimeout(typeChar, 30);
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

  const handleSendMessage = async () => {
    if (!input.trim() || isLoading || isTyping) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    let chatIdToUse = currentChatId;
    if (!chatIdToUse) {
      chatIdToUse = await createNewChat();
      if (!chatIdToUse) return;
    }

    const userLanguage = detectLanguage(input);
    
    const userMessage: Message = { 
      role: 'user', 
      content: input,
      language: userLanguage,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMessage]);
    setSuggestions([]);
    setInput('');
    setIsLoading(true);
    setIsTyping(false);
    
    const currentInput = input;
    
    try {
      const template = texts[userLanguage].searchPromptTemplate;
      const finalPrompt = template.replace("{query}", currentInput);
      const messagesForApi = [...messages, { ...userMessage, content: finalPrompt }];

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForApi,
          userName: session?.user?.name,
          hasGreeted: hasGreeted,
          userContext: {
            userId: session?.user?.id,
            language: language,
            userLanguage: userLanguage,
          },
          chatId: chatIdToUse
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!hasGreeted) {
        setHasGreeted(true);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          fullResponse += text;
        }
      }

      const suggestionsKeyword = userLanguage === 'ar' ? '**قد تهمك أيضاً:**' : '**You might also be interested in:**';
      let extractedSuggestions: string[] = [];
      let displayResponse = fullResponse;

      if (fullResponse.includes(suggestionsKeyword)) {
        const suggestionsStartIndex = fullResponse.indexOf(suggestionsKeyword);
        if (suggestionsStartIndex !== -1) {
          displayResponse = fullResponse.substring(0, suggestionsStartIndex).trim();
          
          const suggestionsText = fullResponse.substring(suggestionsStartIndex + suggestionsKeyword.length);
          const lines = suggestionsText.split('\n').filter(line => line.trim());
          
          extractedSuggestions = lines
            .filter(line => line.match(/^\d+\.\s+/))
            .map(line => line.replace(/^\d+\.\s+/, ''));
        }
      }
      setSuggestions(extractedSuggestions);

      // حفظ رد المساعد فوراً في قاعدة البيانات
      const assistantMessage: Message = {
        role: 'assistant',
        content: displayResponse,
        language: userLanguage,
        timestamp: new Date()
      };

      const updatedMessages = [...messages, userMessage, assistantMessage];

      // تحديث قاعدة البيانات بالرسائل الكاملة
      await fetch(`/api/chat/history/${chatIdToUse}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: currentChatTitle,
          messages: updatedMessages
        }),
      });

      setPendingResponse(displayResponse);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          isTyping: true,
          language: userLanguage,
          timestamp: new Date()
        }
      ]);
      
      if (messages.length === 0 && chatIdToUse) {
        const smartTitle = await generateSmartTitle(currentInput);
        setCurrentChatTitle(smartTitle);
        
        // حفظ العنوان الذكي في قاعدة البيانات
        await fetch(`/api/chat/history/${chatIdToUse}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: smartTitle,
            messages: updatedMessages
          }),
        });
        
        setChatHistory(prev => prev.map(chat => 
          chat._id === chatIdToUse ? { ...chat, title: smartTitle } : chat
        ));
      }
      
    } catch (error) {
      console.error(error);
      const errorMessage = userLanguage === 'ar' 
        ? 'عذراً، حدث خطأ ما. حاول مرة أخرى.' 
        : 'Sorry, something went wrong. Please try again.';
        
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: errorMessage,
          isTyping: false,
          language: userLanguage,
          timestamp: new Date()
        }
      ]);
      setIsTyping(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessageWithQuery = async (query: string, messagesToSend: Message[], chatId: string) => {
    if (!query.trim() || isLoading || isTyping) return;

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    const userLanguage = detectLanguage(query);
    
    setSuggestions([]);
    setInput('');
    setIsLoading(true);
    setIsTyping(false);
    
    try {
      const template = texts[userLanguage].searchPromptTemplate;
      const finalPrompt = template.replace("{query}", query);
      
      const messagesForApi = messagesToSend.map(msg => 
        msg.role === 'user' && msg.content === query 
          ? { ...msg, content: finalPrompt } 
          : msg
      );

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: messagesForApi,
          userName: session?.user?.name,
          hasGreeted: hasGreeted,
          userContext: {
            userId: session?.user?.id,
            language: language,
            userLanguage: userLanguage,
          },
          chatId: chatId
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const text = decoder.decode(value, { stream: true });
          fullResponse += text;
        }
      }

      const suggestionsKeyword = userLanguage === 'ar' ? '**قد تهمك أيضاً:**' : '**You might also be interested in:**';
      let extractedSuggestions: string[] = [];
      let displayResponse = fullResponse;

      if (fullResponse.includes(suggestionsKeyword)) {
        const suggestionsStartIndex = fullResponse.indexOf(suggestionsKeyword);
        if (suggestionsStartIndex !== -1) {
          displayResponse = fullResponse.substring(0, suggestionsStartIndex).trim();
          
          const suggestionsText = fullResponse.substring(suggestionsStartIndex + suggestionsKeyword.length);
          const lines = suggestionsText.split('\n').filter(line => line.trim());
          
          extractedSuggestions = lines
            .filter(line => line.match(/^\d+\.\s+/))
            .map(line => line.replace(/^\d+\.\s+/, ''));
        }
      }
      setSuggestions(extractedSuggestions);

      // حفظ رد المساعد فوراً في قاعدة البيانات
      const assistantMessage: Message = {
        role: 'assistant',
        content: displayResponse,
        language: userLanguage,
        timestamp: new Date()
      };

      const updatedMessages = [...messagesToSend, assistantMessage];

      // تحديث قاعدة البيانات بالرسائل الكاملة
      await fetch(`/api/chat/history/${chatId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: currentChatTitle,
          messages: updatedMessages
        }),
      });

      setPendingResponse(displayResponse);

      setMessages(prev => [
        ...prev,
        {
          role: 'assistant',
          content: '',
          isTyping: true,
          language: userLanguage,
          timestamp: new Date()
        }
      ]);
      
      if (messagesToSend.length === 1 && chatId) {
        const smartTitle = await generateSmartTitle(query);
        setCurrentChatTitle(smartTitle);
        
        // حفظ العنوان الذكي في قاعدة البيانات
        await fetch(`/api/chat/history/${chatId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            title: smartTitle,
            messages: updatedMessages
          }),
        });
        
        setChatHistory(prev => prev.map(chat => 
          chat._id === chatId ? { ...chat, title: smartTitle } : chat
        ));
      }
      
    } catch (error) {
      console.error(error);
      const errorMessage = userLanguage === 'ar' 
        ? 'عذراً، حدث خطأ ما. حاول مرة أخرى.' 
        : 'Sorry, something went wrong. Please try again.';
        
      setMessages(prev => [
        ...prev, 
        { 
          role: 'assistant', 
          content: errorMessage,
          isTyping: false,
          language: userLanguage,
          timestamp: new Date()
        }
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

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
    inputRef.current?.focus();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return t.today;
    } else if (diffDays === 1) {
      return t.yesterday;
    } else {
      return t.daysAgo.replace('{days}', diffDays.toString());
    }
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

  return (
    <div className={`flex flex-col h-screen ${isRTL ? 'rtl' : ''}`}
         style={{background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #0f172a 100%)'}}>
      
      {/* Simple Header - Empty for floating navbar */}
      <div className="h-16 bg-slate-900/30 backdrop-blur-sm border-b border-slate-700/30 relative z-20">
        {/* Empty header for floating navbar */}
      </div>

      <div className="flex flex-1 overflow-hidden relative z-10">
        {/* Enhanced Sidebar */}
        <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 bg-slate-800/40 backdrop-blur-sm border-r border-slate-700/30 overflow-hidden flex flex-col flex-shrink-0`}>
          <div className="p-4 border-b border-slate-700/30">
            <button
              onClick={createNewChat}
              className="w-full bg-blue-600/50 hover:bg-blue-700/50 text-white p-3 rounded-xl flex items-center justify-center transition-all font-medium"
            >
              <span className="mr-2">+</span>
              {t.newChat}
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
            <h3 className="text-sm font-semibold text-gray-300 mb-4 flex items-center">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {t.chatHistory}
            </h3>
            
            {chatHistory.length === 0 ? (
              <div className="text-center py-8">
                <svg className="w-12 h-12 mx-auto text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p className="text-sm text-gray-400">{t.noChats}</p>
              </div>
            ) : (
              <ul className="space-y-2">
                {chatHistory.map(chat => (
                  <li key={chat._id} className="group relative">
                    <div
                      onClick={() => loadChat(chat._id)}
                      className={`w-full text-left p-3 rounded-xl transition-all cursor-pointer ${
                        currentChatId === chat._id
                          ? 'bg-blue-600/30 text-blue-300 border border-blue-500/30'
                          : 'hover:bg-slate-700/50 text-gray-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className={`font-medium truncate ${isRTL ? 'text-right' : 'text-left'}`}>
                            {chat.title}
                          </div>
                          <div className={`text-xs text-gray-400 mt-1 ${isRTL ? 'text-right' : 'text-left'}`}>
                            {formatDate(chat.updatedAt)}
                          </div>
                        </div>
                      </div>
                      
                      <div className={`absolute top-1/2 ${isRTL ? 'left-3' : 'right-3'} transform -translate-y-1/2 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity`}>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setCurrentChatId(chat._id);
                            setCurrentChatTitle(chat.title);
                            setNewChatTitle(chat.title);
                            setShowRenameModal(true);
                          }}
                          className="p-1.5 rounded-lg hover:bg-blue-600/30 text-blue-400 transition-colors"
                          title={t.renameChat}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(t.confirmDelete)) {
                              deleteChat(chat._id);
                            }
                          }}
                          className="p-1.5 rounded-lg hover:bg-red-600/30 text-red-400 transition-colors"
                          title={t.deleteChat}
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
        
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat Header with AI Assistant Title */}
          <div className="bg-slate-900/30 backdrop-blur-sm border-b border-slate-700/30 p-4 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center">
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="p-2 rounded-lg hover:bg-slate-700/50 mr-3 transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M3 5a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zM3 15a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                </svg>
              </button>
              
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
                    {t.title}
                  </h2>
                  <p className="text-sm text-gray-300">{t.subtitle}</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              {currentChatId && (
                <>
                  <button
                    onClick={() => {
                      setNewChatTitle(currentChatTitle);
                      setShowRenameModal(true);
                    }}
                    className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    title={t.renameChat}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                    </svg>
                  </button>
                  <button
                    onClick={openShareModal}
                    className="p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
                    title={t.shareChat}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                    </svg>
                  </button>
                </>
              )}
            </div>
          </div>
          
          {/* Messages Container with Better Spacing */}
          <div 
            ref={chatContainerRef}
            className="flex-1 overflow-y-auto p-6 custom-scrollbar"
          >
            {messages.length === 0 && !hasGreeted && (
              <div className="text-center py-12">
                <div className="w-20 h-20 rounded-full overflow-hidden mx-auto mb-6 bg-slate-800/50 p-1">
                  <Image
                    src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
                    alt="Fazlaka AI Assistant"
                    width={76}
                    height={76}
                    className="object-cover rounded-full"
                  />
                </div>
                <h3 className="text-2xl font-bold text-gray-100 mb-3">
                  {t.welcome}
                </h3>
                <p className="text-gray-300 mb-8 max-w-md mx-auto">
                  {t.description}
                </p>
                
                <div className="grid grid-cols-2 gap-4 mt-8 max-w-lg mx-auto">
                  <button 
                    onClick={() => handleSuggestionClick(t.visionQuestion)}
                    className="p-5 rounded-xl bg-slate-800/40 hover:bg-slate-700/50 transition-all transform hover:scale-105 border border-slate-700/30"
                  >
                    <span className="text-3xl mb-3 block">🎯</span>
                    <span className="text-sm font-medium text-gray-200">{t.vision}</span>
                  </button>
                  <button 
                    onClick={() => handleSuggestionClick(t.episodesQuestion)}
                    className="p-5 rounded-xl bg-slate-800/40 hover:bg-slate-700/50 transition-all transform hover:scale-105 border border-slate-700/30"
                  >
                    <span className="text-3xl mb-3 block">🎬</span>
                    <span className="text-sm font-medium text-gray-200">{t.latestEpisodes}</span>
                  </button>
                  <button 
                    onClick={() => handleSuggestionClick(t.articlesQuestion)}
                    className="p-5 rounded-xl bg-slate-800/40 hover:bg-slate-700/50 transition-all transform hover:scale-105 border border-slate-700/30"
                  >
                    <span className="text-3xl mb-3 block">📝</span>
                    <span className="text-sm font-medium text-gray-200">{t.latestArticles}</span>
                  </button>
                  <button 
                    onClick={() => handleSuggestionClick(t.teamQuestion)}
                    className="p-5 rounded-xl bg-slate-800/40 hover:bg-slate-700/50 transition-all transform hover:scale-105 border border-slate-700/30"
                  >
                    <span className="text-3xl mb-3 block">👥</span>
                    <span className="text-sm font-medium text-gray-200">{t.team}</span>
                  </button>
                </div>
              </div>
            )}
            
            <div className="max-w-4xl mx-auto space-y-8">
              {messages.map((msg, index) => (
                <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} ${msg.isTyping ? 'animate-pulse' : ''}`}>
                  <div className={`max-w-[85%] p-5 rounded-2xl shadow-lg backdrop-blur-sm border border-slate-700/30 ${
                    msg.role === 'user' 
                      ? 'bg-blue-600/20 text-white border-blue-500/30' 
                      : 'bg-slate-800/40 text-gray-100'
                  }`}>
                    <div className={`flex justify-between items-start mb-4 ${isRTL ? 'space-x-reverse' : ''}`}>
                      <div className={`flex items-center ${isRTL ? 'ml-2' : 'mr-2'}`}>
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
                        {msg.role === 'user' && session?.user?.image && (
                          <Image
                            src={session.user.image}
                            alt={session.user.name || 'User'}
                            width={32}
                            height={32}
                            className="rounded-full"
                          />
                        )}
                        <p className={`text-xs font-medium opacity-80 ${isRTL ? 'mr-2' : 'ml-2'}`}>
                          {msg.role === 'user' ? (session?.user?.name || 'User') : t.assistant}
                        </p>
                      </div>
                    </div>
                    
                    {msg.role === 'assistant' && msg.isTyping ? (
                      <div>
                        <p className="text-sm whitespace-pre-wrap">
                          {msg.content}
                          <span className="cursor-blink">|</span>
                        </p>
                      </div>
                    ) : (
                      <p className="text-sm whitespace-pre-wrap leading-relaxed mb-4">{msg.content}</p>
                    )}
                    
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
            
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-slate-800/40 p-5 rounded-2xl shadow-lg backdrop-blur-sm border border-slate-700/30">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}

            {suggestions.length > 0 && !isLoading && !isTyping && (
              <div className={`mt-6 pt-6 border-t border-slate-700/30 ${isRTL ? 'text-right' : 'text-left'}`}>
                <p className="text-sm font-medium text-gray-300 mb-4">{t.suggestions}</p>
                <div className={`grid grid-cols-1 ${isRTL ? 'md:grid-cols-1' : 'md:grid-cols-2'} gap-3`}>
                  {suggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="p-4 bg-slate-800/40 hover:bg-slate-700/50 rounded-xl text-sm text-gray-200 transition-all transform hover:scale-102 border border-slate-700/30"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
          
          {/* Enhanced Input Area */}
          <div className="p-4 bg-slate-900/30 backdrop-blur-sm border-t border-slate-700/30 flex-shrink-0">
            <div className="flex items-center space-x-3 max-w-4xl mx-auto">
              <div className="flex-1 relative min-w-0">
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full p-4 bg-slate-800/60 border border-slate-700/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-100 pr-12"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={isLoading || isTyping}
                  placeholder={t.placeholder}
                />
                {input && (
                  <button
                    onClick={() => setInput('')}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-1 rounded-full hover:bg-slate-700/50 transition-colors"
                  >
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                )}
              </div>
              <button
                onClick={handleSendMessage}
                disabled={isLoading || isTyping || !input.trim()}
                className="bg-blue-600/50 hover:bg-blue-700/50 disabled:from-gray-600/50 disabled:to-gray-700/50 text-white p-4 rounded-2xl disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-105 flex-shrink-0"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Enhanced Modals */}
      {showRenameModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-800/80 p-6 rounded-2xl max-w-md w-full mx-4 backdrop-blur-sm border border-slate-700/30 transform transition-all animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              {t.renameChat}
            </h3>
            <input
              type="text"
              className="w-full p-3 bg-slate-700/60 border border-slate-600/50 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent text-gray-100"
              value={newChatTitle}
              onChange={(e) => setNewChatTitle(e.target.value)}
              placeholder={t.newChat}
              autoFocus
            />
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setShowRenameModal(false);
                  setNewChatTitle('');
                }}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-colors font-medium text-gray-200"
              >
                {t.cancel}
              </button>
              <button
                onClick={renameChat}
                className="px-4 py-2 bg-blue-600/50 hover:bg-blue-700/50 text-white rounded-xl transition-all font-medium"
              >
                {t.save}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {showShareModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in">
          <div className="bg-slate-800/80 p-6 rounded-2xl max-w-md w-full mx-4 backdrop-blur-sm border border-slate-700/30 transform transition-all animate-slide-up">
            <h3 className="text-lg font-semibold text-gray-100 mb-4">
              {t.shareChat}
            </h3>
            
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-200 mb-3">{t.shareType}</h4>
              <div className="space-y-2">
                <label className="flex items-center p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl cursor-pointer hover:bg-slate-600/50 transition-colors">
                  <input
                    type="radio"
                    name="shareType"
                    checked={!isPublic}
                    onChange={() => handleShareTypeChange(false)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-100">{t.privateShare}</div>
                    <div className="text-xs text-gray-400">
                      {t.privateDescription}
                    </div>
                  </div>
                </label>
                <label className="flex items-center p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl cursor-pointer hover:bg-slate-600/50 transition-colors">
                  <input
                    type="radio"
                    name="shareType"
                    checked={isPublic}
                    onChange={() => handleShareTypeChange(true)}
                    className="mr-3"
                  />
                  <div>
                    <div className="font-medium text-gray-100">{t.publicShare}</div>
                    <div className="text-xs text-gray-400">
                      {t.shareDescription}
                    </div>
                  </div>
                </label>
              </div>
            </div>
            
            {shareLink && (
              <div className="mb-4 p-3 bg-slate-700/50 border border-slate-600/50 rounded-xl break-all">
                <p className="text-xs text-gray-400 mb-1">{t.linkCopied}</p>
                <p className="text-sm text-gray-100">{shareLink}</p>
              </div>
            )}
            
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowShareModal(false);
                  setShareLink('');
                }}
                className="px-4 py-2 bg-slate-700/50 hover:bg-slate-600/50 rounded-xl transition-colors font-medium text-gray-200"
              >
                {t.close}
              </button>
              {shareLink ? (
                <button
                  onClick={copyShareLink}
                  className="px-4 py-2 bg-blue-600/50 hover:bg-blue-700/50 text-white rounded-xl transition-all font-medium"
                >
                  {t.copyLink}
                </button>
              ) : (
                <button
                  onClick={generateShareLink}
                  className="px-4 py-2 bg-blue-600/50 hover:bg-blue-700/50 text-white rounded-xl transition-all font-medium"
                >
                  {t.generateLink}
                </button>
              )}
            </div>
          </div>
        </div>
      )}

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
      
      {/* Link Generating Animation */}
      {showLinkGeneratingAnimation && (
        <div className="fixed top-20 left-1/2 transform -translate-x-1/2 bg-blue-600/90 text-white px-6 py-3 rounded-full shadow-lg z-50 animate-pulse">
          <div className="flex items-center space-x-2">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            <span className="font-medium">
              {language === 'ar' ? 'جاري إنشاء الرابط...' : 'Generating link...'}
            </span>
          </div>
        </div>
      )}
      
      {showNewChatAnimation && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="bg-slate-800/80 p-8 rounded-2xl backdrop-blur-sm animate-bounce-in">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full overflow-hidden mx-auto mb-4 bg-slate-700/50 p-1">
                <Image
                  src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
                  alt="Fazlaka AI Assistant"
                  width={60}
                  height={60}
                  className="object-cover rounded-full"
                />
              </div>
              <p className="text-lg font-medium text-gray-100">
                {language === 'ar' ? 'جاري إنشاء محادثة جديدة...' : 'Creating new chat...'}
              </p>
            </div>
          </div>
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
          background-color: #3B82F6;
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
        
        .animate-fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .animate-slide-up {
          animation: slideUp 0.3s ease-out;
        }
        
        @keyframes slideUp {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
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
        
        .hover\\:scale-102:hover {
          transform: scale(1.02);
        }
      `}</style>
    </div>
  );
}