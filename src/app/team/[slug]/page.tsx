'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FaTwitter, FaFacebook, 
  FaInstagram, FaLinkedin, FaYoutube, FaTiktok, FaArrowLeft, 
  FaStar, FaCheckCircle, FaAward, FaSync
} from 'react-icons/fa';

import ContentRenderer from '@/components/Formats/ContentRenderer';

// تم إنشاء تعريف النوع هنا مباشرة لحل مشكلة عدم وجود ملف @/types/team
export interface TeamMember {
  _id: string;
  name?: string;
  nameEn?: string;
  role?: string;
  roleEn?: string;
  bio?: string;
  bioEn?: string;
  imageUrl?: string;
  imageUrlEn?: string;
  socialMedia?: {
    platform: string;
    url: string;
  }[];
  // أضف أي حقول أخرى إذا كانت ضرورية
}

// Helper function to get localized text
function getLocalizedText(arText: string | undefined, enText: string | undefined, language: 'ar' | 'en'): string {
  if (language === 'ar' && arText) return arText;
  if (language === 'en' && enText) return enText;
  return arText || enText || '';
}

// دالة لعرض أيقونة وسائل التواصل الاجتماعي
const renderSocialIcon = (platform: string) => {
  switch (platform) {
    case 'facebook':
      return <FaFacebook className="text-lg md:text-xl" />;
    case 'twitter':
      return <FaTwitter className="text-lg md:text-xl" />;
    case 'instagram':
      return <FaInstagram className="text-lg md:text-xl" />;
    case 'linkedin':
      return <FaLinkedin className="text-lg md:text-xl" />;
    case 'youtube':
      return <FaYoutube className="text-lg md:text-xl" />;
    case 'tiktok':
      return <FaTiktok className="text-lg md:text-xl" />;
    default:
      return <div className="w-4 h-4 rounded-full bg-white"></div>; // أيقونة افتراضية
  }
};

// دالة للحصول على لون خلفية أيقونة وسائل التواصل الاجتماعي
const getSocialIconColor = (platform: string) => {
  switch (platform) {
    case 'facebook':
      return 'bg-blue-600 hover:bg-blue-700';
    case 'twitter':
      return 'bg-sky-500 hover:bg-sky-600';
    case 'instagram':
      return 'bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90';
    case 'linkedin':
      return 'bg-blue-700 hover:bg-blue-800';
    case 'youtube':
      return 'bg-red-600 hover:bg-red-700';
    case 'tiktok':
      return 'bg-gray-900 hover:bg-black';
    default:
      return 'bg-gray-600 hover:bg-gray-700';
  }
};

