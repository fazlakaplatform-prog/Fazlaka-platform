"use client";

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaYoutube, FaInstagram, FaFacebookF, FaTiktok,
  FaEnvelope, FaPaperPlane, FaShare, FaMobileAlt,
  FaDesktop, FaDownload, FaGithub, FaBehance, FaDribbble,
  FaSnapchat, FaPinterest, FaReddit, FaWhatsapp, FaTelegram,
  FaLinkedin, FaArrowRight, FaQuoteRight,
  FaApple, FaGooglePlay, FaWindows, FaLinux, FaStar,
  FaRocket, FaShieldAlt, FaCheckCircle, FaPlay, FaVideo,
  FaUsers, FaBell, FaInfoCircle,
  FaHeart, FaLightbulb, FaAward, FaBullseye,
  FaFlask, FaAtom, FaLandmark, FaBalanceScale, FaBook, FaChartLine,
  FaDiscord  // إضافة أيقونة دسكورد
} from 'react-icons/fa';

// استيراد دالة جلب البيانات من MongoDB
async function fetchSocialLinksFromMongoDB() {
  try {
    const response = await fetch('/api/social-links');
    const data = await response.json();
    
    if (data.success && data.data) {
      return data.data;
    }
    return [];
  } catch (error) {
    console.error('Error fetching social links from MongoDB:', error);
    return [];
  }
}

// Define a type for platform names
type PlatformType = 'youtube' | 'instagram' | 'facebook' | 'tiktok' | 'x' | 'twitter' | 
                   'linkedin' | 'threads' | 'snapchat' | 'pinterest' | 'reddit' | 
                   'whatsapp' | 'telegram' | 'github' | 'behance' | 'dribbble' | 'discord'; // إضافة discord

// واجهة للروابط الاجتماعية
export interface SocialLink {
  _id: string
  platform: string
  url: string
  createdAt?: Date
  updatedAt?: Date
}

// أيقونة X مخصصة
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// أيقونة Threads مخصصة
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M12.186 24h-.007c-3.581-.024-6.346-2.609-6.38-6.019v-.73C2.078 16.242 0 13.75 0 10.792 0 7.642 2.437 5.016 5.531 4.72c.3-2.694 2.825-4.718 5.698-4.718.746 0 1.463.14 2.124.398l.093.037c.727.292 1.361.732 1.858 1.277l.068.075c.511-.25 1.088-.383 1.68-.383 1.043 0 2.024.485 2.663 1.331l.048.064c.387.514.591 1.13.591 1.774v11.534c0 3.438-2.765 6.023-6.346 6.047h-.072zM5.698 6.231c-2.051 0-3.72 1.67-3.72 3.72 0 2.051 1.669 3.72 3.72 3.72h.366v4.31c.024 2.404 1.983 4.363 4.387 4.387h.07c2.404-.024 4.363-1.983 4.387-4.387V4.514c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366h-1.488v-.366c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366h-1.488v-.366c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366H5.698z"/>
  </svg>
);

// أيقونة دسكورد مخصصة
const DiscordIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515a.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0a12.64 12.64 0 0 0-.617-1.25a.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057a19.9 19.9 0 0 0 5.993 3.03a.078.078 0 0 0 .084-.028a14.09 14.09 0 0 0 1.226-1.994a.076.076 0 0 0-.041-.106a13.107 13.107 0 0 1-1.872-.892a.077.077 0 0 1-.008-.128a10.2 10.2 0 0 0 .372-.292a.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127a12.299 12.299 0 0 1-1.873.892a.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028a19.839 19.839 0 0 0 6.002-3.03a.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.956-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419c0-1.333.955-2.419 2.157-2.419c1.21 0 2.176 1.096 2.157 2.42c0 1.333-.946 2.418-2.157 2.418z"/>
  </svg>
);

// دالة للحصول على الأيقونة المناسبة لكل منصة
function getSocialIcon(platform: string) {
  switch (platform) {
    case 'youtube':
      return FaYoutube;
    case 'instagram':
      return FaInstagram;
    case 'facebook':
      return FaFacebookF;
    case 'tiktok':
      return FaTiktok;
    case 'x':
    case 'twitter':
      return XIcon;
    case 'linkedin':
      return FaLinkedin;
    case 'threads':
      return ThreadsIcon;
    case 'snapchat':
      return FaSnapchat;
    case 'pinterest':
      return FaPinterest;
    case 'reddit':
      return FaReddit;
    case 'whatsapp':
      return FaWhatsapp;
    case 'telegram':
      return FaTelegram;
    case 'github':
      return FaGithub;
    case 'behance':
      return FaBehance;
    case 'dribbble':
      return FaDribbble;
    case 'discord':
      return DiscordIcon; // إضافة أيقونة دسكورد
    default:
      return FaShare;
  }
}

