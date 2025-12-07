"use client";
import React, { useEffect, useMemo, useState, useCallback } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { motion, AnimatePresence, PanInfo } from "framer-motion";
import { useLanguage } from "@/components/Language/LanguageProvider";
import { 
  FaTimes, 
  FaSearch, 
  FaFilter, 
  FaTh, 
  FaList, 
  FaPlay, 
  FaBookOpen, 
  FaTrashAlt,
  FaSpinner,
  FaHeart 
} from "react-icons/fa";

// Updated Episode interface with direct URL for thumbnail
interface Episode {
  _id: string;
  title?: string;
  titleEn?: string;
  slug: string;
  thumbnailUrl?: string; // Direct URL instead of Sanity image reference
  thumbnailUrlEn?: string; // English thumbnail URL
  duration?: number;
  publishedAt?: string;
  categories?: string[];
  language?: 'ar' | 'en';
}

// Updated Article interface with direct URL for featured image
interface Article {
  _id: string;
  title?: string;
  titleEn?: string;
  slug: string;
  featuredImageUrl?: string; // Direct URL instead of Sanity image reference
  featuredImageUrlEn?: string; // English featured image URL
  publishedAt?: string;
  readTime?: number;
  categories?: string[];
  language?: 'ar' | 'en';
}

// Union type for favorite items
type FavoriteItem = Episode | Article;

// New interface for structure of data from MongoDB
interface FavoriteDocument {
  _id: string;
  userId: string;
  episode?: Episode | null;
  article?: Article | null;
  createdAt: string;
  updatedAt: string;
}

// Helper function to determine if an item is an episode - FIXED VERSION
function isEpisode(item: FavoriteItem): item is Episode {
  // Check for episode-specific fields
  const episodeItem = item as Episode | Article;
  return (
    'duration' in episodeItem && episodeItem.duration !== undefined || 
    'thumbnailUrl' in episodeItem && episodeItem.thumbnailUrl !== undefined || 
    'thumbnailUrlEn' in episodeItem && episodeItem.thumbnailUrlEn !== undefined
  );
}

// Helper function to get URL for a favorite item
function getItemUrl(item: FavoriteItem): string {
  if (isEpisode(item)) {
    return `/episodes/${item.slug}`;
  } else {
    return `/articles/${item.slug}`;
  }
}

// Helper function to get image URL for a favorite item - updated for direct URLs
function getItemImageUrl(item: FavoriteItem, language: 'ar' | 'en'): string {
  if (isEpisode(item)) {
    const episode = item;
    // Try language-specific URL first, then fallback to default URL
    if (language === 'en' && episode.thumbnailUrlEn) {
      return episode.thumbnailUrlEn;
    }
    if (language === 'ar' && episode.thumbnailUrl) {
      return episode.thumbnailUrl;
    }
    // Fallback to any available URL
    if (episode.thumbnailUrl) {
      return episode.thumbnailUrl;
    }
    if (episode.thumbnailUrlEn) {
      return episode.thumbnailUrlEn;
    }
    return "/placeholder.png";
  } else {
    const article = item as Article;
    // Try language-specific URL first, then fallback to default URL
    if (language === 'en' && article.featuredImageUrlEn) {
      return article.featuredImageUrlEn;
    }
    if (language === 'ar' && article.featuredImageUrl) {
      return article.featuredImageUrl;
    }
    // Fallback to any available URL
    if (article.featuredImageUrl) {
      return article.featuredImageUrl;
    }
    if (article.featuredImageUrlEn) {
      return article.featuredImageUrlEn;
    }
    return "/placeholder.png";
  }
}

// Helper function to get additional info for a favorite item
function getItemInfo(item: FavoriteItem, language: 'ar' | 'en'): string {
  if (isEpisode(item)) {
    return item.duration ? `${Math.floor(item.duration / 60)} ${language === 'ar' ? 'دقيقة' : 'minutes'}` : language === 'ar' ? "حلقة" : "episode";
  } else {
    return (item as Article).readTime ? `${(item as Article).readTime} ${language === 'ar' ? 'دقيقة قراءة' : 'min read'}` : language === 'ar' ? "مقال" : "article";
  }
}

// Helper function to format date - modified to show numbers only
function formatDate(dateString?: string, language: 'ar' | 'en' = 'ar'): string {
  if (!dateString) return "";
  const date = new Date(dateString);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const year = date.getFullYear();
  
  if (language === 'ar') {
    return `${day}/${month}/${year}`;
  } else {
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    return `${monthNames[date.getMonth()]} ${day}, ${year}`;
  }
}

