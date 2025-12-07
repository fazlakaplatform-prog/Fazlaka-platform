"use client";
import React, { useEffect, useMemo, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import ImageWithFallback from "@/components/Formats/ImageWithFallback";
import FavoriteButton from "@/components/Favorites/FavoriteButton";
import { useLanguage } from "@/components/Language/LanguageProvider";
import { 
  FaVideo, 
  FaCalendarAlt, FaNewspaper, FaHeart,
  FaStar, 
  FaBook, 
  FaGraduationCap, 
  FaFileAlt, FaSearch, FaTimes, FaTh, FaList,
  FaChevronDown, FaChevronUp, FaRegBookmark, FaFilter,
  FaLightbulb, FaMicroscope, FaLaptopCode, FaPalette, FaChartLine, FaGlobe, FaAtom, FaMusic,
  FaSync
} from 'react-icons/fa';

// تعريف واجهات البيانات مع دعم اللغة
interface Article {
  _id: string;
  slug: string;
  localizedTitle?: string;
  localizedExcerpt?: string;
  localizedFeaturedImageUrl?: string;
  episode?: {
    _id: string;
    slug: string;
    localizedTitle?: string;
  };
  season?: {
    _id: string;
    slug: string;
    localizedTitle?: string;
  };
  publishedAt?: string;
  language?: 'ar' | 'en';
}

interface Season {
  _id: string;
  slug: string;
  localizedTitle?: string;
  language?: 'ar' | 'en';
}

// كائن الترجمات
const translations = {
  ar: {
    loading: "جارٍ التحميل...",
    error: "حدث خطأ في تحميل البيانات",
    retry: "إعادة المحاولة",
    articles: "المقالات التعليمية",
    discover: "اكشف",
    knowledge: "المعرفة",
    description: "مجموعة شاملة من المقالات التعليمية عالية الجودة في مختلف المجالات، مصممة لتطوير معرفتك ومهاراتك.",
    search: "ابحث عن عنوان أو ملخص...",
    clearSearch: "مسح",
    grid: "عرض شبكي",
    list: "عرض قائمة",
    favorites: "مفضلاتي",
    episodes: "الحلقات",
    seasons: "المواسم",
    results: "مقال",
    searchResults: "نتائج البحث",
    noResults: "لا توجد نتائج مطابقة",
    tryDifferent: "جرب كلمات مفتاحية أخرى",
    open: "فتح",
    close: "طي",
    season: "موسم",
    episode: "حلقة",
    publishedAt: "تاريخ النشر",
    noArticles: "لم نتمكن من العثور على مقالات تطابق بحثك.",
    clearFilters: "جرب كلمات مفتاحية أخرى أو احذف عوامل التصفية.",
    allArticles: "جميع المقالات",
    articlesWithoutSeason: "مقالات بدون موسم",
    filterBySeason: "تصفية حسب الموسم",
    updating: "جاري التحديث..."
  },
  en: {
    loading: "Loading...",
    error: "An error occurred while loading data",
    retry: "Retry",
    articles: "Educational Articles",
    discover: "Discover",
    knowledge: "Knowledge",
    description: "A comprehensive collection of high-quality educational articles in various fields, designed to develop your knowledge and skills.",
    search: "Search for title or excerpt...",
    clearSearch: "Clear",
    grid: "Grid View",
    list: "List View",
    favorites: "My Favorites",
    episodes: "Episodes",
    seasons: "Seasons",
    results: "article",
    searchResults: "Search Results",
    noResults: "No matching results",
    tryDifferent: "Try different keywords",
    open: "Open",
    close: "Close",
    season: "Season",
    episode: "Episode",
    publishedAt: "Published Date",
    noArticles: "We couldn't find any articles matching your search.",
    clearFilters: "Try different keywords or clear filters.",
    allArticles: "All Articles",
    articlesWithoutSeason: "Articles without season",
    filterBySeason: "Filter by season",
    updating: "Updating..."
  }
};

function escapeRegExp(str = "") {
  if (!str) return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function renderHighlighted(text: string, q: string) {
  if (!q) return <>{text}</>;
  try {
    const re = new RegExp(`(${escapeRegExp(q)})`, "ig");
    const parts = text.split(re);
    return (
      <>
        {parts.map((part, i) =>
          re.test(part) ? (
            <mark key={i} className="bg-yellow-100 dark:bg-yellow-700 text-yellow-900 dark:text-yellow-200 rounded px-0.5">
              {part}
            </mark>
          ) : (
            <span key={i}>{part}</span>
          )
        )}
      </>
    );
  } catch {
    return <>{text}</>;
  }
}

// Animation variants
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// Small inline icons
function IconArticles({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 7V4h16v3M9 20h6M12 4v16" />
    </svg>
  );
}

function IconPlay({ className = "h-8 w-8" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M5 3v18l15-9L5 3z" />
    </svg>
  );
}

function IconChevron({ className = "h-5 w-5", open = false }: { className?: string; open?: boolean }) {
  return open ? (
    <FaChevronUp className={className} />
  ) : (
    <FaChevronDown className={className} />
  );
}

export default function ArticlesPageClient() {
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  
  const [articlesBySeason, setArticlesBySeason] = useState<Record<string, Article[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openSeasons, setOpenSeasons] = useState<Record<string, boolean>>({});
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSeason, setFilterSeason] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // دالة لتحميل البيانات - مُغلفة بـ useCallback لمنع إعادة التعريف في كل مرة
  const loadData = useCallback(async () => {
    try {
      // إذا لم يكن تحديثاً تلقائياً، اعرض حالة التحميل
      if (!isUpdating) {
        setLoading(true);
      }
      setError(null);
      
      // جلب المقالات والمواسم من API routes
      const [articlesRes, seasonsRes] = await Promise.all([
        fetch(`/api/articles?language=${language}`),
        fetch(`/api/seasons?language=${language}`)
      ]);

      if (!articlesRes.ok || !seasonsRes.ok) {
        throw new Error('Failed to fetch data');
      }

      const articlesData: { articles: Article[] } = await articlesRes.json();
      const seasonsData: { seasons: Season[] } = await seasonsRes.json();
      
      const articles = articlesData.articles || [];
      const seasons = seasonsData.seasons || [];
      
      // تنظيم المقالات حسب الموسم
      const grouped: Record<string, Article[]> = {};
      
      // تنظيم المقالات حسب الموسم أولاً
      seasons.forEach((season: Season) => {
        const seasonTitle = season.localizedTitle || 'Unknown Season';
        if (!grouped[seasonTitle]) grouped[seasonTitle] = [];
        const seasonArticles = articles.filter(article => 
          article.season?._id === season._id
        );
        grouped[seasonTitle] = seasonArticles;
      });
      
      // إضافة قسم "مقالات بدون موسم"
      const articlesWithoutSeason = articles.filter(article => !article.season);
      if (articlesWithoutSeason.length > 0) {
        grouped[t.articlesWithoutSeason] = articlesWithoutSeason;
      }
      
      // إضافة قسم "جميع المقالات" في النهاية
      grouped[t.allArticles] = articles;
      
      setArticlesBySeason(grouped);
      
      // فتح أول موسم بشكل افتراضي
      const first = Object.keys(grouped)[0];
      if (first && first !== t.allArticles) {
        setOpenSeasons({ [first]: true });
      }
    } catch (err: unknown) {
      console.error(err);
      setError(t.error);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [language, t.error, t.allArticles, t.articlesWithoutSeason, isUpdating]);

  // دالة لتحديث البيانات تلقائياً - مُغلفة بـ useCallback لمنع إعادة التعريف في كل مرة
  const autoRefresh = useCallback(async () => {
    setIsUpdating(true);
    await loadData();
  }, [loadData]);

  useEffect(() => {
    loadData();
    
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
            // تحديث البيانات تلقائياً فوراً
            autoRefresh();
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
  }, [language, t.error, t.allArticles, t.articlesWithoutSeason, loadData, autoRefresh]);

  // تعديل دالة toggleSeason لضمان عملها بشكل صحيح
  const toggleSeason = useCallback((title: string) => {
    setOpenSeasons((prev) => {
      // إنشاء نسخة جديدة من الحالة لتجنب التعديل المباشر
      const newState = { ...prev };
      // تبديل حالة الموسم المحدد
      newState[title] = !newState[title];
      return newState;
    });
  }, []);

  const filteredBySeason = useMemo(() => {
    let result = articlesBySeason;
    
    // تطبيق فلتر الموسم إذا تم تحديده
    if (filterSeason && filterSeason !== t.allArticles) {
      result = { [filterSeason]: articlesBySeason[filterSeason] || [] };
    }
    
    // تطبيق البحث
    if (!searchTerm.trim()) return result;
    const q = searchTerm.trim().toLowerCase();
    const out: Record<string, Article[]> = {};
    
    // عند البحث، لا نعرض قسم "جميع المقالات" لتجنب التكرار
    Object.entries(result).forEach(([season, articles]) => {
      // تخطي قسم "جميع المقالات" عند البحث
      if (season === t.allArticles) return;
      
      const matches = articles.filter((article: Article) => {
        const title = article.localizedTitle?.toLowerCase() || '';
        const excerpt = article.localizedExcerpt?.toLowerCase() || '';
        return title.includes(q) || excerpt.includes(q);
      });
      if (matches.length > 0) out[season] = matches;
    });
    return out;
  }, [articlesBySeason, searchTerm, t.allArticles, filterSeason]);

  // تم تعديل هذه الدالة لتجاهل قسم "جميع المقالات" عند العد
  const totalResults = useMemo(
    () => Object.entries(filteredBySeason).reduce((s, [seasonTitle, arr]) => {
      // تجاهل قسم "جميع المقالات" عند حساب العدد الإجمالي لتجنب العد المزدوج
      if (seasonTitle === t.allArticles) return s;
      return s + arr.length;
    }, 0),
    [filteredBySeason, t.allArticles]
  );

  const seasonEntries = Object.entries(filteredBySeason);
  const searchResults = Object.values(filteredBySeason).flat();

  // Function to format date based on language
  const formatDate = (dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  if (loading && !isUpdating) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="text-center">
        <div className="inline-block animate-bounce bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full mb-4">
          <FaRegBookmark className="text-white text-3xl" />
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{t.loading}</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="text-center bg-white dark:bg-gray-800 p-8 rounded-2xl shadow-xl max-w-md">
        <div className="inline-block bg-red-100 dark:bg-red-900/30 p-3 rounded-full mb-4">
          <FaTimes className="text-red-500 dark:text-red-400 text-2xl" />
        </div>
        <p className="text-lg font-medium text-red-500 dark:text-red-400">{error}</p>
        <button 
          onClick={() => loadData()} 
          className="mt-4 px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:opacity-90 transition-opacity"
        >
          {t.retry}
        </button>
      </div>
    </div>
  );

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
        {/* Hero Section */}
        <div className="relative mb-8 sm:mb-12 overflow-hidden rounded-3xl">
          {/* الخلفية المتدرجة */}
          <div className="absolute inset-0 bg-gradient-to-br from-blue-600 via-purple-600 to-indigo-800 dark:from-blue-900 dark:via-purple-900 dark:to-indigo-950"></div>
          
          {/* العناصر الزخرفية */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            {/* دوائر زخرفية */}
            <div className="absolute -top-40 -right-40 w-64 h-64 bg-blue-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
            
            {/* شبكة زخرفية */}
            <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10"></div>
            
            {/* أيقونات المواد الدراسية في الخلفية */}
            <div className="absolute top-1/4 left-1/4 text-white/10 transform -translate-x-1/2 -translate-y-1/2 float-animation">
              <FaNewspaper className="text-7xl sm:text-9xl drop-shadow-lg" />
            </div>
            <div className="absolute top-1/3 right-1/4 text-white/10 transform translate-x-1/2 -translate-y-1/2 float-animation" style={{ animationDelay: '1s' }}>
              <FaBook className="text-7xl sm:text-9xl drop-shadow-lg" />
            </div>
            <div className="absolute bottom-1/4 left-1/3 text-white/10 transform -translate-x-1/2 translate-y-1/2 float-animation" style={{ animationDelay: '2s' }}>
              <FaFileAlt className="text-7xl sm:text-9xl drop-shadow-lg" />
            </div>
          </div>
          
          {/* المحتوى الرئيسي */}
          <div className="relative z-10 pt-12 sm:pt-16 pb-10 sm:pb-12 md:pb-16 px-4 sm:px-6 md:px-10 flex flex-col items-center justify-center">
            <div className="w-full text-center mb-8 md:mb-0">
              <div className="inline-block bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
                <span className="text-white font-medium flex items-center text-sm sm:text-base">
                  <FaStar className="text-yellow-300 mr-2 animate-pulse" />
                  {t.articles}
                </span>
              </div>
              <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight">
                {t.discover} <span className="text-yellow-300">{t.knowledge}</span> {language === 'ar' ? 'في مقالاتنا' : 'in our articles'}
              </h1>
              <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
                {t.description}
              </p>
              
              {/* أيقونات المواد الدراسية في الأسفل - سطرين */}
              <div className="flex flex-col gap-4 mt-6">
                {/* السطر الأول */}
                <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 flex-wrap">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation">
                    <FaNewspaper className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.5s' }}>
                    <FaBook className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1s' }}>
                    <FaFileAlt className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1.5s' }}>
                    <FaGraduationCap className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2s' }}>
                    <FaLightbulb className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2.5s' }}>
                    <FaMicroscope className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                </div>
                
                {/* السطر الثاني */}
                <div className="flex justify-center gap-3 sm:gap-4 md:gap-6 flex-wrap">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.3s' }}>
                    <FaLaptopCode className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '0.8s' }}>
                    <FaPalette className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1.3s' }}>
                    <FaChartLine className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '1.8s' }}>
                    <FaGlobe className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2.3s' }}>
                    <FaAtom className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                  <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 float-animation" style={{ animationDelay: '2.8s' }}>
                    <FaMusic className="text-yellow-300 text-lg sm:text-xl" />
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* تأثيرات حركية */}
          <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
        </div>
        
        {/* رأس الصفحة */}
        <div className="flex flex-col gap-4 mb-6">
          {/* شريط البحث والفلاتر */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-2 bg-white dark:bg-gray-800 rounded-full shadow-sm px-3 py-2 border border-gray-100 dark:border-gray-700 focus-within:ring-2 focus-within:ring-blue-200">
              <FaSearch className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <input
                aria-label={t.search}
                className="bg-transparent outline-none flex-grow text-sm text-gray-700 dark:text-gray-200 placeholder-gray-400 dark:placeholder-gray-500 py-1"
                placeholder={t.search}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              {searchTerm ? (
                <button
                  onClick={() => setSearchTerm("")}
                  className="flex items-center justify-center rounded-full p-1 hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                  aria-label={t.clearSearch}
                  title={t.clearSearch}
                >
                  <FaTimes className="h-4 w-4 text-gray-500 dark:text-gray-300" />
                </button>
              ) : null}
            </div>
            
            {/* أزرار التحكم */}
            <div className="flex flex-wrap gap-2 justify-between items-center">
              <div className="flex gap-2">
                {/* أزرار تغيير العرض */}
                <div className="inline-flex items-center rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                  <button
                    onClick={() => setViewMode("grid")}
                    className={`flex items-center justify-center p-2 transition ${
                      viewMode === "grid"
                        ? "bg-purple-600 text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    aria-pressed={viewMode === "grid"}
                    title={t.grid}
                  >
                    <FaTh className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`flex items-center justify-center p-2 transition ${
                      viewMode === "list"
                        ? "bg-purple-600 text-white"
                        : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                    aria-pressed={viewMode === "list"}
                    title={t.list}
                  >
                    <FaList className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                  </button>
                </div>
                
                {/* زر الفلاتر */}
                <button
                  onClick={() => setShowFilters(!showFilters)}
                  className={`px-3 py-2 rounded-md text-sm transition flex items-center justify-center shadow-md ${
                    showFilters 
                      ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white" 
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <FaFilter className="h-4 w-4 mr-1" />
                  <span className="hidden sm:inline">{t.filterBySeason}</span>
                </button>
              </div>
              
              {/* روابط التنقل */}
              <div className="flex gap-2">
                <Link href="/favorites" className="px-3 py-2 bg-gradient-to-r from-purple-600 to-purple-700 text-white rounded-md text-sm hover:opacity-90 transition-opacity flex items-center justify-center shadow-md">
                  <FaHeart className="h-4 w-4 ml-1" />
                  <span className="hidden sm:inline">{t.favorites}</span>
                </Link>
                <Link href="/episodes" className="px-3 py-2 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-md text-sm hover:opacity-90 transition-opacity flex items-center justify-center shadow-md">
                  <FaVideo className="h-4 w-4 ml-1" />
                  <span className="hidden sm:inline">{t.episodes}</span>
                </Link>
                <Link href="/seasons" className="px-3 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-md text-sm hover:opacity-90 transition-opacity flex items-center justify-center shadow-md">
                  <FaCalendarAlt className="h-4 w-4 ml-1" />
                  <span className="hidden sm:inline">{t.seasons}</span>
                </Link>
              </div>
            </div>
            
            {/* فلتر المواسم */}
            {showFilters && (
              <div className="bg-white dark:bg-gray-800 rounded-lg p-3 shadow-md border border-gray-200 dark:border-gray-700">
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setFilterSeason(null)}
                    className={`px-3 py-1 rounded-full text-sm transition ${
                      filterSeason === null
                        ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                    }`}
                  >
                    {t.allArticles}
                  </button>
                  {Object.keys(articlesBySeason).filter(season => season !== t.allArticles).map(season => (
                    <button
                      key={season}
                      onClick={() => setFilterSeason(season)}
                      className={`px-3 py-1 rounded-full text-sm transition ${
                        filterSeason === season
                          ? "bg-gradient-to-r from-blue-500 to-purple-500 text-white"
                          : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
                      }`}
                    >
                      {season}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
          
          {/* عدد النتائج */}
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-500 dark:text-gray-400 flex items-center">
              <FaNewspaper className="ml-2" />
              {totalResults} {t.results}
            </div>
            {searchTerm && (
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {t.searchResults}: &quot;{searchTerm}&quot;
              </div>
            )}
          </div>
        </div>
        
        {/* نتائج البحث */}
        {searchTerm.trim() ? (
          <div className="mb-8">
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 dark:from-blue-800 dark:to-purple-900 rounded-xl p-4 mb-6 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <div className="text-sm text-blue-100 dark:text-blue-200">{t.searchResults}</div>
                  <div className="text-lg font-semibold text-white">
                    «{searchTerm}» <span className="text-sm text-blue-200 dark:text-blue-300">({totalResults})</span>
                  </div>
                </div>
                <button onClick={() => setSearchTerm("")} className="px-3 py-2 bg-white/20 backdrop-blur-sm border border-white/30 rounded-md text-sm hover:bg-white/30 text-white transition-colors self-start sm:self-auto">
                  {t.clearSearch}
                </button>
              </div>
            </div>
            
            {searchResults.length === 0 ? (
              <div className="p-8 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 text-center shadow-lg">
                <div className="inline-block bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                  <FaSearch className="text-gray-400 dark:text-gray-500 text-2xl" />
                </div>
                <div className="text-gray-500 dark:text-gray-400 mb-2">{t.noResults}.</div>
                <div className="text-sm text-gray-400 dark:text-gray-500">{t.tryDifferent}</div>
              </div>
            ) : (
              <div>
                {viewMode === "grid" ? (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4"
                  >
                    {searchResults.map((article: Article) => {
                      const slug = article.slug;
                      const title = article.localizedTitle || 'No Title';
                      const excerpt = article.localizedExcerpt || '';
                      const episode = article.episode;
                      const articleSeason = article.season;
                      const thumbnailUrl = article.localizedFeaturedImageUrl || "/placeholder.png";
                      
                      return (
                        <motion.article
                          key={article._id}
                          variants={cardVariants}
                          whileHover={{ scale: 1.02 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          layout
                          className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col bg-white dark:bg-gray-800 shadow-md"
                        >
                          <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block group">
                            <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                              <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                              <motion.div
                                initial={{ opacity: 0 }}
                                whileHover={{ opacity: 1, scale: 1.02 }}
                                transition={{ duration: 0.18 }}
                                className="absolute inset-0 flex items-center justify-center pointer-events-none"
                              >
                                <div className="bg-black/30 dark:bg-white/10 rounded-full p-2">
                                  <IconPlay className="h-6 w-6 text-white dark:text-gray-200" />
                                </div>
                              </motion.div>
                            </div>
                            <div className="p-4">
                              <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2 mb-2">{renderHighlighted(title, searchTerm)}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{excerpt}</p>
                              
                              {/* عرض الموسم المرتبط */}
                              {articleSeason && (
                                <div className="mb-2">
                                  <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-800 dark:text-blue-200 rounded-full">
                                    {t.season}: {articleSeason.localizedTitle}
                                  </span>
                                </div>
                              )}
                              
                              {/* عرض الحلقة المرتبطة */}
                              {episode && (
                                <div className="mb-2">
                                  <span className="text-xs px-2 py-1 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 text-green-800 dark:text-green-200 rounded-full">
                                    {t.episode}: {episode.localizedTitle}
                                  </span>
                                </div>
                              )}
                              
                              {/* عرض تاريخ النشر */}
                              {article.publishedAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <FaCalendarAlt className="h-3 w-3" />
                                  {formatDate(article.publishedAt)}
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="mt-auto p-3 pt-1 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                            <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                              <IconArticles className="h-4 w-4" />
                            </div>
                            <FavoriteButton contentId={article._id} contentType="article" />
                          </div>
                        </motion.article>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-4">
                    {searchResults.map((article: Article) => {
                      const slug = article.slug;
                      const title = article.localizedTitle || 'No Title';
                      const excerpt = article.localizedExcerpt || '';
                      const episode = article.episode;
                      const articleSeason = article.season;
                      const thumbnailUrl = article.localizedFeaturedImageUrl || "/placeholder.png";
                      
                      return (
                        <motion.div
                          key={article._id}
                          variants={cardVariants}
                          whileHover={{ scale: 1.01 }}
                          transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          layout
                          className="flex gap-4 items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-4 hover:shadow-lg transition bg-white dark:bg-gray-800 shadow-md"
                        >
                          <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="flex items-center gap-4 flex-1 group">
                            <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
                              <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" fill sizes="240px" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">{renderHighlighted(title, searchTerm)}</h3>
                              <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{excerpt}</p>
                              
                              {/* عرض الموسم والحلقة المرتبطين */}
                              <div className="flex flex-wrap gap-2 mb-1">
                                {articleSeason && (
                                  <span className="text-xs px-2 py-1 bg-gradient-to-r from-blue-100 to-blue-200 dark:from-blue-900/50 dark:to-blue-800/50 text-blue-800 dark:text-blue-200 rounded-full">
                                    {t.season}: {articleSeason.localizedTitle}
                                  </span>
                                )}
                                {episode && (
                                  <span className="text-xs px-2 py-1 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 text-green-800 dark:text-green-200 rounded-full">
                                    {t.episode}: {episode.localizedTitle}
                                  </span>
                                )}
                              </div>
                              
                              {/* عرض تاريخ النشر */}
                              {article.publishedAt && (
                                <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                  <FaCalendarAlt className="h-3 w-3" />
                                  {formatDate(article.publishedAt)}
                                </div>
                              )}
                            </div>
                          </Link>
                          <div className="flex-shrink-0">
                            <FavoriteButton contentId={article._id} contentType="article" />
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </div>
            )}
          </div>
        ) : null}
        
        {/* قائمة المواسم */}
        <div className="space-y-6">
          {seasonEntries.length === 0 ? (
            <div className="text-center p-10 bg-white dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700 shadow-lg">
              <div className="inline-block bg-gray-100 dark:bg-gray-700 p-4 rounded-full mb-4">
                <FaNewspaper className="text-gray-400 dark:text-gray-500 text-2xl" />
              </div>
              <div className="text-gray-600 dark:text-gray-300 mb-2">{t.noArticles}</div>
              <div className="text-sm text-gray-400 dark:text-gray-500">{t.clearFilters}</div>
            </div>
          ) : (
            seasonEntries.map(([seasonTitle, articles]) => {
              // تعديل كيفية التحقق من حالة الموسم المفتوح
              const isOpen = openSeasons[seasonTitle] === true;
              return (
                <div key={seasonTitle} className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden border border-gray-200 dark:border-gray-700">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700/50">
                    <div className="flex items-center gap-3 mb-2 sm:mb-0">
                      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-100">{seasonTitle}</h2>
                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 px-2 py-1 rounded bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <IconArticles className="h-3 w-3" />
                        <span>{articles.length} {t.results}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <motion.button
                        aria-expanded={isOpen}
                        onClick={() => toggleSeason(seasonTitle)}
                        whileTap={{ scale: 0.97 }}
                        className="inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-gradient-to-r from-blue-500 to-purple-500 text-white transition-all duration-300 hover:opacity-90 text-sm shadow-md"
                      >
                        <motion.span layout className="flex items-center gap-2">
                          <motion.span aria-hidden>
                            <motion.div
                              initial={{ rotate: isOpen ? 180 : 0 }}
                              animate={{ rotate: isOpen ? 180 : 0 }}
                              transition={{ type: "spring", stiffness: 420, damping: 32 }}
                              className="flex items-center"
                            >
                              <IconChevron className="h-4 w-4" open={isOpen} />
                            </motion.div>
                          </motion.span>
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.18 }}>
                            {isOpen ? t.close : t.open}
                          </motion.span>
                        </motion.span>
                      </motion.button>
                    </div>
                  </div>
                  
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key={seasonTitle}
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.28, ease: "easeInOut" }}
                        style={{ overflow: "hidden" }}
                        className="px-4"
                      >
                        <motion.div layout className={`py-4 ${viewMode === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4" : "space-y-4"}`}>
                          {articles.map((article: Article) => {
                            const slug = article.slug;
                            const title = article.localizedTitle || 'No Title';
                            const excerpt = article.localizedExcerpt || '';
                            const episode = article.episode;
                            const thumbnailUrl = article.localizedFeaturedImageUrl || "/placeholder.png";
                            
                            return viewMode === "grid" ? (
                              <motion.article
                                key={article._id}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ scale: 1.02 }}
                                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                                layout
                                className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden hover:shadow-xl transition-all duration-300 flex flex-col bg-white dark:bg-gray-800 shadow-md"
                              >
                                <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block group">
                                  <div className="relative aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800">
                                    <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" fill sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw" />
                                    <motion.div
                                      initial={{ opacity: 0 }}
                                      whileHover={{ opacity: 1, scale: 1.02 }}
                                      transition={{ duration: 0.18 }}
                                      className="absolute inset-0 flex items-center justify-center pointer-events-none"
                                    >
                                      <div className="bg-black/30 dark:bg-white/10 rounded-full p-2">
                                        <IconPlay className="h-6 w-6 text-white dark:text-gray-200" />
                                      </div>
                                    </motion.div>
                                  </div>
                                  <div className="p-4">
                                    <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2 mb-2">{renderHighlighted(title, searchTerm)}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-3">{excerpt}</p>
                                    
                                    {/* عرض الحلقة المرتبطة */}
                                    {episode && (
                                      <div className="mb-2">
                                        <span className="text-xs px-2 py-1 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 text-green-800 dark:text-green-200 rounded-full">
                                          {t.episode}: {episode.localizedTitle}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* عرض تاريخ النشر */}
                                    {article.publishedAt && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <FaCalendarAlt className="h-3 w-3" />
                                        {formatDate(article.publishedAt)}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                                <div className="mt-auto p-3 pt-1 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                                  <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                                    <IconArticles className="h-4 w-4" />
                                  </div>
                                  <FavoriteButton contentId={article._id} contentType="article" />
                                </div>
                              </motion.article>
                            ) : (
                              <motion.div
                                key={article._id}
                                variants={cardVariants}
                                initial="hidden"
                                animate="visible"
                                whileHover={{ scale: 1.01 }}
                                transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                layout
                                className="flex gap-4 items-center border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden p-4 hover:shadow-lg transition bg-white dark:bg-gray-800 shadow-md"
                              >
                                <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="flex items-center gap-4 flex-1 group">
                                  <div className="relative w-24 h-16 sm:w-32 sm:h-20 flex-shrink-0 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 rounded-lg overflow-hidden">
                                    <ImageWithFallback src={thumbnailUrl} alt={title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" fill sizes="240px" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h3 className="font-semibold text-base text-gray-800 dark:text-gray-100 line-clamp-2 mb-1">{renderHighlighted(title, searchTerm)}</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">{excerpt}</p>
                                    
                                    {/* عرض الحلقة المرتبطة */}
                                    {episode && (
                                      <div className="flex flex-wrap gap-2 mb-1">
                                        <span className="text-xs px-2 py-1 bg-gradient-to-r from-green-100 to-green-200 dark:from-green-900/50 dark:to-green-800/50 text-green-800 dark:text-green-200 rounded-full">
                                          {t.episode}: {episode.localizedTitle}
                                        </span>
                                      </div>
                                    )}
                                    
                                    {/* عرض تاريخ النشر */}
                                    {article.publishedAt && (
                                      <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                                        <FaCalendarAlt className="h-3 w-3" />
                                        {formatDate(article.publishedAt)}
                                      </div>
                                    )}
                                  </div>
                                </Link>
                                <div className="flex-shrink-0">
                                  <FavoriteButton contentId={article._id} contentType="article" />
                                </div>
                              </motion.div>
                            );
                          })}
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}