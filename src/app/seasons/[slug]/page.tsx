"use client";
import React, { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { use } from "react";
import Link from "next/link";
import FavoriteButton from "@/components/Favorites/FavoriteButton";
import ImageWithFallback from "@/components/Formats/ImageWithFallback";
import { useLanguage } from "@/components/Language/LanguageProvider";
import { 
  FaCalendarAlt, 
  FaVideo, 
  FaNewspaper, 
  FaSearch, 
  FaTimes, 
  FaTh, 
  FaList,
  FaFilter,
  FaArrowLeft,
  FaPlay,
  FaSpinner,
  FaSync
} from "react-icons/fa";
import { motion, AnimatePresence } from "framer-motion";

// تعريف أنواع البيانات ليتوافق مع MongoDB
interface Season {
  _id: string;
  title?: string;
  titleEn?: string;
  slug?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  description?: string;
  descriptionEn?: string;
  publishedAt?: string;
  updatedAt?: string;
  episodes?: string[]; // Array of episode IDs
  articles?: string[]; // Array of article IDs
}

interface Episode {
  _id: string;
  title?: string;
  titleEn?: string;
  name?: string;
  nameEn?: string;
  description?: string;
  descriptionEn?: string;
  summary?: string;
  summaryEn?: string;
  slug?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  videoUrl?: string;
  videoUrlEn?: string;
  publishedAt?: string;
  season?: string; // Reference to season ID
}

interface Article {
  _id: string;
  title?: string;
  titleEn?: string;
  excerpt?: string;
  excerptEn?: string;
  slug?: string;
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  publishedAt?: string;
  season?: string; // Reference to season ID
  episode?: string; // Reference to episode ID
}

// كائن الترجمات
const translations = {
  ar: {
    loading: "جاري التحميل...",
    error: "حدث خطأ في تحميل الموسم",
    retry: "إعادة المحاولة",
    seasonNotFound: "الموسم غير موجود",
    season: "موسم",
    episodes: "حلقات",
    articles: "مقالات",
    allEpisodes: "جميع الحلقات",
    allArticles: "جميع المقالات",
    searchEpisode: "ابحث عن حلقة...",
    searchArticle: "ابحث عن مقال...",
    noEpisodes: "لا توجد حلقات مطابقة للبحث",
    noArticles: "لا توجد مقالات مطابقة للبحث",
    tryDifferent: "جرب تغيير كلمات البحث أو استخدم عبارات مختلفة للعثور على ما تبحث عنه.",
    episode: "حلقة",
    article: "مقال",
    publishedAt: "تاريخ النشر",
    gridView: "عرض شبكي",
    listView: "عرض قائمة",
    back: "رجوع",
    filter: "فلتر",
    close: "إغلاق",
    updating: "جاري التحديث..."
  },
  en: {
    loading: "Loading...",
    error: "Error loading season",
    retry: "Retry",
    seasonNotFound: "Season not found",
    season: "Season",
    episodes: "Episodes",
    articles: "Articles",
    allEpisodes: "All Episodes",
    allArticles: "All Articles",
    searchEpisode: "Search for an episode...",
    searchArticle: "Search for an article...",
    noEpisodes: "No episodes matching search",
    noArticles: "No articles matching search",
    tryDifferent: "Try changing search terms or use different phrases to find what you're looking for.",
    episode: "Episode",
    article: "Article",
    publishedAt: "Published Date",
    gridView: "Grid View",
    listView: "List View",
    back: "Back",
    filter: "Filter",
    close: "Close",
    updating: "Updating..."
  }
};

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
function getLocalizedText(arText?: string, enText?: string, language: string = 'ar'): string {
  return language === 'ar' ? (arText || '') : (enText || '');
}

// Build media URL function with cache-busting
function buildMediaUrl(thumbnailUrl?: string, thumbnailUrlEn?: string, language: string = 'ar', updatedAt?: string, forceRefresh?: number) {
  // إذا كان هناك رابط مباشر للصورة، استخدمه أولاً مع مراعاة اللغة
  if (language === 'en' && thumbnailUrlEn) {
    thumbnailUrl = thumbnailUrlEn;
  }
  
  if (!thumbnailUrl) {
    return "/placeholder.png";
  }
  
  // إضافة timestamp لمنع التخزين المؤقت
  const timestamp = updatedAt ? `?t=${new Date(updatedAt).getTime()}` : `?t=${Date.now()}_${forceRefresh || 0}`;
  
  // التحقق مما إذا كان الرابط يحتوي بالفعل على معلمات
  const separator = thumbnailUrl.includes('?') ? '&' : '?';
  
  return thumbnailUrl + (thumbnailUrl.includes('?') ? `&t=${new Date(updatedAt || Date.now()).getTime()}_${forceRefresh || 0}` : timestamp);
}

function normalizeForSearch(value?: unknown) {
  if (value === undefined || value === null) return "";
  let s = typeof value === "object" ? Object.values(flattenObj(value)).join(" ") : String(value);
  // Arabic-specific normalizations
  s = s.replace(/ـ/g, ""); // remove kashida
  s = s.replace(/[أإآ]/g, "ا");
  s = s.replace(/ى/g, "ي");
  s = s.replace(/ؤ/g, "و");
  s = s.replace(/ئ/g, "ي");
  s = s.replace(/ة/g, "ه");
  // Arabic-Indic digits -> Latin digits
  const arabicIndic = "٠١٢٣٤٥٦٧٨٩";
  s = s.replace(/[٠-٩]/g, (d) => String(arabicIndic.indexOf(d)));
  // remove combining marks, non letters/numbers, collapse spaces, lowercase
  s = s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  return s;
}

function flattenObj(obj: unknown): Record<string, unknown> {
  if (obj === null || obj === undefined) return { "": "" };
  if (Array.isArray(obj)) return obj.reduce((acc, v, i) => ({ ...acc, [i]: v }), {});
  if (typeof obj === "object") {
    const out: Record<string, unknown> = {};
    for (const k of Object.keys(obj as object)) {
      const v = (obj as Record<string, unknown>)[k];
      if (typeof v === "string" || typeof v === "number") out[k] = v;
      else if (typeof v === "object" && v !== null) {
        out[k] = JSON.stringify(v);
      } else out[k] = String(v);
    }
    return out;
  }
  return { "": String(obj) };
}

interface SeasonProps {
  params: Promise<{ slug: string }>;
}

export default function SeasonPageClient({ params }: SeasonProps) {
  const { slug } = use(params);
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  
  const [season, setSeason] = useState<Season | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // UI state
  const [contentType, setContentType] = useState<"episodes" | "articles">("episodes");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [forceRefresh, setForceRefresh] = useState(0);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(timer);
  }, [searchTerm]);
  
  // دالة لتحميل البيانات
  const loadData = useCallback(async () => {
    try {
      // إذا لم يكن تحديثاً تلقائياً، اعرض حالة التحميل
      if (!isUpdating) {
        setLoading(true);
      }
      setError(null);
      
      // Fetch season from API with cache-busting
      const seasonResponse = await fetch(`/api/seasons/${slug}?language=${language}&t=${Date.now()}`, {
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!seasonResponse.ok) {
        throw new Error("Season not found");
      }
      
      const seasonData = await seasonResponse.json();
      
      if (!seasonData.season) throw new Error("Season not found");
      
      setSeason(seasonData.season);
      
      // Fetch all episodes and articles with cache-busting
      const [episodesResponse, articlesResponse] = await Promise.all([
        fetch(`/api/episodes?language=${language}&t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        }),
        fetch(`/api/articles?language=${language}&t=${Date.now()}`, {
          headers: {
            'Cache-Control': 'no-cache',
            'Pragma': 'no-cache'
          }
        })
      ]);
      
      if (!episodesResponse.ok || !articlesResponse.ok) {
        throw new Error("Failed to fetch content");
      }
      
      const episodesData = await episodesResponse.json();
      const articlesData = await articlesResponse.json();
      
      // Extract episode and article IDs from season
      const seasonEpisodeIds = seasonData.season.episodes || [];
      const seasonArticleIds = seasonData.season.articles || [];
      
      // Normalize IDs (handle both string and object formats)
      const normalizeId = (id: string | { _id: string } | { $oid: string }): string => {
        if (typeof id === 'string') return id;
        if (id && typeof id === 'object') {
          if ('_id' in id) return id._id;
          if ('$oid' in id) return id.$oid;
        }
        return String(id);
      };
      
      const normalizedEpisodeIds = seasonEpisodeIds.map(normalizeId);
      const normalizedArticleIds = seasonArticleIds.map(normalizeId);
      
      // Filter episodes that belong to this season
      const seasonEpisodes = episodesData.episodes.filter(
        (ep: Episode) => {
          // Check if episode ID is in season's episodes array
          const isInSeasonEpisodes = normalizedEpisodeIds.includes(ep._id);
          // Also check if episode has a season reference that matches
          const hasSeasonReference = ep.season === seasonData.season._id;
          
          return isInSeasonEpisodes || hasSeasonReference;
        }
      );
      
      // Filter articles that belong to this season
      const seasonArticles = articlesData.articles.filter(
        (art: Article) => {
          // Check if article ID is in season's articles array
          const isInSeasonArticles = normalizedArticleIds.includes(art._id);
          // Also check if article has a season reference that matches
          const hasSeasonReference = art.season === seasonData.season._id;
          
          return isInSeasonArticles || hasSeasonReference;
        }
      );
      
      setEpisodes(seasonEpisodes || []);
      setArticles(seasonArticles || []);
      setError(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      setSeason(null);
      setEpisodes([]);
      setArticles([]);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [slug, language, isUpdating]);
  
  // دالة لتحديث البيانات تلقائياً
  const autoRefresh = useCallback(async () => {
    setIsUpdating(true);
    setForceRefresh(prev => prev + 1); // زيادة forceRefresh لتحديث الصور
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
            // تحقق مما إذا كان التغيير يتعلق بالمواسم أو الحلقات أو المقالات
            if (data.collection === 'seasons' || data.collection === 'episodes' || data.collection === 'articles') {
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
  }, [slug, language, autoRefresh]);
  
  // Create memoized helper functions that accept language as parameter
  const getSearchableTextForEpisode = useMemo(() => {
    return (ep: Episode, lang: 'ar' | 'en') => {
      const candidates = [
        getLocalizedText(ep.title, ep.titleEn, lang) ?? getLocalizedText(ep.name, ep.nameEn, lang) ?? "",
        getLocalizedText(ep.description, ep.descriptionEn, lang) ?? "",
        getLocalizedText(ep.summary, ep.summaryEn, lang) ?? "",
        ep.slug ?? "",
        JSON.stringify(ep)
      ];
      return candidates.join(" ");
    };
  }, []);
  
  const getSearchableTextForArticle = useMemo(() => {
    return (art: Article, lang: 'ar' | 'en') => {
      const candidates = [
        getLocalizedText(art.title, art.titleEn, lang) ?? "",
        getLocalizedText(art.excerpt, art.excerptEn, lang) ?? "",
        art.slug ?? "",
        JSON.stringify(art)
      ];
      return candidates.join(" ");
    };
  }, []);
  
  const filteredEpisodes = useMemo(() => {
    const q = normalizeForSearch(debouncedSearch);
    if (!q) return episodes;
    const tokens = q.split(" ").filter(Boolean);
    return episodes.filter((ep) => {
      const hay = normalizeForSearch(getSearchableTextForEpisode(ep, language));
      return tokens.every((t) => hay.includes(t));
    });
  }, [episodes, debouncedSearch, getSearchableTextForEpisode, language]);
  
  const filteredArticles = useMemo(() => {
    const q = normalizeForSearch(debouncedSearch);
    if (!q) return articles;
    const tokens = q.split(" ").filter(Boolean);
    return articles.filter((art) => {
      const hay = normalizeForSearch(getSearchableTextForArticle(art, language));
      return tokens.every((t) => hay.includes(t));
    });
  }, [articles, debouncedSearch, getSearchableTextForArticle, language]);
  
  // Function to format date based on language
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "";
    
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [language]);
  
  // Animation variants
  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.9 },
    visible: (i: number) => ({ 
      opacity: 1, 
      y: 0, 
      scale: 1,
      transition: { 
        delay: i * 0.08, 
        duration: 0.6, 
        ease: [0.22, 1, 0.36, 1] as const
      } 
    }),
    hover: { 
      scale: 1.03, 
      y: -10,
      transition: { 
        duration: 0.3, 
        ease: "easeInOut" as const
      }
    },
    exit: { 
      opacity: 0, 
      scale: 0.9,
      y: 20,
      transition: { 
        duration: 0.3,
        ease: "easeInOut" as const
      }
    }
  };
  
  const listVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: (i: number) => ({ 
      opacity: 1, 
      x: 0,
      transition: { 
        delay: i * 0.05, 
        duration: 0.5,
        ease: [0.22, 1, 0.36, 1] as const
      } 
    }),
    hover: { 
      x: 10,
      transition: { 
        duration: 0.2,
        ease: "easeInOut" as const
      }
    },
    exit: { 
      opacity: 0, 
      x: -20,
      transition: { 
        duration: 0.2,
        ease: "easeInOut" as const
      }
    }
  };
  
  const playIconVariants = {
    rest: { scale: 0.8, opacity: 0.7, rotate: -5 },
    hover: { 
      scale: 1.1, 
      opacity: 1,
      rotate: 0,
      transition: { 
        duration: 0.3,
        ease: "easeInOut" as const
      }
    },
  };
  
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    },
    exit: {
      opacity: 0,
      transition: {
        staggerChildren: 0.03,
        staggerDirection: -1
      }
    }
  };
  
  const buttonVariants = {
    rest: { scale: 1 },
    hover: { 
      scale: 1.05,
      transition: { 
        duration: 0.2,
        ease: "easeInOut" as const
      }
    },
    tap: { 
      scale: 0.95,
      transition: { 
        duration: 0.1,
        ease: "easeInOut" as const
      }
    }
  };
  
  if (loading && !isUpdating) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="text-center">
        <div className="inline-block animate-bounce bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full mb-4">
          <FaSpinner className="text-white text-3xl animate-spin" />
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{t.loading}</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="text-center max-w-md p-8 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700">
        <div className="text-red-500 mb-4">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t.error}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6">{error}</p>
        <button 
          onClick={() => loadData()}
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
        >
          {t.retry}
        </button>
      </div>
    </div>
  );
  
  if (!season) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="text-center p-6 text-gray-600 dark:text-gray-400">{t.seasonNotFound}</div>
    </div>
  );
  
  const seasonTitle = getLocalizedText(season.title, season.titleEn, language) ?? (language === 'ar' ? "موسم" : "Season");
  const seasonDescription = getLocalizedText(season.description, season.descriptionEn, language) ?? "";
  const seasonThumbnailUrl = buildMediaUrl(season.thumbnailUrl, season.thumbnailUrlEn, language, season.updatedAt, forceRefresh);
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* مؤشر التحديث التلقائي */}
      {isUpdating && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <FaSync className="h-5 w-5 animate-spin" />
          <span>{t.updating}</span>
        </div>
      )}
      
      <div className="container mx-auto py-4 px-4 max-w-7xl">
        {/* Back button for mobile */}
        <motion.div 
          className="mb-4 md:hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
          <motion.button
            variants={buttonVariants}
            whileHover="hover"
            whileTap="tap"
            onClick={() => window.history.back()}
            className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 rounded-lg shadow-md"
          >
            <FaArrowLeft className="h-4 w-4" />
            <span>{t.back}</span>
          </motion.button>
        </motion.div>
        
        {/* Season info - Hero Section */}
        <motion.div 
          className="relative rounded-2xl overflow-hidden mb-6 mt-6 shadow-xl"
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Background gradient overlay */}
          <motion.div 
            className="absolute inset-0 bg-gradient-to-r from-blue-900/80 to-indigo-900/80 z-10 dark:from-blue-800/90 dark:to-indigo-800/90"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.2 }}
          />
          
          {/* Background image with blur effect */}
          <div className="absolute inset-0 z-0">
            <motion.div
              className="absolute inset-0"
              initial={{ scale: 1.1, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            >
              <ImageWithFallback 
                src={seasonThumbnailUrl} 
                alt={seasonTitle} 
                fill
                style={{ objectFit: 'cover' }}
                className="filter blur-sm scale-110"
              />
            </motion.div>
          </div>
          
          {/* Content container */}
          <div className="relative z-20 p-6 md:p-8 lg:p-12 flex flex-col md:flex-row gap-6">
            {/* Thumbnail */}
            <motion.div 
              className="md:w-2/5 lg:w-1/3 flex-shrink-0"
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
            >
              <div className="relative group">
                <motion.div 
                  className="absolute -inset-2 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl blur opacity-75 group-hover:opacity-100 transition-opacity duration-300"
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.3 }}
                />
                <div className="relative bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow-2xl transform transition-transform duration-300 group-hover:scale-[1.02]">
                  <div className="relative w-full h-48 md:h-64 lg:h-80">
                    <ImageWithFallback 
                      src={seasonThumbnailUrl} 
                      alt={seasonTitle} 
                      fill
                      style={{ objectFit: 'cover' }}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
            
            {/* Text content */}
            <motion.div 
              className="flex-1 flex flex-col justify-center"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
            >
              <motion.div 
                className="inline-block px-3 py-1 bg-blue-600 text-white text-sm font-medium rounded-full mb-3 self-start"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.5, delay: 0.5 }}
              >
                {t.season}
              </motion.div>
              <motion.h1 
                className="text-2xl md:text-3xl lg:text-4xl xl:text-5xl font-bold mb-3 text-white drop-shadow-lg"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                {seasonTitle}
              </motion.h1>
              <motion.p 
                className="text-base md:text-lg text-gray-100 mb-4 max-w-2xl leading-relaxed"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.7 }}
              >
                {seasonDescription}
              </motion.p>
              
              {/* Stats and meta info */}
              <motion.div 
                className="flex flex-wrap gap-3 mt-2"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.8 }}
              >
                <motion.div 
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg"
                  whileHover={{ scale: 1.05, y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <FaVideo className="h-4 w-4 text-blue-300" />
                  <span className="text-white font-medium text-sm md:text-base">{episodes.length} {t.episodes}</span>
                </motion.div>
                <motion.div 
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm px-3 py-2 rounded-lg"
                  whileHover={{ scale: 1.05, y: -3 }}
                  transition={{ duration: 0.2 }}
                >
                  <FaNewspaper className="h-4 w-4 text-purple-300" />
                  <span className="text-white font-medium text-sm md:text-base">{articles.length} {t.articles}</span>
                </motion.div>
              </motion.div>
              
              {/* Action buttons */}
              <motion.div 
                className="flex flex-wrap gap-3 mt-4"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, delay: 0.9 }}
              >
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Link
                    href="/episodes"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-blue-600 font-medium rounded-lg text-sm hover:bg-blue-50 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    {t.allEpisodes}
                  </Link>
                </motion.div>
                <motion.div variants={buttonVariants} whileHover="hover" whileTap="tap">
                  <Link
                    href="/articles"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white text-purple-600 font-medium rounded-lg text-sm hover:bg-purple-50 transition-all duration-300 shadow-md hover:shadow-lg"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                    </svg>
                    {t.allArticles}
                  </Link>
                </motion.div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>
        
        {/* Enhanced Controls Section */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-5 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            {/* Content Type Tabs */}
            <div className="flex flex-wrap gap-2">
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setContentType("episodes")}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  contentType === "episodes"
                    ? "bg-blue-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                <FaVideo className="h-5 w-5" />
                {t.episodes} ({filteredEpisodes.length})
              </motion.button>
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setContentType("articles")}
                className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all duration-300 flex items-center gap-2 ${
                  contentType === "articles"
                    ? "bg-purple-600 text-white shadow-md"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600"
                }`}
              >
                <FaNewspaper className="h-5 w-5" />
                {t.articles} ({filteredArticles.length})
              </motion.button>
            </div>
            
            {/* Search and View Mode Controls */}
            <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
              {/* Search Input */}
              <div className="relative flex-1 min-w-[180px] max-w-md">
                <input
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={contentType === "articles" ? t.searchArticle : t.searchEpisode}
                  dir={isRTL ? 'rtl' : 'ltr'}
                  className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent outline-none transition-all duration-300 shadow-md focus:shadow-lg"
                />
                {/* Search icon on left */}
                <span className={`absolute ${isRTL ? 'right-4' : 'left-4'} top-3.5 text-gray-400 dark:text-gray-500`}>
                  <FaSearch className="h-5 w-5" />
                </span>
                {/* Clear button on right */}
                {searchTerm && (
                  <button 
                    onClick={() => setSearchTerm("")}
                    className={`absolute ${isRTL ? 'left-4' : 'right-4'} top-3.5 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200`}
                  >
                    <FaTimes className="h-5 w-5" />
                  </button>
                )}
              </div>
              
              {/* Filter button for mobile */}
              <motion.button
                variants={buttonVariants}
                whileHover="hover"
                whileTap="tap"
                onClick={() => setShowFilterModal(true)}
                className="md:hidden flex items-center gap-2 px-4 py-3 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700"
              >
                <FaFilter className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                <span className="text-gray-600 dark:text-gray-300">{t.filter}</span>
              </motion.button>
              
              {/* View Mode Toggle */}
              <div className="hidden md:inline-flex items-center rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-md overflow-hidden">
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setViewMode("grid")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition-all duration-300 ${
                    viewMode === "grid" 
                      ? contentType === "episodes" 
                        ? "bg-blue-600 text-white" 
                        : "bg-purple-600 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  title={t.gridView}
                >
                  <FaTh className={`h-5 w-5 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                </motion.button>
                <motion.button
                  variants={buttonVariants}
                  whileHover="hover"
                  whileTap="tap"
                  onClick={() => setViewMode("list")}
                  className={`flex items-center gap-2 px-4 py-3 text-sm transition-all duration-300 ${
                    viewMode === "list" 
                      ? contentType === "episodes" 
                        ? "bg-blue-600 text-white" 
                        : "bg-purple-600 text-white"
                      : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                  }`}
                  title={t.listView}
                >
                  <FaList className={`h-5 w-5 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
        
        {/* Episodes */}
        <AnimatePresence mode="wait">
          {contentType === "episodes" && (
            <>
              {filteredEpisodes.length === 0 ? (
                <motion.div 
                  className="text-center py-12 px-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="inline-block p-4 rounded-full bg-blue-100 dark:bg-blue-900/30 mb-4">
                    <FaVideo className="h-12 w-12 text-blue-500 dark:text-blue-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.noEpisodes}</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    {t.tryDifferent}
                  </p>
                </motion.div>
              ) : viewMode === "grid" ? (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {filteredEpisodes.map((ep: Episode, index) => {
                    const title = getLocalizedText(ep.title, ep.titleEn, language) ?? getLocalizedText(ep.name, ep.nameEn, language) ?? (language === 'ar' ? "حلقة" : "Episode");
                    const thumbnailUrl = buildMediaUrl(ep.thumbnailUrl, ep.thumbnailUrlEn, language, undefined, forceRefresh);
                    const slug = ep.slug ?? ep._id;
                    const episodeDate = formatDate(ep.publishedAt);
                    
                    return (
                      <motion.div
                        key={ep._id}
                        custom={index}
                        variants={cardVariants}
                        whileHover="hover"
                        exit="exit"
                        layout
                        className="border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      >
                        <div className="relative">
                          <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block">
                            <div className="aspect-video bg-gray-100 dark:bg-gray-700">
                              <motion.div 
                                className="relative w-full h-full"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.5 }}
                              >
                                <ImageWithFallback src={thumbnailUrl} alt={title} fill style={{ objectFit: 'cover' }} />
                              </motion.div>
                            </div>
                          </Link>
                          
                          {/* gradient overlay + play icon */}
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <motion.div 
                              variants={playIconVariants}
                              initial="rest"
                              whileHover="hover"
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center shadow-lg"
                            >
                              <FaPlay className="h-5 w-5 sm:h-7 sm:w-7 text-black dark:text-white" />
                            </motion.div>
                          </div>
                          
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                              {t.episode}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 sm:p-5 flex-1 flex flex-col">
                          <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{title}</h2>
                            
                            {/* Episode Date - Now prominently displayed */}
                            {episodeDate && (
                              <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 mb-3 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                <FaCalendarAlt className="h-4 w-4 ml-2" />
                                <span>{episodeDate}</span>
                              </div>
                            )}
                            
                            {ep.description && (
                              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                                {getLocalizedText(ep.description, ep.descriptionEn, language)}
                              </p>
                            )}
                          </Link>
                          
                          {/* Favorite Button moved here */}
                          <div className="mt-auto pt-3">
                            <FavoriteButton contentId={ep._id} contentType="episode" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  className="space-y-3 sm:space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {filteredEpisodes.map((ep: Episode, index) => {
                    const title = getLocalizedText(ep.title, ep.titleEn, language) ?? getLocalizedText(ep.name, ep.nameEn, language) ?? (language === 'ar' ? "حلقة" : "Episode");
                    const thumbnailUrl = buildMediaUrl(ep.thumbnailUrl, ep.thumbnailUrlEn, language, undefined, forceRefresh);
                    const slug = ep.slug ?? ep._id;
                    const episodeDate = formatDate(ep.publishedAt);
                    
                    return (
                      <motion.div
                        key={ep._id}
                        custom={index}
                        variants={listVariants}
                        whileHover="hover"
                        exit="exit"
                        layout
                        className="flex gap-3 sm:gap-4 items-center border rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
                      >
                        <div className="relative w-24 h-20 sm:w-36 sm:h-24 lg:w-44 lg:h-28 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
                          <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block">
                            <motion.div 
                              className="relative w-full h-full"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ImageWithFallback src={thumbnailUrl} alt={title} fill style={{ objectFit: 'cover' }} />
                            </motion.div>
                          </Link>
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-blue-600 text-white">
                              {t.episode}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/episodes/${encodeURIComponent(String(slug))}`} className="block">
                            <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">{title}</h3>
                            
                            {/* Episode Date - Now prominently displayed */}
                            {episodeDate && (
                              <div className="flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 mt-2 mb-3 bg-blue-50 dark:bg-blue-900/20 px-3 py-2 rounded-lg">
                                <FaCalendarAlt className="h-4 w-4 ml-2" />
                                <span>{episodeDate}</span>
                              </div>
                            )}
                            
                            {ep.description && (
                              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-1">
                                {getLocalizedText(ep.description, ep.descriptionEn, language)}
                              </p>
                            )}
                          </Link>
                          
                          {/* Favorite Button moved here */}
                          <div className="mt-3">
                            <FavoriteButton contentId={ep._id} contentType="episode" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
        
        {/* Articles */}
        <AnimatePresence mode="wait">
          {contentType === "articles" && (
            <>
              {filteredArticles.length === 0 ? (
                <motion.div 
                  className="text-center py-12 px-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.5 }}
                >
                  <div className="inline-block p-4 rounded-full bg-purple-100 dark:bg-purple-900/30 mb-4">
                    <FaNewspaper className="h-12 w-12 text-purple-500 dark:text-purple-400" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">{t.noArticles}</h3>
                  <p className="text-gray-600 dark:text-gray-400 max-w-md mx-auto">
                    {t.tryDifferent}
                  </p>
                </motion.div>
              ) : viewMode === "grid" ? (
                <motion.div 
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {filteredArticles.map((art: Article, index) => {
                    const title = getLocalizedText(art.title, art.titleEn, language) ?? (language === 'ar' ? "مقال" : "Article");
                    const thumbnailUrl = buildMediaUrl(art.featuredImageUrl, art.featuredImageUrlEn, language, undefined, forceRefresh);
                    const slug = art.slug ?? art._id;
                    const articleDate = formatDate(art.publishedAt);
                    
                    return (
                      <motion.div
                        key={art._id}
                        custom={index}
                        variants={cardVariants}
                        whileHover="hover"
                        exit="exit"
                        layout
                        className="border rounded-xl overflow-hidden shadow-lg hover:shadow-xl transition-all duration-300 flex flex-col bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                      >
                        <div className="relative">
                          <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block">
                            <div className="aspect-video bg-gray-100 dark:bg-gray-700">
                              <motion.div 
                                className="relative w-full h-full"
                                whileHover={{ scale: 1.05 }}
                                transition={{ duration: 0.5 }}
                              >
                                <ImageWithFallback src={thumbnailUrl} alt={title} fill style={{ objectFit: 'cover' }} />
                              </motion.div>
                            </div>
                          </Link>
                          
                          {/* gradient overlay + play icon */}
                          <motion.div 
                            className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                            initial={{ opacity: 0 }}
                            whileHover={{ opacity: 1 }}
                          />
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <motion.div 
                              variants={playIconVariants}
                              initial="rest"
                              whileHover="hover"
                              className="w-12 h-12 sm:w-16 sm:h-16 rounded-full bg-white/90 dark:bg-black/80 flex items-center justify-center shadow-lg"
                            >
                              <FaPlay className="h-5 w-5 sm:h-7 sm:w-7 text-black dark:text-white" />
                            </motion.div>
                          </div>
                          
                          <div className="absolute top-2 right-2 sm:top-3 sm:right-3">
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">
                              {t.article}
                            </span>
                          </div>
                        </div>
                        <div className="p-3 sm:p-5 flex-1 flex flex-col">
                          <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block">
                            <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">{title}</h2>
                            
                            {/* Article Date - Now prominently displayed */}
                            {articleDate && (
                              <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 mb-3 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                                <FaCalendarAlt className="h-4 w-4 ml-2" />
                                <span>{articleDate}</span>
                              </div>
                            )}
                            
                            {art.excerpt && (
                              <p className="text-gray-600 dark:text-gray-300 text-sm mb-3 line-clamp-2">
                                {getLocalizedText(art.excerpt, art.excerptEn, language)}
                              </p>
                            )}
                          </Link>
                          
                          {/* Favorite Button moved here */}
                          <div className="mt-auto pt-3">
                            <FavoriteButton contentId={art._id} contentType="article" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              ) : (
                <motion.div 
                  className="space-y-3 sm:space-y-4"
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  exit="exit"
                >
                  {filteredArticles.map((art: Article, index) => {
                    const title = getLocalizedText(art.title, art.titleEn, language) ?? (language === 'ar' ? "مقال" : "Article");
                    const thumbnailUrl = buildMediaUrl(art.featuredImageUrl, art.featuredImageUrlEn, language, undefined, forceRefresh);
                    const slug = art.slug ?? art._id;
                    const articleDate = formatDate(art.publishedAt);
                    
                    return (
                      <motion.div
                        key={art._id}
                        custom={index}
                        variants={listVariants}
                        whileHover="hover"
                        exit="exit"
                        layout
                        className="flex gap-3 sm:gap-4 items-center border rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-sm"
                      >
                        <div className="relative w-24 h-20 sm:w-36 sm:h-24 lg:w-44 lg:h-28 flex-shrink-0 rounded-lg overflow-hidden shadow-md">
                          <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block">
                            <motion.div 
                              className="relative w-full h-full"
                              whileHover={{ scale: 1.05 }}
                              transition={{ duration: 0.3 }}
                            >
                              <ImageWithFallback src={thumbnailUrl} alt={title} fill style={{ objectFit: 'cover' }} />
                            </motion.div>
                          </Link>
                          <div className="absolute top-2 left-2">
                            <span className="px-2 py-1 rounded-full text-xs font-bold bg-purple-600 text-white">
                              {t.article}
                            </span>
                          </div>
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link href={`/articles/${encodeURIComponent(String(slug))}`} className="block">
                            <h3 className="font-bold text-base sm:text-lg text-gray-900 dark:text-white truncate">{title}</h3>
                            
                            {/* Article Date - Now prominently displayed */}
                            {articleDate && (
                              <div className="flex items-center text-sm font-medium text-purple-600 dark:text-purple-400 mt-2 mb-3 bg-purple-50 dark:bg-purple-900/20 px-3 py-2 rounded-lg">
                                <FaCalendarAlt className="h-4 w-4 ml-2" />
                                <span>{articleDate}</span>
                              </div>
                            )}
                            
                            {art.excerpt && (
                              <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 line-clamp-1">
                                {getLocalizedText(art.excerpt, art.excerptEn, language)}
                              </p>
                            )}
                          </Link>
                          
                          {/* Favorite Button moved here */}
                          <div className="mt-3">
                            <FavoriteButton contentId={art._id} contentType="article" />
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              )}
            </>
          )}
        </AnimatePresence>
      </div>
      
      {/* Filter Modal for Mobile */}
      <AnimatePresence>
        {showFilterModal && (
          <motion.div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowFilterModal(false)}
          >
            <motion.div
              className="bg-white dark:bg-gray-800 w-full rounded-t-2xl p-6 max-h-[70vh] overflow-y-auto"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100">{t.filter}</h3>
                <button
                  onClick={() => setShowFilterModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                >
                  <FaTimes className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
              
              {/* View mode toggle */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">View Mode</h4>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => {
                      setViewMode("grid");
                      setShowFilterModal(false);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg transition ${
                      viewMode === "grid" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <FaTh className={`h-6 w-6 mb-2 ${viewMode === "grid" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                    <span>{t.gridView}</span>
                  </button>
                  <button
                    onClick={() => {
                      setViewMode("list");
                      setShowFilterModal(false);
                    }}
                    className={`flex flex-col items-center justify-center p-4 rounded-lg transition ${
                      viewMode === "list" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-600"
                    }`}
                  >
                    <FaList className={`h-6 w-6 mb-2 ${viewMode === "list" ? "text-white" : "text-gray-500 dark:text-gray-400"}`} />
                    <span>{t.listView}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        @keyframes fade-in-up {
          from { 
            opacity: 0;
            transform: translateY(20px);
          }
          to { 
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .animate-fade-in {
          animation: fade-in 0.6s ease-out forwards;
        }
        
        .animate-fade-in-up {
          animation: fade-in-up 0.5s ease-out forwards;
          opacity: 0;
        }
        
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
}