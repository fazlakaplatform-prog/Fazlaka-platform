'use client';
import React, { useEffect, useRef, useState, Suspense } from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/components/Language/LanguageProvider";
import Head from "next/head";
import { 
  FaQuestionCircle, FaComments, FaLightbulb, FaSearch, FaTimes, FaFilter, FaHeadset, FaArrowRight, FaInfoCircle, FaSync,
  FaChevronDown, FaChevronUp
} from "react-icons/fa";

type FaqItem = { 
  id: string; 
  question: string; 
  answer: string;
  category?: string;
  categoryEn?: string;
};

// إضافة الترجمات (لا تغيير)
const translations = {
  ar: {
    home: "الرئيسية",
    content: "محتوانا",
    episodes: "الحلقات",
    playlists: "قوائم التشغيل",
    seasons: "المواسم",
    articles: "المقالات",
    about: "تعرف علينا",
    whoWeAre: "من نحن",
    team: "الفريق",
    contact: "التواصل",
    contactUs: "تواصل معنا",
    faq: "الأسئلة الشائعة",
    search: "ابحث عن سؤال أو كلمة مفتاحية...",
    searchResults: "نتائج البحث",
    noResults: "لا توجد نتائج مطابقة",
    searching: "جاري البحث...",
    viewAllResults: "عرض جميع نتائج البحث",
    signIn: "تسجيل دخول",
    signUp: "إنشاء حساب",
    manageAccount: "إدارة الحساب",
    favorites: "مفضلاتي",
    signOut: "تسجيل الخروج",
    notifications: "الإشعارات",
    viewAll: "مشاهدة الكل",
    noNotifications: "لا توجد إشعارات جديدة",
    loading: "جاري التحميل...",
    terms: "شروط وأحكام",
    privacy: "سياسة الخصوصية",
    episode: "حلقة",
    article: "مقال",
    playlist: "قائمة تشغيل",
    faqItem: "سؤال شائع",
    season: "موسم",
    teamMember: "عضو الفريق",
    termsItem: "شروط وأحكام",
    privacyItem: "سياسة الخصوصية",
    darkMode: "تبديل الوضع الليلي",
    language: "تبديل اللغة",
    copyright: "© {year} فذلكة",
    // ترجمات صفحة الأسئلة الشائعة
    pageTitle: "الأسئلة الأكثر شيوعاً",
    pageSubtitle: "إجابات على استفساراتكم حول قناتنا العلمية على يوتيوب وخدماتنا التعليمية",
    searchButton: "البحث عن سؤال",
    contactButton: "تواصل معنا",
    faqSectionTitle: "الأسئلة الشائعة",
    faqSectionSubtitle: "إجابات على استفساراتكم حول قناتنا العلمية على يوتيوب وخدماتنا التعليمية",
    categories: "التصنيفات",
    allCategories: "جميع التصنيفات",
    filterBy: "التصفية حسب:",
    removeFilter: "إزالة التصفية",
    noQuestions: "لا توجد أسئلة",
    noQuestionsMessage: "لا توجد أسئلة تطابق بحثك أو الفئة المحددة",
    clearSearch: "مسح البحث",
    cancelFilter: "إلغاء الفلتر",
    needHelp: "هل تحتاج إلى مساعدة إضافية؟",
    helpMessage: "فريق الدعم متاح لمساعدتك في أي استفسار. لا تتردد في التواصل معنا للحصول على المساعدة التي تحتاجها.",
    contactDirectly: "تواصل معنا مباشرة",
    errorLoading: "حدث خطأ أثناء تحميل الأسئلة. يرجى المحاولة مرة أخرى لاحقاً.",
    tryAgain: "إعادة المحاولة",
    questionOpened: "لقد تم فتح السؤال الذي بحثت عنه أدناه",
    noQuestionsAvailable: "لا توجد أسئلة شائعة حالياً",
    noTitle: "(بدون عنوان)",
    noAnswer: "لا يوجد جواب.",
    aboutUs: "من نحن",
    aboutUsDescription: "تعرف على رؤيتنا وقصتنا والفريق الذي يقف وراء فذلكة",
    updating: "جاري التحديث...",
    // ترجمات قسم الهيرو الجديد
    heroTitle: "الأسئلة الشائعة",
    heroHighlight: "فريق فذلكه",
    heroSubtitle: "نحن هنا لمساعدتك. ابحث عن إجابات لأسئلتك الشائعة أو تواصل مع فريق فذلكه للحصول على الدعم الفني. نسعى دائماً لتقديم أفضل خدمة ممكنة.",
    // ترجمات قسم التواصل الجديد
    contactTitle: "تواصل معنا",
    contactSubtitle: "فريق فذلكه متاح للإجابة على استفساراتك ومساعدتك",
    contactEmail: "البريد الإلكتروني",
    contactPhone: "الهاتف",
    contactAddress: "العنوان",
    goToContact: "انتقل إلى صفحة التواصل"
  },
  en: {
    home: "Home",
    content: "Content",
    episodes: "Episodes",
    playlists: "Playlists",
    seasons: "Seasons",
    articles: "Articles",
    about: "About",
    whoWeAre: "Who We Are",
    team: "Team",
    contact: "Contact",
    contactUs: "Contact Us",
    faq: "FAQ",
    search: "Search for a question or keyword...",
    searchResults: "Search Results",
    noResults: "No matching results",
    searching: "Searching...",
    viewAllResults: "View All Results",
    signIn: "Sign In",
    signUp: "Sign Up",
    manageAccount: "Manage Account",
    favorites: "My Favorites",
    signOut: "Sign Out",
    notifications: "Notifications",
    viewAll: "View All",
    noNotifications: "No new notifications",
    loading: "Loading...",
    terms: "Terms & Conditions",
    privacy: "Privacy Policy",
    episode: "Episode",
    article: "Article",
    playlist: "Playlist",
    faqItem: "FAQ",
    season: "Season",
    teamMember: "Team Member",
    termsItem: "Terms & Conditions",
    privacyItem: "Privacy Policy",
    darkMode: "Toggle Dark Mode",
    language: "Toggle Language",
    copyright: "© {year} Falthaka",
    // ترجمات صفحة الأسئلة الشائعة
    pageTitle: "Frequently Asked Questions",
    pageSubtitle: "Answers to your inquiries about our scientific YouTube channel and educational services",
    searchButton: "Search for a question",
    contactButton: "Contact us",
    faqSectionTitle: "Frequently Asked Questions",
    faqSectionSubtitle: "Answers to your inquiries about our scientific YouTube channel and educational services",
    categories: "Categories",
    allCategories: "All Categories",
    filterBy: "Filter by:",
    removeFilter: "Remove Filter",
    noQuestions: "No questions",
    noQuestionsMessage: "No questions match your search or selected category",
    clearSearch: "Clear Search",
    cancelFilter: "Cancel Filter",
    needHelp: "Need additional help?",
    helpMessage: "Our support team is available to help you with any inquiry. Don't hesitate to contact us to get help you need.",
    contactDirectly: "Contact us directly",
    errorLoading: "An error occurred while loading questions. Please try again later.",
    tryAgain: "Try Again",
    questionOpened: "The question you searched for has been opened below",
    noQuestionsAvailable: "No frequently asked questions available at the moment",
    noTitle: "(No title)",
    noAnswer: "No answer available.",
    aboutUs: "About Us",
    aboutUsDescription: "Learn about our vision, story, and the team behind Falthaka",
    updating: "Updating...",
    // ترجمات قسم الهيرو الجديد
    heroTitle: "Frequently Asked Questions",
    heroHighlight: "Falthaka Team",
    heroSubtitle: "We're here to help. Find answers to your frequently asked questions or contact the Falthaka team for technical support. We always strive to provide the best possible service.",
    // ترجمات قسم التواصل الجديد
    contactTitle: "Contact Us",
    contactSubtitle: "The Falthaka team is available to answer your inquiries and help you",
    contactEmail: "Email",
    contactPhone: "Phone",
    contactAddress: "Address",
    goToContact: "Go to Contact Page"
  }
};