// Get unique categories from favorites
function getUniqueCategories(favorites: FavoriteItem[]): string[] {
  const categoriesSet = new Set<string>();
  
  favorites.forEach(item => {
    if (item.categories && item.categories.length > 0) {
      item.categories.forEach(cat => categoriesSet.add(cat));
    }
  });
  
  return Array.from(categoriesSet).sort();
}

// Custom Confirmation Modal Component
const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title,
  language
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title: string;
  language: 'ar' | 'en';
}) => {
  const texts = {
    ar: {
      confirmDelete: "تأكيد الحذف",
      deleteMessage: "هل أنت متأكد من أنك تريد حذف هذا العنصر من المفضلة؟",
      cancel: "إلغاء",
      confirm: "تأكيد الحذف"
    },
    en: {
      confirmDelete: "Confirm Delete",
      deleteMessage: "Are you sure you want to remove this item from favorites?",
      cancel: "Cancel",
      confirm: "Confirm Delete"
    }
  };
  
  const t = texts[language];
  
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* Modal */}
          <motion.div
            className="relative bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 max-w-md w-full p-6 z-10"
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: "spring", damping: 25, stiffness: 300 }}
          >
            {/* Decorative elements */}
            <div className="absolute -top-6 -right-6 w-12 h-12 bg-gradient-to-r from-red-500 to-red-600 rounded-full flex items-center justify-center shadow-lg">
              <FaTrashAlt className="h-6 w-6 text-white" />
            </div>
            
            <div className="text-center">
              <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                <FaTrashAlt className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{t.confirmDelete}</h3>
              <p className="text-gray-600 dark:text-gray-300 mb-1">{t.deleteMessage}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-6 truncate" title={title}>{title}</p>
              
              <div className="flex justify-center gap-4 mt-6">
                <button
                  onClick={onClose}
                  className="px-5 py-2.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                >
                  {t.cancel}
                </button>
                <button
                  onClick={onConfirm}
                  className="px-5 py-2.5 rounded-lg bg-gradient-to-r from-red-600 to-red-700 text-white font-medium hover:from-red-700 hover:to-red-800 transition-all focus:outline-none focus:ring-2 focus:ring-red-300 shadow-sm hover:shadow-md transform hover:scale-105"
                >
                  {t.confirm}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default function FavoritesPage() {
  const { data: session } = useSession();
  const { language, isRTL } = useLanguage();
  const [favorites, setFavorites] = useState<FavoriteItem[]>([]);
  const [loading, setLoading] = useState(true);
  // UI states
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [fadeIn, setFadeIn] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [showFilterModal, setShowFilterModal] = useState(false);
  // Respect user motion preferences
  const [reduceMotion, setReduceMotion] = useState(false);
  // Swipe to delete state
  const [swipedItemId, setSwipedItemId] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  // Confirmation modal state
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<{id: string, type: "episode" | "article", title: string} | null>(null);

  // Text translations based on language
  const texts = {
    ar: {
      pageTitle: "مفضلاتي",
      pageSubtitle: "كل المحتوى الذي تحبه في مكان واحد",
      savedItems: "العناصر المحفوظة",
      episodes: "حلقات",
      articles: "مقالات",
      searchPlaceholder: "ابحث في المفضلات...",
      categories: "التصنيفات",
      all: "الكل",
      episodesOnly: "الحلقات فقط",
      articlesOnly: "المقالات فقط",
      gridView: "شبكي",
      listView: "قائمة",
      allEpisodes: "جميع الحلقات",
      allArticles: "جميع المقالات",
      remove: "إزالة",
      noFavorites: "لا توجد عناصر في المفضلة",
      noMatchingFavorites: "لا توجد مفضلات تطابق البحث",
      tryDifferentKeywords: "جرب كلمات مفتاحية أخرى أو احذف عوامل التصفية.",
      addFavorites: "أضف حلقات أو مقالات إلى المفضلة للعرض هنا.",
      exploreEpisodes: "استكشف الحلقات",
      exploreArticles: "استكشف المقالات",
      loadingFavorites: "جاري تحميل المفضلات...",
      loginRequired: "تسجيل الدخول مطلوب",
      loginMessage: "يجب تسجيل الدخول لعرض المفضلات.",
      signIn: "تسجيل الدخول",
      swipeToDelete: "اسحب العنصر لليسار أو اليمين للحذف",
      clearSearch: "مسح",
      episode: "حلقة",
      article: "مقال",
      minute: "دقيقة",
      minutes: "دقائق",
      minRead: "دقيقة قراءة",
      minReads: "دقائق قراءة",
      filter: "فلتر",
      close: "إغلاق"
    },
    en: {
      pageTitle: "My Favorites",
      pageSubtitle: "All your favorite content in one place",
      savedItems: "Saved Items",
      episodes: "Episodes",
      articles: "Articles",
      searchPlaceholder: "Search in favorites...",
      categories: "Categories",
      all: "All",
      episodesOnly: "Episodes Only",
      articlesOnly: "Articles Only",
      gridView: "Grid",
      listView: "List",
      allEpisodes: "All Episodes",
      allArticles: "All Articles",
      remove: "Remove",
      noFavorites: "No items in favorites",
      noMatchingFavorites: "No favorites match your search",
      tryDifferentKeywords: "Try different keywords or remove filters.",
      addFavorites: "Add episodes or articles to favorites to display here.",
      exploreEpisodes: "Explore Episodes",
      exploreArticles: "Explore Articles",
      loadingFavorites: "Loading favorites...",
      loginRequired: "Login Required",
      loginMessage: "You need to login to view your favorites.",
      signIn: "Sign In",
      swipeToDelete: "Swipe item left or right to delete",
      clearSearch: "Clear",
      episode: "episode",
      article: "article",
      minute: "minute",
      minutes: "minutes",
      minRead: "min read",
      minReads: "mins read",
      filter: "Filter",
      close: "Close"
    }
  };
  
  const t = texts[language];

  // Prevent horizontal scrolling on page
  useEffect(() => {
    const preventHorizontalScroll = (e: TouchEvent) => {
      if (e.touches.length > 1) return;
      
      const touch = e.touches[0];
      const startX = touch.clientX;
      const startY = touch.clientY;
      
      const handleTouchMove = (moveEvent: TouchEvent) => {
        if (!moveEvent.touches.length) return;
        
        const touchMove = moveEvent.touches[0];
        const deltaX = touchMove.clientX - startX;
        const deltaY = touchMove.clientY - startY;
        
        // Prevent horizontal scroll if swipe is more horizontal than vertical
        if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 10) {
          moveEvent.preventDefault();
        }
      };
      
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      
      const handleTouchEnd = () => {
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
      
      document.addEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchstart', preventHorizontalScroll, { passive: false });
    
    return () => {
      document.removeEventListener('touchstart', preventHorizontalScroll);
    };
  }, []);

  useEffect(() => {
    // Check if mobile
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkIsMobile();
    window.addEventListener('resize', checkIsMobile);
    
    return () => window.removeEventListener('resize', checkIsMobile);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduceMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReduceMotion(e.matches);
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, []);

  // Memoize fetchFavorites function to prevent unnecessary re-renders
  const fetchFavorites = useCallback(async () => {
    if (!session?.user) return;
    
    try {
      // Fetch favorites from MongoDB API
      const response = await fetch(`/api/favorites/user/${session.user.id}`);
      
      if (response.ok) {
        const data = await response.json();
        const favoriteDocs: FavoriteDocument[] = data.favorites || [];
        
        // Extract episodes and articles from favorite documents
        const episodes: Episode[] = [];
        const articles: Article[] = [];
        
        favoriteDocs.forEach((fav) => {
          if (fav.episode) {
            episodes.push(fav.episode);
          }
          if (fav.article) {
            articles.push(fav.article);
          }
        });
        
        // Combine all episodes and articles
        const combinedFavorites = [...episodes, ...articles].sort((a, b) => {
          // Fixed: Provide fallback empty strings to prevent undefined values
          const titleA = language === 'ar' ? (a.title || '') : ((a.titleEn || a.title) || '');
          const titleB = language === 'ar' ? (b.title || '') : ((b.titleEn || b.title) || '');
          return titleA.localeCompare(titleB, language === 'ar' ? 'ar' : 'en');
        });
        
        setFavorites(combinedFavorites);
      }
    } catch (err) {
      console.error("Error fetching favorites:", err);
      setFavorites([]);
    } finally {
      setLoading(false);
    }
  }, [session, language]);

  useEffect(() => {
    if (!session?.user) {
      setLoading(false);
      return;
    }
    
    fetchFavorites();
  }, [session, fetchFavorites]);

  useEffect(() => {
    if (!loading) {
      const t = setTimeout(() => setFadeIn(true), 50);
      return () => clearTimeout(t);
    }
  }, [loading]);

  const handleRemove = useCallback(async (itemId: string, contentType: "episode" | "article") => {
    if (!session?.user) return;
    
    try {
      const response = await fetch(`/api/favorites`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: session.user.id,
          contentId: itemId,
          contentType,
        }),
      });

      if (response.ok) {
        setFavorites((prev) => prev.filter((item) => item._id !== itemId));
        setSwipedItemId(null); // Reset swiped item state
      } else {
        const errorData = await response.json();
        console.error("Error removing favorite:", errorData);
        alert(language === 'ar' ? "حدث خطأ أثناء إزالة العنصر من المفضلة. يرجى المحاولة مرة أخرى." : "An error occurred while removing item from favorites. Please try again.");
      }
    } catch (err) {
      console.error("❌ Failed to remove favorite:", err);
      alert(language === 'ar' ? "حدث خطأ أثناء إزالة العنصر من المفضلة. يرجى المحاولة مرة أخرى." : "An error occurred while removing item from favorites. Please try again.");
    }
  }, [session, language]);

  // Handle swipe gestures for list view (swipe left OR right to delete)
  const handleDragEndList = useCallback((itemId: string, contentType: "episode" | "article", title: string, info: PanInfo) => {
    const { offset, velocity } = info;
    
    // Check if swipe was to the left OR right with enough velocity or offset
    if (Math.abs(offset.x) > 80 || Math.abs(velocity.x) > 500) {
      // Show confirmation modal before deleting
      setItemToDelete({ id: itemId, type: contentType, title });
      setShowConfirmModal(true);
    } else {
      // Reset position if not swiped far enough
      setSwipedItemId(null);
    }
  }, []);

  // Handle confirmation modal actions
  const handleConfirmDelete = useCallback(() => {
    if (itemToDelete) {
      handleRemove(itemToDelete.id, itemToDelete.type);
      setItemToDelete(null);
      setShowConfirmModal(false);
    }
  }, [itemToDelete, handleRemove]);

  const handleCancelDelete = useCallback(() => {
    setSwipedItemId(null);
    setItemToDelete(null);
    setShowConfirmModal(false);
  }, []);

  const filteredFavorites = useMemo(() => {
    let result = favorites;
    
    // Filter by type (episodes or articles)
    if (selectedCategory === "episodes") {
      result = result.filter(isEpisode);
    } else if (selectedCategory === "articles") {
      result = result.filter(item => !isEpisode(item));
    } else if (selectedCategory !== "all") {
      // Filter by content category
      result = result.filter(item => 
        item.categories && item.categories.includes(selectedCategory)
      );
    }
    
    // Filter by search term
    const q = searchTerm.trim().toLowerCase();
    if (q) {
      result = result.filter((item) => {
        // Fixed: Provide fallback empty strings to prevent undefined values
        const title = language === 'ar' 
          ? (item.title || "").toString().toLowerCase()
          : ((item.titleEn || item.title) || "").toString().toLowerCase();
        return title.includes(q);
      });
    }
    
    return result;
  }, [favorites, searchTerm, selectedCategory, language]);

  // Calculate statistics
  const episodeCount = favorites.filter(isEpisode).length;
  const articleCount = favorites.length - episodeCount;
  const categories = useMemo(() => getUniqueCategories(favorites), [favorites]);

  // motion variants
  const heroVariants = {
    hidden: { opacity: 0, y: -20 },
    visible: { 
      opacity: 1, 
      y: 0, 
      transition: { 
        duration: 0.6,
        staggerChildren: 0.1
      } 
    },
  };

  const statCardVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { 
        duration: 0.5,
        type: "spring" as const,
        stiffness: 100
      } 
    },
    hover: { 
      scale: 1.05, 
      y: -5,
      transition: { 
        duration: 0.2 
      } 
    }
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.04 } },
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 8, scale: 0.995 },
    visible: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.32 } },
    hover: { scale: 1.02, y: -4, transition: { duration: 0.16 } },
    exit: { opacity: 0, y: 6, scale: 0.98, transition: { duration: 0.22 } },
  } as const;

  // Swipe to delete variants
  const swipeItemVariants = {
    hidden: { opacity: 0, x: 20 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3 } },
    exit: { opacity: 0, x: -100, transition: { duration: 0.3 } },
  };

  if (loading) return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16">
      <div className="text-center">
        <div className="inline-block animate-bounce bg-gradient-to-r from-blue-600 to-purple-600 p-4 rounded-full mb-4">
          <FaSpinner className="text-white text-3xl animate-spin" />
        </div>
        <p className="text-lg font-medium text-gray-700 dark:text-gray-200">{t.loadingFavorites}</p>
      </div>
    </div>
  );
  
  if (!session?.user) return (
    <div className="flex flex-col items-center justify-center min-h-screen p-6 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="text-center max-w-md bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl border border-gray-100 dark:border-gray-700">
        <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 p-1">
          <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
            <FaHeart className="h-10 w-10 text-blue-600 dark:text-blue-400" />
          </div>
        </div>
        <h3 className="mt-6 text-2xl font-bold text-gray-900 dark:text-gray-100">{t.loginRequired}</h3>
        <p className="mt-3 text-gray-600 dark:text-gray-300">{t.loginMessage}</p>
        <div className="mt-8">
          <Link
            href="/sign-in"
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-full shadow-sm text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition hover:scale-105"
          >
            {t.signIn}
          </Link>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 pt-16" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="container mx-auto py-4 px-4 max-w-7xl">
        {/* Back button for mobile */}
        <motion.div 
          className="mb-4 md:hidden"
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
        >
        </motion.div>
        
        {/* Enhanced Hero Section with Multiple Waves */}
        <motion.div 
          className="relative overflow-hidden bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-700 dark:from-blue-800 dark:via-purple-800 dark:to-indigo-900 text-white pt-8 pb-12 rounded-2xl mb-6"
          initial="hidden"
          animate="visible"
          variants={heroVariants}
        >
          {/* Enhanced background with more colorful elements */}
          <div className="absolute inset-0 bg-black opacity-20"></div>
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden">
            {/* Larger, more colorful gradient orbs */}
            <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-40 animate-pulse"></div>
            <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-gradient-to-r from-indigo-400 to-blue-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-30 transform -translate-x-1/2 -translate-y-1/2"></div>
            
            {/* Additional colorful elements */}
            <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse"></div>
            <div className="absolute bottom-1/3 left-1/3 w-72 h-72 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-25 animate-pulse"></div>
          </div>
          
          <div className="relative container mx-auto px-4 py-8">
            <div className="text-center">
              <motion.div 
                className="inline-flex items-center justify-center p-3 bg-white/10 backdrop-blur-sm rounded-full mb-4 shadow-lg"
                variants={heroVariants}
                whileHover={{ scale: 1.1, rotate: 5 }}
                transition={{ type: "spring", stiffness: 300 }}
              >
                <FaHeart className="h-8 w-8" />
              </motion.div>
              <motion.h1 
                className="text-3xl md:text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-blue-100"
                variants={heroVariants}
              >
                {t.pageTitle}
              </motion.h1>
              <motion.p 
                className="mt-4 max-w-2xl mx-auto text-lg text-blue-100"
                variants={heroVariants}
              >
                {t.pageSubtitle}
              </motion.p>
            </div>

            {/* Enhanced Stats Cards with colorful shadows */}
            <motion.div 
              className="mt-8 grid grid-cols-3 gap-3 md:gap-4 max-w-3xl mx-auto"
              variants={heroVariants}
            >
              <motion.div 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-white/20"
                variants={statCardVariants}
                whileHover="hover"
              >
                <div className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-blue-100 to-white bg-clip-text text-transparent">{favorites.length}</div>
                <div className="text-sm md:text-base text-blue-100">{t.savedItems}</div>
              </motion.div>
              
              <motion.div 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-white/20"
                variants={statCardVariants}
                whileHover="hover"
              >
                <div className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-purple-100 to-white bg-clip-text text-transparent">{episodeCount}</div>
                <div className="text-sm md:text-base text-blue-100">{t.episodes}</div>
              </motion.div>
              
              <motion.div 
                className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center shadow-lg border border-white/20"
                variants={statCardVariants}
                whileHover="hover"
              >
                <div className="text-2xl md:text-3xl font-bold mb-1 bg-gradient-to-r from-indigo-100 to-white bg-clip-text text-transparent">{articleCount}</div>
                <div className="text-sm md:text-base text-blue-100">{t.articles}</div>
              </motion.div>
            </motion.div>
          </div>
        </motion.div>

        {/* Search and Filters Section */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-5 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
        >
          <div className="flex flex-col gap-4">
            {/* Search Input */}
            <div className="relative">
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={t.searchPlaceholder}
                className="w-full pl-12 pr-12 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
              />
              {/* Clear button on the left */}
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
              {/* Search icon on the right */}
              <span className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500">
                <FaSearch className="h-5 w-5" />
              </span>
            </div>
            
            {/* Filter and View Controls */}
            <div className="flex items-center justify-between">
              {/* Filter button for mobile */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowFilterModal(true)}
                className="md:hidden flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg"
              >
                <FaFilter className="h-4 w-4" />
                <span>{t.filter}</span>
              </motion.button>
              
              {/* Desktop filters */}
              <div className="hidden md:flex items-center gap-3">
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 outline-none"
                >
                  <option value="all">{t.all}</option>
                  <option value="episodes">{t.episodesOnly}</option>
                  <option value="articles">{t.articlesOnly}</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              
              {/* View Mode Toggle */}
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
          
          {/* Swipe hint for mobile - only show in list view */}
          {isMobile && viewMode === "list" && (
            <div className="mt-4 text-center text-sm text-gray-500 dark:text-gray-400 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 ${isRTL ? 'mr-1' : 'ml-1'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
              </svg>
              {t.swipeToDelete}
            </div>
          )}
        </motion.div>
        
        <div className={`${fadeIn ? "opacity-100" : "opacity-0"} transition-opacity duration-500`}>
          {filteredFavorites.length === 0 ? (
            <motion.div 
              className="text-center p-8 md:p-12 bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-lg max-w-2xl mx-auto"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="mx-auto flex items-center justify-center h-16 w-16 md:h-24 md:w-24 rounded-full bg-gradient-to-r from-blue-100 to-purple-100 dark:from-blue-900/30 dark:to-purple-900/30 p-1">
                <div className="h-full w-full rounded-full bg-white dark:bg-gray-800 flex items-center justify-center">
                  <FaHeart className="h-8 w-8 md:h-12 md:w-12 text-blue-400 dark:text-blue-500" />
                </div>
              </div>
              <div className="mt-4 md:mt-6 text-lg md:text-xl font-medium text-gray-900 dark:text-gray-100">
                {searchTerm || selectedCategory !== "all" ? t.noMatchingFavorites : t.noFavorites}
              </div>
              <div className="mt-2 text-gray-500 dark:text-gray-400">
                {searchTerm || selectedCategory !== "all" 
                  ? t.tryDifferentKeywords
                  : t.addFavorites}
              </div>
              {!searchTerm && selectedCategory === "all" && (
                <div className="mt-6 md:mt-8 flex flex-wrap justify-center gap-4">
                  <Link
                    href="/episodes"
                    className="inline-flex items-center px-4 py-2 md:px-6 md:py-3 border border-transparent text-base font-medium rounded-full shadow-lg text-white bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transform transition hover:scale-105"
                  >
                    {t.exploreEpisodes}
                  </Link>
                  <Link
                    href="/articles"
                    className="inline-flex items-center px-4 py-2 md:px-6 md:py-3 border border-gray-300 dark:border-gray-600 text-base font-medium rounded-full shadow-lg text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform transition hover:scale-105"
                  >
                    {t.exploreArticles}
                  </Link>
                </div>
              )}
            </motion.div>
          ) : viewMode === "grid" ? (
            <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6" layout variants={listVariants} initial="hidden" animate="visible">
              <AnimatePresence initial={false}>
                {filteredFavorites.map((item) => {
                  const itemUrl = getItemUrl(item);
                  const thumbnailUrl = getItemImageUrl(item, language);
                  const isEpisodeItem = isEpisode(item);
                  const itemInfo = getItemInfo(item, language);
                  const itemDate = formatDate(item.publishedAt, language);
                  // Fixed: Provide fallback empty string to prevent undefined value
                  const itemTitle = language === 'ar' ? (item.title || '') : ((item.titleEn || item.title) || '');
                  
                  return (
                    <motion.div
                      key={item._id}
                      layout
                      initial={reduceMotion ? undefined : "hidden"}
                      animate={reduceMotion ? undefined : "visible"}
                      whileHover={reduceMotion ? undefined : "hover"}
                      exit={reduceMotion ? undefined : "exit"}
                      variants={cardVariants}
                      className="relative group"
                    >
                      {/* Enhanced Card with Glassmorphism and Glow Effects */}
                      <motion.div
                        className="relative overflow-hidden rounded-xl border border-gray-200/50 dark:border-gray-700/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl shadow-lg hover:shadow-xl transition-all duration-500 flex flex-col group"
                        whileHover={{ 
                          y: -5,
                          scale: 1.02,
                        }}
                        transition={{ 
                          type: "spring", 
                          stiffness: 300, 
                          damping: 20 
                        }}
                      >
                        {/* Shimmer/Gloss Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none"></div>
                        
                        <Link href={itemUrl} className="group block flex-1">
                          <div className="relative aspect-video bg-gray-100 dark:bg-gray-700 overflow-hidden rounded-t-xl">
                            <Image 
                              src={thumbnailUrl} 
                              alt={itemTitle} 
                              fill
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500">
                              <motion.div 
                                className="rounded-full bg-black/60 backdrop-blur-sm p-3 md:p-4"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                              >
                                {/* Different icon for articles vs episodes */}
                                {isEpisodeItem ? (
                                  <FaPlay className="h-6 w-6 md:h-8 md:w-8 text-white" />
                                ) : (
                                  <FaBookOpen className="h-6 w-6 md:h-8 md:w-8 text-white" />
                                )}
                              </motion.div>
                            </div>
                            
                            {/* Enhanced Type Badge */}
                            <div className="absolute top-3 right-3">
                              <motion.div 
                                className={`inline-flex items-center px-2 py-1 md:px-3 md:py-1.5 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg ${
                                  isEpisodeItem 
                                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white" 
                                    : "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                                }`}
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                {isEpisodeItem ? t.episode : t.article}
                              </motion.div>
                            </div>
                          </div>
                          <div className="p-4 md:p-6">
                            <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-gray-100 line-clamp-2 mb-3 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                              {itemTitle}
                            </h3>
                            
                            <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mt-4">
                              <div className="flex items-center gap-2">
                                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <span>{itemInfo}</span>
                              </div>
                              
                              {itemDate && (
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12 a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <span>{itemDate}</span>
                                </div>
                              )}
                            </div>
                            
                            {/* Categories */}
                            {item.categories && item.categories.length > 0 && (
                              <div className="mt-4 flex flex-wrap gap-2">
                                {item.categories.slice(0, 2).map((category) => (
                                  <motion.span 
                                    key={category} 
                                    className="inline-block px-2 py-1 md:px-3 md:py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    {category}
                                  </motion.span>
                                ))}
                                {item.categories.length > 2 && (
                                  <span className="inline-block px-2 py-1 md:px-3 md:py-1.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                    +{item.categories.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="mt-auto px-4 pb-4 pt-2 md:px-6 md:pb-6 md:pt-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400"></div>
                          <div className="flex items-center gap-2">
                            {/* Enhanced Delete Button */}
                            <motion.button
                              onClick={() => {
                                setItemToDelete({ id: item._id, type: isEpisodeItem ? "episode" : "article", title: itemTitle });
                                setShowConfirmModal(true);
                              }}
                              className="inline-flex items-center justify-center gap-2 px-3 py-2 md:px-4 md:py-2.5 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 border border-red-200 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-300"
                              aria-label={language === 'ar' ? "حذف من المفضلات" : "Remove from favorites"}
                              title={t.remove}
                              whileHover={{ scale: 1.05 }}
                              whileTap={{ scale: 0.95 }}
                            >
                              <FaTrashAlt className="h-4 w-4" />
                              <span className="hidden sm:inline text-sm font-medium">{t.remove}</span>
                            </motion.button>
                          </div>
                        </div>
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          ) : (
            <motion.div className="space-y-4 overflow-x-hidden" layout variants={listVariants} initial="hidden" animate="visible">
              <AnimatePresence initial={false}>
                {filteredFavorites.map((item) => {
                  const itemUrl = getItemUrl(item);
                  const thumbnailUrl = getItemImageUrl(item, language);
                  const isEpisodeItem = isEpisode(item);
                  const itemInfo = getItemInfo(item, language);
                  const itemDate = formatDate(item.publishedAt, language);
                  // Fixed: Provide fallback empty string to prevent undefined value
                  const itemTitle = language === 'ar' ? (item.title || '') : ((item.titleEn || item.title) || '');
                  const isSwiped = swipedItemId === item._id;
                  
                  return (
                    <motion.div
                      key={item._id}
                      layout
                      initial={reduceMotion ? undefined : "hidden"}
                      animate={reduceMotion ? undefined : "visible"}
                      whileHover={reduceMotion ? undefined : "hover"}
                      exit={reduceMotion ? undefined : "exit"}
                      variants={swipeItemVariants}
                      className="relative group"
                    >
                      {/* Delete background that appears when swiping left OR right */}
                      <motion.div 
                        className="absolute inset-0 bg-gradient-to-r from-red-500 to-red-600 rounded-xl flex items-center justify-center z-0 shadow-lg"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isSwiped ? 1 : 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-white font-bold text-lg">{t.remove}</span>
                          <FaTrashAlt className="h-6 w-6 text-white" />
                        </div>
                      </motion.div>
                      
                      {/* Enhanced List Item */}
                      <motion.div
                        className="relative flex gap-4 items-center border border-gray-200/50 dark:border-gray-700/50 rounded-xl overflow-hidden p-3 md:p-4 hover:shadow-lg transition-all duration-500 bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl group z-10"
                        drag={isMobile ? "x" : false}
                        dragConstraints={{ left: 0, right: 0 }}
                        dragElastic={0.1}
                        dragMomentum={false}
                        dragPropagation={false}
                        onDragStart={() => setSwipedItemId(item._id)}
                        onDragEnd={(_, info) => handleDragEndList(item._id, isEpisodeItem ? "episode" : "article", itemTitle, info)}
                        onDragTransitionEnd={() => {
                          if (!isSwiped) {
                            setSwipedItemId(null);
                          }
                        }}
                        animate={{ x: isSwiped ? 80 : 0 }}
                        transition={{ type: "spring", stiffness: 500, damping: 30 }}
                        whileHover={{ 
                          x: isSwiped ? 80 : 0,
                          scale: isSwiped ? 1 : 1.01,
                        }}
                      >
                        {/* Shimmer Effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out pointer-events-none rounded-xl"></div>
                        
                        <Link href={itemUrl} className="flex items-center gap-4 flex-1 group">
                          <div className="relative w-24 h-16 md:w-32 md:h-20 flex-shrink-0 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md">
                            <Image 
                              src={thumbnailUrl} 
                              alt={itemTitle} 
                              fill
                              className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110" 
                              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500"></div>
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-0 group-hover:opacity-100 transition-all duration-500">
                              <motion.div 
                                className="rounded-full bg-black/60 backdrop-blur-sm p-2"
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3, delay: 0.1 }}
                              >
                                {/* Different icon for articles vs episodes */}
                                {isEpisodeItem ? (
                                  <FaPlay className="h-4 w-4 md:h-6 md:w-6 text-white" />
                                ) : (
                                  <FaBookOpen className="h-4 w-4 md:h-6 md:w-6 text-white" />
                                )}
                              </motion.div>
                            </div>
                            
                            {/* Enhanced Type Badge */}
                            <div className="absolute top-2 right-2">
                              <motion.div 
                                className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold backdrop-blur-sm shadow-lg ${
                                  isEpisodeItem 
                                    ? "bg-gradient-to-r from-indigo-600 to-indigo-700 text-white" 
                                    : "bg-gradient-to-r from-purple-600 to-purple-700 text-white"
                                }`}
                                whileHover={{ scale: 1.1 }}
                                transition={{ type: "spring", stiffness: 400 }}
                              >
                                {isEpisodeItem ? t.episode : t.article}
                              </motion.div>
                            </div>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-4 mb-2">
                              <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                  </svg>
                                </div>
                                <span>{itemInfo}</span>
                              </div>
                              
                              {itemDate && (
                                <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                                  <div className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12 a2 2 0 002 2z" />
                                    </svg>
                                  </div>
                                  <span>{itemDate}</span>
                                </div>
                              )}
                            </div>
                            <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 line-clamp-2 mb-2 group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-blue-600 group-hover:to-purple-600 group-hover:bg-clip-text transition-all duration-300">
                              {itemTitle}
                            </h3>
                            
                            {/* Categories */}
                            {item.categories && item.categories.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-2">
                                {item.categories.slice(0, 2).map((category) => (
                                  <motion.span 
                                    key={category} 
                                    className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full"
                                    whileHover={{ scale: 1.05 }}
                                    transition={{ type: "spring", stiffness: 400 }}
                                  >
                                    {category}
                                  </motion.span>
                                ))}
                                {item.categories.length > 2 && (
                                  <span className="inline-block px-2 py-1 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                                    +{item.categories.length - 2}
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="flex-shrink-0 flex items-center gap-3 px-2">
                          <motion.button
                            onClick={() => {
                              setItemToDelete({ id: item._id, type: isEpisodeItem ? "episode" : "article", title: itemTitle });
                              setShowConfirmModal(true);
                            }}
                            className="inline-flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-200 border border-red-200 dark:border-red-800/30 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-red-300"
                            aria-label={language === 'ar' ? "حذف من المفضلات" : "Remove from favorites"}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <FaTrashAlt className="h-4 w-4" />
                            <span className="hidden sm:inline text-sm font-medium">{t.remove}</span>
                          </motion.button>
                        </div>
                        
                        {/* Swipe hint indicator for mobile */}
                        {isMobile && (
                          <div className={`absolute ${isRTL ? 'right-0' : 'left-0'} top-0 bottom-0 w-10 flex items-center justify-center`}>
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-5 w-5 text-gray-400`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
                            </svg>
                          </div>
                        )}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </motion.div>
          )}
        </div>
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
              
              {/* Content type filter */}
              <div className="mb-6">
                <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Content Type</h4>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setSelectedCategory("all");
                      setShowFilterModal(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedCategory === "all" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {t.all}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory("episodes");
                      setShowFilterModal(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedCategory === "episodes" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {t.episodesOnly}
                  </button>
                  <button
                    onClick={() => {
                      setSelectedCategory("articles");
                      setShowFilterModal(false);
                    }}
                    className={`w-full text-left px-4 py-3 rounded-lg transition ${
                      selectedCategory === "articles" 
                        ? "bg-blue-600 text-white" 
                        : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                    }`}
                  >
                    {t.articlesOnly}
                  </button>
                </div>
              </div>
              
              {/* Categories filter */}
              {categories.length > 0 && (
                <div>
                  <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">Categories</h4>
                  <div className="space-y-2">
                    {categories.map((category) => (
                      <button
                        key={category}
                        onClick={() => {
                          setSelectedCategory(category);
                          setShowFilterModal(false);
                        }}
                        className={`w-full text-left px-4 py-3 rounded-lg transition ${
                          selectedCategory === category 
                            ? "bg-blue-600 text-white" 
                            : "bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200"
                        }`}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Confirmation Modal */}
      <ConfirmationModal 
        isOpen={showConfirmModal} 
        onClose={handleCancelDelete} 
        onConfirm={handleConfirmDelete}
        title={itemToDelete?.title || ""}
        language={language}
      />
    </div>
  );
}