// دالة للحصول على اللون المناسب لكل منصة
function getPlatformColor(platform: string) {
  switch (platform) {
    case 'youtube':
      return 'from-red-500 to-red-600';
    case 'instagram':
      return 'from-pink-500 to-purple-500';
    case 'facebook':
      return 'from-blue-500 to-blue-600';
    case 'tiktok':
      return 'from-gray-800 to-black';
    case 'x':
    case 'twitter':
      return 'from-gray-700 to-gray-900';
    case 'linkedin':
      return 'from-blue-600 to-blue-700';
    case 'threads':
      return 'from-gray-800 to-black';
    case 'snapchat':
      return 'from-yellow-400 to-yellow-500';
    case 'pinterest':
      return 'from-red-600 to-red-700';
    case 'reddit':
      return 'from-orange-500 to-orange-600';
    case 'whatsapp':
      return 'from-green-500 to-green-600';
    case 'telegram':
      return 'from-blue-400 to-blue-500';
    case 'github':
      return 'from-gray-700 to-gray-800';
    case 'behance':
      return 'from-blue-500 to-blue-600';
    case 'dribbble':
      return 'from-pink-400 to-pink-500';
    case 'discord':
      return 'from-indigo-500 to-indigo-600'; // لون دسكورد
    default:
      return 'from-blue-500 to-indigo-600';
  }
}

// دالة للحصول على اسم المنصة حسب اللغة
function getPlatformName(platform: string, language: string) {
  const names: Record<PlatformType, { ar: string; en: string }> = {
    youtube: { ar: 'يوتيوب', en: 'YouTube' },
    instagram: { ar: 'انستجرام', en: 'Instagram' },
    facebook: { ar: 'فيس بوك', en: 'Facebook' },
    tiktok: { ar: 'تيك توك', en: 'TikTok' },
    x: { ar: 'إكس', en: 'X' },
    twitter: { ar: 'إكس', en: 'X' },
    linkedin: { ar: 'لينكد إن', en: 'LinkedIn' },
    threads: { ar: 'ثريدز', en: 'Threads' },
    snapchat: { ar: 'سناب شات', en: 'Snapchat' },
    pinterest: { ar: 'بينترست', en: 'Pinterest' },
    reddit: { ar: 'ريديت', en: 'Reddit' },
    whatsapp: { ar: 'واتساب', en: 'WhatsApp' },
    telegram: { ar: 'تيليجرام', en: 'Telegram' },
    github: { ar: 'جيت هب', en: 'GitHub' },
    behance: { ar: 'بهانس', en: 'Behance' },
    dribbble: { ar: 'دريببل', en: 'Dribbble' },
    discord: { ar: 'ديسكورد', en: 'Discord' } // اسم دسكورد
  };
  
  // Use type assertion to tell TypeScript that platform is a valid key
  const platformKey = platform as PlatformType;
  return names[platformKey]?.[language as 'ar' | 'en'] || platform;
}

// Define a type for YouTube data
interface YouTubeData {
  subscribers: string;
  views: string;
  videos: string;
  channelName: string;
  channelThumbnail: string;
  latestVideo: {
    id: string;
    title: string;
    thumbnail: string;
    url: string;
  } | null;
}

// دالة لجلب بيانات قناة يوتيوب
async function fetchYouTubeData(): Promise<YouTubeData | null> {
  const API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY;
  const CHANNEL_ID = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
  
  if (!API_KEY || !CHANNEL_ID) {
    console.error('YouTube API key or Channel ID is missing');
    return null;
  }

  try {
    // جلب معلومات القناة
    const channelResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics,snippet&id=${CHANNEL_ID}&key=${API_KEY}`
    );
    
    if (!channelResponse.ok) {
      throw new Error('Failed to fetch channel data');
    }
    
    const channelData = await channelResponse.json();
    
    if (!channelData.items || channelData.items.length === 0) {
      throw new Error('Channel not found');
    }
    
    const channel = channelData.items[0];
    const statistics = channel.statistics;
    const snippet = channel.snippet;
    
    // جلب أحدث فيديو
    const videosResponse = await fetch(
      `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${CHANNEL_ID}&order=date&maxResults=1&type=video&key=${API_KEY}`
    );
    
    if (!videosResponse.ok) {
      throw new Error('Failed to fetch videos');
    }
    
    const videosData = await videosResponse.json();
    
    let latestVideo = null;
    if (videosData.items && videosData.items.length > 0) {
      const video = videosData.items[0];
      latestVideo = {
        id: video.id.videoId,
        title: video.snippet.title,
        thumbnail: video.snippet.thumbnails.high?.url || video.snippet.thumbnails.default?.url,
        url: `https://www.youtube.com/watch?v=${video.id.videoId}`
      };
    }
    
    return {
      subscribers: formatNumber(parseInt(statistics.subscriberCount || '0')),
      views: formatNumber(parseInt(statistics.viewCount || '0')),
      videos: formatNumber(parseInt(statistics.videoCount || '0')),
      channelName: snippet.title || 'YouTube Channel',
      channelThumbnail: snippet.thumbnails?.default?.url || '',
      latestVideo
    };
  } catch (error) {
    console.error('Error fetching YouTube data:', error);
    return null;
  }
}

