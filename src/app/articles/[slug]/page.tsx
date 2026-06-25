"use client";
import React, { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { motion, useScroll, useTransform, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Image from 'next/image';
import { useLanguage } from '@/components/Language/LanguageProvider';
import FavoriteButton from '@/components/Favorites/FavoriteButton';
import CommentsClient from '@/components/comments/CommentsClient';
import ContentRenderer from '@/components/Formats/ContentRenderer';
import { useTrackView } from '@/hooks/useTrackView';
import toast from 'react-hot-toast';
import { 
  FaPlay, 
  FaFolder, 
  FaVideo,
  FaComment,
  FaSync,
  FaHeart,
  FaBookmark,
  FaPlus,
  FaTimes,
  FaSpinner,
  FaFolderOpen
} from 'react-icons/fa';

// --- Type Definitions ---

// Fix: Define a flexible item type instead of using 'any'
type FlexibleItem = string | { id: string };

interface Playlist {
  id: string; slug: string; title?: string; titleEn?: string;
  // Fix: Use the flexible type for articles array
  articles?: FlexibleItem[]; 
  userId?: string;
}

interface Comment {
  id: string;
  name: string;
  email: string;
  comment: string;
  createdAt: string;
  parentId?: string;
  replies?: Comment[];
}

interface Article {
  id: string;
  title: string;
  titleEn?: string;
  excerpt?: string;
  excerptEn?: string;
  content?: string;
  contentEn?: string;
  publishedAt?: string | Date | null;
  slug: string;
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  episode?: { 
    id: string; 
    title: string;
    titleEn?: string;
    slug: string;
    thumbnailUrl?: string;
    thumbnailUrlEn?: string;
  } | null;
  season?: {
    id: string; 
    title: string;
    titleEn?: string;
    slug: string;
    thumbnailUrl?: string;
    thumbnailUrlEn?: string;
  } | null;
}

interface EpisodeItem {
  id: string;
  title: string;
  titleEn?: string;
  slug: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
}

interface SeasonItem {
  id: string;
  title: string;
  titleEn?: string;
  slug: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
}

// --- Translations ---

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
    updating: "جاري التحديث...",
    favoritesCount: "عدد الإعجابات",
    saveToPlaylist: "حفظ في قائمة",
    savedSuccess: "تمت الإضافة للقائمة",
    alreadyInPlaylist: "العنصر موجود بالفعل",
    loginToAdd: "سجل دخولك للحفظ",
    selectPlaylist: "اختر قائمة",
    createNewPlaylist: "إنشاء قائمة جديدة",
    playlistName: "اسم القائمة",
    create: "إنشاء",
    myPlaylists: "قوائمي",
    noPlaylistsYet: "لا توجد قوائم بعد",
    errorSaving: "حدث خطأ أثناء الحفظ"
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
    updating: "Updating...",
    favoritesCount: "Favorites Count",
    saveToPlaylist: "Save to List",
    savedSuccess: "Added to playlist",
    alreadyInPlaylist: "Already in playlist",
    loginToAdd: "Login to save",
    selectPlaylist: "Select Playlist",
    createNewPlaylist: "Create New Playlist",
    playlistName: "Playlist Name",
    create: "Create",
    myPlaylists: "My Playlists",
    noPlaylistsYet: "No playlists yet",
    errorSaving: "Error saving"
  }
};

// --- Helpers ---

function getLocalizedText(arText?: string, enText?: string, language: 'ar' | 'en' = 'ar'): string {
  return language === 'ar' ? (arText || enText || "") : (enText || arText || "");
}

// --- Components ---

