"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "../Language/LanguageProvider";

interface FavoriteButtonProps {
  contentId: string;
  contentType: "episode" | "article";
  isFavorite?: boolean;
  onToggle?: () => void;
  showCount?: boolean;
}

export default function FavoriteButton({ 
  contentId, 
  contentType, 
  isFavorite: propIsFavorite,
  onToggle: propOnToggle,
  showCount = false
}: FavoriteButtonProps) {
  const { data: session } = useSession();
  const { language } = useLanguage();
  const [isFavorite, setIsFavorite] = useState(propIsFavorite || false);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [favoritesCount, setFavoritesCount] = useState(0);

  // نصوص التطبيق حسب اللغة
  const texts = {
    ar: {
      addToFavorites: "إضافة للمفضلة",
      removeFromFavorites: "إزالة من المفضلة",
      errorMessage: "حدث خطأ أثناء تحديث المفضلة. يرجى المحاولة مرة أخرى.",
      loginRequired: "يجب تسجيل الدخول لإضافة المحتوى للمفضلة"
    },
    en: {
      addToFavorites: "Add to favorites",
      removeFromFavorites: "Remove from favorites",
      errorMessage: "An error occurred while updating favorites. Please try again.",
      loginRequired: "You must be logged in to add content to favorites"
    }
  };

  const t = texts[language];

  useEffect(() => {
    // إذا تم تمرير حالة الإعجاب كـ prop، استخدمها مباشرة
    if (propIsFavorite !== undefined) {
      setIsFavorite(propIsFavorite);
    }
    
    // جلب عدد الإعجابات
    const fetchFavoritesCount = async () => {
      try {
        const response = await fetch(`/api/favorites/count?contentId=${contentId}&contentType=${contentType}`);
        if (response.ok) {
          const data = await response.json();
          setFavoritesCount(data.count || 0);
        }
      } catch (error) {
        console.error("Error fetching favorites count:", error);
      }
    };
    
    fetchFavoritesCount();
    
    // خلاف ذلك، تحقق من API
    if (session?.user && propIsFavorite === undefined) {
      // Check if content is in favorites
      const checkFavorite = async () => {
        try {
          const response = await fetch(`/api/favorites?userId=${session.user.id}&contentId=${contentId}&contentType=${contentType}`);
          
          if (!response.ok) {
            const errorText = await response.text();
            console.error("API Error:", response.status, errorText);
            throw new Error(`API error: ${response.status}`);
          }
          
          const data = await response.json();
          setIsFavorite(data.isFavorite);
        } catch (error) {
          console.error("Error checking favorite status:", error);
        } finally {
          setLoading(false);
        }
      };

      checkFavorite();
    } else {
      setLoading(false);
    }
  }, [session, contentId, contentType, propIsFavorite]);

  async function handleToggle() {
    if (!session?.user) {
      alert(t.loginRequired);
      return;
    }
    
    if (actionLoading) return;
    
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
        const newFavoriteState = !isFavorite;
        setIsFavorite(newFavoriteState);
        
        // تحديث عدد الإعجابات
        if (newFavoriteState) {
          setFavoritesCount(prev => prev + 1);
        } else {
          setFavoritesCount(prev => Math.max(0, prev - 1));
        }
        
        // إذا تم تمرير دالة onToggle، استدعها
        if (propOnToggle) {
          propOnToggle();
        }
      } else {
        const errorText = await response.text();
        console.error("API Error:", response.status, errorText);
        
        try {
          const errorData = await response.json();
          console.error("Error toggling favorite:", errorData);
        } catch (e) {
          console.error("Error parsing error response:", e);
        }
        
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
    <div className="flex items-center gap-2">
      <button
        onClick={handleToggle}
        disabled={actionLoading}
        aria-label={isFavorite ? t.removeFromFavorites : t.addToFavorites}
        className={`group relative flex items-center justify-center w-12 h-12 md:w-14 md:h-14 rounded-full transition-all duration-500 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 overflow-hidden`}
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
      
      {/* عرض عدد الإعجابات */}
      {showCount && (
        <span className={`text-sm font-medium ${isFavorite ? 'text-red-500' : 'text-gray-600 dark:text-gray-400'}`}>
          {favoritesCount}
        </span>
      )}
    </div>
  );
}