// دالة لتنسيق الأرقام
function formatNumber(num: number): string {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M+';
  } else if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K+';
  }
  return num.toString();
}

// مكون الهيرو الجديد بالكامل
const HeroSection = ({ language }: { language: string }) => {
  const translations = {
    ar: {
      title: "كل منصاتنا الرسمية في مكان واحد",
      subtitle: "تواصل معنا عبر جميع وسائل التواصل الاجتماعي المتاحة",
      allPlatforms: "جميع المنصات"
    },
    en: {
      title: "All our official platforms in one place",
      subtitle: "Connect with us through all available social media",
      allPlatforms: "All Platforms"
    }
  };
  
  const t = translations[language === 'ar' ? 'ar' : 'en'];
  const isRTL = language === 'ar';
  
  // دالة للانتقال إلى قسم المنصات
  const scrollToPlatforms = () => {
    const platformsSection = document.getElementById('platforms-section');
    if (platformsSection) {
      platformsSection.scrollIntoView({ behavior: 'smooth' });
    }
  };
  
  return (
    <div className="relative mb-12 sm:mb-16 overflow-hidden rounded-3xl shadow-2xl">
      {/* الخلفية المتدرجة الجديدة */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 dark:from-indigo-900 dark:via-purple-900 dark:to-pink-950"></div>
      
      {/* شبكة زخرفية متحركة */}
      <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI1IiBoZWlnaHQ9IjUiPgo8cmVjdCB3aWR0aD0iNSIgaGVpZ2h0PSI1IiBmaWxsPSIjZmZmIiBmaWxsLW9wYWNpdHk9IjAuMDUiPjwvcmVjdD4KPC9zdmc+')] opacity-10 animate-shimmer"></div>
      
      {/* دوائر زخرفية متحركة */}
      <div className="absolute -top-40 -right-40 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
      <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 py-10 sm:py-12 md:py-16 px-4 sm:px-6 md:px-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          {/* النص */}
          <div className={`${isRTL ? 'lg:order-1' : 'lg:order-2'}`}>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 leading-tight animate-fade-in-up">
              {t.title}
            </h1>
            <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-xl animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              {t.subtitle}
            </p>
          </div>
          
          {/* الصورة */}
          <div className={`${isRTL ? 'lg:order-2' : 'lg:order-1'} flex justify-center items-center`}>
            <div className="relative w-full max-w-md mx-auto">
              {/* Mockup */}
              <div className="relative bg-white/10 backdrop-blur-sm rounded-3xl p-6 shadow-2xl transform transition-all duration-500 hover:scale-105 animate-float">
                <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
                  <div className="h-8 bg-gradient-to-r from-indigo-500 to-purple-500 flex items-center px-4">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="grid grid-cols-3 gap-4">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl h-20 flex items-center justify-center">
                        <FaInstagram className="text-white text-2xl" />
                      </div>
                      <div className="bg-gradient-to-r from-pink-500 to-purple-500 rounded-xl h-20 flex items-center justify-center">
                        <FaFacebookF className="text-white text-2xl" />
                      </div>
                      <div className="bg-gradient-to-r from-gray-800 to-black rounded-xl h-20 flex items-center justify-center">
                        <FaTiktok className="text-white text-2xl" />
                      </div>
                      <div className="bg-gradient-to-r from-gray-700 to-gray-900 rounded-xl h-20 flex items-center justify-center">
                        <XIcon className="text-white text-2xl" />
                      </div>
                      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl h-20 flex items-center justify-center">
                        <FaYoutube className="text-white text-2xl" />
                      </div>
                      <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl h-20 flex items-center justify-center">
                        <DiscordIcon className="text-white text-2xl" /> {/* استبدال سناب شات بدسكورد */}
                      </div>
                    </div>
                    <div className="mt-4 flex justify-center">
                      <button 
                        onClick={scrollToPlatforms}
                        className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-4 py-2 rounded-full text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300"
                      >
                        {t.allPlatforms}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* أيقونات عائمة */}
              <div className="absolute -top-4 -right-4 bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full shadow-lg animate-float" style={{ animationDelay: '1s' }}>
                <FaShare className="text-white text-xl" />
              </div>
              <div className="absolute -bottom-4 -left-4 bg-gradient-to-r from-green-400 to-blue-500 p-3 rounded-full shadow-lg animate-float" style={{ animationDelay: '2s' }}>
                <FaHeart className="text-white text-xl" />
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* تأثيرات حركية محسنة */}
      <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-shimmer" style={{ animationDelay: '1s', animationDirection: 'reverse' }}></div>
    </div>
  );
};

