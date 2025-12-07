"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useScroll, useTransform } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useLanguage } from '@/components/Language/LanguageProvider';
import FavoriteButton from '@/components/Favorites/FavoriteButton';
import CommentsClient from '@/components/comments/CommentsClient';
import ContentRenderer from '@/components/Formats/ContentRenderer';
import { 
  FaPlay, 
  FaStar, 
  FaFolder, 
  FaVideo,
  FaComment,
  FaSync,
  FaHeart
} from 'react-icons/fa';

// تعريفات الأنواع - تعديل الواجهات لتتوافق مع MongoDB
interface Comment {
  _id: string;
  name: string;
  email: string;
  comment: string;
  createdAt: string;
  parentId?: string;
  replies?: Comment[];
}

interface Article {
  _id: string;
  _type: string;
  title: string;
  titleEn?: string;
  excerpt: string;
  excerptEn?: string;
  content: string;
  contentEn?: string;
  publishedAt: string;
  slug: string;
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  episode?: {
    _id: string;
    title: string;
    titleEn?: string;
    slug: string;
    thumbnailUrl?: string;
    thumbnailUrlEn?: string;
  };
  season?: {
    _id: string;
    title: string;
    titleEn?: string;
    slug: string;
    thumbnailUrl?: string;
    thumbnailUrlEn?: string;
  };
  language?: 'ar' | 'en';
}

interface EpisodeItem {
  _id: string;
  title: string;
  titleEn?: string;
  slug: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  language?: 'ar' | 'en';
}

interface SeasonItem {
  _id: string;
  title: string;
  titleEn?: string;
  slug: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  language?: 'ar' | 'en';
}

