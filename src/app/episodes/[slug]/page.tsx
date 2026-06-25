"use client";
import React, { useEffect, useState, useRef, useCallback, useMemo } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";

import { useLanguage } from "@/components/Language/LanguageProvider";
import ContentRenderer from "@/components/Formats/ContentRenderer";
import VideoPlayer from "@/components/VideoPlayer";
import CommentsClient from "@/components/comments/CommentsClient";
import { pusherClient } from "@/lib/pusher";
import { useTrackView } from "@/hooks/useTrackView";

import { 
  FaPlay, FaClock, FaComment, FaStar, FaFileAlt, FaSync, FaHeart, FaShare, FaCheck, 
  FaChevronLeft, FaChevronRight, FaBookmark, FaPlus, FaTimes, FaSpinner, FaFolderOpen 
} from "react-icons/fa";
import toast from "react-hot-toast";

// --- Types & Interfaces ---

interface Season {
  id: string; title?: string; titleEn?: string; slug: string; thumbnailUrl?: string; thumbnailUrlEn?: string;
  localizedTitle?: string; localizedThumbnailUrl?: string;
}

interface Episode {
  id: string; title?: string; titleEn?: string; slug: string; description?: string; descriptionEn?: string;
  content?: string; contentEn?: string; videoUrl?: string; videoUrlEn?: string; thumbnailUrl?: string;
  thumbnailUrlEn?: string; season?: Season | null; articles?: Article[]; publishedAt?: string | Date | null;
  featured?: boolean; localizedTitle?: string; localizedDescription?: string; localizedContent?: string;
  localizedVideoUrl?: string; localizedThumbnailUrl?: string; _count?: { comments: number };
}

interface Article {
  id: string; title?: string; titleEn?: string; slug: string; excerpt?: string; excerptEn?: string;
  featuredImageUrl?: string; featuredImageUrlEn?: string; localizedTitle?: string; localizedExcerpt?: string;
  localizedFeaturedImageUrl?: string;
}

// Fix: Defined specific type for playlist items
interface Playlist {
  id: string; slug: string; title?: string; titleEn?: string; 
  episodes?: (string | { id: string })[]; 
  userId?: string;
}

// --- Constants & Helpers ---

const translations = {
  ar: {
    loading: "جارٍ التحميل...", error: "حدث خطأ", notFound: "لم تُعثر على الحلقة", backToHome: "العودة إلى الرئيسية",
    newEpisode: "حلقة جديدة", featured: "مميز", share: "مشاركة", aboutEpisode: "نبذة عن الحلقة", content: "المحتوى",
    season: "الموسم", suggestedEpisodes: "حلقات مقترحة", relatedArticles: "مقالات مرتبطة", comments: "التعليقات",
    viewAllEpisodes: "عرض جميع الحلقات", clickToViewSeason: "اضغط لعرض حلقات الموسم", readArticle: "قراءة المقال",
    viewAllArticles: "عرض جميع المقالات", episode: "حلقة", article: "مقال", noTitle: "بدون عنوان", noSeason: "بدون موسم",
    readMore: "اقرأ المزيد...", like: "إعجاب", liked: "تم الإعجاب", shareEpisode: "مشاركة الحلقة",
    commentEpisode: "تعليق على الحلقة", interactWithEpisode: "تفاعل مع الحلقة", updating: "جاري التحديث...",
    copyLink: "تم نسخ الرابط!", loadFailed: "فشل التحميل", videoNotAvailable: "الفيديو غير متاح حالياً",
    saveToPlaylist: "حفظ في قائمة", savedSuccess: "تمت الإضافة للقائمة", alreadyInPlaylist: "العنصر موجود بالفعل",
    loginToAdd: "سجل دخولك للحفظ", selectPlaylist: "اختر قائمة", createNewPlaylist: "إنشاء قائمة جديدة",
    playlistName: "اسم القائمة", create: "إنشاء", myPlaylists: "قوائمي", noPlaylistsYet: "لا توجد قوائم بعد",
    errorSaving: "حدث خطأ أثناء الحفظ"
  },
  en: {
    loading: "Loading...", error: "An error occurred", notFound: "Episode not found", backToHome: "Back to Home",
    newEpisode: "New Episode", featured: "Featured", share: "Share", aboutEpisode: "About Episode", content: "Content",
    season: "Season", suggestedEpisodes: "Suggested Episodes", relatedArticles: "Related Articles", comments: "Comments",
    viewAllEpisodes: "View All Episodes", clickToViewSeason: "Click to view season episodes", readArticle: "Read Article",
    viewAllArticles: "View All Articles", episode: "Episode", article: "Article", noTitle: "No Title", noSeason: "No Season",
    readMore: "Read more...", like: "Like", liked: "Liked", shareEpisode: "Share Episode",
    commentEpisode: "Comment on Episode", interactWithEpisode: "Interact with Episode", updating: "Updating...",
    copyLink: "Link Copied!", loadFailed: "Failed to load", videoNotAvailable: "Video not available",
    saveToPlaylist: "Save to List", savedSuccess: "Added to playlist", alreadyInPlaylist: "Already in playlist",
    loginToAdd: "Login to save", selectPlaylist: "Select Playlist", createNewPlaylist: "Create New Playlist",
    playlistName: "Playlist Name", create: "Create", myPlaylists: "My Playlists", noPlaylistsYet: "No playlists yet",
    errorSaving: "Error saving"
  }
};

