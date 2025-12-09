"use client";
import React, { useEffect, useState, useRef, useCallback, JSX } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, useScroll, useTransform } from "framer-motion";
import { useSession } from "next-auth/react";
import { Session } from "next-auth";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { useLanguage } from "@/components/Language/LanguageProvider";
import ContentRenderer from "@/components/Formats/ContentRenderer";
import Comments from "@/components/comments/Comments"; // استيراد مكون التعليقات

import { FaPlay, FaClock, FaStar, FaFileAlt, FaSync, FaHeart, FaComment } from "react-icons/fa";

// تعريف الأنواع مباشرة في الملف مع دعم اللغة
interface Season {
  _id: string;
  title?: string;
  titleEn?: string;
  slug: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
}

interface Episode {
  _id: string;
  title?: string;
  titleEn?: string;
  slug: string;
  description?: string | Block[];
  descriptionEn?: string | Block[];
  content?: string | Block[];
  contentEn?: string | Block[];
  videoUrl?: string;
  videoUrlEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  season?: Season;
  articles?: Article[];
  publishedAt?: string;
}

interface Article {
  _id: string;
  title?: string;
  titleEn?: string;
  slug: string;
  excerpt?: string;
  excerptEn?: string;
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
}

interface Block {
  _type: "block";
  style?: string;
  listItem?: string;
  level?: number;
  children?: Span[];
}

interface Span {
  text?: string;
  marks?: string[];
  _type?: "span" | "link";
  href?: string;
}

// كائن الترجمات
const translations = {
  ar: {
    loading: "جارٍ التحميل...",
    error: "حدث خطأ",
    notFound: "لم تُعثر على الحلقة",
    backToHome: "العودة إلى الرئيسية",
    newEpisode: "حلقة جديدة",
    featured: "مميز",
    share: "مشاركة",
    aboutEpisode: "نبذة عن الحلقة",
    content: "المحتوى",
    season: "الموسم",
    suggestedEpisodes: "حلقات مقترحة",
    relatedArticles: "مقالات مرتبطة",
    viewAllEpisodes: "عرض جميع الحلقات",
    clickToViewSeason: "اضغط لعرض حلقات الموسم",
    readArticle: "قراءة المقال",
    viewAllArticles: "عرض جميع المقالات",
    episode: "حلقة",
    article: "مقال",
    noTitle: "بدون عنوان",
    noSeason: "بدون موسم",
    readMore: "اقرأ المزيد...",
    // ترجمات جديدة للأزرار
    like: "إعجاب",
    liked: "تم الإعجاب",
    shareEpisode: "مشاركة الحلقة",
    interactWithEpisode: "تفاعل مع الحلقة",
    updating: "جاري التحديث...",
    favoritesCount: "عدد الإعجابات",
    // ترجمات قسم التعليقات
    comments: "التعليقات"
  },
  en: {
    loading: "Loading...",
    error: "An error occurred",
    notFound: "Episode not found",
    backToHome: "Back to Home",
    newEpisode: "New Episode",
    featured: "Featured",
    share: "Share",
    aboutEpisode: "About Episode",
    content: "Content",
    season: "Season",
    suggestedEpisodes: "Suggested Episodes",
    relatedArticles: "Related Articles",
    viewAllEpisodes: "View All Episodes",
    clickToViewSeason: "Click to view season episodes",
    readArticle: "Read Article",
    viewAllArticles: "View All Articles",
    episode: "Episode",
    article: "Article",
    noTitle: "No Title",
    noSeason: "No Season",
    readMore: "Read more...",
    // ترجمات جديدة للأزرار
    like: "Like",
    liked: "Liked",
    shareEpisode: "Share Episode",
    interactWithEpisode: "Interact with Episode",
    updating: "Updating...",
    favoritesCount: "Favorites Count",
    // ترجمات قسم التعليقات
    comments: "Comments"
  }
};

// دالة بديلة لـ getLocalizedText
function getLocalizedText(arText?: string, enText?: string, language: 'ar' | 'en' = 'ar'): string {
  if (language === 'ar') {
    return arText || enText || "";
  } else {
    return enText || arText || "";
  }
}