// مكون قسم يوتيوب المميز
const YouTubeSection = ({ socialLinks, isRTL, language }: { socialLinks: SocialLink[], isRTL: boolean, language: string }) => {
  const translations = {
    ar: {
      title: "قناتنا على <span class='text-red-500'>يوتيوب</span>",
      subtitle: "اشترك في قناتنا على يوتيوب لمشاهدة أحدث الفيديوهات والشروحات والبرامج التعليمية التي نقدمها.",
      subscribe: "اشترك الآن",
      videos: "يوتيوب",
      subscribers: "مشتركين",
      totalViews: "اجمالي المشاهدات",
      latestVideo: "أحدث الفيديو",
      watchNow: "شاهد الآن",
      loading: "جاري التحميل...",
      error: "حدث خطأ في تحميل بيانات يوتيوب"
    },
    en: {
      title: "Our <span class='text-red-500'>YouTube</span> Channel",
      subtitle: "Subscribe to our YouTube channel to watch the latest videos, tutorials and educational programs we provide.",
      subscribe: "Subscribe Now",
      videos: "YouTube ",
      subscribers: "Subscribers",
      totalViews: "Total Views",
      latestVideo: "Latest Video",
      watchNow: "Watch Now",
      loading: "Loading...",
      error: "Error loading YouTube data"
    }
  };
  
  const t = translations[language === 'ar' ? 'ar' : 'en'];
  
  // البحث عن رابط يوتيوب
  const youtubeLink = socialLinks.find(link => link.platform === 'youtube');
  
  const [youtubeData, setYoutubeData] = useState<YouTubeData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  
  useEffect(() => {
    const loadYouTubeData = async () => {
      try {
        setLoading(true);
        setError(false);
        const data = await fetchYouTubeData();
        if (data) {
          setYoutubeData(data);
        } else {
          setError(true);
        }
      } catch (error) {
        console.error('Error loading YouTube data:', error);
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    
    loadYouTubeData();
  }, []);
  
  if (!youtubeLink) return null;
  
  return (
    <section className="mb-12 sm:mb-16 relative">
      {/* خلفية مميزة للقسم */}
      <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-red-50 to-pink-50 dark:from-red-900/20 dark:via-red-900/20 dark:to-pink-900/20 rounded-3xl shadow-lg"></div>
      
      {/* عناصر زخرفية */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-red-400 to-red-500 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-r from-pink-400 to-red-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
      </div>
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-full mb-4 animate-fade-in-down shadow-lg">
            <FaYoutube className="mr-2" />
            <span className="font-bold">{t.videos}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 animate-fade-in-up" dangerouslySetInnerHTML={{ __html: t.title }}></h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {t.subtitle}
          </p>
          <div className="w-20 sm:w-32 h-1 bg-gradient-to-r from-red-500 to-red-600 mx-auto rounded-full mt-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}></div>
        </div>
        
        <div className="max-w-6xl mx-auto">
          <div className="group relative">
            {/* المحتوى الرئيسي */}
            <div className="relative bg-white dark:bg-gray-800 rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-200 dark:border-gray-700 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* معلومات القناة */}
                <div className="flex flex-col justify-center">
                  <div className="flex items-center mb-6">
                    {loading ? (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mr-4 animate-pulse"></div>
                    ) : error || !youtubeData?.channelThumbnail ? (
                      <div className="w-16 h-16 bg-gray-200 dark:bg-gray-700 rounded-full mr-4 flex items-center justify-center">
                        <FaYoutube className="text-gray-400 text-2xl" />
                      </div>
                    ) : (
                      <Image 
                        src={youtubeData.channelThumbnail} 
                        alt={youtubeData.channelName} 
                        width={64}
                        height={64}
                        className="rounded-full mr-4"
                      />
                    )}
                    <div>
                      <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
                        {loading ? (
                          <div className="h-6 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
                        ) : error ? (
                          getPlatformName('youtube', language)
                        ) : (
                          youtubeData?.channelName || getPlatformName('youtube', language)
                        )}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {language === 'ar' ? 'قناة يوتيوب' : 'YouTube Channel'}
                      </p>
                    </div>
                  </div>
                  
                  {/* إحصائيات القناة */}
                  {loading ? (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-300 dark:text-gray-600 animate-pulse">---</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{t.subscribers}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-300 dark:text-gray-600 animate-pulse">---</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{t.totalViews}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-300 dark:text-gray-600 animate-pulse">---</div>
                        <div className="text-xs text-gray-400 dark:text-gray-500">{t.videos}</div>
                      </div>
                    </div>
                  ) : error ? (
                    <div className="text-center mb-6 text-red-500 dark:text-red-400">
                      {t.error}
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-4 mb-6">
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{youtubeData?.subscribers || '0'}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{t.subscribers}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{youtubeData?.views || '0'}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{t.totalViews}</div>
                      </div>
                      <div className="text-center">
                        <div className="text-xl font-bold text-gray-900 dark:text-white">{youtubeData?.videos || '0'}</div>
                        <div className="text-xs text-gray-600 dark:text-gray-400">{t.videos}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* زر الاشتراك */}
                  <a
                    href={youtubeLink.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative inline-flex items-center justify-center overflow-hidden bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 transform hover:scale-105 shadow-lg"
                  >
                    <span className="relative z-10 flex items-center">
                      <FaBell className={`mr-3 text-lg transition-transform duration-300 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'}`} />
                      {t.subscribe}
                    </span>
                    {/* تأثير الموجة على الزر */}
                    <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-red-700 to-red-800 opacity-0 transition-opacity duration-300 rounded-full transform scale-0 group-hover:scale-100"></span>
                  </a>
                </div>
                
                {/* أحدث فيديو */}
                <div className="relative">
                  <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <FaVideo className="mr-2 text-red-500" />
                    {t.latestVideo}
                  </h4>
                  {loading ? (
                    <div className="relative rounded-xl overflow-hidden shadow-lg">
                      <div className="w-full h-48 sm:h-56 bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
                    </div>
                  ) : error || !youtubeData?.latestVideo ? (
                    <div className="relative rounded-xl overflow-hidden shadow-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center h-48 sm:h-56">
                      <p className="text-gray-500 dark:text-gray-400">{t.error}</p>
                    </div>
                  ) : (
                    <div className="relative rounded-xl overflow-hidden shadow-lg group cursor-pointer" onClick={() => youtubeData.latestVideo && window.open(youtubeData.latestVideo.url, '_blank')}>
                      <Image 
                        src={youtubeData.latestVideo.thumbnail} 
                        alt={youtubeData.latestVideo.title} 
                        width={640}
                        height={360}
                        className="w-full h-48 sm:h-56 object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                        <div className="bg-red-600 rounded-full p-3 transform scale-0 group-hover:scale-100 transition-transform duration-300">
                          <FaPlay className="text-white text-xl" />
                        </div>
                      </div>
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                        <p className="text-white font-medium text-sm line-clamp-2">{youtubeData.latestVideo.title}</p>
                      </div>
                    </div>
                  )}
                  {youtubeData?.latestVideo && (
                    <a
                      href={youtubeData.latestVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-4 inline-flex items-center text-red-600 dark:text-red-400 font-medium hover:text-red-700 dark:hover:text-red-300 transition-colors"
                    >
                      {t.watchNow}
                      <FaArrowRight className={`mr-2 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

// مكون قسم المنصات الجديد
const PlatformsSection = ({ socialLinks, isRTL, language }: { socialLinks: SocialLink[], isRTL: boolean, language: string }) => {
  const translations = {
    ar: {
      title: "منصّاتنا الرقمية",
      subtitle: "اختر المنصة التي تناسب احتياجاتك من مجموعتنا المتنوعة.",
      visit: "زيارة المنصة"
    },
    en: {
      title: "Our Digital Platforms",
      subtitle: "Choose the platform that suits your needs from our diverse collection.",
      visit: "Visit Platform"
    }
  };
  
  const t = translations[language === 'ar' ? 'ar' : 'en'];
  
  // فلترة الروابط لاستبعاد التطبيقات
  const filteredLinks = socialLinks.filter(link => 
    !['mobile_app', 'desktop_app', 'app_store', 'google_play', 'download_link', 'website'].includes(link.platform)
  );
  
  if (filteredLinks.length === 0) return null;
  
  // تحديد عدد الأعمدة بناءً على عدد الروابط
  const getGridCols = () => {
    if (filteredLinks.length === 1) return 'grid-cols-1';
    if (filteredLinks.length === 2) return 'grid-cols-1 sm:grid-cols-2';
    if (filteredLinks.length === 3) return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3';
    return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4';
  };
  
  return (
    <section id="platforms-section" className="mb-12 sm:mb-16 relative">
      {/* خلفية مميزة للقسم */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-3xl shadow-lg"></div>
      
      {/* عناصر زخرفية */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>
      
      {/* المحتوى الرئيسي */}
      <div className="relative z-10 p-4 sm:p-6 md:p-8">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 animate-fade-in-up">{t.title}</h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {t.subtitle}
          </p>
          <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full mt-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}></div>
        </div>
        
        <div className={`grid ${getGridCols()} gap-6 sm:gap-8 max-w-6xl mx-auto`}>
          {filteredLinks.map((link, index) => {
            const Icon = getSocialIcon(link.platform);
            const colorClass = getPlatformColor(link.platform);
            const platformName = getPlatformName(link.platform, language);
            
            return (
              <a 
                key={link._id}
                href={link.url} 
                target="_blank" 
                rel="noopener noreferrer" 
                className="group relative animate-fade-in-up"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800 rounded-2xl shadow-lg transform rotate-1 group-hover:rotate-2 transition-all duration-300"></div>
                <div className="relative bg-white dark:bg-gray-800 rounded-2xl p-6 sm:p-8 shadow-lg border border-gray-100 dark:border-gray-700 transition-all duration-300 hover:shadow-xl hover:-translate-y-2 h-full flex flex-col items-center justify-between min-h-[280px]">
                  <div className="flex flex-col items-center justify-center w-full">
                    <div className={`bg-gradient-to-r ${colorClass} p-4 rounded-full mb-4 flex items-center justify-center group-hover:scale-110 transition-transform shadow-lg`}>
                      <Icon className="text-white text-3xl" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2 text-center">
                      {platformName}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 text-sm text-center mb-4">
                      {language === 'ar' ? `انضم إلينا على ${platformName} لتكون جزءاً من مجتمعنا` : `Join us on ${platformName} to be part of our community`}
                    </p>
                  </div>
                  <div className="w-full">
                    <div className="inline-flex items-center justify-center w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium py-2 px-4 rounded-xl transition-all duration-300 transform hover:scale-105">
                      <span>{t.visit}</span>
                      <FaArrowRight className={`mr-2 ${isRTL ? 'mr-2 rotate-180' : 'ml-2'}`} />
                    </div>
                  </div>
                </div>
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

// مكون قسم التطبيقات المميز (بدون Size و Downloads و Rating)
const AppsSection = ({ socialLinks, isRTL, language }: { socialLinks: SocialLink[], isRTL: boolean, language: string }) => {
  const translations = {
    ar: {
      title: "تطبيقاتنا",
      subtitle: "حمل تطبيقاتنا الآن واستمتع بتجربة أفضل على جميع الأجهزة",
      mobileApps: "تطبيق الموبايل",
      desktopApps: "تطبيق الكمبيوتر",
      download: "تحميل",
      features: "المميزات",
      available: "متاح الآن",
      secure: "آمن 100%",
      fast: "سريع",
      free: "مجاني"
    },
    en: {
      title: "Our Applications",
      subtitle: "Download our app now and enjoy a better experience on all devices",
      mobileApps: "Mobile App",
      desktopApps: "Desktop App",
      download: "Download",
      features: "Features",
      available: "Available Now",
      secure: "100% Secure",
      fast: "Fast",
      free: "Free"
    }
  };
  
  const t = translations[language === 'ar' ? 'ar' : 'en'];
  
  // فلترة التطبيقات
  const mobileApps = socialLinks.filter(link => 
    ['mobile_app', 'app_store', 'google_play'].includes(link.platform)
  );
  
  const desktopApps = socialLinks.filter(link => 
    ['desktop_app', 'download_link', 'website'].includes(link.platform)
  );
  
  // بيانات وهمية للتطبيقات (يمكن استبدالها ببيانات حقيقية من MongoDB)
  const appData = {
    mobile: {
      icon: FaMobileAlt,
      color: 'from-blue-500 to-indigo-600',
      bgColor: 'from-blue-100 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-900/20',
      features: [t.secure, t.fast, t.free]
    },
    desktop: {
      icon: FaDesktop,
      color: 'from-purple-500 to-pink-600',
      bgColor: 'from-purple-100 to-pink-100 dark:from-purple-900/20 dark:to-pink-900/20',
      features: [t.secure, t.fast, t.free]
    }
  };
  
  if (mobileApps.length === 0 && desktopApps.length === 0) return null;
  
  // تحديد تخطيط الشبكة بناءً على عدد التطبيقات
  const getGridCols = () => {
    if (mobileApps.length > 0 && desktopApps.length > 0) return 'grid-cols-1 lg:grid-cols-2';
    return 'grid-cols-1';
  };
  
  return (
    <section className="mb-12 sm:mb-16 relative">
      {/* خلفية مميزة للقسم */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 rounded-3xl shadow-lg"></div>
      
      {/* عناصر زخرفية */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden rounded-3xl">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-gradient-to-r from-indigo-400 to-purple-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-gradient-to-r from-purple-400 to-pink-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-20 animate-pulse-slow" style={{ animationDelay: '1s' }}></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-r from-indigo-400 to-pink-400 rounded-full mix-blend-soft-light filter blur-3xl opacity-10 animate-pulse-slow" style={{ animationDelay: '2s' }}></div>
      </div>
      
      <div className="relative z-10 p-4 sm:p-6 md:p-8">
        <div className="text-center mb-8 sm:mb-12">
          <div className="inline-flex items-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-4 py-2 rounded-full mb-4 animate-fade-in-down shadow-lg">
            <FaRocket className="mr-2" />
            <span className="font-bold">{t.available}</span>
          </div>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent animate-fade-in-up">
            {t.title}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto text-sm sm:text-base animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            {t.subtitle}
          </p>
          <div className="w-20 sm:w-32 h-1 bg-gradient-to-r from-indigo-500 to-purple-500 mx-auto rounded-full mt-4 animate-fade-in-up" style={{ animationDelay: '0.4s' }}></div>
        </div>
        
        <div className={`grid ${getGridCols()} gap-8 sm:gap-12 max-w-6xl mx-auto`}>
          {/* قسم تطبيقات الموبايل */}
          {mobileApps.length > 0 && (
            <div className="group animate-fade-in-up">
              <div className="relative">
                {/* الخلفية المتحركة */}
                <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-3xl shadow-2xl transform rotate-2 group-hover:rotate-3 transition-all duration-500 opacity-20"></div>
                
                {/* المحتوى الرئيسي */}
                <div className={`relative bg-gradient-to-br ${appData.mobile.bgColor} rounded-3xl p-6 sm:p-8 shadow-xl border border-blue-200 dark:border-blue-800 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
                  {/* رأس القسم */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className={`bg-gradient-to-r ${appData.mobile.color} p-3 rounded-2xl mr-4 shadow-lg group-hover:scale-110 transition-transform`}>
                        <appData.mobile.icon className="text-white text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {t.mobileApps}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          iOS & Android
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <FaApple className="text-gray-600 dark:text-gray-400 text-xl" />
                      <FaGooglePlay className="text-gray-600 dark:text-gray-400 text-xl" />
                    </div>
                  </div>
                  
                  {/* المميزات */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {appData.mobile.features.map((feature, index) => (
                      <span key={index} className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <FaCheckCircle className="mr-1 text-green-500" />
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  {/* أزرار التحميل */}
                  <div className="space-y-3">
                    {mobileApps.map((app, index) => (
                      <a
                        key={app._id}
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center">
                          {app.platform === 'app_store' ? (
                            <FaApple className="mr-3 text-xl" />
                          ) : (
                            <FaGooglePlay className="mr-3 text-xl" />
                          )}
                          <span>{t.download}</span>
                        </div>
                        <FaArrowRight className={`transition-transform duration-300 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'}`} />
                        
                        {/* تأثير التوهج */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {/* قسم تطبيقات الكمبيوتر */}
          {desktopApps.length > 0 && (
            <div className="group animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
              <div className="relative">
                {/* الخلفية المتحركة */}
                <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-pink-400 rounded-3xl shadow-2xl transform -rotate-2 group-hover:-rotate-3 transition-all duration-500 opacity-20"></div>
                
                {/* المحتوى الرئيسي */}
                <div className={`relative bg-gradient-to-br ${appData.desktop.bgColor} rounded-3xl p-6 sm:p-8 shadow-xl border border-purple-200 dark:border-purple-800 transition-all duration-500 hover:shadow-2xl hover:-translate-y-2`}>
                  {/* رأس القسم */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className={`bg-gradient-to-r ${appData.desktop.color} p-3 rounded-2xl mr-4 shadow-lg group-hover:scale-110 transition-transform`}>
                        <appData.desktop.icon className="text-white text-2xl" />
                      </div>
                      <div>
                        <h3 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
                          {t.desktopApps}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Windows, Mac, Linux
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <FaWindows className="text-gray-600 dark:text-gray-400 text-xl" />
                      <FaApple className="text-gray-600 dark:text-gray-400 text-xl" />
                      <FaLinux className="text-gray-600 dark:text-gray-400 text-xl" />
                    </div>
                  </div>
                  
                  {/* المميزات */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {appData.desktop.features.map((feature, index) => (
                      <span key={index} className="bg-white dark:bg-gray-800 px-3 py-1 rounded-full text-xs font-medium text-gray-700 dark:text-gray-300 flex items-center">
                        <FaCheckCircle className="mr-1 text-green-500" />
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  {/* أزرار التحميل */}
                  <div className="space-y-3">
                    {desktopApps.map((app, index) => (
                      <a
                        key={app._id}
                        href={app.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group relative flex items-center justify-between bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-bold py-3 px-4 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg"
                        style={{ animationDelay: `${index * 0.1}s` }}
                      >
                        <div className="flex items-center">
                          <FaDownload className="mr-3 text-xl" />
                          <span>{t.download}</span>
                        </div>
                        <FaArrowRight className={`transition-transform duration-300 group-hover:${isRTL ? '-translate-x-1' : 'translate-x-1'}`} />
                        
                        {/* تأثير التوهج */}
                        <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"></div>
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        {/* شعار الأمان */}
        <div className="text-center mt-8 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
          <div className="inline-flex items-center bg-white dark:bg-gray-800 px-4 py-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
            <FaShieldAlt className="text-green-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t.secure} • {t.fast} • {t.free}
            </span>
          </div>
        </div>
      </div>
    </section>
  );
};

// مكون المحتوى الرئيسي
function FollowUsContent() {
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(true);
  const [language, setLanguage] = useState('ar');
  const [mounted, setMounted] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<number>(Date.now());

  useEffect(() => {
    setMounted(true);
    
    // التحقق من تفضيل اللغة المحفوظ في localStorage
    const savedLanguage = localStorage.getItem('language');
    let detectedLanguage = 'ar'; // default to Arabic
    
    if (savedLanguage !== null) {
      detectedLanguage = savedLanguage;
    } else {
      // إذا لم يكن هناك تفضيل محفوظ، استخدم لغة المتصفح
      const browserLang = navigator.language || (navigator as unknown as { userLanguage: string }).userLanguage || '';
      detectedLanguage = browserLang.includes('ar') ? 'ar' : 'en';
    }
    
    setLanguage(detectedLanguage);
    setIsRTL(detectedLanguage === 'ar');
    
    // تطبيق اتجاه الصفحة بناءً على اللغة
    document.documentElement.dir = detectedLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = detectedLanguage;
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const fetchData = async () => {
      try {
        setLoading(true);
        console.log("Fetching social links for language:", language);
        
        // جلب الروابط الاجتماعية من MongoDB
        const linksData = await fetchSocialLinksFromMongoDB();
        console.log("Social links data:", linksData);
        setSocialLinks(linksData);
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [language, mounted]);

  // إضافة تأثير التحديث التلقائي باستخدام SSE
  useEffect(() => {
    if (!mounted) return;
    
    // إنشاء اتصال EventSource للاستماع إلى تحديثات SSE
    const eventSource = new EventSource('/api/stream');
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        console.log('Received SSE update:', data);
        
        // تحديث البيانات عند تلقي إشعار بتغيير في الروابط الاجتماعية
        if (
          data.type === 'change' && data.collection === 'socialLinks' ||
          data.type === 'socialLinkCreated' ||
          data.type === 'socialLinkUpdated' ||
          data.type === 'socialLinkDeleted'
        ) {
          console.log('Updating social links due to change notification');
          setLastUpdate(Date.now());
          
          // جلب البيانات المحدثة
          fetchSocialLinksFromMongoDB().then(linksData => {
            setSocialLinks(linksData);
          }).catch(error => {
            console.error('Error fetching updated social links:', error);
          });
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    eventSource.onerror = (error) => {
      console.error('SSE error:', error);
      eventSource.close();
      
      // إعادة محاولة الاتصال بعد 5 ثوانٍ
      setTimeout(() => {
        console.log('Attempting to reconnect to SSE...');
        const newEventSource = new EventSource('/api/stream');
        newEventSource.onmessage = eventSource.onmessage;
        newEventSource.onerror = eventSource.onerror;
      }, 5000);
    };
    
    return () => {
      eventSource.close();
    };
  }, [mounted]);

  // إضافة مؤقت للتحديث الدوري كنسخة احتياطية
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      console.log('Periodic refresh check');
      fetchSocialLinksFromMongoDB().then(linksData => {
        setSocialLinks(linksData);
      }).catch(error => {
        console.error('Error during periodic refresh:', error);
      });
    }, 60000); // تحديث كل دقيقة
    
    return () => clearInterval(interval);
  }, [mounted]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 min-h-screen overflow-x-hidden">
      <div className="container mx-auto px-4 pt-24 pb-12 max-w-6xl">
        {/* الهيرو الجديد بالكامل */}
        <HeroSection language={language} />
        
        {/* قسم يوتيوب المميز */}
        <YouTubeSection socialLinks={socialLinks} isRTL={isRTL} language={language} />
        
        {/* قسم المنصات الجديد */}
        <PlatformsSection socialLinks={socialLinks} isRTL={isRTL} language={language} />
        
        {/* قسم التطبيقات المميز (بدون Size و Downloads و Rating) */}
        <AppsSection socialLinks={socialLinks} isRTL={isRTL} language={language} />
      </div>
      
      {/* إضافة الأنماط العامة للصفحة */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
        .animate-bounce-slow {
          animation: bounce-slow 2s infinite;
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        .animate-float {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes fade-in-down {
          0% { opacity: 0; transform: translateY(-20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-down {
          animation: fade-in-down 0.6s ease-out;
        }
        @keyframes fade-in-up {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fade-in-up 0.6s ease-out;
        }
      `}</style>
    </div>
  );
}

// مكون الصفحة الرئيسي مع Suspense
const FollowUsPage = () => {
  return (
    <Suspense fallback={<div className="flex justify-center items-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
    </div>}>
      <FollowUsContent />
    </Suspense>
  );
};

export default FollowUsPage;