const getLocalizedText = (arText?: string, enText?: string, language: 'ar' | 'en' = 'ar'): string => {
  return language === 'ar' ? (arText || enText || "") : (enText || arText || "");
};



// --- Custom Hooks ---

function useFavorites(contentId: string | undefined, contentType: "episode" | "article") {
  const { data: session } = useSession();
  const [isFavorite, setIsFavorite] = useState(false);
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!contentId) return;
    fetch(`/api/favorites/count?contentId=${contentId}&contentType=${contentType}`)
      .then(res => res.ok ? res.json() : null)
      .then(data => data && setCount(data.count || 0))
      .catch(console.error);

    if (session?.user) {
      fetch(`/api/favorites?userId=${session.user.id}&contentId=${contentId}&contentType=${contentType}`)
        .then(res => res.ok ? res.json() : null)
        .then(data => data && setIsFavorite(data.isFavorite))
        .catch(console.error);
    }
  }, [contentId, contentType, session]);

  const toggleFavorite = useCallback(async () => {
    if (!session?.user || !contentId) return;
    const originalIsFavorite = isFavorite;
    const originalCount = count;
    setIsFavorite(!originalIsFavorite);
    setCount(prev => originalIsFavorite ? Math.max(0, prev - 1) : prev + 1);
    try {
      const method = originalIsFavorite ? "DELETE" : "POST";
      const res = await fetch(`/api/favorites`, {
        method, headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: session.user.id, contentId, contentType })
      });
      if (!res.ok) throw new Error("Failed");
    } catch (error) {
      setIsFavorite(originalIsFavorite);
      setCount(originalCount);
    }
  }, [session, contentId, contentType, isFavorite, count]);

  return { isFavorite, count, toggleFavorite };
}

// --- Sub-Components ---

const Toast = ({ message, show }: { message: string; show: boolean }) => (
  <AnimatePresence>
    {show && (
      <motion.div initial={{ opacity: 0, y: 50, x: "-50%" }} animate={{ opacity: 1, y: 0, x: "-50%" }} exit={{ opacity: 0, y: 50, x: "-50%" }} className="fixed bottom-5 left-1/2 bg-gray-900 text-white px-6 py-3 rounded-full shadow-lg z-50 flex items-center gap-2">
        <FaCheck className="text-green-400" /> {message}
      </motion.div>
    )}
  </AnimatePresence>
);