function ActionButtons({ 
  contentId, 
  contentType, 
  title, 
  onCommentClick,
  isFavorite,
  onToggleFavorite,
  favoritesCount,
  onSaveClick
}: { 
  contentId: string; 
  contentType: "episode" | "article"; 
  title: string;
  onCommentClick: () => void;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  favoritesCount: number;
  onSaveClick: () => void;
}) {
  const { language } = useLanguage();
  const t = translations[language];

  const handleShare = useCallback(() => {
    if (typeof navigator !== "undefined" && navigator.share) {
      navigator.share({ title, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success(language === 'ar' ? "تم نسخ الرابط" : "Link copied");
    }
  }, [title, language]);

  return (
    <div className="relative bg-gradient-to-br from-slate-50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-750 dark:to-slate-800 rounded-3xl p-6 md:p-8 border border-slate-200/60 dark:border-slate-700/60 shadow-xl overflow-hidden">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-400/10 rounded-full filter blur-3xl"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-400/10 rounded-full filter blur-3xl"></div>
      
      <div className="relative flex items-center justify-center mb-8">
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent flex-grow"></div>
        <h3 className="px-6 text-xl font-bold bg-gradient-to-r from-slate-700 dark:from-slate-300 to-slate-900 dark:to-slate-100 bg-clip-text text-transparent">
          {t.interactWithArticle}
        </h3>
        <div className="h-px bg-gradient-to-r from-transparent via-slate-300 dark:via-slate-600 to-transparent flex-grow"></div>
      </div>
      
      <div className="relative flex flex-wrap items-center justify-center gap-6 md:gap-8">
        {/* Like Button */}
        <div className="flex flex-col items-center gap-3">
          <div className="group relative">
            <div className="absolute inset-0 bg-gradient-to-r from-red-500 to-pink-500 rounded-full blur-lg opacity-0 group-hover:opacity-40 transition-all duration-500"></div>
            <FavoriteButton contentId={contentId} contentType={contentType} isFavorite={isFavorite} onToggle={onToggleFavorite} />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{isFavorite ? t.liked : t.like}</span>
            <div className="flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 rounded-full">
              <FaHeart className="w-3 h-3 text-red-500" />
              <span className="text-sm font-medium text-red-600 dark:text-red-400">{favoritesCount}</span>
            </div>
          </div>
        </div>
        
        {/* Save to Playlist Button */}
        <div className="flex flex-col items-center gap-3">
           <button
            onClick={onSaveClick}
            className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-purple-500 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500 to-purple-600 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex items-center justify-center">
              <FaBookmark className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.saveToPlaylist}</span>
        </div>

        {/* Share Button */}
        <div className="flex flex-col items-center gap-3">
          <button onClick={handleShare} className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500 to-blue-600 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m9.032 4.026a9.001 9.001 0 01-7.432 0m9.032-4.026A9.001 9.001 0 0112 3c-4.474 0-8.268 3.12-9.032 7.326m0 0A9.001 9.001 0 0012 21c4.474 0 8.268-3.12 9.032-7.326" />
              </svg>
            </div>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.shareArticle}</span>
        </div>
        
        {/* Comment Button */}
        <div className="flex flex-col items-center gap-3">
          <button onClick={onCommentClick} className="group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-amber-600 transition-all duration-500"></div>
            <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <div className="relative z-10 flex items-center justify-center">
              <svg className="w-5 h-5 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
          </button>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{t.commentArticle}</span>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

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
  
  // Playlist State
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 400], [0, 100]);

  // --- Data Fetching ---

  const loadData = useCallback(async () => {
    try {
      if (!isUpdating) setLoading(true);
      setError(null);
      if (!slugOrId) { setError(t.error); setLoading(false); return; }
      
      const response = await fetch(`/api/articles/${slugOrId}?language=${language}`);
      if (!response.ok) throw new Error(t.notFound);
      
      const data = await response.json();
      const art = data.article;
      if (!art) throw new Error(t.notFound);
      
      let relatedEpisodes: EpisodeItem[] = [];
      if (art.episode && art.episode.id) relatedEpisodes = [{ ...art.episode, id: art.episode.id }];
      let relatedSeasons: SeasonItem[] = [];
      if (art.season && art.season.id) relatedSeasons = [{ ...art.season, id: art.season.id }];
      
      setArticle(art);
      setEpisodes(relatedEpisodes);
      setSeasons(relatedSeasons);
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
      setLoading(false);
    } finally { setIsUpdating(false); }
  }, [slugOrId, language, t.error, t.notFound, isUpdating]);

  const autoRefresh = useCallback(async () => { setIsUpdating(true); await loadData(); }, [loadData]);
  
  const fetchFavoritesCount = useCallback(async () => {
    if (article?.id) {
      try {
        const response = await fetch(`/api/favorites/count?contentId=${article.id}&contentType=article`);
        if (response.ok) { const data = await response.json(); setFavoritesCount(data.count || 0); }
      } catch (err) { console.error("Error fetching favorites count:", err); }
    }
  }, [article]);
  
  const checkFavorite = useCallback(async () => {
    if (session?.user && article?.id) {
      try {
        const response = await fetch(`/api/favorites?userId=${session.user.id}&contentId=${article.id}&contentType=article`);
        if (response.ok) { const data = await response.json(); setIsFavorite(data.isFavorite); }
      } catch (err) { console.error("Error checking favorite status:", err); }
    }
  }, [session, article]);
  
  const handleToggleFavorite = useCallback(() => {
    setIsFavorite(!isFavorite);
    setFavoritesCount(prev => !isFavorite ? prev + 1 : Math.max(0, prev - 1));
  }, [isFavorite]);

  // --- Playlist Logic ---

  const fetchUserPlaylists = useCallback(async () => {
    if (!session?.user) return;
    setLoadingPlaylists(true);
    try {
        const res = await fetch('/api/playlists');
        const data = await res.json();
        if (res.ok) setUserPlaylists(data.playlists.filter((p: Playlist) => p.userId === session.user.id));
    } catch (err) { console.error("Failed to fetch playlists", err); } 
    finally { setLoadingPlaylists(false); }
  }, [session]);

  const handleOpenPlaylistModal = () => {
    if (!session?.user) { toast.error(t.loginToAdd); return; }
    setIsPlaylistModalOpen(true);
    fetchUserPlaylists();
  };

  const handleSaveToPlaylist = async (playlistId: string) => {
    if (!article || isSaving) return;
    setIsSaving(true);
    try {
        const targetPlaylist = userPlaylists.find(p => p.id === playlistId);
        if (!targetPlaylist) throw new Error("Playlist not found");

        const currentItems = targetPlaylist.articles || [];
        // Fix: Remove 'any' and use the FlexibleItem type inference
        const currentIds = currentItems.map((item) => typeof item === 'string' ? item : item.id);
        
        if (currentIds.includes(article.id)) {
            toast(t.alreadyInPlaylist);
            setIsSaving(false);
            return;
        }

        const res = await fetch(`/api/playlists/${targetPlaylist.slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ articles: [...currentIds, article.id] })
        });

        if (res.ok) {
            toast.success(t.savedSuccess);
            setIsPlaylistModalOpen(false);
            setUserPlaylists(prev => prev.map(p => {
                if (p.id === playlistId) return { ...p, articles: [...(p.articles || []), article.id] };
                return p;
            }));
        } else { toast.error(t.errorSaving); }
    } catch (err) { toast.error(t.errorSaving); } 
    finally { setIsSaving(false); }
  };

  const handleCreateAndSave = async () => {
    if (!article || !newPlaylistName || isSaving) return;
    setIsSaving(true);
    try {
        const res = await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newPlaylistName, titleEn: newPlaylistName,
                articles: [article.id], isPublic: false
            })
        });
        if (res.ok) { toast.success(t.savedSuccess); setIsPlaylistModalOpen(false); setNewPlaylistName(""); }
        else { toast.error(t.errorSaving); }
    } catch { toast.error(t.errorSaving); } 
    finally { setIsSaving(false); }
  };
  
  // --- Effects ---

  const scrollToComments = useCallback(() => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' }), []);
  const getImageUrl = useCallback((imageUrl?: string, imageUrlEn?: string): string => (language === 'ar' ? imageUrl : imageUrlEn) || '/placeholder.png', [language]);
  const formatDate = useCallback((dateString?: string | Date | null) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [language]);
  
  const setupEventSource = useCallback(() => {
    if (eventSourceRef.current) eventSourceRef.current.close();
    if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
    eventSourceRef.current = new EventSource('/api/stream');
    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.type === 'change') {
          if (data.collection === 'articles' || data.collection === 'seasons' || data.collection === 'episodes') autoRefresh();
        }
      } catch (err) { console.error('Error parsing SSE message:', err); }
    };
    eventSourceRef.current.onerror = () => {
      if (eventSourceRef.current) eventSourceRef.current.close();
      reconnectTimeoutRef.current = setTimeout(setupEventSource, 2000);
    };
  }, [autoRefresh]);
  
  useTrackView(article?.id || '', 'ARTICLE', article?.slug, article?.title);
  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { setupEventSource(); return () => { if (eventSourceRef.current) eventSourceRef.current.close(); if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current); }; }, [setupEventSource]);
  useEffect(() => { checkFavorite(); }, [checkFavorite]);
  useEffect(() => { fetchFavoritesCount(); }, [fetchFavoritesCount]);
  
  if (loading && !isUpdating) return ( <div className="container mx-auto py-8 text-center"><div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-72 w-full rounded-xl mb-4" /><div className="animate-pulse bg-gray-300 dark:bg-gray-700 h-6 w-1/2 mx-auto rounded mb-2" /></div> );
  if (error) return ( <div className="min-h-screen flex items-center justify-center"><div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-2xl p-8 text-center"><h1 className="text-2xl font-bold mb-2">{t.notFound}</h1><p className="text-gray-600 mb-6">{t.notFoundMessage}</p><Link href="/articles" className="px-6 py-3 bg-blue-600 text-white rounded-lg">{t.viewAllArticles}</Link></div></div> );
  if (!article) return <div className="p-8 text-center">{t.noArticleFound}</div>;
  
  const title = getLocalizedText(article.title, article.titleEn, language);
  const excerpt = getLocalizedText(article.excerpt, article.excerptEn, language);
  const content = getLocalizedText(article.content, article.contentEn, language);
  const publishedAt = article.publishedAt;
  const featuredImageUrl = getImageUrl(article.featuredImageUrl, article.featuredImageUrlEn);
  
  return (
    <div className="bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      {isUpdating && ( <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3"><FaSync className="h-5 w-5 animate-spin" /><span>{t.updating}</span></div> )}
      
      {/* Header */}
      <header className="relative w-full overflow-hidden shadow-2xl">
        <motion.div style={{ y }} className="relative h-[60vh] md:h-[70vh]">
          <div className="absolute inset-0"><Image src={featuredImageUrl} alt={title} fill className="object-cover" priority onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} /></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-transparent" />
          <div className={`absolute bottom-0 ${isRTL ? 'right-0' : 'left-0'} p-4 md:p-6 lg:p-10 w-full`}>
            <motion.div initial={{ opacity: 0, y: 40 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, delay: 0.2 }} className="inline-block backdrop-blur-lg bg-black/40 rounded-2xl md:rounded-3xl px-4 md:px-8 py-4 md:py-6 shadow-2xl border border-white/10 max-w-full">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full text-xs font-bold text-white shadow-lg">{t.newArticle}</span>
                <span className="flex items-center gap-1 px-3 py-1 bg-gradient-to-r from-red-500 to-pink-500 rounded-full text-xs font-bold text-white shadow-lg"><FaHeart className="text-white" />{favoritesCount}</span>
              </div>
              <h1 className="text-2xl md:text-3xl lg:text-5xl font-extrabold leading-tight tracking-wide bg-gradient-to-r from-purple-400 via-pink-500 to-red-600 bg-clip-text text-transparent animate-gradient">{title}</h1>
              <div className="mt-3 flex items-center gap-3"><p className="text-base md:text-lg lg:text-2xl text-gray-200 font-medium drop-shadow-md">{formatDate(publishedAt)}</p></div>
            </motion.div>
          </div>
        </motion.div>
      </header>
      
      <div className="w-full px-3 sm:px-4 md:px-6 lg:px-8 py-6 md:py-8">
        <div className="max-w-6xl mx-auto">
        
          {/* Excerpt & Content */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg"><FaPlay className="text-sm" /></div><h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-700 bg-clip-text text-transparent">{t.articleExcerpt}</h2></div>
            <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-purple-100 dark:border-gray-700 backdrop-blur-md"><ContentRenderer htmlContent={excerpt} /></div>
          </motion.section>
          
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-500 to-pink-600 flex items-center justify-center text-white shadow-lg"><FaPlay className="text-sm" /></div><h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-purple-600 to-pink-700 bg-clip-text text-transparent">{t.content}</h2></div>
            <div className="bg-gradient-to-br from-purple-50/50 to-pink-50/50 dark:from-gray-700/50 dark:to-gray-800/50 rounded-xl md:rounded-2xl shadow-xl p-4 md:p-6 border border-purple-100 dark:border-gray-700 backdrop-blur-md"><ContentRenderer htmlContent={content} /></div>
          </motion.section>
          
          {/* Interactions */}
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden">
            <ActionButtons contentId={article.id} contentType="article" title={title} onCommentClick={scrollToComments} isFavorite={isFavorite} onToggleFavorite={handleToggleFavorite} favoritesCount={favoritesCount} onSaveClick={handleOpenPlaylistModal} />
          </motion.section>
          
          {/* Related Content */}
          {seasons.length > 0 && ( <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-lg"><FaFolder className="text-sm" /></div><h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-700 bg-clip-text text-transparent">{t.relatedSeason}</h2></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{seasons.map((season) => { const seasonTitle = getLocalizedText(season.title, season.titleEn, language); return (<motion.div key={season.id} whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"><Link href={`/seasons/${encodeURIComponent(season.slug)}`} className="block"><div className="relative h-40 overflow-hidden"><Image src={getImageUrl(season.thumbnailUrl, season.thumbnailUrlEn)} alt={seasonTitle} fill className="object-cover transition-transform duration-500 hover:scale-110" onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-gradient-to-r from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg"><FaPlay className="text-white text-lg ml-1" /></div></div></div><div className="p-4"><h3 className="text-lg font-bold mb-2">{seasonTitle}</h3><span className="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-200 rounded-full">{t.season}</span></div></Link></motion.div>); })}</div></motion.section> )}
          {episodes.length > 0 && ( <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 mb-6 md:mb-8 border border-gray-100 dark:border-gray-700 overflow-hidden"><div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center text-white shadow-lg"><FaVideo className="text-sm" /></div><h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-green-600 to-teal-700 bg-clip-text text-transparent">{t.relatedEpisode}</h2></div><div className="grid grid-cols-1 md:grid-cols-2 gap-4">{episodes.map((episode) => { const episodeTitle = getLocalizedText(episode.title, episode.titleEn, language); return (<motion.div key={episode.id} whileHover={{ scale: 1.02 }} className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-900 rounded-xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300"><Link href={`/episodes/${encodeURIComponent(episode.slug)}`} className="block"><div className="relative h-40 overflow-hidden"><Image src={getImageUrl(episode.thumbnailUrl, episode.thumbnailUrlEn)} alt={episodeTitle} fill className="object-cover transition-transform duration-500 hover:scale-110" onError={(e) => { e.currentTarget.src = '/placeholder.png'; }} /><div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"><div className="w-12 h-12 rounded-full bg-gradient-to-r from-green-500 to-teal-600 flex items-center justify-center shadow-lg"><FaPlay className="text-white text-lg ml-1" /></div></div></div><div className="p-4"><h3 className="text-lg font-bold mb-2">{episodeTitle}</h3><span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-800 dark:text-green-200 rounded-full">{t.episode}</span></div></Link></motion.div>); })}</div></motion.section> )}
          
          {/* Comments */}
          <motion.section id="comments-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-800 rounded-2xl md:rounded-3xl shadow-xl p-4 md:p-6 border border-gray-100 dark:border-gray-700 overflow-hidden">
            <div className="flex items-center gap-3 mb-4"><div className="w-10 h-10 rounded-full bg-gradient-to-r from-yellow-500 to-orange-600 flex items-center justify-center text-white shadow-lg"><FaComment className="text-sm" /></div><h2 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-700 bg-clip-text text-transparent">{t.comments}</h2></div>
            <CommentsClient contentId={article.id} type="article" />
          </motion.section>
        </div>
      </div>

      {/* --- Save to Playlist Modal --- */}
      <AnimatePresence>
          {isPlaylistModalOpen && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsPlaylistModalOpen(false)}>
                  <motion.div initial={{ scale: 0.9, y: 20, opacity: 0 }} animate={{ scale: 1, y: 0, opacity: 1 }} exit={{ scale: 0.9, y: 20, opacity: 0 }} onClick={(e) => e.stopPropagation()} className="bg-white dark:bg-gray-800 rounded-3xl p-6 w-full max-w-md shadow-2xl border dark:border-gray-700 max-h-[80vh] overflow-hidden flex flex-col">
                      <div className="flex justify-between items-center mb-6">
                          <h3 className="text-xl font-bold dark:text-white flex items-center gap-2"><FaBookmark className="text-blue-600" /> {t.saveToPlaylist}</h3>
                          <button onClick={() => setIsPlaylistModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition p-2 hover:bg-gray-100 rounded-full"><FaTimes /></button>
                      </div>
                      <div className="flex-1 overflow-y-auto space-y-3 mb-6 pr-2">
                          {loadingPlaylists ? <div className="flex justify-center py-8"><FaSpinner className="animate-spin text-blue-600 text-2xl" /></div> : userPlaylists.length === 0 ? <div className="text-center text-gray-500 py-8"><FaFolderOpen className="mx-auto text-4xl mb-3 opacity-50" /><p>{t.noPlaylistsYet}</p></div> : (
                              userPlaylists.map(pl => (
                                  <motion.button key={pl.id} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSaveToPlaylist(pl.id)} disabled={isSaving} className="w-full p-4 rounded-xl border dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:border-blue-300 dark:hover:border-blue-600 transition flex items-center justify-between group">
                                      <span className="font-medium text-gray-800 dark:text-white truncate">{getLocalizedText(pl.title, pl.titleEn, language)}</span>
                                      <FaPlus className="text-gray-400 group-hover:text-blue-600 transition" />
                                  </motion.button>
                              ))
                          )}
                      </div>
                      <div className="border-t dark:border-gray-700 pt-6">
                          <h4 className="text-sm font-medium text-gray-500 mb-3">{t.createNewPlaylist}</h4>
                          <div className="flex gap-2">
                              <input type="text" value={newPlaylistName} onChange={(e) => setNewPlaylistName(e.target.value)} placeholder={t.playlistName} className="flex-1 p-3 rounded-xl border dark:bg-gray-700 dark:border-gray-600 outline-none focus:ring-2 ring-blue-500 transition" />
                              <button onClick={handleCreateAndSave} disabled={!newPlaylistName || isSaving} className="px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:opacity-50 flex items-center justify-center min-w-[80px]">
                                  {isSaving ? <FaSpinner className="animate-spin" /> : t.create}
                              </button>
                          </div>
                      </div>
                  </motion.div>
              </motion.div>
          )}
      </AnimatePresence>
      
      <style jsx global>{` .animate-gradient { background-size: 200% 200%; animation: gradient 5s ease infinite; } @keyframes gradient { 0% { background-position: 0% 50%; } 50% { background-position: 100% 50%; } 100% { background-position: 0% 50%; } } `}</style>
    </div>
  );
}