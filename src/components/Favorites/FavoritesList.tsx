"use client";
import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useLanguage } from "../Language/LanguageProvider";
import { Heart, Play, FileText } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

// تعريف واجهات للبيانات
interface Episode {
  _id: string;
  title?: string;
  titleEn?: string;
  slug?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
}

interface Article {
  _id: string;
  title?: string;
  titleEn?: string;
  slug?: string;
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
}

interface Favorite {
  _id: string;
  userId: string;
  episode?: Episode;
  article?: Article;
  createdAt: string;
}

export default function FavoritesList() {
  const { data: session } = useSession();
  const { language } = useLanguage();
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [loading, setLoading] = useState(true);
  const [favoritesCounts, setFavoritesCounts] = useState<{ [contentId: string]: number }>({});

  const texts = {
    ar: {
      title: "المفضلة",
      noFavorites: "لا توجد عناصر في المفضلة",
      episode: "حلقة",
      article: "مقال",
      loading: "جاري التحميل...",
      error: "حدث خطأ أثناء تحميل المفضلة"
    },
    en: {
      title: "Favorites",
      noFavorites: "No items in favorites",
      episode: "Episode",
      article: "Article",
      loading: "Loading...",
      error: "An error occurred while loading favorites"
    }
  };

  const t = texts[language];

  useEffect(() => {
    if (session?.user) {
      const fetchFavorites = async () => {
        try {
          const response = await fetch(`/api/favorites/user/${session.user.id}`);
          if (response.ok) {
            const data = await response.json();
            const favoritesData = data.favorites || [];
            setFavorites(favoritesData);
            
            // جلب عدد الإعجابات لكل عنصر
            const episodeIds = favoritesData
              .filter((fav: Favorite) => fav.episode)
              .map((fav: Favorite) => fav.episode!._id);
            
            const articleIds = favoritesData
              .filter((fav: Favorite) => fav.article)
              .map((fav: Favorite) => fav.article!._id);
            
            // جلب عدد الإعجابات للحلقات
            if (episodeIds.length > 0) {
              try {
                const episodesResponse = await fetch(`/api/favorites/count?contentIds=${episodeIds.join(',')}&contentType=episode`);
                if (episodesResponse.ok) {
                  const episodesData = await episodesResponse.json();
                  setFavoritesCounts(prev => ({ ...prev, ...episodesData.counts }));
                }
              } catch (error) {
                console.error("Error fetching episodes favorites count:", error);
              }
            }
            
            // جلب عدد الإعجابات للمقالات
            if (articleIds.length > 0) {
              try {
                const articlesResponse = await fetch(`/api/favorites/count?contentIds=${articleIds.join(',')}&contentType=article`);
                if (articlesResponse.ok) {
                  const articlesData = await articlesResponse.json();
                  setFavoritesCounts(prev => ({ ...prev, ...articlesData.counts }));
                }
              } catch (error) {
                console.error("Error fetching articles favorites count:", error);
              }
            }
          }
        } catch (error) {
          console.error("Error fetching favorites:", error);
        } finally {
          setLoading(false);
        }
      };

      fetchFavorites();
    } else {
      setLoading(false);
    }
  }, [session]);

  const getLocalizedText = (arText?: string, enText?: string) => {
    return language === 'ar' ? (arText || '') : (enText || '');
  };

  const getThumbnailUrl = (arUrl?: string, enUrl?: string) => {
    const url = language === 'ar' ? arUrl : enUrl;
    return url || '/placeholder.png';
  };

  if (!session?.user) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-lg mb-4">يجب تسجيل الدخول لعرض المفضلة</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="container mx-auto py-8 text-center">
        <p className="text-lg">{t.loading}</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center gap-2 mb-6">
        <Heart className="w-6 h-6 text-red-500 fill-current" />
        <h1 className="text-2xl font-bold">{t.title}</h1>
      </div>

      {favorites.length === 0 ? (
        <div className="text-center py-12">
          <Heart className="w-16 h-16 mx-auto text-gray-300 mb-4" />
          <p className="text-lg text-gray-500">{t.noFavorites}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {favorites.map((favorite) => {
            const isEpisode = !!favorite.episode;
            const item = isEpisode ? favorite.episode : favorite.article;
            
            if (!item) return null;
            
            const title = getLocalizedText(item.title, item.titleEn);
            let thumbnailUrl: string;
            
            // تحديد رابط الصورة بناءً على نوع العنصر
            if (isEpisode) {
              const episode = item as Episode;
              thumbnailUrl = getThumbnailUrl(episode.thumbnailUrl, episode.thumbnailUrlEn);
            } else {
              const article = item as Article;
              thumbnailUrl = getThumbnailUrl(article.featuredImageUrl, article.featuredImageUrlEn);
            }
            
            const slug = item.slug;
            const linkUrl = isEpisode ? `/episodes/${slug}` : `/articles/${slug}`;
            const contentId = item._id;
            const favoritesCount = favoritesCounts[contentId] || 0;
            
            return (
              <div key={favorite._id} className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div className="relative h-40">
                  <Image
                    src={thumbnailUrl}
                    alt={title}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                  <div className="absolute top-2 right-2 bg-black/50 text-white px-2 py-1 rounded-full text-xs flex items-center gap-1">
                    {isEpisode ? <Play className="w-3 h-3" /> : <FileText className="w-3 h-3" />}
                    {isEpisode ? t.episode : t.article}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-lg mb-2 line-clamp-2">{title}</h3>
                  <div className="flex items-center justify-between">
                    <Link
                      href={linkUrl}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300"
                    >
                      {isEpisode ? (
                        <>
                          <Play className="w-4 h-4" />
                          مشاهدة الحلقة
                        </>
                      ) : (
                        <>
                          <FileText className="w-4 h-4" />
                          قراءة المقال
                        </>
                      )}
                    </Link>
                    <div className="flex items-center gap-1 text-red-500">
                      <Heart className="w-4 h-4 fill-current" />
                      <span className="text-sm">{favoritesCount}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}