const SectionTitle = ({ title, icon: Icon, gradient }: { title: string; icon: React.ElementType; gradient: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${gradient} flex items-center justify-center text-white shadow-lg ring-2 ring-white/10`}>
      <Icon className="text-sm" />
    </div>
    <h2 className="text-2xl font-bold bg-gradient-to-r from-gray-800 dark:from-white to-gray-500 dark:to-gray-300 bg-clip-text text-transparent">
      {title}
    </h2>
    <div className="flex-grow h-px bg-gradient-to-r from-gray-200 dark:from-gray-700 to-transparent"></div>
  </div>
);

const EpisodeCard = ({ episode, t }: { episode: Episode; t: typeof translations.ar }) => (
  <motion.div whileHover={{ y: -5 }} className="h-full">
    <Link href={`/episodes/${episode.slug}`} className="block h-full rounded-2xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 group bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700">
      <div className="relative h-44 overflow-hidden">
        <Image src={episode.localizedThumbnailUrl || "/placeholder.png"} alt={episode.localizedTitle || t.noTitle} fill className="object-cover group-hover:scale-110 transition-transform duration-500" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
            <FaPlay className="text-white text-lg ml-1" />
          </div>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 line-clamp-2 dark:text-white">{episode.localizedTitle || t.noTitle}</h3>
        <span className="text-xs px-3 py-1 bg-blue-100 dark:bg-blue-900/50 text-blue-600 dark:text-blue-300 rounded-full">{t.episode}</span>
      </div>
    </Link>
  </motion.div>
);

const ArticleCard = ({ article, t }: { article: Article; t: typeof translations.ar }) => (
  <motion.div whileHover={{ scale: 1.02 }} className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-lg border border-gray-100 dark:border-gray-700">
    <Link href={`/articles/${article.slug}`}>
      <div className="relative h-40 overflow-hidden">
        <Image src={article.localizedFeaturedImageUrl || "/placeholder.png"} alt={article.localizedTitle || t.noTitle} fill className="object-cover hover:scale-105 transition-transform duration-500" />
      </div>
      <div className="p-4">
        <h3 className="font-bold text-lg mb-2 dark:text-white">{article.localizedTitle || t.noTitle}</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{article.localizedExcerpt || t.readMore}</p>
        <div className="flex justify-between items-center">
          <span className="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/50 text-green-600 dark:text-green-300 rounded-full">{t.article}</span>
          <span className="text-sm text-blue-500 hover:underline">{t.readArticle}</span>
        </div>
      </div>
    </Link>
  </motion.div>
);

const LoadingSkeleton = () => (
  <div className="animate-pulse space-y-8 p-4">
    <div className="w-full h-80 bg-gray-300 dark:bg-gray-700 rounded-3xl" />
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl col-span-1" />
      <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded-xl col-span-2" />
    </div>
  </div>
);

// --- Main Component ---

export default function EpisodeDetailPageClient() {
  const params = useParams();
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  
  const slug = useMemo(() => (Array.isArray(params?.slug) ? params.slug.join("/") : params?.slug ?? ""), [params]);
  
  const [episode, setEpisode] = useState<Episode | null>(null);
  const [suggested, setSuggested] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [showToast, setShowToast] = useState(false);
  
  // Playlist State
  const [isPlaylistModalOpen, setIsPlaylistModalOpen] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<Playlist[]>([]);
  const [loadingPlaylists, setLoadingPlaylists] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const navPrevRef = useRef<HTMLButtonElement>(null);
  const navNextRef = useRef<HTMLButtonElement>(null);

  const { data: session } = useSession();
  const { isFavorite, count: favoritesCount, toggleFavorite } = useFavorites(episode?.id, "episode");
  useTrackView(episode?.id || '', 'EPISODE', episode?.slug, episode?.localizedTitle);

  // --- Data Fetching ---

  const loadData = useCallback(async (isUpdate = false) => {
    if (!slug) return;
    if (isUpdate) setIsUpdating(true); else setLoading(true);
    
    try {
      const epRes = await fetch(`/api/episodes/${encodeURIComponent(slug)}?language=${language}`);
      if (!epRes.ok) throw new Error(t.notFound);
      const epData = await epRes.json();
      
      const mappedEp: Episode = {
        ...epData.episode,
        localizedTitle: getLocalizedText(epData.episode.title, epData.episode.titleEn, language),
        localizedDescription: getLocalizedText(epData.episode.description, epData.episode.descriptionEn, language),
        localizedContent: getLocalizedText(epData.episode.content, epData.episode.contentEn, language),
        localizedVideoUrl: getLocalizedText(epData.episode.videoUrl, epData.episode.videoUrlEn, language),
        localizedThumbnailUrl: getLocalizedText(epData.episode.thumbnailUrl, epData.episode.thumbnailUrlEn, language),
        season: epData.episode.season ? {
          ...epData.episode.season,
          localizedTitle: getLocalizedText(epData.episode.season.title, epData.episode.season.titleEn, language),
          localizedThumbnailUrl: getLocalizedText(epData.episode.season.thumbnailUrl, epData.episode.season.thumbnailUrlEn, language),
        } : null,
        articles: (epData.episode.articles || []).map((a: Article) => ({
          ...a,
          localizedTitle: getLocalizedText(a.title, a.titleEn, language),
          localizedExcerpt: getLocalizedText(a.excerpt, a.excerptEn, language),
          localizedFeaturedImageUrl: getLocalizedText(a.featuredImageUrl, a.featuredImageUrlEn, language),
        })),
        _count: epData.episode._count || { comments: 0 }
      };

      setEpisode(mappedEp);

      const suggRes = await fetch(`/api/episodes?language=${language}`);
      const suggData = await suggRes.json();
      const filteredSuggested = (suggData.episodes || [])
        .filter((item: Episode) => item.id !== mappedEp.id)
        .slice(0, 10)
        .map((item: Episode) => ({
          ...item,
          localizedTitle: getLocalizedText(item.title, item.titleEn, language),
          localizedThumbnailUrl: getLocalizedText(item.thumbnailUrl, item.thumbnailUrlEn, language),
        }));
      
      setSuggested(filteredSuggested);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.error);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [slug, language, t.error, t.notFound]);

  useEffect(() => { loadData(); }, [loadData]);

  // --- Playlist Logic ---

  const fetchUserPlaylists = useCallback(async () => {
    if (!session?.user) return;
    setLoadingPlaylists(true);
    try {
        const res = await fetch('/api/playlists');
        const data = await res.json();
        if (res.ok) {
            setUserPlaylists(data.playlists.filter((p: Playlist) => p.userId === session.user.id));
        }
    } catch (err) {
        console.error("Failed to fetch playlists", err);
    } finally {
        setLoadingPlaylists(false);
    }
  }, [session]);

  const handleOpenPlaylistModal = () => {
    if (!session?.user) {
        toast.error(t.loginToAdd);
        return;
    }
    setIsPlaylistModalOpen(true);
    fetchUserPlaylists();
  };

  const handleSaveToPlaylist = async (playlistId: string) => {
    if (!episode || isSaving) return;
    setIsSaving(true);
    
    try {
        const targetPlaylist = userPlaylists.find(p => p.id === playlistId);
        if (!targetPlaylist) throw new Error("Playlist not found");

        // Fix: Use defined type instead of any
        const currentItems = targetPlaylist.episodes || [];
        const currentIds = currentItems.map((item) => typeof item === 'string' ? item : item.id);
        
        if (currentIds.includes(episode.id)) {
            toast(t.alreadyInPlaylist);
            setIsSaving(false);
            return;
        }

        const res = await fetch(`/api/playlists/${targetPlaylist.slug}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                episodes: [...currentIds, episode.id]
            })
        });

        if (res.ok) {
            toast.success(t.savedSuccess);
            setIsPlaylistModalOpen(false);
            setUserPlaylists(prev => prev.map(p => {
                if (p.id === playlistId) {
                    return { ...p, episodes: [...(p.episodes || []), episode.id] };
                }
                return p;
            }));
        } else {
            toast.error(t.errorSaving);
        }
    } catch (err) {
        console.error(err);
        toast.error(t.errorSaving);
    } finally {
        setIsSaving(false);
    }
  };

  const handleCreateAndSave = async () => {
    if (!episode || !newPlaylistName || isSaving) return;
    setIsSaving(true);

    try {
        const res = await fetch('/api/playlists', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title: newPlaylistName,
                titleEn: newPlaylistName,
                episodes: [episode.id],
                isPublic: false
            })
        });

        if (res.ok) {
            toast.success(t.savedSuccess);
            setIsPlaylistModalOpen(false);
            setNewPlaylistName("");
        } else {
            toast.error(t.errorSaving);
        }
    } catch (err) {
        toast.error(t.errorSaving);
    } finally {
        setIsSaving(false);
    }
  };

  // --- Effects ---

  useEffect(() => {
    if (!episode?.id) return;
    const channel = pusherClient.subscribe(`episode-${episode.id}`);
    channel.bind('episode-updated', () => loadData(true));
    channel.bind('new-comment', () => {
        setEpisode(prev => prev ? { ...prev, _count: { ...prev._count, comments: (prev._count?.comments || 0) + 1 } } : null);
    });
    return () => { channel.unbind_all(); channel.unsubscribe(); };
  }, [episode?.id, loadData]);

  // --- Handlers ---

  const handleShare = useCallback(() => {
    if (navigator.share) {
      navigator.share({ title: episode?.localizedTitle, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 2000);
    }
  }, [episode?.localizedTitle]);

  const scrollToComments = () => document.getElementById('comments-section')?.scrollIntoView({ behavior: 'smooth' });

  const formattedDate = useMemo(() => {
    if (!episode?.publishedAt) return "";
    return new Date(episode.publishedAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  }, [episode?.publishedAt, language]);

  if (loading) return <LoadingSkeleton />;
  if (error) return (
    <div className="container mx-auto py-20 text-center">
      <p className="text-red-500 text-xl mb-4">{error}</p>
      <button onClick={() => router.push("/")} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">{t.backToHome}</button>
    </div>
  );
  if (!episode) return null;

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen" dir={isRTL ? 'rtl' : 'ltr'}>
      
      <Toast message={t.copyLink} show={showToast} />

      <AnimatePresence>
        {isUpdating && (
          <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} className="fixed top-20 right-4 z-50 bg-blue-600 text-white px-4 py-2 rounded-lg shadow-lg flex items-center gap-2">
            <FaSync className="animate-spin" /> {t.updating}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Header */}
      <header className="relative w-full h-[50vh] md:h-[60vh] overflow-hidden">
        <Image src={episode.localizedThumbnailUrl || "/placeholder.png"} alt={episode.localizedTitle || t.noTitle} fill className="object-cover" priority />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-gray-900/50 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6 md:p-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-4xl">
            <div className="flex gap-2 mb-4">
              <span className="px-3 py-1 text-xs font-bold bg-blue-600 text-white rounded-full">{t.newEpisode}</span>
              {episode.featured && <span className="px-3 py-1 text-xs font-bold bg-purple-600 text-white rounded-full flex items-center gap-1"><FaStar size={10} /> {t.featured}</span>}
            </div>
            <h1 className="text-3xl md:text-5xl font-extrabold mb-3 text-white drop-shadow-lg">{episode.localizedTitle || t.noTitle}</h1>
            <div className="flex items-center gap-4 text-gray-200">
              <span className="text-lg font-medium">{episode.season?.localizedTitle || t.noSeason}</span>
              {episode.publishedAt && <span className="flex items-center gap-1 text-sm opacity-80"><FaClock /> {formattedDate}</span>}
            </div>
          </motion.div>
        </div>
      </header>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-8 -mt-10 relative z-10">
        
        <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white dark:bg-gray-800/90 rounded-3xl shadow-2xl p-4 md:p-6 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
          <VideoPlayer videoUrl={episode.localizedVideoUrl || ""} title={episode.localizedTitle} thumbnailUrl={episode.localizedThumbnailUrl} />

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-8">
             {/* Like Button */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={toggleFavorite} className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-lg ring-1 ring-white/10 ${isFavorite ? 'bg-red-500 text-white scale-110 shadow-red-500/30' : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 hover:scale-105'}`}>
                <FaHeart size={20} />
              </button>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400"><FaHeart className="text-red-400" size={10} /> {favoritesCount}</div>
            </div>
            
            {/* Save to Playlist Button */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={handleOpenPlaylistModal} className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-blue-100 dark:hover:bg-blue-900/50 hover:text-blue-600 flex items-center justify-center shadow-lg transition-all hover:scale-105 ring-1 ring-white/10">
                <FaBookmark size={20} />
              </button>
              <span className="text-xs text-gray-500">{t.saveToPlaylist}</span>
            </div>

            {/* Share Button */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={handleShare} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white flex items-center justify-center shadow-lg shadow-blue-500/20 transition-all hover:scale-105">
                <FaShare size={20} />
              </button>
              <span className="text-xs text-gray-500">{t.share}</span>
            </div>

            {/* Comment Button */}
            <div className="flex flex-col items-center gap-1">
              <button onClick={scrollToComments} className="w-14 h-14 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white flex items-center justify-center shadow-lg shadow-amber-500/20 transition-all hover:scale-105">
                <FaComment size={20} />
              </button>
              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">{episode._count?.comments || 0}</div>
            </div>
          </div>
        </motion.section>

        {/* About & Content Sections ... (Keep existing code) ... */}
        {episode.localizedDescription && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white dark:bg-gray-800/90 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
            <SectionTitle title={t.aboutEpisode} icon={FaPlay} gradient="from-blue-500 to-indigo-600" />
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"><ContentRenderer htmlContent={episode.localizedDescription} /></div>
          </motion.section>
        )}

        {episode.localizedContent && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white dark:bg-gray-800/90 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
            <SectionTitle title={t.content} icon={FaFileAlt} gradient="from-green-500 to-teal-600" />
            <div className="prose dark:prose-invert max-w-none text-gray-700 dark:text-gray-300 leading-relaxed"><ContentRenderer htmlContent={episode.localizedContent} /></div>
          </motion.section>
        )}

        {episode.season && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white dark:bg-gray-800/90 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
            <SectionTitle title={t.season} icon={FaClock} gradient="from-purple-500 to-pink-600" />
            <Link href={`/seasons/${episode.season.slug}`} className="block group">
              <div className="relative h-44 rounded-2xl overflow-hidden shadow-lg">
                <Image src={episode.season.localizedThumbnailUrl || "/placeholder.png"} alt={episode.season.localizedTitle || t.noSeason} fill className="object-cover group-hover:scale-105 transition-transform duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent group-hover:from-black/80 transition-colors flex items-end p-6">
                  <h3 className="text-white text-2xl font-bold drop-shadow-lg">{episode.season.localizedTitle}</h3>
                </div>
              </div>
            </Link>
          </motion.section>
        )}

        {suggested.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="py-4">
            <SectionTitle title={t.suggestedEpisodes} icon={FaPlay} gradient="from-cyan-500 to-blue-600" />
            <div className="relative">
              <button ref={navPrevRef} className="absolute left-0 top-1/2 -translate-y-1/2 z-10 -ml-4 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <FaChevronLeft className="text-gray-600 dark:text-gray-300" />
              </button>
              <button ref={navNextRef} className="absolute right-0 top-1/2 -translate-y-1/2 z-10 -mr-4 w-10 h-10 rounded-full bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <FaChevronRight className="text-gray-600 dark:text-gray-300" />
              </button>
              <Swiper modules={[Navigation]} spaceBetween={16} slidesPerView={1} breakpoints={{ 640: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } }} navigation={{ prevEl: navPrevRef.current, nextEl: navNextRef.current }} onBeforeInit={(swiper) => {
                 // @ts-expect-error Swiper expects HTMLElement but RefObject works fine at runtime
                 swiper.params.navigation.prevEl = navPrevRef.current;
                 // @ts-expect-error Swiper expects HTMLElement but RefObject works fine at runtime
                 swiper.params.navigation.nextEl = navNextRef.current;
              }}>
                {suggested.map((item) => (<SwiperSlide key={item.id}><EpisodeCard episode={item} t={t} /></SwiperSlide>))}
              </Swiper>
            </div>
          </motion.section>
        )}

        {episode.articles && episode.articles.length > 0 && (
          <motion.section initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-white dark:bg-gray-800/90 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
            <SectionTitle title={t.relatedArticles} icon={FaFileAlt} gradient="from-teal-500 to-green-600" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {episode.articles.map((article) => (<ArticleCard key={article.id} article={article} t={t} />))}
            </div>
          </motion.section>
        )}

        <motion.section id="comments-section" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }} className="bg-white dark:bg-gray-800/90 rounded-3xl shadow-xl p-6 md:p-8 border border-gray-100 dark:border-gray-700/50 backdrop-blur-sm">
          <SectionTitle title={t.comments} icon={FaComment} gradient="from-yellow-500 to-orange-600" />
          <CommentsClient contentId={episode.id} type="episode" />
        </motion.section>

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
    </div>
  );
}