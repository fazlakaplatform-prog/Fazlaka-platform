"use client";

import React, { useState, useEffect, useMemo, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { 
  FaPlay, 
  FaList, 
  FaTh, 
  FaSearch, 
  FaTimes, 
  FaHeart,
  FaFilter,
  FaUser,
  FaSignInAlt,
  FaArrowRight,
  FaSync
} from "react-icons/fa";
import { motion } from "framer-motion";

// Define the type for language
type Language = 'ar' | 'en';

// تعريف نوع موسع لقائمة التشغيل مع دعم اللغة
interface Playlist {
  _id: string;
  title?: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  imageUrlEn?: string;
  episodes?: string[]; // Array of Episode IDs
  articles?: string[]; // Array of Article IDs
  createdAt: string;
  updatedAt: string;
}

// تعريف أنواع البيانات للحلقات والمقالات
interface Episode {
  _id: string;
  title?: string;
  titleEn?: string;
  name?: string;
  nameEn?: string;
  slug?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  duration?: number;
  publishedAt?: string;
  season?: string;
}

interface Article {
  _id: string;
  title?: string;
  titleEn?: string;
  slug?: string;
  excerpt?: string;
  excerptEn?: string;
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  publishedAt?: string;
  season?: string;
  readTime?: number;
}

// كائن الترجمات
const translations = {
  ar: {
    loading: "جاري التحميل...",
    noPlaylists: "لا توجد قوائم حالياً",
    noResults: "لا توجد نتائج مطابقة للبحث",
    clearSearch: "مسح البحث",
    playlists: "قوائم التشغيل",
    discover: "اكتشف",
    collections: "مجموعاتنا",
    description: "استكشف مجموعتنا المتنوعة من قوائم التشغيل المنظمة التي تجمع بين الحلقات والمقالات لتجربة تعليمية شاملة ومتكاملة.",
    searchPlaceholder: "ابحث عن قائمة تشغيل...",
    searchInPlaylists: "ابحث في قوائم التشغيل حسب العنوان",
    gridView: "عرض شبكي",
    listView: "عرض قائمة",
    items: "عنصر",
    episode: "حلقة",
    episodes: "حلقات",
    article: "مقال",
    articles: "مقالات",
    myFavorites: "قائمتي المفضلة",
    favoriteDescription: "جميع المحتوى الذي تفضله في مكان واحد",
    totalEpisodes: "الحلقات",
    totalArticles: "المقالات",
    viewAll: "عرض الكل",
    totalPlaylists: "إجمالي قوائم التشغيل",
    filterByType: "تصفية حسب النوع",
    allTypes: "جميع الأنواع",
    withEpisodes: "تحتوي على حلقات",
    withArticles: "تحتوي على مقالات",
    withBoth: "تحتوي على الاثنين",
    loginToViewFavorites: "سجل دخولك لعرض المفضلة",
    loginPrompt: "سجل دخولك لحفظ المحتوى المفضل لديك والوصول إليه بسهولة",
    signIn: "تسجيل الدخول",
    noFavoritesYet: "لا توجد عناصر في المفضلة بعد",
    startAddingFavorites: "ابدأ بإضافة المحتوى الذي يعجبك إلى المفضلة",
    recentItems: "أحدث العناصر",
    savedItems: "العناصر المحفوظة",
    exploreEpisodes: "استكشف الحلقات",
    exploreArticles: "استكشف المقالات",
    loadingFavorites: "جاري تحميل المفضلات...",
    loginRequired: "تسجيل الدخول مطلوب",
    loginMessage: "يجب تسجيل الدخول لعرض المفضلات.",
    swipeToDelete: "اسحب العنصر لليسار أو اليمين للحذف",
    minute: "دقيقة",
    minutes: "دقائق",
    minRead: "دقيقة قراءة",
    minReads: "دقائق قراءة",
    filter: "فلتر",
    close: "إغلاق",
    remove: "إزالة",
    noMatchingFavorites: "لا توجد مفضلات تطابق البحث",
    tryDifferentKeywords: "جرب كلمات مفتاحية أخرى أو احذف عوامل التصفية.",
    addFavorites: "أضف حلقات أو مقالات إلى المفضلة للعرض هنا.",
    confirmDelete: "تأكيد الحذف",
    deleteMessage: "هل أنت متأكد من أنك تريد حذف هذا العنصر من المفضلة؟",
    cancel: "إلغاء",
    confirm: "تأكيد الحذف",
    viewMyFavorites: "عرض قائمتي المفضلة",
    yourFavorites: "مفضلاتك الشخصية",
    updating: "جاري التحديث..."
  },
  en: {
    loading: "Loading...",
    noPlaylists: "No playlists available",
    noResults: "No matching results",
    clearSearch: "Clear Search",
    playlists: "Playlists",
    discover: "Discover",
    collections: "Our Collections",
    description: "Explore our diverse collection of organized playlists that combine episodes and articles for a comprehensive and integrated educational experience.",
    searchPlaceholder: "Search for a playlist...",
    searchInPlaylists: "Search playlists by title",
    gridView: "Grid View",
    listView: "List View",
    items: "items",
    episode: "episode",
    episodes: "episodes",
    article: "article",
    articles: "articles",
    myFavorites: "My Favorites",
    favoriteDescription: "All your favorite content in one place",
    totalEpisodes: "Episodes",
    totalArticles: "Articles",
    viewAll: "View All",
    totalPlaylists: "Total Playlists",
    filterByType: "Filter by type",
    allTypes: "All Types",
    withEpisodes: "With Episodes",
    withArticles: "With Articles",
    withBoth: "With Both",
    loginToViewFavorites: "Login to view your favorites",
    loginPrompt: "Sign in to save your favorite content and access it easily",
    signIn: "Sign In",
    noFavoritesYet: "No items in favorites yet",
    startAddingFavorites: "Start adding content you like to your favorites",
    recentItems: "Recent Items",
    savedItems: "Saved Items",
    exploreEpisodes: "Explore Episodes",
    exploreArticles: "Explore Articles",
    loadingFavorites: "Loading favorites...",
    loginRequired: "Login Required",
    loginMessage: "You need to login to view your favorites.",
    swipeToDelete: "Swipe item left or right to delete",
    minute: "minute",
    minutes: "minutes",
    minRead: "min read",
    minReads: "mins read",
    filter: "Filter",
    close: "Close",
    remove: "Remove",
    noMatchingFavorites: "No favorites match your search",
    tryDifferentKeywords: "Try different keywords or remove filters.",
    addFavorites: "Add episodes or articles to favorites to display here.",
    confirmDelete: "Confirm Delete",
    deleteMessage: "Are you sure you want to remove this item from favorites?",
    cancel: "Cancel",
    confirm: "Confirm Delete",
    viewMyFavorites: "View My Favorites",
    yourFavorites: "Your Personal Favorites",
    updating: "Updating..."
  }
};

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
function getLocalizedText(arText?: string, enText?: string, language: Language = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}

// دالة مساعدة لتنسيق التاريخ
function formatDate(dateString?: string, language: Language = 'ar'): string {
  if (!dateString) return "";
  
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  
  return date.toLocaleDateString(
    language === 'ar' ? 'ar-EG' : 'en-US', 
    options
  );
}

// دالة مساعدة لتنسيق المدة
function formatDuration(minutes?: number, language: Language = 'ar'): string {
  if (!minutes) return "";
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return language === 'ar' 
      ? `${hours} ساعة و ${mins} دقيقة`
      : `${hours} hour${hours > 1 ? 's' : ''} and ${mins} minute${mins > 1 ? 's' : ''}`;
  }
  
  return language === 'ar' 
    ? `${mins} دقيقة${mins > 1 ? 'ات' : ''}`
    : `${mins} minute${mins > 1 ? 's' : ''}`;
}