// الترجمات
const translations = {
  ar: {
    loading: "جارٍ التحميل...",
    error: "حدث خطأ في تحميل المقال",
    notFound: "المقال غير موجود",
    notFoundMessage: "عذراً، المقال الذي تبحث عنه غير موجود أو قد تم حذفه.",
    viewAllArticles: "عرض جميع المقالات",
    backToHome: "العودة إلى الرئيسية",
    noArticleFound: "لم تُعثر على المقال.",
    articleExcerpt: "نبذة عن المقال",
    content: "المحتوى",
    relatedSeason: "الموسم المرتبط",
    relatedEpisode: "الحلقة المرتبطة",
    comments: "التعليقات",
    newArticle: "مقال جديد",
    featured: "مميز",
    favorites: "المفضلة",
    season: "موسم",
    episode: "حلقة",
    viewSeason: "عرض الموسم",
    watchEpisode: "مشاهدة الحلقة",
    commentPlaceholder: "اكتب تعليقك هنا...",
    sendComment: "أرسل التعليق",
    sending: "جاري الإرسال...",
    signInToComment: "يجب تسجيل الدخول لكي تتمكن من إرسال تعليق.",
    signIn: "تسجيل الدخول",
    writeCommentFirst: "اكتب تعليقاً قبل الإرسال.",
    signInRequired: "يجب تسجيل الدخول لإرسال تعليق.",
    noCommentsYet: "لا توجد تعليقات بعد.",
    viewDocument: "عرض المستند",
    openInGoogleDrive: "فتح في Google Drive",
    image: "صورة",
    openImage: "فتح الصورة",
    document: "مستند",
    video: "فيديو",
    publishedAt: "تاريخ النشر",
    reply: "رد",
    delete: "حذف",
    replyTo: "رد على",
    cancel: "إلغاء",
    confirmDelete: "هل أنت متأكد من حذف هذا التعليق؟",
    deleteSuccess: "تم حذف التعليق بنجاح",
    replySuccess: "تم إرسال الرد بنجاح",
    writeReply: "اكتب ردك هنا...",
    sendReply: "إرسال الرد",
    replying: "جاري الرد...",
    noReplies: "لا توجد ردود بعد",
    showReplies: "عرض الردود",
    hideReplies: "إخفاء الردود",
    like: "إعجاب",
    liked: "تم الإعجاب",
    shareArticle: "مشاركة المقال",
    commentArticle: "تعليق على المقال",
    interactWithArticle: "تفاعل مع المقال",
    code: "كود",
    copyCode: "نسخ الكود",
    copied: "تم النسخ",
    javascript: "جافا سكريبت",
    typescript: "تايب سكريبت",
    react: "رياكت",
    css: "سي إس إس",
    html: "إتش تي إم إل",
    python: "بايثون",
    java: "جافا",
    php: "بي إتش بي",
    nodejs: "نود جي إس",
    database: "قاعدة بيانات",
    server: "سيرفر",
    cloud: "سحابة",
    security: "أمان",
    tools: "أدوات",
    performance: "أداء",
    expandCode: "توسيع الكود",
    collapseCode: "طي الكود",
    viewInNewTab: "عرض في نافذة جديدة",
    updating: "جاري التحديث...",
    favoritesCount: "عدد الإعجابات"
  },
  en: {
    loading: "Loading...",
    error: "Error loading article",
    notFound: "Article not found",
    notFoundMessage: "Sorry, article you're looking for doesn't exist or may have been deleted.",
    viewAllArticles: "View all articles",
    backToHome: "Back to home",
    noArticleFound: "Article not found.",
    articleExcerpt: "Article excerpt",
    content: "Content",
    relatedSeason: "Related season",
    relatedEpisode: "Related episode",
    comments: "Comments",
    newArticle: "New article",
    featured: "Featured",
    favorites: "Favorites",
    season: "Season",
    episode: "Episode",
    viewSeason: "View season",
    watchEpisode: "Watch episode",
    commentPlaceholder: "Write your comment here...",
    sendComment: "Send comment",
    sending: "Sending...",
    signInToComment: "You must be signed in to post a comment.",
    signIn: "Sign in",
    writeCommentFirst: "Write a comment before sending.",
    signInRequired: "You must be signed in to send a comment.",
    noCommentsYet: "No comments yet.",
    viewDocument: "View document",
    openInGoogleDrive: "Open in Google Drive",
    image: "Image",
    openImage: "Open image",
    document: "Document",
    video: "Video",
    publishedAt: "Published at",
    reply: "Reply",
    delete: "Delete",
    replyTo: "Reply to",
    cancel: "Cancel",
    confirmDelete: "Are you sure you want to delete this comment?",
    deleteSuccess: "Comment deleted successfully",
    replySuccess: "Reply sent successfully",
    writeReply: "Write your reply here...",
    sendReply: "Send reply",
    replying: "Replying...",
    noReplies: "No replies yet",
    showReplies: "Show replies",
    hideReplies: "Hide replies",
    like: "Like",
    liked: "Liked",
    shareArticle: "Share Article",
    commentArticle: "Comment on Article",
    interactWithArticle: "Interact with Article",
    code: "Code",
    copyCode: "Copy Code",
    copied: "Copied",
    javascript: "JavaScript",
    typescript: "TypeScript",
    react: "React",
    css: "CSS",
    html: "HTML",
    python: "Python",
    java: "Java",
    php: "PHP",
    nodejs: "Node.js",
    database: "Database",
    server: "Server",
    cloud: "Cloud",
    security: "Security",
    tools: "Tools",
    performance: "Performance",
    expandCode: "Expand Code",
    collapseCode: "Collapse Code",
    viewInNewTab: "View in New Tab",
    updating: "Updating...",
    favoritesCount: "Favorites Count"
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

// مكون الأزرار المحسّن
function ActionButtons({ 
  contentId, 
  contentType, 
  title, 
  onCommentClick,
  isFavorite,
  onToggleFavorite,
  favoritesCount
}: { 
  contentId: string; 
  contentType: "episode" | "article"; 
  title: string;
  onCommentClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  favoritesCount: number;
}) {
  const { language } = useLanguage();

  const handleShare = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({
        title,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      alert(language === 'ar' ? "تم نسخ الرابط إلى الحافظة" : "Link copied to clipboard");
    }
  }, [title, language]);

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-750 dark:to-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
      {/* تأثيرات الإضاءة الخلفية */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full filter blur-3xl"></div>
      
      {/* عنوان القسم */}
      <div className="relative flex items-center justify-center mb-8">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent flex-grow"></div>
        <h3 className="px-6 text-xl font-bold bg-gradient-to-r from-slate-700 dark:from-slate-300 to-slate-900 dark:to-slate-100 bg-clip-text text-transparent">
          {translations[language].interactWithArticle}
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
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
              </svg>
            </div>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {translations[language].shareArticle}
          </span>
        </div>
        
        {/* زر التعليق */}
        <div className="flex flex-col items-center gap-3">
          <button
            onClick={onCommentClick}
            className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {translations[language].commentArticle}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function ArticleDetailPageClient() {
  const { language, isRTL } = useLanguage();
  const { data: session } = useSession();
  const t = translations[language];
  const params = useParams() as Record<string, string | string[]>;
  const rawSlug = params?.slug;
  const slugOrId = Array.isArray(rawSlug) ? rawSlug.join("/") : rawSlug ?? "";
  const [article, setArticle] = useState<Article | null>(null);
  const [episodes, setEpisodes] = useState<EpisodeItem[]>([]);
  const [seasons, setSeasons] = useState<SeasonItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);
  const [isUpdating, setIsUpdating] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // تأثير Parallax للقسم الرئيسي
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 100]);
  
  // دالة لتحميل البيانات
  const loadData = useCallback(async () => {
    try {
      // إذا لم يكن تحديثاً تلقائياً، اعرض حالة التحميل
      if (!isUpdating) {
        setLoading(true);
      }
      setError(null);
      
      if (!slugOrId) {
        setError(t.error);
        setLoading(false);
        return;
      }
      
      console.log("Fetching article with slug:", slugOrId, "and language:", language);
      
      const response = await fetch(`/api/articles/${slugOrId}?language=${language}`);
      
      if (!response.ok) {
        throw new Error(t.notFound);
      }
      
      const data = await response.json();
      const art = data.article;
      
      console.log("Article found:", art);
      
      if (!art) {
        console.error("Article not found for slug/ID:", slugOrId);
        throw new Error(t.notFound);
      }
      
      if (art.language && art.language !== language) {
        console.error("Article language mismatch. Expected:", language, "Got:", art.language);
        
        const alternativeResponse = await fetch(`/api/articles/${slugOrId}?language=${language === 'ar' ? 'en' : 'ar'}`);
        
        if (alternativeResponse.ok) {
          const alternativeData = await alternativeResponse.json();
          const alternativeArt = alternativeData.article;
          
          if (alternativeArt) {
            console.log("Found alternative article in different language:", alternativeArt);
            window.location.href = `/${language === 'ar' ? 'en' : 'ar'}/articles/${slugOrId}`;
            return;
          }
        }
        
        throw new Error(t.notFound);
      }
      
      let relatedEpisodes: EpisodeItem[] = [];
      if (art.episode) {
        relatedEpisodes = [art.episode];
      }
      
      let relatedSeasons: SeasonItem[] = [];
      if (art.season) {
        relatedSeasons = [art.season];
      }
      
      setArticle(art);
      setEpisodes(relatedEpisodes);
      setSeasons(relatedSeasons);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: unknown) {
      console.error("Error loading article:", e);
      setError((e as Error)?.message ?? t.error);
      setLoading(false);
    } finally {
      setIsUpdating(false);
    }
  }, [slugOrId, language, t.error, t.notFound, isUpdating]);

  // دالة لتحديث البيانات تلقائياً
  const autoRefresh = useCallback(async () => {
    setIsUpdating(true);
    await loadData();
  }, [loadData]);
  
  // دالة لجلب عدد الإعجابات
  const fetchFavoritesCount = useCallback(async () => {
    if (article) {
      try {
        const response = await fetch(`/api/favorites/count?contentId=${article._id}&contentType=article`);
        if (response.ok) {
          const data = await response.json();
          setFavoritesCount(data.count || 0);
        }
      } catch (err) {
        console.error("Error fetching favorites count:", err);
      }
    }
  }, [article]);
  
  // دالة للتحقق من حالة المفضلة
  const checkFavorite = useCallback(async () => {
    if (session?.user && article) {
      try {
        const response = await fetch(`/api/favorites?userId=${session.user.id}&contentId=${article._id}&contentType=article`);
        if (response.ok) {
          const data = await response.json();
          setIsFavorite(data.isFavorite);
        }
      } catch (err) {
        console.error("Error checking favorite status:", err);
      }
    }
  }, [session, article]);
  
  // دالة لتبديل حالة المفضلة
  const handleToggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
    // تحديث العداد
    if (!isFavorite) {
      setFavoritesCount(prev => prev + 1);
    } else {
      setFavoritesCount(prev => Math.max(0, prev - 1));
    }
  }, [isFavorite]);
  
  // دالة للتمرير إلى قسم التعليقات
  const scrollToComments = useCallback(() => {
    const commentsSection = document.getElementById('comments-section');
    if (commentsSection) {
      commentsSection.scrollIntoView({ behavior: 'smooth' });
    }
  }, []);
  
  // دالة للحصول على رابط الصورة
  const getImageUrl = useCallback((imageUrl?: string, imageUrlEn?: string): string => {
    const url = language === 'ar' ? imageUrl : imageUrlEn;
    
    if (!url) {
      console.log("No image URL provided, using placeholder");
      return '/placeholder.png';
    }
    
    console.log("Using image URL:", url);
    return url;
  }, [language]);
  
  // دالة لتنسيق التاريخ
  const formatDate = useCallback((dateString?: string) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    return date.toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }, [language]);
  
  // دالة لإعداد EventSource
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
          
          // تحقق مما إذا كان التغيير يتعلق بالمقال الحالي
          if (data.collection === 'articles') {
            // إذا كان هناك تغيير في المقالات، قم بتحديث الصفحة
            autoRefresh();
          } else if (data.collection === 'seasons' || data.collection === 'episodes') {
            // إذا كان هناك تغيير في المواسم أو الحلقات، قم بتحديث الصفحة أيضاً
            autoRefresh();
          }
        }
      } catch (err) {
        console.error('Error parsing SSE message:', err);
      }
    };
    
    eventSourceRef.current.onerror = (err) => {
      console.error('SSE connection error:', err);
      // إغلاق الاتصال الحالي
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      // إعادة الاتصال بعد فترة قصيرة
      reconnectTimeoutRef.current = setTimeout(setupEventSource, 2000);
    };
  }, [autoRefresh]);
  
  // تحميل البيانات عند تحميل المكون
  useEffect(() => {
    loadData();
  }, [loadData]);
  
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
  
  // التحقق من حالة المفضلة عند تغير الجلسة أو المقال
  useEffect(() => {
    checkFavorite();
  }, [checkFavorite]);
  
  // جلب عدد الإعجابات عند تغير المقال
  useEffect(() => {
    fetchFavoritesCount();
  }, [fetchFavoritesCount]);
  
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center">
          <div className="text-red-500 text-6xl mb-4">404</div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">{t.notFound}</h1>
          <p className="text-gray-600 dark:text-gray-300 mb-6">
            {t.notFoundMessage}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/articles"
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              {t.viewAllArticles}
            </Link>
            <Link
              href="/"
              className="px-6 py-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors font-medium"
            >
              {t.backToHome}
            </Link>
          </div>
        </div>
      </div>
    );
      
  if (!article) return <div className="p-8 text-center">{t.noArticleFound}</div>;
  
  const title = getLocalizedText(article.title, article.titleEn, language);
  const excerpt = language === 'ar' ? article.excerpt : article.excerptEn || article.excerpt;
  const content = language === 'ar' ? article.content : article.contentEn || article.content;
  const publishedAt = article.publishedAt;
  
  const featuredImageUrl = getImageUrl(article.featuredImageUrl, article.featuredImageUrlEn);
  console.log("Final featuredImageUrl:", featuredImageUrl);
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* مؤشر التحديث التلقائي */}
      {isUpdating && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <FaSync className="h-5 w-5 animate-spin" />
          <span>{t.updating}</span>
        </div>
      )}
      
      {/* القسم الرئيسي */}
      <header className="relative w-full overflow-hidden shadow-2xl">
        <motion.div
          style={{ y }}
          className="relative h-[60vh] md:h-[70vh]"
        >
          <div className="absolute inset-0">
            <Image
              src={featuredImageUrl}
              alt={title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
              priority
              onError={(e) => {
                console.error("Error loading featured image:", e);
                e.currentTarget.src = '/placeholder.png';
              }}
            />
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
          <div className={`absolute bottom-0 ${isRTL ? 'right-0' : 'left-0'} p-4 md:p-6 lg:p-10 text-${isRTL ? 'right' : 'left'} w-full`}>
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2 }}
              className="inline-block backdrop-blur-lg bg-black/40 rounded-2xl md:rounded-3xl px-4 md:px-8 py-4 md:py-6 shadow-2xl border border-white/10 max-w-full"
            >
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold text-white shadow-lg">
                  {language === 'ar' ? 'مقال جديد' : 'New article'}
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
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-extrabold leading-tight tracking-wide bg-gradient-to-r from-purple-400 via-pink-500 to-red-600 bg-clip-text text-transparent animate-gradient">
                {title}
              </h1>
              <div className="mt-3 flex items-center gap-3">
                <p className="text-base md:text-lg lg:text-2xl text-gray-200 font-medium drop-shadow-md">
                  {formatDate(publishedAt)}
                </p>
                <div className="h-1 w-6 md:w-8 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full"></div>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </header>
      
      {/* المحتوى الرئيسي */}
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
        
          {/* قسم المقدمة */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-700 bg-clip-text text-transparent">
                  {t.articleExcerpt}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
              </div>
              
              {/* التعديل هنا: استخدام ContentRenderer للنبذة */}
              <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-purple-100 dark:border-gray-700 backdrop-blur-md">
                <ContentRenderer htmlContent={excerpt} />
              </div>
            </div>
          </motion.section>
          
          {/* قسم المحتوى */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-700 bg-clip-text text-transparent">
                  {t.content}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-purple-200 to-transparent"></div>
              </div>
              
              <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-purple-100 dark:border-gray-700 backdrop-blur-md">
                <ContentRenderer htmlContent={content} />
              </div>
            </div>
          </motion.section>
          
          {/* قسم التفاعل مع المقال */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="mb-4 md:mb-6">
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <FaPlay className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  {t.interactWithArticle}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
              </div>
              
              <div className="mt-6 md:mt-8">
                <ActionButtons 
                  contentId={article._id} 
                  contentType="article" 
                  title={title}
                  onCommentClick={scrollToComments}
                  isFavorite={isFavorite}
                  onToggleFavorite={handleToggleFavorite}
                  favoritesCount={favoritesCount}
                />
              </div>
            </div>
          </motion.section>
          
          {/* قسم الموسم */}
          {seasons.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg">
                  <FaFolder className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">
                  {t.relatedSeason}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-blue-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {seasons.map((season) => {
                  const seasonTitle = getLocalizedText(season.title, season.titleEn, language);
                  const seasonImageUrl = getImageUrl(season.thumbnailUrl, season.thumbnailUrlEn);
                  console.log("Season image URL:", seasonImageUrl);
                  
                  return (
                    <motion.div
                      key={season._id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                      <Link
                        href={`/seasons/${encodeURIComponent(season.slug)}`}
                        className="block"
                      >
                        <div className="relative h-40 md:h-48 overflow-hidden">
                          <Image
                            src={seasonImageUrl}
                            alt={seasonTitle}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={(e) => {
                              console.error("Error loading season image:", e);
                              e.currentTarget.src = '/placeholder.png';
                            }}
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
                          <h3 className="text-lg font-bold mb-2">{seasonTitle}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">
                              {t.season}
                            </span>
                            <span className="text-sm text-blue-600 dark:text-blue-400 hover:underline">
                              {t.viewSeason}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}
          
          {/* قسم الحلقة */}
          {episodes.length > 0 && (
            <motion.section 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"
            >
              <div className="flex items-center gap-3 mb-4 md:mb-6">
                <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white shadow-lg">
                  <FaVideo className="text-xs md:text-sm" />
                </div>
                <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-700 bg-clip-text text-transparent">
                  {t.relatedEpisode}
                </h2>
                <div className="flex-grow h-px bg-gradient-to-r from-green-200 to-transparent"></div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {episodes.map((episode) => {
                  const episodeTitle = getLocalizedText(episode.title, episode.titleEn, language);
                  const episodeImageUrl = getImageUrl(episode.thumbnailUrl, episode.thumbnailUrlEn);
                  console.log("Episode image URL:", episodeImageUrl);
                  
                  return (
                    <motion.div
                      key={episode._id}
                      whileHover={{ scale: 1.02 }}
                      transition={{ duration: 0.3 }}
                      className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl md:rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"
                    >
                      <Link
                        href={`/episodes/${encodeURIComponent(episode.slug)}`}
                        className="block"
                      >
                        <div className="relative h-40 md:h-48 overflow-hidden">
                          <Image
                            src={episodeImageUrl}
                            alt={episodeTitle}
                            fill
                            className="object-cover transition-transform duration-500 hover:scale-110"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            onError={(e) => {
                              console.error("Error loading episode image:", e);
                              e.currentTarget.src = '/placeholder.png';
                            }}
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                            <motion.div 
                              whileHover={{ scale: 1.1 }}
                              whileTap={{ scale: 0.9 }}
                              className="w-12 h-12 md:w-14 md:h-14 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center shadow-lg"
                            >
                              <FaPlay className="text-white text-base md:text-lg ml-1" />
                            </motion.div>
                          </div>
                        </div>
                        <div className="p-4">
                          <h3 className="text-lg font-bold mb-2">{episodeTitle}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full">
                              {t.episode}
                            </span>
                            <span className="text-sm text-green-600 dark:text-green-400 hover:underline">
                              {t.watchEpisode}
                            </span>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>
            </motion.section>
          )}
          
          {/* قسم التعليقات */}
          <motion.section 
            id="comments-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 border border-gray-100 dark:border-gray-700 overflow-hidden"
          >
            <div className="flex items-center gap-3 mb-4 md:mb-6">
              <div className="w-8 h-8 md:w-10 md:h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center text-white shadow-lg">
                <FaComment className="text-xs md:text-sm" />
              </div>
              <h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-700 bg-clip-text text-transparent">
                {t.comments}
              </h2>
              <div className="flex-grow h-px bg-gradient-to-r from-yellow-200 to-transparent"></div>
            </div>
            
            <CommentsClient contentId={article._id} type="article" />
          </motion.section>
        </div>
      </div>
      
      {/* أنماط إضافية */}
      <style jsx global>{`
        .animate-gradient {
          background-size: 200% 200%;
          animation: gradient 5s ease infinite;
        }
        @keyframes gradient {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </div>
  );
}