// دالة لتحويل روابط الفيديو إلى روابط مضمنة
function toEmbed(url: string): string {
  if (!url) return "";
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com")) {
      const v = u.searchParams.get("v");
      if (v) return `https://www.youtube.com/embed/${v}`;
    }
    if (u.hostname.includes("youtu.be")) {
      const id = u.pathname.replace("/", "");
      return `https://www.youtube.com/embed/${id}`;
    }
    return url;
  } catch {
    return url;
  }
}

// مكون FavoriteButton المحسّن
function FavoriteButton({ contentId, contentType, isFavorite, onToggle }: { 
  contentId: string; 
  contentType: "episode" | "article"; 
  isFavorite: boolean;
  onToggle: () => void;
}) {
  const { data: session } = useSession();
  const { language } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // نصوص التطبيق حسب اللغة
  const texts = {
    ar: {
      addToFavorites: "إضافة للمفضلة",
      removeFromFavorites: "إزالة من المفضلة",
      errorMessage: "حدث خطأ أثناء تحديث المفضلة. يرجى المحاولة مرة أخرى."
    },
    en: {
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
      errorMessage: "An error occurred while updating favorites. Please try again."
    }
  };

  const t = texts[language];

  useEffect(() => {
    if (session) {
      setLoading(false);
    } else {
      setLoading(false);
    }
  }, [session]);

  async function handleToggle() {
    if (!session?.user || actionLoading) return;
    
    setActionLoading(true);
    
    try {
      const method = isFavorite ? "DELETE" : "POST";
      const response = await fetch(`/api/favorites`, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          contentId,
          contentType,
        }),
      });

      if (response.ok) {
        onToggle();
      } else {
        const errorData = await response.json();
        console.error("Error toggling favorite:", errorData);
        alert(t.errorMessage);
      }
    } catch (error) {
      console.error("Error toggling favorite:", error);
      alert(t.errorMessage);
    } finally {
      setActionLoading(false);
    }
  }

  if (loading) return null;

  return (
    <button
      onClick={handleToggle}
      disabled={actionLoading || !session?.user}
      aria-label={isFavorite ? t.removeFromFavorites : t.addToFavorites}
      className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 overflow-hidden"
    >
      {/* خلفية متدرجة */}
      <div className={`absolute inset-0 bg-gradient-to-br ${isFavorite ? 'from-red-500 to-pink-600' : 'from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800'} transition-all duration-500`}></div>
      
      {/* تأثير اللمعان */}
      <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
      
      {/* تأثير الحركة عند التفعيل */}
      {isFavorite && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-full h-full rounded-full bg-red-500/30 animate-ping"></div>
        </div>
      )}
      
      {/* الأيقونة */}
      <div className="relative z-10 flex items-center justify-center">
        {actionLoading ? (
          <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        ) : (
          <svg 
            className={`w-5 h-5 md:w-6 md:h-6 transition-all duration-300 ${isFavorite ? 'text-white' : 'text-gray-600 dark:text-gray-300'}`} 
            fill={isFavorite ? "currentColor" : "none"} 
            stroke={isFavorite ? "white" : "currentColor"}
            strokeWidth={isFavorite ? 0 : 2}
            viewBox="0 0 24 24"
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
          </svg>
        )}
      </div>
      
      {/* تأثير النبض عند التفعيل */}
      {isFavorite && (
        <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
      )}
    </button>
  );
}