// دالة مساعدة لتنسيق وقت القراءة
function formatReadTime(minutes?: number, language: Language = 'ar'): string {
  if (!minutes) return "";
  
  return language === 'ar' 
    ? `${minutes} دقيقة قراءة${minutes > 1 ? 'ات' : ''}`
    : `${minutes} min read${minutes > 1 ? 's' : ''}`;
}

const PlaylistsPage = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("grid");
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [fadeIn, setFadeIn] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [favoritesData, setFavoritesData] = useState({
    episodes: 0,
    articles: 0,
    recentItems: [] as (Episode | Article)[]
  });
  const [fetchError, setFetchError] = useState(false);
  const [language, setLanguage] = useState<Language>('ar');
  const [isRTL, setIsRTL] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // استخدام هوك NextAuth الصحيح للحصول على بيانات المستخدم
  const { data: session, status } = useSession();
  const isSignedIn = status === "authenticated";
  const user = session?.user;
  const isLoaded = status !== "loading";
  
  useEffect(() => {
    // تحديد اللغة واتجاه النص
    const savedLanguage = (localStorage.getItem('language') || 'ar') as Language;
    setLanguage(savedLanguage);
    setIsRTL(savedLanguage === 'ar');
  }, []);
  
  // Memoize the fetchPlaylistsData function to prevent unnecessary re-renders
  const fetchPlaylistsData = useCallback(async (savedLanguage: Language) => {
    try {
      // جلب قوائم التشغيل من MongoDB API
      const response = await fetch(`/api/playlists?language=${savedLanguage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }
      
      const data = await response.json();
      console.log("Fetched playlists:", data);
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);
  
  useEffect(() => {
    // تحديد اللغة واتجاه النص
    const savedLanguage = (localStorage.getItem('language') || 'ar') as Language;
    setLanguage(savedLanguage);
    setIsRTL(savedLanguage === 'ar');
    
    fetchPlaylistsData(savedLanguage);
  }, [fetchPlaylistsData]);

  // دالة لتحديث البيانات تلقائياً
  const autoRefresh = useCallback(async () => {
    setIsUpdating(true);
    
    try {
      const savedLanguage = (localStorage.getItem('language') || 'ar') as Language;
      
      // جلب قوائم التشغيل من MongoDB API
      const response = await fetch(`/api/playlists?language=${savedLanguage}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch playlists');
      }
      
      const data = await response.json();
      console.log("Fetched playlists:", data);
      setPlaylists(data.playlists || []);
    } catch (error) {
      console.error("Error fetching playlists:", error);
      setFetchError(true);
    } finally {
      setIsUpdating(false);
    }
  }, []);
  
  // Memoize the fetchFavoritesData function to prevent unnecessary re-renders
  const fetchFavoritesData = useCallback(async () => {
    try {
      // إذا لم يكن المستخدم مسجل دخول، لا نحاول جلب البيانات
      if (!isSignedIn || !user?.id) {
        setFavoritesData({
          episodes: 0,
          articles: 0,
          recentItems: []
        });
        return;
      }

      console.log("Fetching favorites for user:", user.id);

      // جلب المفضلة من MongoDB API
      const response = await fetch(`/api/favorites/user/${user.id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch favorites');
      }
      
      const data = await response.json();
      
      console.log("Favorites data:", data);
      
      setFavoritesData({
        episodes: data.episodesCount || 0,
        articles: data.articlesCount || 0,
        recentItems: data.recentItems || []
      });
    } catch (error) {
      console.error("Error fetching favorites data:", error);
      setFetchError(true);
      setFavoritesData({
        episodes: 0,
        articles: 0,
        recentItems: []
      });
    }
  }, [isSignedIn, user?.id]);
  
  // جلب بيانات المفضلة من API
  useEffect(() => {
    // انتظر حتى يتم تحميل حالة المستخدم من NextAuth
    if (isLoaded && !loading) {
      fetchFavoritesData();
    }
  }, [loading, isLoaded, fetchFavoritesData]);
  
  // Memoize the setupEventSource function to prevent unnecessary re-renders
  const setupEventSource = useCallback(() => {
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
          // تحقق مما إذا كان التغيير يتعلق بقوائم التشغيل أو الحلقات أو المقالات
          if (data.collection === 'playlists' || data.collection === 'episodes' || data.collection === 'articles') {
            // إذا كان هناك تغيير في أي من هذه المجموعات، قم بتحديث الصفحة
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
  }, [autoRefresh]);
  
  // إعداد EventSource للاستماع إلى تحديثات SSE
  useEffect(() => {
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
  }, [setupEventSource]);

  useEffect(() => {
    if (!loading) {
      const timer = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  // Fix the TypeScript error by ensuring language has the correct type
  const t = translations[language];

  // التحقق مما إذا كانت المفضلة يجب أن تظهر في نتائج البحث
  const shouldShowFavoritesInSearch = useMemo(() => {
    if (!searchTerm) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const favoritesTitle = language === 'ar' ? 'مفضلاتي' : 'my favorites';
    
    // التحقق من عنوان المفضلة
    if (favoritesTitle.includes(searchLower)) return true;
    
    // التحقق من العناصر في المفضلة
    return favoritesData.recentItems.some(item => {
      const title = language === 'ar' ? item.title : (item.titleEn || item.title);
      return title && title.toLowerCase().includes(searchLower);
    });
  }, [searchTerm, language, favoritesData.recentItems]);

  // فلترة قوائم التشغيل بناءً على البحث والنوع
  const filteredPlaylists = useMemo(() => {
    let result = playlists.filter(
      (playlist) => {
        const title = language === 'ar' 
          ? (playlist.title || "")
          : (playlist.titleEn || playlist.title || "");
        
        return title
          .toString()
          .toLowerCase()
          .includes(searchTerm.toLowerCase());
      }
    );
    
    // تطبيق فلتر النوع إذا تم تحديده
    if (filterType) {
      result = result.filter((playlist) => {
        const episodesCount = playlist.episodes?.length || 0;
        const articlesCount = playlist.articles?.length || 0;
        
        if (filterType === 'episodes') return episodesCount > 0 && articlesCount === 0;
        if (filterType === 'articles') return articlesCount > 0 && episodesCount === 0;
        if (filterType === 'both') return episodesCount > 0 && articlesCount > 0;
        
        return true; // 'all'
      });
    }
    
    return result;
  }, [playlists, searchTerm, language, filterType]);

  // حساب العدد الإجمالي لقوائم التشغيل (بما في ذلك المفضلة)
  const totalPlaylistsCount = shouldShowFavoritesInSearch ? filteredPlaylists.length + 1 : filteredPlaylists.length;
  const originalTotalCount = playlists.length + 1; // +1 للمفضلة

  // عرض حالة التحميل حتى يتم تحميل بيانات المستخدم من NextAuth
  if (loading || !isLoaded) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="text-center">
          <div className="inline-block animate-bounce bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white"></div>
          </div>
          <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{t.loading}</p>
        </div>
      </div>
    );
  }

  if (playlists.length === 0 && !fetchError) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
        <div className="text-center max-w-md p-8 bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
            <FaList className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <p className="text-gray-600 dark:text-gray-400 text-lg">{t.noPlaylists}</p>
        </div>
      </div>
    );
  }

  // دالة للحصول على رابط الصورة مع دعم اللغة
  const getImageUrl = (playlist: Playlist): string | null => {
    if (language === 'en' && playlist.imageUrlEn) {
      return playlist.imageUrlEn;
    }
    
    if (playlist.imageUrl) {
      return playlist.imageUrl;
    }
    
    return null;
  };

  // مكون القسم الرئيسي
  const HeroSection = () => {
    return (
      <div className={`relative mb-8 sm:mb-12 overflow-hidden rounded-3xl transition-all duration-1000 ${fadeIn ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
        {/* الخلفية المتدرجة */}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950"></div>
        
        {/* العناصر الزخرفية */}
        <div className="absolute top-0 right-0 w-full h-full overflow-hidden">
          {/* دوائر زخرفية */}
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 transform -translate-x-1/2 -translate-y-1/2"></div>
          
          {/* عناصر زخرفية إضافية */}
          <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse"></div>
          <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-25 animate-pulse"></div>
        </div>
        
        {/* المحتوى الرئيسي */}
        <div className="relative container mx-auto px-4 py-8">
          <div className="text-center">
            <motion.div 
              className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-4 shadow-lg"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.1, rotate: 5 }}
            >
              <FaList className="h-8 w-8" />
            </motion.div>
            <motion.h1 
              className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.3 }}
            >
              {t.playlists}
            </motion.h1>
            <motion.p 
              className="mt-4 max-w-2xl mx-auto text-lg text-blue-100"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.4 }}
            >
              {t.description}
            </motion.p>
          </div>
        </div>
        
        {/* تأثيرات حركية */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
      </div>
    );
  };

  // مكون قائمة المفضلة
  const FavoritesPlaylist = () => {
    // إذا كان هناك خطأ في جلب البيانات
    if (fetchError) {
      return (
        <div className="group block border-2 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-[1.03] bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 border-gray-300 dark:border-gray-600 focus:outline-none focus-visible:ring-4 focus-visible:ring-gray-300/50 relative">
          <div className="relative p-6 flex flex-col items-center justify-center h-full min-h-[250px] z-10">
            <div className="relative mb-4">
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg border-2 border-gray-200 dark:border-gray-600">
                <FaHeart className="h-8 w-8 text-gray-400" />
              </div>
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t.myFavorites}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              {language === 'ar' ? 'حدث خطأ في تحميل المفضلات' : 'Error loading favorites'}
            </p>
            
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 transition-all duration-300 transform hover:scale-105"
            >
              {language === 'ar' ? 'إعادة المحاولة' : 'Retry'}
            </button>
          </div>
        </div>
      );
    }

    // إذا لم يكن المستخدم مسجل دخول، عرض بطاقة تسجيل الدخول
    if (!isSignedIn) {
      return (
        <div className="group block border-2 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-[1.03] bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 dark:from-indigo-900 dark:via-blue-900 dark:to-cyan-900 border-indigo-300 dark:border-indigo-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-indigo-300/50 relative">
          {/* خلفية متحركة متعددة الطبقات */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-blue-500/10 to-cyan-500/10 dark:from-indigo-500/20 dark:via-blue-500/20 dark:to-cyan-500/20 rounded-2xl"></div>
          
          {/* تأثيرات الضوء المتحركة */}
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            <div className="absolute top-0 left-0 w-32 h-32 bg-indigo-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
            <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-cyan-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
          </div>
          
          {/* محتوى البطاقة */}
          <div className="relative p-6 flex flex-col items-center justify-center h-full min-h-[250px] z-10">
            {/* أيقونة المستخدم مع القلب */}
            <div className="relative mb-4">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-blue-500 rounded-full blur-xl animate-pulse"></div>
              <div className="relative bg-white dark:bg-gray-800 p-4 rounded-full shadow-lg border-2 border-indigo-200 dark:border-indigo-700">
                <div className="relative">
                  <FaUser className="h-8 w-8 text-indigo-500" />
                  <FaHeart className="h-4 w-4 text-red-500 absolute -bottom-1 -right-1" />
                </div>
              </div>
            </div>
            
            {/* النصوص */}
            <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
              {t.loginToViewFavorites}
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-4">
              {t.loginPrompt}
            </p>
            
            {/* زر تسجيل الدخول */}
            <Link
              href="/sign-in"
              className="inline-flex items-center px-4 py-2 bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-full hover:from-indigo-600 hover:to-blue-600 transition-all duration-300 transform hover:scale-105 z-20 relative"
            >
              <FaSignInAlt className="mr-2" />
              {t.signIn}
            </Link>
          </div>
          
          {/* تأثير التوهج عند التمرير */}
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/20 via-blue-500/20 to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl pointer-events-none"></div>
        </div>
      );
    }

    // بطاقة بسيط للمستخدم المسجل دخول
    return (
      <Link
        href="/favorites"
        className="group block border-2 rounded-2xl overflow-hidden shadow-2xl hover:shadow-3xl transition-all duration-700 transform hover:scale-[1.03] bg-gradient-to-br from-rose-50 via-pink-50 to-purple-50 dark:from-rose-900 dark:via-pink-900 dark:to-purple-900 border-rose-300 dark:border-rose-700 focus:outline-none focus-visible:ring-4 focus-visible:ring-rose-300/50 relative"
      >
        {/* خلفية متحركة متعددة الطبقات */}
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 via-pink-500/10 to-purple-500/10 dark:from-rose-500/20 dark:via-pink-500/20 dark:to-purple-500/20 rounded-2xl"></div>
        
        {/* تأثيرات الضوء المتحركة */}
        <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
          <div className="absolute top-0 left-0 w-32 h-32 bg-rose-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-0 left-1/2 w-32 h-32 bg-purple-400 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-4000"></div>
        </div>
        
        {/* محتوى البطاقة */}
        <div className="relative p-6 z-10 flex flex-col items-center justify-center h-full min-h-[280px]">
          {/* صورة المستخدم الشخصية مع القلب */}
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-r from-rose-500 to-pink-500 rounded-full blur-xl animate-pulse"></div>
            <div className="relative">
              {/* صورة المستخدم */}
              {user?.image ? (
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white dark:border-gray-800 shadow-xl">
                  <Image
                    src={user.image}
                    alt={user.name || "User"}
                    width={96}
                    height={96}
                    className="w-full h-full object-cover"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-rose-400 to-pink-400 flex items-center justify-center">
                  <FaUser className="h-10 w-10 text-white" />
                </div>
              )}
              {/* أيقونة القلب */}
              <div className="absolute -bottom-2 -right-2 bg-white dark:bg-gray-800 rounded-full p-2 shadow-lg border-2 border-rose-200 dark:border-rose-700">
                <FaHeart className="h-5 w-5 text-rose-500" />
              </div>
            </div>
          </div>
          
          {/* العنوان الرئيسي */}
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2 text-center">
            {t.yourFavorites}
          </h2>
          
          {/* اسم المستخدم */}
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
            {user?.name || (language === 'ar' ? 'المستخدم' : 'User')}
          </p>
          
          {/* زر عرض المفضلة */}
          <div className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-rose-500 to-pink-500 text-white rounded-full hover:from-rose-600 hover:to-pink-600 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl group">
            <span className="font-medium">{t.viewMyFavorites}</span>
            <FaArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
          </div>
        </div>
        
        {/* تأثير التوهج عند التمرير */}
        <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-purple-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-700 rounded-2xl pointer-events-none"></div>
      </Link>
    );
  };

  // مكون بطاقة قائمة التشغيل للعرض الشبكي
  const PlaylistCard = ({ playlist, index }: { playlist: Playlist; index: number }) => {
    const imageUrl = getImageUrl(playlist);
    // حساب عدد الحلقات والمقالات
    const episodesCount = playlist.episodes?.length || 0;
    const articlesCount = playlist.articles?.length || 0;
    const totalItems = episodesCount + articlesCount;
    // الحصول على العنوان المناسب حسب اللغة
    const title = language === 'ar' 
      ? (playlist.title || "")
      : (playlist.titleEn || playlist.title || "");
    
    return (
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        whileHover={{ scale: 1.03, y: -5 }}
        className="group border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <Link href={`/playlists/${playlist.slug}`} className="block">
          <div className="w-full h-48 relative overflow-hidden bg-gray-100 dark:bg-gray-700">
            {imageUrl ? (
              <>
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                />
                {/* تأثير التدرج على الصورة */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              </>
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                <FaList className="h-12 w-12 text-gray-400 dark:text-gray-500" />
              </div>
            )}
            
            {/* أيقونة التشغيل */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500">
              <motion.div 
                className="rounded-full bg-black/60 backdrop-blur-sm p-3 md:p-4"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.1 }}
              >
                <FaPlay className="h-5 w-5 md:h-7 md:w-7 text-white" />
              </motion.div>
            </div>
            
            {/* شارات نوع المحتوى */}
            <div className="absolute top-2 right-2 flex gap-1">
              {episodesCount > 0 && (
                <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full">
                  {episodesCount} {episodesCount === 1 ? t.episode : t.episodes}
                </span>
              )}
              {articlesCount > 0 && (
                <span className="text-xs bg-green-600 text-white px-2 py-1 rounded-full">
                  {articlesCount} {articlesCount === 1 ? t.article : t.articles}
                </span>
              )}
            </div>
          </div>
          <div className="p-4">
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 line-clamp-2 mb-2">{title}</h2>
            <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
              <FaList className="h-4 w-4 mr-1" />
              <span>{totalItems} {t.items}</span>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  // مكون بطاقة قائمة التشغيل للعرض القائمة - تم تحسينه
  const PlaylistListItem = ({ playlist, index }: { playlist: Playlist; index: number }) => {
    const imageUrl = getImageUrl(playlist);
    // حساب عدد الحلقات والمقالات
    const episodesCount = playlist.episodes?.length || 0;
    const articlesCount = playlist.articles?.length || 0;
    const totalItems = episodesCount + articlesCount;
    // الحصول على العنوان المناسب حسب اللغة
    const title = language === 'ar' 
      ? (playlist.title || "")
      : (playlist.titleEn || playlist.title || "");
    
    return (
      <motion.div
        initial={{ opacity: 0, x: -30 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: index * 0.05, duration: 0.3 }}
        whileHover={{ x: 10 }}
        className="group border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
      >
        <Link href={`/playlists/${playlist.slug}`} className="block">
          <div className="flex flex-col sm:flex-row">
            {/* صورة قائمة التشغيل */}
            <div className="relative w-full sm:w-32 sm:h-32 h-48 overflow-hidden bg-gray-100 dark:bg-gray-700">
              {imageUrl ? (
                <Image
                  src={imageUrl}
                  alt={title}
                  fill
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                  sizes="(max-width: 768px) 100vw, 200px"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800">
                  <FaList className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
              )}
              
              {/* أيقونة التشغيل */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500">
                <motion.div 
                  className="rounded-full bg-black/60 backdrop-blur-sm p-3"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                >
                  <FaPlay className="h-5 w-5 text-white" />
                </motion.div>
              </div>
            </div>
            
            {/* محتوى قائمة التشغيل */}
            <div className="flex-1 p-4 sm:p-6">
              <h3 className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-100 mb-2 line-clamp-2">{title}</h3>
              
              <div className="flex flex-wrap items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center">
                  <FaList className="h-4 w-4 mr-1" />
                  <span>{totalItems} {t.items}</span>
                </div>
                
                {episodesCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-full text-xs">
                    {episodesCount} {episodesCount === 1 ? t.episode : t.episodes}
                  </span>
                )}
                
                {articlesCount > 0 && (
                  <span className="inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-full text-xs">
                    {articlesCount} {articlesCount === 1 ? t.article : t.articles}
                  </span>
                )}
              </div>
            </div>
            
            {/* سهم التنقل */}
            <div className="flex items-center justify-center p-4 sm:p-6">
              <div className="text-gray-400 group-hover:text-blue-500 transition-colors duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* مؤشر التحديث التلقائي */}
      {isUpdating && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <FaSync className="h-5 w-5 animate-spin" />
          <span>{t.updating}</span>
        </div>
      )}
      
      <div className="container mx-auto px-4 py-6 max-w-7xl">
        {/* القسم الرئيسي */}
        <HeroSection />
        
        {/* رأس الصفحة */}
        <div className="flex flex-col gap-4 mb-6">
          {/* شريط البحث والفلاتر */}
          <div className="flex flex-col gap-3">
            {/* مربع البحث */}
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
              />
              {/* زر المسح على اليسار */}
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm("")}
                  className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-100 transition-all duration-200"
                  aria-label={t.clearSearch}
                  title={t.clearSearch}
                >
                  <FaTimes className="h-5 w-5" />
                </button>
              )}
              {/* أيقونة البحث على اليمين */}
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <FaSearch className="h-5 w-5" />
              </span>
            </div>
            
            {/* أزرار التحكم */}
            <div className="flex items-center justify-between">
              {/* زر الفلاتر للجوال */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilters(!showFilters)}
                className="md:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                <FaFilter className="h-4 w-4" />
                <span>{t.filter}</span>
              </motion.button>
              
              {/* فلاتر سطح المكتب */}
              <div className="hidden md:flex items-center gap-3">
                <select
                  value={filterType || ""}
                  onChange={(e) => setFilterType(e.target.value === "all" ? null : e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none"
                >
                  <option value="">{t.allTypes}</option>
                  <option value="episodes">{t.withEpisodes}</option>
                  <option value="articles">{t.withArticles}</option>
                  <option value="both">{t.withBoth}</option>
                </select>
              </div>
              
              {/* أزرار تغيير طريقة العرض */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg ${viewMode === "grid" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                  aria-label={t.gridView}
                  title={t.gridView}
                >
                  <FaTh className="h-5 w-5" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg ${viewMode === "list" ? "bg-blue-600 text-white" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300"}`}
                  aria-label={t.listView}
                  title={t.listView}
                >
                  <FaList className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
          
          {/* عدد النتائج */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <FaList className="ml-2" />
              {totalPlaylistsCount} {language === 'ar' ? 'قائمة تشغيل' : 'playlist'}
            </div>
            {searchTerm && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {language === 'ar' 
                  ? `عرض ${totalPlaylistsCount} من أصل ${originalTotalCount} قائمة`
                  : `Showing ${totalPlaylistsCount} of ${originalTotalCount} playlists`
                }
              </div>
            )}
          </div>
        </div>
        
        {/* محتوى القوائم مع الرسوم المتحركة */}
        <div className={`${fadeIn ? "opacity-100" : "opacity-0"} transition-opacity duration-500`} style={{ minHeight: "200px" }}>
          {totalPlaylistsCount === 0 ? (
            <div className="text-center mt-10 py-12 rounded-3xl shadow-lg bg-white dark:bg-gray-800">
              <div className="inline-block p-4 rounded-full bg-gray-100 dark:bg-gray-700 mb-4">
                <FaSearch className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <p className="text-gray-600 dark:text-gray-400 text-lg">
                {t.noResults}
              </p>
              <button 
                onClick={() => setSearchTerm("")}
                className="mt-4 inline-flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-full hover:opacity-90 transition-all duration-300 transform hover:scale-105"
              >
                {t.clearSearch}
              </button>
            </div>
          ) : viewMode === "grid" ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6">
              {/* قائمة المفضلة الأولى - تظهر دائماً */}
              <FavoritesPlaylist />
              
              {filteredPlaylists.map((playlist, index) => (
                <PlaylistCard key={playlist._id} playlist={playlist} index={index} />
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {/* قائمة المفضلة الأولى في وضع القائمة - تظهر دائماً */}
              <FavoritesPlaylist />
              
              {filteredPlaylists.map((playlist, index) => (
                <PlaylistListItem key={playlist._id} playlist={playlist} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
      
      {/* أنماط CSS مخصصة للرسوم المتحركة */}
      <style jsx>{`
        @keyframes blob {
          0% {
            transform: translate(0px, 0px) scale(1);
          }
          33% {
            transform: translate(30px, -50px) scale(1.1);
          }
          66% {
            transform: translate(-20px, 20px) scale(0.9);
          }
          100% {
            transform: translate(0px, 0px) scale(1);
          }
        }
        .animate-blob {
          animation: blob 7s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>
    </div>
  );
};

export default PlaylistsPage;