// دالة للحصول على النص المناسب بناءً على اللغة (تم نقلها للخارج)
const getLocalizedText = (language: string, arText?: string, enText?: string) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

function FaqContent() {
  // استخدام هوك اللغة للحصول على الحالة الحالية
  const { isRTL, language } = useLanguage();
  
  // تعريف جميع الحالات في بداية المكون
  const [faqs, setFaqs] = useState<FaqItem[]>([]);
  const [faqLoading, setFaqLoading] = useState(true);
  const [faqError, setFaqError] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFaqs, setFilteredFaqs] = useState<FaqItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showCategories, setShowCategories] = useState(false);
  const [showAboutAnimation, setShowAboutAnimation] = useState(true);
  const [showContactAnimation, setShowContactAnimation] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const reduceMotion = useReducedMotion();
  const searchParams = useSearchParams();
  const faqIdFromSearch = searchParams.get("faq");
  
  const contentRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const [contentHeights, setContentHeights] = useState<Record<string, string>>({});
  
  // الحصول على الترجمات بناءً على اللغة الحالية
  const t = translations[language];
  
  useEffect(() => {
    setMounted(true);
    
    // التحقق من تفضيل الوضع المحفوظ في localStorage
    const savedDarkMode = localStorage.getItem('darkMode');
    if (savedDarkMode !== null) {
      setIsDarkMode(savedDarkMode === 'true');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
    }
  }, []);

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isDarkMode]);
  
  // دالة لتحميل البيانات
  const fetchFaqsData = async () => {
    try {
      // إذا لم يكن تحديثاً تلقائياً، اعرض حالة التحميل
      if (!isUpdating) {
        setFaqLoading(true);
      }
      
      // استدعاء API route بدلاً من دالة الخدمة مباشرة
      const response = await fetch(`/api/faqs?language=${language}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch FAQs');
      }

      const data = result.data;
      
      const formattedFaqs = data.map((item: {
        id: string;
        question: string;
        questionEn: string;
        answer: string;
        answerEn: string;
        category?: string;
        categoryEn?: string;
      }) => ({
        id: item.id, // الـ API يضيف حقل id
        question: getLocalizedText(language, item.question, item.questionEn),
        answer: getLocalizedText(language, item.answer, item.answerEn),
        category: item.category,
        categoryEn: item.categoryEn
      }));
      
      setFaqs(formattedFaqs);
      setFilteredFaqs(formattedFaqs);
      setFaqError(false);
    } catch (error) {
      console.error("Error fetching FAQs from API:", error);
      setFaqError(true);
    } finally {
      setFaqLoading(false);
      setIsUpdating(false);
    }
  };
  
  // دالة لتحديث البيانات تلقائياً
  const autoRefresh = async () => {
    setIsUpdating(true);
    await fetchFaqsData();
  };
  
  useEffect(() => {
    if (!mounted) return;
    
    fetchFaqsData();
    
    // إعداد EventSource للاستماع إلى تحديثات SSE
    const setupEventSource = () => {
      // إغلاق الاتصال الحالي إذا كان موجوداً
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // إلغاء أي إعادة اتصال مجدولة
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // إنشاء اتصال جديد
      eventSourceRef.current = new EventSource('/api/stream');
      
      eventSourceRef.current.onopen = () => {
        console.log('SSE connection opened');
      };
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'change') {
            console.log('Change detected:', data);
            // تحقق مما إذا كان التغيير يتعلق بالأسئلة الشائعة
            if (data.collection === 'faqs') {
              // إذا كان هناك تغيير في الأسئلة الشائعة، قم بتحديث الصفحة
              autoRefresh();
            }
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      eventSourceRef.current.onerror = (error) => {
        console.error('SSE connection error:', error);
        // إغلاق الاتصال الحالي
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        // إعادة الاتصال بعد فترة قصيرة
        reconnectTimeoutRef.current = setTimeout(setupEventSource, 2000);
      };
    };
    
    setupEventSource();
    
    // تنظيف الاتصال عند تفكيك المكون
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [language, mounted]);
  
  useEffect(() => {
    function measure() {
      const heights: Record<string, string> = {};
      Object.entries(contentRefs.current).forEach(([id, el]) => {
        if (el) heights[id] = `${el.scrollHeight}px`;
      });
      setContentHeights(heights);
    }
    const timeout = setTimeout(measure, 30);
    window.addEventListener("resize", measure);
    return () => {
      clearTimeout(timeout);
      window.removeEventListener("resize", measure);
    };
  }, [faqs]);
  
  useEffect(() => {
    if (faqIdFromSearch && faqs.length > 0) {
      const faq = faqs.find(f => f.id === faqIdFromSearch);
      if (faq) {
        setOpenFaq(faq.id);
        setTimeout(() => {
          const element = document.getElementById(`faq-${faq.id}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
          }
        }, 300);
      }
    }
  }, [faqIdFromSearch, faqs]);
  
  useEffect(() => {
    let result = faqs;
    
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        faq => 
          faq.question.toLowerCase().includes(term) || 
          faq.answer.toLowerCase().includes(term) ||
          (language === 'ar' ? faq.category : faq.categoryEn)?.toLowerCase().includes(term)
      );
    }
    
    if (activeCategory) {
      result = result.filter(faq => 
        language === 'ar' ? faq.category === activeCategory : faq.categoryEn === activeCategory
      );
    }
    
    setFilteredFaqs(result);
  }, [searchTerm, faqs, activeCategory, language]);
  
  const toggleFaq = (id: string) => {
    const el = contentRefs.current[id];
    if (el) {
      const h = `${el.scrollHeight}px`;
      setContentHeights((s) => ({ ...s, [id]: h }));
    }
    setOpenFaq((prev) => (prev === id ? null : id));
  };
  
  const reloadFaqs = () => {
    setFaqLoading(true);
    setFaqError(false);
    fetchFaqsData();
  };
  
  const setContentRef = (id: string) => (el: HTMLDivElement | null) => {
    contentRefs.current[id] = el;
  };
  
  // تعديل استخراج الفئات ليشمل اللغتين
  const categories = Array.from(new Set(
    faqs.map(faq => language === 'ar' ? faq.category : faq.categoryEn).filter(Boolean)
  )) as string[];
  
  const categoryCounts = categories.reduce((acc, category) => {
    acc[category] = faqs.filter(faq => 
      language === 'ar' ? faq.category === category : faq.categoryEn === category
    ).length;
    return acc;
  }, {} as Record<string, number>);
  
  const selectCategory = (category: string) => {
    setActiveCategory(category);
    setShowCategories(false);
  };
  
  // قسم الهيرو الجديد المشابه لصفحة الاتصال
  const HeroSection = () => {
    return (
      <div className="relative mb-12 overflow-hidden rounded-3xl">
        {/* الخلفية المتدرجة */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-950"></div>
        
        {/* شبكة زخرفية متحركة */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10 animate-shimmer"></div>
        
        {/* دوائر زخرفية متحركة */}
        <div className="absolute -top-40 -right-40 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        
        {/* المحتوى الرئيسي */}
        <div className="relative z-10 py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* النص */}
            <div className={`${isRTL ? 'lg:order-1' : 'lg:order-2'}`}>
              <div className="inline-block bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
                <span className="text-white font-medium flex items-center text-sm sm:text-base">
                  <FaQuestionCircle className="mr-2" />
                  {t.faq}
                </span>
              </div>
              <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight ${isRTL ? '' : 'font-sans tracking-wide'}`}>
                {t.heroTitle} <span className="text-yellow-300">{t.heroHighlight}</span>
              </h1>
              <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl">
                <span className={isRTL ? '' : 'font-sans'}>
                  {t.heroSubtitle}
                </span>
              </p>
              
              {/* أزرار التواصل في الأسفل */}
              <div className="flex flex-wrap gap-4 mt-6">
                <Link 
                  href="#faq-search" 
                  className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-all duration-300 flex items-center shadow-lg"
                >
                  <FaSearch className="mr-2" />
                  {t.search}
                </Link>
                <Link 
                  href="#contact-section" 
                  className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-all duration-300 flex items-center shadow-lg"
                >
                  <FaComments className="mr-2" />
                  {t.contactButton}
                </Link>
              </div>
            </div>
            
            {/* الصورة */}
            <div className={`${isRTL ? 'lg:order-2' : 'lg:order-1'} flex justify-center items-center`}>
              <div className="relative w-full max-w-md mx-auto">
                {/* Mockup */}
                <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-2xl transform transition-all duration-500 hover:scale-105 animate-float">
                  <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
                    <div className="h-8 bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center px-4">
                      <div className="flex space-x-2">
                        <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                        <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                            <FaQuestionCircle className="text-white text-xl" />
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                            <FaLightbulb className="text-white text-xl" />
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                            <FaComments className="text-white text-xl" />
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-center">
                        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center">
                          <FaSearch className="mr-2" />
                          {t.search}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* أيقونات عائمة */}
                <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                  <FaQuestionCircle className="text-white text-xl" />
                </div>
                <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-400 to-blue-500 p-3 rounded-full shadow-lg animate-float" style={{ animationDelay: '2s' }}>
                  <FaLightbulb className="text-white text-xl" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* تأثيرات حركية */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-shimmer" style={{ animationDelay: '1s', animationDirection: 'reverse' }}></div>
      </div>
    );
  };

  const AboutUsSection = () => {
    return (
      <motion.div 
        initial={showAboutAnimation ? (reduceMotion ? {} : { opacity: 0, y: 20 }) : {}}
        animate={showAboutAnimation ? (reduceMotion ? {} : { opacity: 1, y: 0 }) : {}}
        transition={{ delay: 0.2, duration: 0.5 }}
        className="mb-12"
        onAnimationComplete={() => setShowAboutAnimation(false)}
      >
        <div className="relative bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 rounded-3xl p-6 md:p-8 border border-teal-100 dark:border-teal-800 overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute top-10 left-10 w-16 h-16 bg-teal-200/30 dark:bg-teal-700/20 rounded-full blur-xl"></div>
            <div className="absolute top-20 right-20 w-20 h-20 bg-cyan-200/30 dark:bg-cyan-700/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-blue-200/30 dark:bg-blue-700/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-1/3 w-18 h-18 bg-green-200/30 dark:bg-green-700/20 rounded-full blur-xl"></div>
            <div className="absolute top-1/4 left-1/4 w-8 h-8 border-2 border-teal-300/30 dark:border-teal-600/30 rotate-45"></div>
            <div className="absolute top-1/3 right-1/4 w-6 h-6 border-2 border-cyan-300/30 dark:border-cyan-600/30 rounded-full"></div>
            <div className="absolute bottom-1/4 left-1/3 w-10 h-10 border-2 border-blue-300/30 dark:border-blue-600/30 rotate-12"></div>
            <div className="absolute bottom-1/3 right-1/3 w-5 h-5 border-2 border-green-300/30 dark:border-green-600/30 rotate-45"></div>
          </div>
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
              <div className="flex items-center justify-center md:justify-start mb-4">
                <div className="bg-teal-100 dark:bg-teal-800/50 p-4 rounded-full shadow-lg">
                  <FaInfoCircle className="text-teal-600 dark:text-teal-300 text-3xl" />
                </div>
              </div>
              <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-3">
                {t.aboutUs}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 text-lg max-w-2xl">
                {t.aboutUsDescription}
              </p>
            </div>
            
            <Link href="/about">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-teal-600 to-cyan-600 text-white font-bold py-4 px-8 md:px-10 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center transform hover:-translate-y-1"
              >
                {t.aboutUs}
                <FaArrowRight className={`${isRTL ? 'ml-3' : 'mr-3'} text-xl`} />
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  };

  const ContactSection = () => {
    return (
      <motion.div 
        id="contact-section"
        initial={showContactAnimation ? (reduceMotion ? {} : { opacity: 0, y: 20 }) : {}}
        animate={showContactAnimation ? (reduceMotion ? {} : { opacity: 1, y: 0 }) : {}}
        transition={{ delay: 0.3, duration: 0.5 }}
        className="mb-12"
        onAnimationComplete={() => setShowContactAnimation(false)}
      >
        <div className="relative bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-3xl p-6 md:p-8 border border-indigo-100 dark:border-indigo-800 text-center overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute top-10 left-10 w-16 h-16 bg-indigo-200/30 dark:bg-indigo-700/20 rounded-full blur-xl"></div>
            <div className="absolute top-20 right-20 w-20 h-20 bg-purple-200/30 dark:bg-purple-700/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-blue-200/30 dark:bg-blue-700/20 rounded-full blur-xl"></div>
            <div className="absolute bottom-10 right-1/3 w-18 h-18 bg-pink-200/30 dark:bg-pink-700/20 rounded-full blur-xl"></div>
            <div className="absolute top-1/4 left-1/4 w-8 h-8 border-2 border-indigo-300/30 dark:border-indigo-600/30 rotate-45"></div>
            <div className="absolute top-1/3 right-1/4 w-6 h-6 border-2 border-purple-300/30 dark:border-purple-600/30 rounded-full"></div>
            <div className="absolute bottom-1/4 left-1/3 w-10 h-10 border-2 border-blue-300/30 dark:border-blue-600/30 rotate-12"></div>
            <div className="absolute bottom-1/3 right-1/3 w-5 h-5 border-2 border-pink-300/30 dark:border-pink-600/30 rotate-45"></div>
          </div>
          
          <div className="relative z-10">
            <div className="flex justify-center mb-6">
              <div className="bg-indigo-100 dark:bg-indigo-800/50 p-5 rounded-full shadow-lg">
                <FaHeadset className="text-indigo-600 dark:text-indigo-300 text-4xl" />
              </div>
            </div>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
              {t.contactTitle}
            </h3>
            <p className="text-gray-700 dark:text-gray-300 text-lg mb-8 max-w-2xl mx-auto">
              {t.contactSubtitle}
            </p>
            
            <Link href="/contact">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold py-4 px-8 md:px-10 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 flex items-center mx-auto transform hover:-translate-y-1"
              >
                {t.goToContact}
                <FaArrowRight className={`${isRTL ? 'ml-3' : 'mr-3'} text-xl`} />
              </motion.button>
            </Link>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 overflow-x-hidden">
      {/* مؤشر التحديث التلقائي */}
      {isUpdating && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <FaSync className="h-5 w-5 animate-spin" />
          <span>{t.updating}</span>
        </div>
      )}
      
      <div className="container mx-auto max-w-5xl relative z-10">
        <HeroSection />
        
        <motion.main 
          id="faq-search"
          initial={reduceMotion ? {} : { opacity: 0, y: 20 }}
          animate={reduceMotion ? {} : { opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.5 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-6 md:p-8 relative shadow-xl border border-gray-200 dark:border-gray-700 mb-12"
        >
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div className={`text-center ${isRTL ? 'md:text-right' : 'md:text-left'}`}>
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900 dark:text-gray-100 flex flex-col md:flex-row items-center justify-center md:justify-start">
                <motion.div animate={reduceMotion ? {} : { rotate: [0, 5, 0, -5, 0] }} transition={{ repeat: Infinity, duration: 6, repeatDelay: 3, ease: "easeInOut" }}>
                  <FaQuestionCircle className={`w-8 h-8 md:w-10 md:h-10 ${isRTL ? 'ml-3' : 'mr-3'} text-indigo-600 dark:text-indigo-400`} />
                </motion.div>
                <span className="mt-2 md:mt-0">{t.faqSectionTitle}</span>
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-2 text-base md:text-lg">{t.faqSectionSubtitle}</p>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <div className="relative flex-grow">
              <div className={`absolute inset-y-0 ${isRTL ? 'right-0 pr-4' : 'left-0 pl-4'} flex items-center pointer-events-none`}>
                <FaSearch className="text-gray-400" />
              </div>
              <input
                type="text"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onFocus={() => { setShowSuggestions(true); }}
                onBlur={() => { setTimeout(() => setShowSuggestions(false), 200); }}
                className={`w-full p-3 ${isRTL ? 'pr-12 pl-4' : 'pl-12 pr-4'} border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300`}
                suppressHydrationWarning={true}
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm("")} className={`absolute inset-y-0 ${isRTL ? 'left-0 pl-4' : 'right-0 pr-4'} flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300`}>
                  <FaTimes />
                </button>
              )}
              
              {showSuggestions && searchTerm && (
                <div className={`absolute z-40 mt-2 w-full bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto ${isRTL ? 'right-0' : 'left-0'}`}>
                  {filteredFaqs.slice(0, 5).map((faq) => (
                    <div key={faq.id} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200" onClick={() => { setSearchTerm(faq.question); setShowSuggestions(false); setOpenFaq(faq.id); setTimeout(() => { const element = document.getElementById(`faq-${faq.id}`); if (element) { element.scrollIntoView({ behavior: "smooth", block: "center" }); } }, 300); }}>
                      <p className="font-medium text-gray-900 dark:text-gray-100 break-words">{faq.question}</p>
                      <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{faq.answer.replace(/<[^>]*>/g, '').substring(0, 60)}...</p>
                    </div>
                  ))}
                  {filteredFaqs.length === 0 && (<div className="p-3 text-gray-500 dark:text-gray-400 text-center">{t.noResults}</div>)}
                </div>
              )}
            </div>
            
            <div className="relative">
              <button onClick={() => setShowCategories(!showCategories)} suppressHydrationWarning={true} className="flex items-center justify-center w-full md:w-auto px-4 md:px-6 py-3 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition-all duration-300">
                <FaFilter className={`${isRTL ? 'ml-2' : 'mr-2'}`} />
                <span className="truncate">{activeCategory ? activeCategory : t.categories}</span>
                {activeCategory && (<span className={`${isRTL ? 'ml-2' : 'mr-2'} bg-white text-indigo-600 text-xs rounded-full w-5 h-5 flex items-center justify-center flex-shrink-0`}>1</span>)}
              </button>
              
              {showCategories && (
                <div className={`absolute z-40 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-60 overflow-y-auto ${isRTL ? 'right-0' : 'left-0'}`}>
                  <div className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 flex items-center justify-between" onClick={() => { setActiveCategory(null); setShowCategories(false); }}>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{t.allCategories}</span>
                    {!activeCategory && (<span className="text-indigo-500"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></span>)}
                  </div>
                  {categories.map((category) => (
                    <div key={category} className="p-3 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer transition-colors duration-200 flex items-center justify-between" onClick={() => selectCategory(category)}>
                      <div className="flex items-center min-w-0">
                        <span className="font-medium text-gray-900 dark:text-gray-100 truncate">{category}</span>
                        <span className={`${isRTL ? 'ml-2' : 'mr-2'} text-xs bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 px-2 py-1 rounded-full flex-shrink-0`}>{categoryCounts[category] || 0}</span>
                      </div>
                      {activeCategory === category && (<span className="text-indigo-500 flex-shrink-0"><svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg></span>)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          
          {activeCategory && (
            <div className="mb-6 flex flex-col sm:flex-row items-center justify-between gap-2">
              <div className="flex items-center">
                <span className="text-gray-600 dark:text-gray-400">{isRTL ? ' : ' : ''}{t.filterBy}</span>
                <span className="px-3 py-1 bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 rounded-full text-sm font-medium truncate max-w-xs">{activeCategory}</span>
                <span className="text-gray-600 dark:text-gray-400">{isRTL ? '' : ' : '}</span>
              </div>
              <button onClick={() => setActiveCategory(null)} className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 flex items-center flex-shrink-0">
                <FaTimes className={`${isRTL ? 'ml-1' : 'mr-1'}`} />
                {t.removeFilter}
              </button>
            </div>
          )}
          
          {faqIdFromSearch && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
              <p className="text-blue-700 dark:text-blue-300 flex items-center">
                <svg className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                {t.questionOpened}
              </p>
            </motion.div>
          )}
          
          {faqLoading && (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          )}
          
          {faqError && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
              <p className="text-red-600 dark:text-red-400">{t.errorLoading}</p>
              <button onClick={reloadFaqs} className="mt-4 px-6 py-3 bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-200 rounded-lg hover:bg-red-200 dark:hover:bg-red-700 transition-colors font-medium">{t.tryAgain}</button>
            </div>
          )}
          
          {!faqLoading && !faqError && filteredFaqs.length === 0 && (
            <div className="text-center py-12">
              <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              <h3 className="mt-2 text-lg font-medium text-gray-900 dark:text-gray-100">{t.noQuestions}</h3>
              <p className="mt-1 text-gray-500 dark:text-gray-400">{searchTerm || activeCategory ? t.noQuestionsMessage : t.noQuestionsAvailable}</p>
              {(searchTerm || activeCategory) && (
                <div className="mt-4 flex flex-wrap justify-center gap-3">
                  {searchTerm && (<button onClick={() => setSearchTerm("")} className="px-6 py-3 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors font-medium">{t.clearSearch}</button>)}
                  {activeCategory && (<button onClick={() => setActiveCategory(null)} className="px-6 py-3 bg-purple-100 dark:bg-purple-900 text-purple-700 dark:text-purple-200 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors font-medium">{t.cancelFilter}</button>)}
                </div>
              )}
            </div>
          )}
          
          {!faqLoading && !faqError && filteredFaqs.length > 0 && (
            <div className="space-y-4">
              {filteredFaqs.map((f) => {
                const isOpen = openFaq === f.id;
                const localizedCategory = getLocalizedText(language, f.category, f.categoryEn);
                
                return (
                  <motion.div key={f.id} id={`faq-${f.id}`} initial={reduceMotion ? {} : { opacity: 0, y: 10 }} animate={reduceMotion ? {} : { opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className={`border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 transition-all duration-300 ${isOpen ? 'shadow-lg' : 'shadow-sm'}`}>
                    <button 
                      onClick={() => toggleFaq(f.id)} 
                      aria-expanded={isOpen} 
                      className="w-full p-5 text-left flex items-start justify-between bg-gradient-to-r from-blue-700 to-blue-900 hover:from-blue-800 hover:to-blue-950 transition-colors duration-200"
                      suppressHydrationWarning={true}
                    >
                      <div className="flex items-start min-w-0 flex-1 gap-4">
                        <div className="p-2 rounded-lg bg-white/20 flex-shrink-0 mt-1">
                          <FaQuestionCircle className="text-white text-lg" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className={`font-semibold text-white text-lg leading-tight ${isRTL ? 'text-right' : 'text-left'}`}>{f.question || t.noTitle}</h3>
                          {localizedCategory && (
                            <span className="inline-block mt-2 px-3 py-1 bg-white/20 text-white text-xs rounded-full">
                              {localizedCategory}
                            </span>
                          )}
                        </div>
                      </div>
                      <motion.span 
                        animate={reduceMotion ? {} : { rotate: isOpen ? 180 : 0 }} 
                        transition={{ duration: 0.2 }} 
                        className={`${isRTL ? 'mr-3' : 'ml-3'} flex-shrink-0 text-white mt-2`}
                        aria-hidden
                      >
                        {isOpen ? <FaChevronUp /> : <FaChevronDown />}
                      </motion.span>
                    </button>
                    
                    <motion.div 
                      ref={setContentRef(f.id)} 
                      style={{ maxHeight: isOpen ? contentHeights[f.id] ?? undefined : 0, overflow: "hidden", transition: reduceMotion ? undefined : "max-height 200ms ease, opacity 200ms ease", opacity: isOpen ? 1 : 0, }} 
                      aria-hidden={!isOpen}
                    >
                      <div className="p-6 pt-0">
                        <div className="pt-6 border-t border-gray-100 dark:border-gray-700">
                          <div className="prose prose-sm max-w-none dark:prose-invert">
                            {f.answer ? <div dangerouslySetInnerHTML={{ __html: f.answer }} /> : <p className="text-gray-500 dark:text-gray-400">{t.noAnswer}</p>}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.main>
        
        {/* تم نقل قسم "من نحن" ليكون بعد قسم الأسئلة الشائعة */}
        {!faqLoading && !faqError && <AboutUsSection />}
        
        {/* قسم التواصل البسيط */}
        {!faqLoading && !faqError && <ContactSection />}
      </div>
      
      <style jsx global>{`
        @keyframes shimmer { 0% { transform: translateX(-100%); } 100% { transform: translateX(100%); } }
        .animate-shimmer { animation: shimmer 3s infinite; }
        @keyframes pulse-slow { 0%, 100% { opacity: 0.2; } 50% { opacity: 0.3; } }
        .animate-pulse-slow { animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes float-animation { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-20px); } }
        .float-animation { animation: float-animation 6s ease-in-out infinite; }
        
        .prose {
          color: rgb(55 65 81);
          line-height: 1.75;
        }
        
        .prose h1, .prose h2, .prose h3, .prose h4, .prose h5, .prose h6 {
          color: rgb(17 24 39);
          font-weight: 600;
          line-height: 1.25;
          margin-top: 1.5em;
          margin-bottom: 0.5em;
        }
        
        .prose p {
          margin-top: 1em;
          margin-bottom: 1em;
        }
        
        .prose ul, .prose ol {
          margin-top: 1em;
          margin-bottom: 1em;
          padding-left: 1.5em;
        }
        
        .prose li {
          margin-top: 0.5em;
          margin-bottom: 0.5em;
        }
        
        .prose strong {
          color: rgb(17 24 39);
          font-weight: 600;
        }
        
        .prose a {
          color: rgb(59 130 246);
          text-decoration: underline;
          font-weight: 500;
        }
        
        .prose a:hover {
          color: rgb(37 99 235);
        }
        
        .prose code {
          color: rgb(17 24 39);
          background-color: rgb(243 244 246);
          padding: 0.125rem 0.25rem;
          border-radius: 0.25rem;
          font-size: 0.875em;
          font-weight: 600;
        }
        
        .prose pre {
          color: rgb(17 24 39);
          background-color: rgb(243 244 246);
          padding: 1rem;
          border-radius: 0.5rem;
          overflow-x: auto;
          margin-top: 1.5em;
          margin-bottom: 1.5em;
        }
        
        .prose blockquote {
          border-left: 4px solid rgb(209 213 219);
          padding-left: 1rem;
          margin-top: 1.5em;
          margin-bottom: 1.5em;
          font-style: italic;
          color: rgb(107 114 128);
        }
        
        .dark .prose {
          color: rgb(209 213 219);
        }
        
        .dark .prose h1, .dark .prose h2, .dark .prose h3, .dark .prose h4, .dark .prose h5, .dark .prose h6 {
          color: rgb(243 244 246);
        }
        
        .dark .prose strong {
          color: rgb(243 244 246);
        }
        
        .dark .prose a {
          color: rgb(96 165 250);
        }
        
        .dark .prose a:hover {
          color: rgb(147 197 253);
        }
        
        .dark .prose code {
          color: rgb(243 244 246);
          background-color: rgb(55 65 81);
        }
        
        .dark .prose pre {
          color: rgb(243 244 246);
          background-color: rgb(55 65 81);
        }
        
        .dark .prose blockquote {
          border-left-color: rgb(75 85 99);
          color: rgb(156 163 175);
        }
      `}</style>
    </div>
  );
}

export default function FaqPage() {
  // استخدام هوك اللغة للحصول على الحالة الحالية
  const { language } = useLanguage();
  
  return (
    <>
      {/* بيانات التعريف للصفحة لتحسين SEO */}
      <Head>
        <title>الأسئلة الشائعة - فذلكة | Frequently Asked Questions - Falthaka</title>
        <meta name="description" content="إجابات على الأسئلة الأكثر شيوعاً حول قناتنا العلمية على يوتيوب وخدماتنا التعليمية. Find answers to frequently asked questions about our scientific YouTube channel and educational services." />
        <meta name="keywords" content="أسئلة شائعة, فذلكة, قناة علمية, يوتيوب, تعليم, FAQ, Falthaka, scientific channel, YouTube, education" />
        <meta property="og:title" content="الأسئلة الشائعة - فذلكة | Frequently Asked Questions - Falthaka" />
        <meta property="og:description" content="إجابات على الأسئلة الأكثر شيوعاً حول قناتنا العلمية على يوتيوب وخدماتنا التعليمية. Find answers to frequently asked questions about our scientific YouTube channel and educational services." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://falthaka.com/faq" />
        <meta property="og:image" content="https://falthaka.com/images/faq-og-image.jpg" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="الأسئلة الشائعة - فذلكة | Frequently Asked Questions - Falthaka" />
        <meta name="twitter:description" content="إجابات على الأسئلة الأكثر شيوعاً حول قناتنا العلمية على يوتيوب وخدماتنا التعليمية. Find answers to frequently asked questions about our scientific YouTube channel and educational services." />
        <meta name="twitter:image" content="https://falthaka.com/images/faq-twitter-image.jpg" />
        <link rel="canonical" href="https://falthaka.com/faq" />
        
        {/* بيانات الهيكل المنظمة */}
        <script type="application/ld+json">
          {`
            {
              "@context": "https://schema.org",
              "@type": "FAQPage",
              "mainEntity": [
                {
                  "@type": "Question",
                  "name": "ما هي فذلكة؟",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "فذلكة هي منصة تعليمية علمية تقدم محتوى تعليمي مبتكر عبر قناتها على يوتيوب."
                  }
                },
                {
                  "@type": "Question",
                  "name": "How can I contact Falthaka team?",
                  "acceptedAnswer": {
                    "@type": "Answer",
                    "text": "You can contact Falthaka team through our contact page or by sending an email to fazlaka.contact@gmail.com."
                  }
                }
              ]
            }
          `}
        </script>
      </Head>
      
      <Suspense fallback={
        <div className="container mx-auto py-8 px-4 max-w-4xl">
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        </div>
      }>
        <FaqContent />
      </Suspense>
    </>
  );
}