// مكون الأزرار المحسّن مع عداد الإعجابات
function ActionButtons({ 
  contentId, 
  contentType, 
  title, 
  isFavorite,
  onToggleFavorite,
  favoritesCount
}: { 
  contentId: string; 
  contentType: "episode" | "article"; 
  title: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  favoritesCount: number;
}) {
  const { data: session } = useSession();
  const { language } = useLanguage();

  const handleShare = () => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      });
    } else {
      // نسخ الرابط إلى الحافظة كبديل
      navigator.clipboard.writeText(window.location.href);
      alert(language === 'ar' ? "تم نسخ الرابط إلى الحافظة" : "Link copied to clipboard");
    }
  };

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-750 dark:to-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
      {/* تأثيرات الإضاءة الخلفية */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full filter blur-3xl"></div>
      
      {/* عنوان القسم */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent flex-grow"></div>
        <h3 className="px-6 text-xl font-bold bg-gradient-to-r from-slate-700 dark:from-slate-300 to-slate-900 dark:to-slate-100 bg-clip-text text-transparent">
          {translations[language].interactWithEpisode}
        </h3>
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent flex-grow"></div>
      </div>
      
      {/* الأزرار مع العناوين */}
      <div className="relative flex flex-wrap items-center justify-center gap-6 md:gap-8">
        {/* زر الإعجاب مع العداد */}
        <div className="flex flex-col items-center gap-3">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-lg opacity-0 group-hover:opacity-40 transition-all duration-500"></div>
            <FavoriteButton 
              contentId={contentId} 
              contentType={contentType} 
              isFavorite={isFavorite}
              onToggle={onToggleFavorite}
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {isFavorite ? translations[language].liked : translations[language].like}
            </span>
            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
              <FaHeart className="w-3 h-3 text-red-500" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">
                {favoritesCount}
              </span>
            </div>
          </div>
        </div>
        
        {/* زر المشاركة */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={handleShare}
            className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden"
          >
            {/* خلفية متدرجة */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 transition-all duration-500"></div>
            
            {/* تأثير اللمعان */}
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            {/* الأيقونة */}
            <div className="relative z-10 flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
              </svg>
            </div>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {translations[language].shareEpisode}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function EpisodeDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const { data: session } = useSession();
  const t = translations[language];
  const rawSlug = params?.slug;
  const slug = Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug ?? "";
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [suggested, setSuggested] = useState<Episode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // Swiper navigation refs
  const navPrevRef = useRef<HTMLButtonElement | null>(null);
  const navNextRef = useRef<HTMLButtonElement | null>(null);
  
  // Parallax for Hero
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 100]);
  
  // دالة لتحميل البيانات
  const loadData = async () => {
    try {
      // إذا لم يكن تحديثاً تلقائياً، اعرض حالة التحميل
      if (!isUpdating) {
        setLoading(true);
      }
      setError(null);
      setEpisode(null);
      setSuggested([]);
      setArticles([]);
      
      if (!slug) {
        setError(t.error);
        setLoading(false);
        return;
      }
      
      // Fetch episode with related articles using API routes
      const episodeResponse = await fetch(`/api/episodes/${encodeURIComponent(slug)}?language=${language}`);
      if (!episodeResponse.ok) {
        throw new Error(t.notFound);
      }
      
      const episodeData = await episodeResponse.json();
      const ep = episodeData.episode;
      
      // Fetch suggested episodes
      const suggestedResponse = await fetch(`/api/episodes?language=${language}`);
      if (!suggestedResponse.ok) {
        throw new Error(t.error);
      }
      
      const suggestedData = await suggestedResponse.json();
      const allEpisodes = suggestedData.episodes || [];
      
      // Filter out current episode and limit to 20
      const suggestedEpisodes = allEpisodes
        .filter((item: Episode) => item._id !== ep._id)
        .slice(0, 20);
      
      setEpisode(ep);
      setSuggested(suggestedEpisodes);
      // Set articles from episode query (only related articles)
      setArticles(ep.articles || []);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : t.error);
      setLoading(false);
    } finally {
      setIsUpdating(false);
    }
  };

  // دالة لتحديث البيانات تلقائياً
  const autoRefresh = async () => {
    setIsUpdating(true);
    await loadData();
  };
  
  // دالة لجلب عدد الإعجابات
  const fetchFavoritesCount = useCallback(async () => {
    if (episode) {
      try {
        const response = await fetch(`/api/favorites/count?contentId=${episode._id}&contentType=episode`);
        if (response.ok) {
          const data = await response.json();
          setFavoritesCount(data.count || 0);
        }
      } catch (err) {
        console.error("Error fetching favorites count:", err);
      }
    }
  }, [episode]);
  
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
            
            // تحقق مما إذا كان التغيير يتعلق بالحلقة الحالية
            if (data.collection === 'episodes') {
              // إذا كان هناك تغيير في الحلقات، قم بتحديث الصفحة
              autoRefresh();
            } else if (data.collection === 'seasons' || data.collection === 'articles') {
              // إذا كان هناك تغيير في المواسم أو المقالات، قم بتحديث الصفحة أيضاً
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
  }, [slug, language, t.error, t.notFound]);
  
  // التحقق من حالة المفضلة
  useEffect(() => {
    if (session?.user && episode) {
      const checkFavorite = async () => {
        try {
          const response = await fetch(`/api/favorites?userId=${session.user.id}&contentId=${episode._id}&contentType=episode`);
          if (response.ok) {
            const data = await response.json();
            setIsFavorite(data.isFavorite);
          }
        } catch (error) {
          console.error("Error checking favorite status:", error);
        }
      };

      checkFavorite();
    }
  }, [session, episode]);
  
  // جلب عدد الإعجابات عند تغير الحلقة
  useEffect(() => {
    fetchFavoritesCount();
  }, [fetchFavoritesCount]);
  
  // دالة محسّنة للتعامل مع صور URL مباشرة
  const getThumbnailUrl = useCallback((thumbnailUrl?: string, thumbnailUrlEn?: string): string => {
    // تحديد الرابط بناءً على اللغة
    const url = language === 'ar' ? thumbnailUrl : thumbnailUrlEn;
    
    if (!url) return "/placeholder.png";
    
    // إذا كان الرابط نصياً، أرجعه كما هو
    if (typeof url === 'string') {
      return url;
    }
    
    // إذا لم يكن نصياً، ارجع صورة افتراضية
    return "/placeholder.png";
  }, [language]);
  
  if (loading && !isUpdating)
    return (
      <div className="container mx-auto py-8 text-center">
        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-72 w-full rounded-xl mb-4" />
        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-6 w-1/2 mx-auto rounded mb-2" />
        <div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-4 w-1/3 mx-auto rounded" />
      </div>
    );
  if (error)
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-red-500 text-xl mb-4">{error}</p>
        <button
          onClick={() => router.push("/")}
          className="text-blue-600 hover:underline"
        >
          {t.backToHome}
        </button>
      </div>
    );
  if (!episode) return <div className="p-8 text-center">{t.notFound}</div>;
  
  const title = getLocalizedText(episode.title, episode.titleEn, language) || t.noTitle;
  
  // تعديل طريقة تحويل المحتوى بناءً على اللغة
  const description = language === 'ar' 
    ? (typeof episode.description === 'string' 
        ? episode.description || ""
        : "")
    : (typeof episode.descriptionEn === 'string' 
        ? episode.descriptionEn || ""
        : "");
  
  const content = language === 'ar' 
    ? (typeof episode.content === 'string' 
        ? episode.content || ""
        : "")
    : (typeof episode.contentEn === 'string' 
        ? episode.contentEn || ""
        : "");
  
  // تحديد رابط الفيديو بناءً على اللغة
  const videoUrl = language === 'ar' ? episode.videoUrl : episode.videoUrlEn;
  const embedUrl = toEmbed(videoUrl || "");
  const season = episode.season;
  const seasonTitle = getLocalizedText(season?.title, season?.titleEn, language) || t.noSeason;
  // Fix: Provide a fallback empty string for seasonSlug to prevent undefined
  const seasonSlug = season?.slug ?? '';
  
  // تحديد رابط الصورة المصغرة بناءً على اللغة
  const thumbnailUrl = getThumbnailUrl(episode.thumbnailUrl, episode.thumbnailUrlEn);
  const seasonThumbnailUrl = getThumbnailUrl(season?.thumbnailUrl, season?.thumbnailUrlEn);
  
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
  
  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    // تحديث العداد
    if (!isFavorite) {
      setFavoritesCount(prev => prev + 1);
    } else {
      setFavoritesCount(prev => Math.max(0, prev - 1));
    }
  };
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* مؤشر التحديث التلقائي */}
      {isUpdating && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <FaSync className="h-5 w-5 animate-spin" />
          <span>{t.updating}</span>
        </div>
      )}
      
      {/* HERO */}
      <header className="relative w-full overflow-hidden shadow-2xl">
        <motion.div
          style={{ y }}
          className="relative h-[50vh] md:h-[70vh]"
        >
          <motion.div
            className="w-full h-full object-cover"
            initial={{ scale: 1.1 }}
            animate={{ scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
          >
            <Image
              src={thumbnailUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="100vw"
              priority
            />
          </motion.div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
          <div className={`absolute bottom-0 ${isRTL ? 'right-0' : 'left-0'} p-4 md:p-6 lg:p-10 text-${isRTL ? 'right' : 'left'} w-full`}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-block backdrop-blur-lg bg-black/40 rounded-2xl md:rounded-3xl px-4 md:px-8 py-4 md:py-6 shadow-2xl border border-white/10 max-w-full"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-gradient-to-r from-blue-600 to-indigo-700 rounded-full text-xs font-bold text-white shadow-lg">
                  {t.newEpisode}
                </span>
                <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold text-white shadow-lg">
                  <FaStar className="text-yellow-300" />
                  {t.featured}
                </span>
                {/* عرض عدد الإعجابات في رأس الصفحة */}
                <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs font-bold text-white shadow-lg">
                  <FaHeart className="text-white" />
                  {favoritesCount} {language === 'ar' ? 'إعجاب' : 'likes'}
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-extrabold leading-tight tracking-wide bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 bg-clip-text text-transparent animate-gradient">
                {title}
              </h1>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-base md:text-lg lg:text-2xl text-gray-200 font-medium drop-shadow-md">
                  {seasonTitle}
                </p>
                <div className="h-1 w-6 md:w-8 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"></div>
              </div>
              {episode.publishedAt && (
                <div className="mt-2 flex items-center gap-2 text-sm text-gray-300">
                  <FaClock />
                  <span>{formatDate(episode.publishedAt)}</span>
                </div>
              )}
            </motion.div>
          </div>
        </motion.div>
      </header>
      
      {/* MAIN CONTENT */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
          
          {/* VIDEO SECTION */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="mb-4 md:mb-6">
              {embedUrl ? (
                <div className="aspect-video w-full bg-black rounded-xl md:rounded-2xl overflow-hidden shadow-2xl transform transition duration-500 hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(0,0,0,0.6)] animate-fade-in">
                  <iframe
                    src={embedUrl}
                    title={title}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="relative aspect-video w-full bg-black rounded-xl md:rounded-2xl overflow-hidden shadow-2xl animate-fade-in">
                  <Image
                    src={thumbnailUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                    <motion.div 
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                    >
                      <FaPlay className="text-white text-xl md:text-2xl ml-1" />
                    </motion.div>
                  </div>
                </div>
              )}
              
              {/* ACTION BUTTONS - قسم محسّن بالأزرار الجديدة */}
              <div className="mt-6 md:mt-8">
                <ActionButtons 
                  contentId={episode._id} 
                  contentType="episode" 
                  title={title}
                  isFavorite={isFavorite}
                  onToggleFavorite={handleToggleFavorite}
                  favoritesCount={favoritesCount}
                />
              </div>
            </div>
          </motion.section>
          
          {/* DESCRIPTION SECTION */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  {t.aboutEpisode}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50/50 to-indigo-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-blue-100 dark:border-gray-700 backdrop-blur-md">
                <ContentRenderer htmlContent={description} />
              </div>
            </div>
          </motion.section>
          
          {/* CONTENT SECTION */}
          {content && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="mb-4 md:mb-6">
                <div className="flex items-center gap-3 mb-4 md:mb-6">
                  <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                    <FaPlay className="text-xs md:text-sm" />
                  </div>
                  <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-700 bg-clip-text text-transparent">
                    {t.content}
                  </h2>
                  <div className="flex-grow h-px bg-gradient-to-r from-green-200 to-transparent"></div>
                </div>
                
                <div className="bg-gradient-to-br from-green-50/50 to-teal-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-green-100 dark:border-gray-700 backdrop-blur-md">
                  <ContentRenderer htmlContent={content} />
                </div>
              </div>
            </motion.section>
          )}
          
          {/* SEASON SECTION */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
                <FaClock className="text-xs md:text-sm" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-700 bg-clip-text text-transparent">
                {t.season}
              </h2>
              <div className="flex-grow h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
            </div>
            
            <Link
              href={`/seasons/${encodeURIComponent(seasonSlug)}`}
              className="block group"
            >
              <motion.div 
                whileHover={{ y: -5 }}
                className="rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 transition-all duration-300 border border-gray-200 dark:border-gray-700"
              >
                <div className="relative h-32 md:h-40 overflow-hidden">
                  <Image
                    src={seasonThumbnailUrl}
                    alt={seasonTitle}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="100vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-start p-3 md:p-4">
                    <span className="text-white font-bold text-sm md:text-base md:text-lg">{t.viewAllEpisodes}</span>
                  </div>
                </div>
                <div className="p-4 md:p-5">
                  <h3 className="text-lg md:text-xl font-bold mb-2">{seasonTitle}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400">
                      {t.clickToViewSeason}
                    </p>
                    <div className="w-7 h-7 md:w-8 md:h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center text-white">
                      <FaPlay className="text-xs md:text-sm ml-1" />
                    </div>
                  </div>
                </div>
              </motion.div>
            </Link>
          </motion.section>
          
          {/* SUGGESTED SECTION */}
          {suggested.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-700 bg-clip-text text-transparent">
                  {t.suggestedEpisodes}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-green-200 to-transparent"></div>
              </div>
              
              <div className="relative">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  ref={navPrevRef}
                  className="hidden md:inline-flex absolute -left-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 items-center justify-center"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  ref={navNextRef}
                  className="hidden md:inline-flex absolute -right-4 top-1/2 -translate-y-1/2 z-30 w-10 h-10 md:w-12 md:h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg hover:shadow-xl transition-all duration-300 items-center justify-center"
                >
                  <svg className="w-5 h-5 md:w-6 md:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </motion.button>
                
                <Swiper
                  modules={[Navigation, Pagination, Autoplay]}
                  spaceBetween={16}
                  slidesPerView={1}
                  breakpoints={{ 
                    640: { slidesPerView: 2 }, 
                    768: { slidesPerView: 2 },
                    1024: { slidesPerView: 3 } 
                  }}
                  navigation={{
                    prevEl: navPrevRef.current,
                    nextEl: navNextRef.current,
                  }}
                  onBeforeInit={(swiper) => {
                    // Fix: Properly type check and assign navigation parameters
                    if (swiper.params.navigation && typeof swiper.params.navigation !== 'boolean') {
                      swiper.params.navigation.prevEl = navPrevRef.current;
                      swiper.params.navigation.nextEl = navNextRef.current;
                    }
                  }}
                  pagination={{
                    clickable: true,
                    el: ".custom-pagination",
                    bulletClass: "swiper-pagination-bullet-custom",
                    bulletActiveClass: "swiper-pagination-bullet-active-custom",
                  }}
                  autoplay={{ delay: 4500, disableOnInteraction: false }}
                  grabCursor
                  speed={600}
                  className="py-6 md:py-8 overflow-visible"
                >
                  {suggested.map((item, index) => {
                    const itemTitle = getLocalizedText(item.title, item.titleEn, language) || t.noTitle;
                    const itemThumbnailUrl = getThumbnailUrl(item.thumbnailUrl, item.thumbnailUrlEn);
                    
                    return (
                      <SwiperSlide key={`episode-${item._id || index}-${index}`} className="overflow-visible px-1 md:px-2">
                        <motion.div
                          whileHover={{ 
                            y: -10, 
                            scale: 1.03,
                          }}
                          transition={{ duration: 0.3 }}
                          className="h-full"
                        >
                          <Link
                            href={`/episodes/${item.slug}`}
                            className="block bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 h-full flex flex-col group border border-gray-200 dark:border-gray-700"
                          >
                            <div className="relative h-40 md:h-48 overflow-hidden flex-shrink-0">
                              <Image
                                src={itemThumbnailUrl}
                                alt={itemTitle}
                                fill
                                className="object-cover transition-transform duration-500 group-hover:scale-110"
                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                              />
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                                <motion.div 
                                  whileHover={{ scale: 1.1 }}
                                  whileTap={{ scale: 0.9 }}
                                  className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                                >
                                  <FaPlay className="text-white text-base md:text-lg ml-1" />
                                </motion.div>
                              </div>
                            </div>
                            <div className="p-4 flex-grow">
                              <h3 className="text-base md:text-lg font-bold mb-2 line-clamp-2">{itemTitle}</h3>
                              <div className="flex items-center justify-between mt-3 md:mt-4">
                                <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                                  {t.episode}
                                </span>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      </SwiperSlide>
                    );
                  })}
                </Swiper>
                
                <div className="custom-pagination flex justify-center mt-4 md:mt-6 gap-2" />
              </div>
            </motion.section>
          )}
          
          {/* RELATED ARTICLES SECTION */}
          {articles.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-teal-500 to-cyan-600 flex items-center justify-center text-white shadow-lg">
                  <FaFileAlt className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-teal-600 to-cyan-700 bg-clip-text text-transparent">
                  {t.relatedArticles}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-teal-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {articles.map((article, index) => {
                  const articleTitle = getLocalizedText(article.title, article.titleEn, language) || t.noTitle;
                  const articleExcerpt = getLocalizedText(article.excerpt, article.excerptEn, language) || t.readMore;
                  const articleThumbnailUrl = getThumbnailUrl(article.featuredImageUrl, article.featuredImageUrlEn);
                  const articleUrl = `/articles/${encodeURIComponent(article.slug)}`;
                  
                  return (
                    <motion.div
                      key={`article-${article._id || index}-${index}`}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                      <Link href={articleUrl} className="block">
                        <div className="relative h-40 md:h-48 overflow-hidden">
                          <Image
                            src={articleThumbnailUrl}
                            alt={articleTitle}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <motion.div 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"
                            >
                              <FaPlay className="text-white text-base md:text-lg ml-1" />
                            </motion.div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold mb-2">{articleTitle}</h3>
                          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                            {articleExcerpt}
                          </p>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full">
                              {t.article}
                            </span>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                router.push(articleUrl);
                              }}
                              className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                            >
                              {t.readArticle}
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
              
              <div className="mt-6 text-center">
                <Link 
                  href="/articles" 
                  className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-teal-500 to-cyan-600 text-white rounded-lg hover:opacity-90 transition-opacity"
                >
                  <span>{t.viewAllArticles}</span>
                </Link>
              </div>
            </motion.section>
          )}

          {/* COMMENTS SECTION */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-orange-500 to-red-600 flex items-center justify-center text-white shadow-lg">
                  <FaComment className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-orange-600 to-red-700 bg-clip-text text-transparent">
                  {t.comments}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-orange-200 to-transparent"></div>
              </div>
              
              <div className="mt-6 md:mt-8">
                <Comments contentId={episode._id} type="episode" />
              </div>
            </div>
          </motion.section>
        </div>
      </div>
      
      {/* Swiper custom styles */}
      <style jsx global>{`
        .swiper-pagination-bullet-custom {
          width: 10px;
          height: 10px;
          background: #cbd5e1;
          border-radius: 999px;
          opacity: 0.9;
          transition: all 0.25s ease;
        }
        .swiper-pagination-bullet-active-custom {
          width: 24px;
          height: 10px;
          border-radius: 999px;
          background: linear-gradient(90deg, #3b82f6, #6366f1);
          opacity: 1;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.6);
        }
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
        @keyframes gradient {
          0% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
          100% {
            background-position: 0% 50%;
          }
        }
        @media (prefers-color-scheme: dark) {
          .swiper-pagination-bullet-custom {
            background: #4b5563;
          }
        }
        .swiper-wrapper {
          padding: 10px 0;
        }
        .swiper-slide {
          overflow: visible !important;
          padding: 0 4px !important;
        }
        @media (min-width: 768px) {
          .swiper-slide {
            padding: 0 8px !important;
          }
        }
        .swiper-slide > div {
          overflow: visible;
          will-change: transform;
        }
        /* تأثيرات الظل المتقدمة */
        .group:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
          z-index: 10;
        }
        .dark .group:hover {
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.3), 0 4px 6px -2px rgba(0, 0, 0, 0.1);
        }
      `}</style>
    </div>
  );
}