export default function Page({ params }: { params: Promise<{ slug: string }> }) {
  const [member, setMember] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(true);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [mounted, setMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);
  
  useEffect(() => {
    setMounted(true);
    isMountedRef.current = true;

    const savedLanguage = localStorage.getItem('language');
    let detectedLanguage: 'ar' | 'en' = 'ar';
    
    if (savedLanguage) {
      detectedLanguage = savedLanguage === 'ar' ? 'ar' : 'en';
    } else {
      const browserLang = navigator.language || (navigator as unknown as { userLanguage: string }).userLanguage;
      detectedLanguage = browserLang.includes('ar') ? 'ar' : 'en';
    }
    
    setLanguage(detectedLanguage);
    setIsRTL(detectedLanguage === 'ar');
    
    document.documentElement.dir = detectedLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = detectedLanguage;

    return () => {
      isMountedRef.current = false;
    };
  }, []);
  
  // This effect handles data fetching and SSE setup.
  // It's self-contained to prevent infinite loops from unstable dependencies.
  useEffect(() => {
    if (!mounted) return;

    let isActive = true; // Flag to prevent state updates if the effect is cleaned up

    const initializeData = async () => {
      try {
        const { slug } = await params;
        if (!slug) return;

        const fetchData = async (isAutoUpdate = false) => {
          // Prevent updates if component is unmounted or effect is inactive
          if (!isMountedRef.current || !isActive) return;

          if (!isAutoUpdate) {
            setLoading(true);
          } else {
            setIsUpdating(true);
          }

          try {
            const response = await fetch(`/api/team/slug/${slug}`);
            if (!response.ok) {
              throw new Error('Failed to fetch team member');
            }
            const memberData = await response.json();
            
            if (isMountedRef.current && isActive) {
              setMember(memberData);
            }
          } catch (error) {
            console.error("Error fetching team member:", error);
            if (isMountedRef.current && isActive) {
              setMember(null);
            }
          } finally {
            if (isMountedRef.current && isActive) {
              setLoading(false);
              setIsUpdating(false);
            }
          }
        };

        // Initial data fetch
        await fetchData();

        // Setup Server-Sent Events for live updates
        const setupEventSource = () => {
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
          if (reconnectTimeoutRef.current) {
            clearTimeout(reconnectTimeoutRef.current);
          }

          eventSourceRef.current = new EventSource('/api/stream');
          
          eventSourceRef.current.onopen = () => console.log('SSE connection opened');
          
          eventSourceRef.current.onmessage = (event) => {
            if (!isActive || !isMountedRef.current) return;
            try {
              const data = JSON.parse(event.data);
              if (data.type === 'change' && data.collection === 'teams') {
                console.log('Change detected, refreshing member data...');
                fetchData(true); // Trigger a background update
              }
            } catch (error) {
              console.error('Error parsing SSE message:', error);
            }
          };
          
          eventSourceRef.current.onerror = () => {
            console.error('SSE connection error. Attempting to reconnect...');
            if (eventSourceRef.current) {
              eventSourceRef.current.close();
            }
            if (isActive && isMountedRef.current) {
              reconnectTimeoutRef.current = setTimeout(setupEventSource, 5000);
            }
          };
        };

        setupEventSource();

      } catch (error) {
        console.error("Initialization error:", error);
        if (isMountedRef.current && isActive) {
          setLoading(false);
          setMember(null);
        }
      }
    };

    initializeData();

    // Cleanup function
    return () => {
      isActive = false; // Deactivate this effect run
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [mounted, params]); // Dependencies are stable: `mounted` is a boolean, `params` is a stable object from Next.js.
  
  // الترجمات
  const translations = {
    ar: {
      loading: "جاري تحميل البيانات...",
      memberNotFound: "العضو غير موجود",
      memberNotFoundDesc: "لم نتمكن من العثور على العضو الذي تبحث عنه.",
      backToTeam: "العودة إلى صفحة الفريق",
      noInfo: "لا توجد معلومات متاحة عن هذا العضو.",
      contactMe: "تواصل معي",
      noSocialMedia: "لا توجد وسائل تواصل اجتماعي متاحة",
      updating: "جاري التحديث..."
    },
    en: {
      loading: "Loading data...",
      memberNotFound: "Member Not Found",
      memberNotFoundDesc: "We couldn't find member you're looking for.",
      backToTeam: "Back to Team Page",
      noInfo: "No information available about this member.",
      contactMe: "Contact Me",
      noSocialMedia: "No social media available",
      updating: "Updating..."
    }
  };
  
  const t = translations[language];
  
  if (loading && !isUpdating) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">{t.loading}</p>
        </div>
      </div>
    );
  }
  
  if (!member) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12 flex items-center">
        <div className="container mx-auto px-4 text-center">
          <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl p-6 md:p-8 max-w-md mx-auto">
            <div className="mb-6">
              <svg className="w-16 h-16 md:w-20 md:h-20 mx-auto text-gray-400 dark:text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 0118 0 9 9 0 01-18 0z" />
              </svg>
            </div>
            <h1 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-4">{t.memberNotFound}</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-6">{t.memberNotFoundDesc}</p>
            <Link href="/team" className={`inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 text-white font-medium py-2 px-4 md:py-2.5 md:px-6 rounded-lg transition-all shadow-lg hover:shadow-xl ${isRTL ? 'flex-row-reverse' : ''}`}>
              <FaArrowLeft />
              <span>{t.backToTeam}</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }
  
  const photoUrl = isRTL && member.imageUrl ? member.imageUrl : 
                  !isRTL && member.imageUrlEn ? member.imageUrlEn : 
                  member.imageUrl || member.imageUrlEn || "/placeholder.png";
  
  const name = getLocalizedText(member.name, member.nameEn, language);
  const role = getLocalizedText(member.role, member.roleEn, language);
  const bio = getLocalizedText(member.bio, member.bioEn, language) || t.noInfo;
  
  const hasSocialMedia = member.socialMedia && member.socialMedia.length > 0;
  
  const getHtmlContent = () => {
    const styledHtml = `
      <div class="prose prose-sm md:prose-base lg:prose-lg prose-indigo dark:prose-invert max-w-none" dir="${isRTL ? 'rtl' : 'ltr'}" lang="${language}">
        ${bio}
      </div>
    `;
    
    return styledHtml;
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 pt-24 pb-12">
      {isUpdating && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <FaSync className="h-5 w-5 animate-spin" />
          <span>{t.updating}</span>
        </div>
      )}
      
      <div className="container mx-auto px-4 max-w-6xl">
        <div className="bg-white dark:bg-gray-800 rounded-xl md:rounded-2xl shadow-xl overflow-hidden">
          <div className="relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600">
              <div className="absolute inset-0 bg-black/20"></div>
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-10 md:top-20 left-5 md:left-10 w-48 md:w-72 h-48 md:h-72 rounded-full bg-purple-500/20 blur-3xl"></div>
                <div className="absolute bottom-10 md:bottom-20 right-5 md:right-10 w-40 md:w-64 h-40 md:h-64 rounded-full bg-pink-500/20 blur-3xl"></div>
                <div className="absolute top-1/4 md:top-1/3 left-1/6 md:left-1/4 w-32 md:w-48 h-32 md:h-48 rounded-full bg-blue-500/20 blur-3xl"></div>
                <div className="absolute bottom-1/4 md:bottom-1/3 right-1/6 md:right-1/4 w-36 md:w-56 h-36 md:h-56 rounded-full bg-indigo-500/20 blur-3xl"></div>
              </div>
            </div>
            
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
            
            <div className="relative z-10 p-6 md:p-8 lg:p-12">
              <div className={`flex flex-col md:flex-row items-center gap-6 md:gap-8 lg:gap-12 ${isRTL ? 'md:flex-row-reverse' : ''}`}>
                <div className="flex-shrink-0 relative">
                  <div className="absolute -inset-4 bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 rounded-full blur-xl opacity-70 animate-pulse"></div>
                  
                  <div className="relative w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl z-10">
                    <Image 
                      src={photoUrl} 
                      alt={name} 
                      width={300} 
                      height={300}
                      className="w-full h-full object-cover" 
                      priority
                    />
                    
                    <div className="absolute bottom-2 md:bottom-3 right-2 md:right-3 bg-white rounded-full p-1 md:p-1.5 shadow-lg z-20">
                      <div className="w-3 h-3 md:w-4 md:h-4 rounded-full bg-green-500 animate-pulse"></div>
                    </div>
                    
                    <div className="absolute -top-1 md:-top-2 -right-1 md:-right-2 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full p-1.5 md:p-2 shadow-lg z-20">
                      <FaStar className="text-white text-sm md:text-lg" />
                    </div>
                  </div>
                </div>
                
                <div className="flex-1 text-center md:text-left">
                  <div className="mb-3 md:mb-4">
                    <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-white mb-2 md:mb-3 tracking-tight leading-tight">
                      {name}
                    </h1>
                    <div className={`w-16 md:w-24 h-1 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full ${isRTL ? 'mx-auto md:mr-0' : 'mx-auto md:ml-0'}`}></div>
                  </div>
                  
                  {role && (
                    <div className="mb-5 md:mb-8">
                      <div className={`inline-flex items-center gap-1.5 md:gap-2 bg-white/20 backdrop-blur-sm px-3 py-1.5 md:px-5 md:py-2.5 rounded-full border border-white/30 shadow-lg ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <FaAward className="text-yellow-300 text-base md:text-lg" />
                        <span className="text-base md:text-lg font-medium text-white">
                          {role}
                        </span>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 md:mt-6">
                    <div className={`flex flex-col ${isRTL ? 'items-end md:items-end' : 'items-start md:items-start'}`}>
                      <div className={`flex items-center gap-1.5 md:gap-2 mb-3 md:mb-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
                        <FaCheckCircle className="text-green-400 text-base md:text-lg" />
                        <span className="text-white font-medium text-sm md:text-base">{t.contactMe}</span>
                      </div>
                      
                      {hasSocialMedia ? (
                        <div className="flex flex-wrap justify-center md:justify-start gap-2 md:gap-3">
                          {member.socialMedia!.map((social, index) => (
                            <a 
                              key={index}
                              href={social.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className={`w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center text-white transition-all duration-300 transform hover:scale-110 hover:shadow-xl ${getSocialIconColor(social.platform)}`}
                              aria-label={`${isRTL ? 'تابعنا على' : 'Follow us on'} ${social.platform}`}
                            >
                              {renderSocialIcon(social.platform)}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <div className="text-white/70 text-xs md:text-sm bg-white/10 px-3 py-1.5 md:px-4 md:py-2 rounded-full">
                          {t.noSocialMedia}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="p-4 md:p-6 lg:p-10">
            <ContentRenderer htmlContent={getHtmlContent()} />
            
            <div className="mt-8 md:mt-12 pt-6 md:pt-8 border-t border-gray-200 dark:border-gray-700 text-center">
              <Link href="/team" className={`inline-flex items-center gap-2 md:gap-3 px-6 py-3 md:px-8 md:py-4 border border-transparent text-base md:text-lg font-semibold rounded-full shadow-lg text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all transform hover:scale-105 ${isRTL ? 'flex-row-reverse' : ''}`}>
                <FaArrowLeft className="text-lg md:text-xl" />
                <span>{t.backToTeam}</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}