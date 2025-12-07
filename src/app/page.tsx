"use client";

import Image from 'next/image';
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Pagination, Autoplay } from 'swiper/modules';
import "swiper/css";
import "swiper/css/pagination";

import { useLanguage } from '@/components/Language/LanguageProvider';

// Define the HeroSlider interface directly in this file
interface HeroSlider {
  _id: string;
  mediaType: 'image' | 'video';
  image?: string;
  imageEn?: string;
  videoUrl?: string;
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  link?: {
    url: string;
    text: string;
    textEn?: string;
  };
}

// الترجمات
const translations = {
  ar: {
    platformName: "فذلكة",
    noFaqs: "لا يوجد محتوى مميز حالياً",
    newContentTitle: "المحتوى الجديد",
    dynamicDescriptions: [
      "اكتشف عالماً من المعرفة المبسطة والممتعة",
      "تعلم المفاهيم المعقدة بطريقة سهلة ومبسطة",
      "انضم إلى مجتمع المتعلمين والمثقفين",
      "استمتع بمحتوى تعليمي عالي الجودة",
      "طور مهاراتك مع أفضل الشرح والتفصيل",
      "احصل على ملخصات سريعة لأهم الأفكار العلمية",
      "استكشف قصصاً وسيناريوهات تطبيقية للعلم",
      "تعمق في المعرفة بمصادر وروابط موثوقة"
    ],
  },
  en: {
    platformName: "fazlaka",
    noFaqs: "No featured content available at the moment",
    newContentTitle: "New Content",
    dynamicDescriptions: [
      "Discover a world of simplified and enjoyable knowledge",
      "Learn complex concepts in an easy and simplified way",
      "Join a community of learners and intellectuals",
      "Enjoy high-quality educational content",
      "Develop your skills with best explanations",
      "Get quick summaries of important scientific ideas",
      "Explore applied stories and scenarios of science",
      "Dive deeper into knowledge with trusted sources"
    ],
  }
};

// دالة مساعدة لاستخراج معرف الفيديو
function extractVideoId(url: string): string | null {
  const youtubeRegex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) return youtubeMatch[1];
  
  const vimeoRegex = /vimeo\.com\/(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) return vimeoMatch[1];
  
  return null;
}

// دالة محسنة للحصول على النص المترجم
function getLocalizedTextEnhanced(arText?: string, enText?: string, language?: string): string {
  if (language === 'en') {
    return enText || arText || '';
  }
  return arText || enText || '';
}

// مكون أنيميشن الكتابة
const TypingAnimation = ({ text, className = "", speed = 50, deleteSpeed = 25, initialDelay = 0 }: { 
  text: string, 
  className?: string, 
  speed?: number, 
  deleteSpeed?: number, 
  initialDelay?: number 
}) => {
  const [displayedText, setDisplayedText] = useState('');
  const [targetText, setTargetText] = useState(text);
  const [isDeleting, setIsDeleting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);

  useEffect(() => {
    const startTimeout = setTimeout(() => {
      setTargetText(text);
      setHasStarted(true);
    }, initialDelay);
    return () => clearTimeout(startTimeout);
  }, [initialDelay]);

  useEffect(() => {
    if (!hasStarted) return;
    if (text === targetText) return;
    if (!isDeleting && text.startsWith(displayedText)) {
      setTargetText(text);
    } else {
      setIsDeleting(true);
    }
  }, [text, targetText, isDeleting, displayedText, hasStarted]);

  useEffect(() => {
    if (!hasStarted) return;
    const handleTick = () => {
      setDisplayedText(current => {
        if (isDeleting) {
          if (current.length > 0) {
            return current.substring(0, current.length - 1);
          }
        } else {
          if (current.length < targetText.length) {
            return targetText.substring(0, current.length + 1);
          }
        }
        return current;
      });
    };
    const currentSpeed = isDeleting ? deleteSpeed : speed;
    const timeout = setTimeout(handleTick, currentSpeed);
    return () => clearTimeout(timeout);
  }, [displayedText, targetText, isDeleting, speed, deleteSpeed, hasStarted]);

  useEffect(() => {
    if (isDeleting && displayedText === '') {
      setIsDeleting(false);
      setTargetText(text);
    }
  }, [isDeleting, displayedText, text]);

  return (
    <span className={className}>
      {displayedText}
      {(isDeleting || displayedText.length < targetText.length) && (
        <span className="inline-block w-0.5 h-5 bg-cyan-400 animate-pulse"></span>
      )}
    </span>
  );
};

// مكون مؤشر التحميل
const VideoLoader = () => (
  <div className="absolute inset-0 flex items-center justify-center bg-black/20 z-10">
    <div className="relative">
      <div className="w-16 h-16 rounded-full border-4 border-gray-200"></div>
      <div className="absolute top-0 left-0 w-16 h-16 rounded-full border-4 border-transparent border-t-cyan-400 border-r-blue-500 animate-spin"></div>
      <div className="absolute inset-2 rounded-full border-4 border-transparent border-b-blue-500 border-l-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
    </div>
  </div>
);

// مكون الفيديو المحسّن
const OptimizedVideo = ({ 
  src, 
  poster, 
  className = "", 
  autoPlay = true, 
  muted = true, 
  loop = true, 
  playsInline = true,
  priority = false
}: { 
  src: string, 
  poster?: string, 
  className?: string, 
  autoPlay?: boolean, 
  muted?: boolean, 
  loop?: boolean, 
  playsInline?: boolean,
  priority?: boolean
}) => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoaded, setIsLoaded] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleCanPlay = () => {
      setIsLoading(false);
      setIsLoaded(true);
    };

    const handleLoadStart = () => {
      setIsLoading(true);
      setIsLoaded(false);
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('loadstart', handleLoadStart);

    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('loadstart', handleLoadStart);
    };
  }, []);

  useEffect(() => {
    if (priority && videoRef.current) {
      videoRef.current.load();
    }
  }, [priority]);

  return (
    <div className={`relative ${className}`}>
      {isLoading && <div className="absolute inset-0 z-10"><VideoLoader /></div>}
      {!isLoaded && poster && (
        <Image src={poster} alt="Video poster" fill className="object-cover" priority={priority} sizes="100vw" />
      )}
      <video
        ref={videoRef}
        className={`w-full h-full object-cover transition-opacity duration-1000 ${isLoaded ? 'opacity-100' : 'opacity-0'}`}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline={playsInline}
        poster={poster}
        preload={priority ? "auto" : "metadata"}
      >
        <source src={src} type="video/mp4" />
        Your browser does not support the video tag.
      </video>
    </div>
  );
};

// مكون سلايدر المحتوى المميز
const HeroSliderComponent = ({ refreshTrigger }: { refreshTrigger?: number }) => {
  const { language } = useLanguage();
  const t = translations[language];  
  const [sliders, setSliders] = useState<HeroSlider[]>([]);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!mounted) return;
    
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, [mounted]);

  // دالة لتحميل البيانات
  const fetchSliders = async () => {
    try {
      const res = await fetch(`/api/hero-sliders?lang=${language}`);
      if (!res.ok) throw new Error('Failed to fetch');
      const data = await res.json();
      setSliders(data);
    } catch (error) {
      console.error('Error loading featured hero sliders:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!mounted) return;
    fetchSliders();
  }, [language, refreshTrigger, mounted]);

  // إعداد EventSource للاستماع إلى تحديثات SSE
  useEffect(() => {
    if (!mounted) return;
    
    // إغلاق الاتصال الحالي إذا كان موجوداً
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    // إلغاء أي إعادة اتصال مجدولة
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    // دالة لإعداد اتصال SSE
    const setupEventSource = () => {
      try {
        eventSourceRef.current = new EventSource('/api/stream');
        
        eventSourceRef.current.onopen = () => {
          console.log('SSE connection opened for hero sliders');
        };
        
        eventSourceRef.current.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('Hero slider SSE update:', data);
            
            // التحقق من أن التغيير يتعلق بالهيرو سلايدر
            const coll = (data.collection || '').toString().toLowerCase();
            if (
              (data.type === 'change' && coll === 'herosliders') ||
              data.type === 'heroSliderCreated' ||
              data.type === 'heroSliderUpdated' ||
              data.type === 'heroSliderDeleted'
            ) {
              console.log('Updating hero sliders due to change notification');
              fetchSliders(); // تحديث البيانات مباشرة
            }
          } catch (error) {
            console.error('Error parsing SSE message for hero sliders:', error);
          }
        };
        
        eventSourceRef.current.onerror = (error) => {
          console.error('Hero sliders SSE connection error:', error);
          // إغلاق الاتصال الحالي
          if (eventSourceRef.current) {
            eventSourceRef.current.close();
          }
          // إعادة الاتصال بعد فترة قصيرة مع تراجع أسي
          const backoffTime = Math.min(1000 * Math.pow(2, reconnectTimeoutRef.current ? 1 : 0), 30000);
          reconnectTimeoutRef.current = setTimeout(setupEventSource, backoffTime);
        };
      } catch (error) {
        console.error('Error setting up hero sliders SSE:', error);
        // إعادة المحاولة بعد فترة
        reconnectTimeoutRef.current = setTimeout(setupEventSource, 5000);
      }
    };
    
    setupEventSource();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [language, mounted]);

  if (loading) {
    return (
      <div className="w-full h-full flex items-center justify-center">
        <div className="relative">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
          <div className="absolute inset-0 rounded-full h-8 w-8 border-t-2 border-b-2 border-cyan-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '1.5s' }}></div>
        </div>
      </div>
    );
  }

  if (sliders.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-black/20 backdrop-blur-sm rounded-lg">
        <p className="text-white text-xs">{t.noFaqs}</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full ${isMobile ? '' : 'max-w-lg'}`}>
      <Swiper
        modules={[Autoplay, Pagination]}
        spaceBetween={0}
        slidesPerView={1}
        autoplay={{
          delay: isMobile ? 7000 : 5000,
          disableOnInteraction: false,
          pauseOnMouseEnter: true,
        }}
        pagination={{
          clickable: true,
          dynamicBullets: true,
        }}
        className="hero-slider w-full h-full"
      >
        {sliders.map((slider, index) => (
          <SwiperSlide key={slider._id} className="relative">
            <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
              <div className="absolute inset-0 rounded-lg overflow-hidden shadow-lg">
                {slider.mediaType === 'image' && (
                  <div className="absolute inset-0">
                    <Image
                      src={language === 'ar' 
                        ? (slider.image || '/placeholder.png')
                        : (slider.imageEn || slider.image || '/placeholder.png')
                      }
                      alt={getLocalizedTextEnhanced(slider.title, slider.titleEn, language)}
                      fill
                      className="object-cover"
                      priority={index === 0}
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                  </div>
                )}
                
                {slider.mediaType === 'video' && (
                  <div className="absolute inset-0 w-full h-full overflow-hidden">
                    {slider.videoUrl ? (
                      <>
                        {slider.videoUrl.includes('youtube.com') || slider.videoUrl.includes('youtu.be') ? (
                          <iframe
                            src={`https://www.youtube.com/embed/${extractVideoId(slider.videoUrl)}?autoplay=1&mute=1&loop=1&playlist=${extractVideoId(slider.videoUrl)}&controls=0&showinfo=0&modestbranding=1&rel=0&iv_load_policy=3&cc_load_policy=0&fs=0&playsinline=1&disablekb=1`}
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        ) : slider.videoUrl.includes('vimeo.com') ? (
                          <iframe
                            src={`https://player.vimeo.com/video/${extractVideoId(slider.videoUrl)}?autoplay=1&muted=1&loop=1&controls=0&background=1`}
                            className="absolute inset-0 w-full h-full"
                            frameBorder="0"
                            allow="autoplay; fullscreen; picture-in-picture"
                            allowFullScreen
                          />
                        ) : (
                          <video
                            src={slider.videoUrl}
                            className="absolute inset-0 w-full h-full object-cover"
                            autoPlay
                            muted
                            loop
                            playsInline
                            preload="metadata"
                          />
                        )}
                      </>
                    ) : (
                      <div className="absolute inset-0 w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <p className="text-gray-500 dark:text-gray-400 text-xs">No video available</p>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                
                <div className="absolute inset-0 flex flex-col justify-end p-2 md:p-3">
                  <h3 className="text-xs md:text-sm font-bold text-white mb-1 drop-shadow-lg">
                    {getLocalizedTextEnhanced(slider.title, slider.titleEn, language)}
                  </h3>
                  
                  <p className="text-xs text-white/90 mb-2 drop-shadow-md line-clamp-1">
                    {getLocalizedTextEnhanced(slider.description, slider.descriptionEn, language)}
                  </p>
                  
                  <div className="flex gap-1">
                    {slider.link?.url && slider.link?.text && (
                      <Link
                        href={slider.link.url}
                        className="inline-flex items-center gap-1 bg-white text-indigo-600 px-1.5 py-0.5 rounded-full font-bold shadow-lg hover:bg-indigo-50 transition-all duration-300 text-xs"
                      >
                        {getLocalizedTextEnhanced(slider.link.text, slider.link.textEn, language)}
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
      
      <style jsx global>{`
        .hero-slider .swiper-pagination-bullet {
          background-color: rgba(255, 255, 255, 0.5);
          width: 4px;
          height: 4px;
          opacity: 0.7;
          transition: all 0.3s ease;
        }
        .hero-slider .swiper-pagination-bullet-active {
          background: white;
          width: 12px;
          border-radius: 2px;
          opacity: 1;
        }
      `}</style>
    </div>
  );
};

// مكون الهيرو
const HeroSection = ({ refreshTrigger }: { refreshTrigger?: number }) => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const [isMobile, setIsMobile] = useState(false);
  const [currentDescriptionIndex, setCurrentDescriptionIndex] = useState(0);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentDescriptionIndex((prev) => (prev + 1) % t.dynamicDescriptions.length);
    }, isMobile ? 6000 : 4000);
    return () => clearInterval(interval);
  }, [t.dynamicDescriptions.length, isMobile]);
  
  return (
    <div className="hero-container relative z-10">
      <div className="video-wrapper relative w-full overflow-hidden">
        {isMobile ? (
          <div className="relative w-full h-screen">
            <Image
              src="/heroMM.png"
              alt={t.platformName}
              fill
              className="object-cover"
              priority
              sizes="100vw"
              quality={85}
            />
          </div>
        ) : (
          <div className="relative w-full" style={{ paddingBottom: '56.25%' }}>
            <div className="absolute inset-0">
              <OptimizedVideo
                src="/hero.mp4"
                poster="/hero.png"
                className={`hero-video absolute inset-0 w-full h-full object-cover ${!isRTL ? 'video-mirror' : ''}`}
                autoPlay={true}
                muted={true}
                loop={true}
                playsInline={true}
                priority={true}
              />
            </div>
          </div>
        )}
        
        <div className="absolute inset-0 bg-black/40"></div>
        
        <div className="absolute inset-0 flex flex-col p-8 md:p-16">
          {isMobile && (
            <>
              <div className="flex flex-col items-center justify-center text-center text-white mb-8 mt-16">
                <h1 className={`hero-title text-5xl font-bold mb-6 mt-8 ${isRTL ? 'font-arabic' : ''}`}>
                  {t.platformName}
                </h1>
                
                <div className="text-lg opacity-90 drop-shadow-md h-8 mb-8">
                  <TypingAnimation 
                    text={t.dynamicDescriptions[currentDescriptionIndex]} 
                    className="hero-description"
                    speed={40}
                    deleteSpeed={20}
                    initialDelay={500}
                  />
                </div>
              </div>
            </>
          )}
          
          {!isMobile && (
            <>
              <div className="w-full flex justify-start mt-2 mb-8">
                <div className="max-w-lg flex flex-col items-start">
                  <div className="w-full text-center mb-4">
                    <h1 className={`hero-title text-3xl md:text-4xl font-bold mb-3 mt-8 ${isRTL ? 'font-arabic' : ''}`}>
                      {t.platformName}
                    </h1>
                    
                    <div className="text-base md:text-lg opacity-90 drop-shadow-md h-6">
                      <TypingAnimation 
                        text={t.dynamicDescriptions[currentDescriptionIndex]} 
                        className="hero-description"
                        speed={40}
                        deleteSpeed={20}
                        initialDelay={500}
                      />
                    </div>
                  </div>

                  <div className="w-full">
                    <HeroSliderComponent refreshTrigger={refreshTrigger} />
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

// القسم الجديد "المحتوى الجديد" للموبايل فقط
const NewContentSection = ({ refreshTrigger }: { refreshTrigger?: number }) => {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const [isMobile, setIsMobile] = useState(false);
  
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  if (!isMobile) return null;  
  return (
    <section className="relative w-full py-16">
      <div className="container mx-auto px-4">
        <div className="text-center">
          <h2 className={`text-3xl font-bold mb-4 ${isRTL ? 'font-arabic' : ''} hero-title`}>
            {t.newContentTitle}
          </h2>
          <div className="w-24 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 mx-auto mb-8"></div>
          <div className="w-full max-w-lg mx-auto">
            <HeroSliderComponent refreshTrigger={refreshTrigger} />
          </div>
        </div>
      </div>
    </section>
  );
};

// المكون الرئيسي
export default function Home() {
  const { language, isRTL } = useLanguage();
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [mounted, setMounted] = useState(false);
  const t = translations[language];

  useEffect(() => {
    setMounted(true);
  }, []);

  // إضافة مؤقت للتحديث الدوري كنسخة احتياطية (تم تقليل التكرار)
  useEffect(() => {
    if (!mounted) return;
    
    const interval = setInterval(() => {
      console.log('Periodic refresh check for hero sliders');
      setRefreshTrigger(prev => prev + 1);
    }, 300000); // تحديث كل 5 دقائق بدلاً من دقيقة
    
    return () => clearInterval(interval);
  }, [mounted]);
  
  return (
    <div className="antialiased bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-950 dark:to-gray-900 text-gray-900 dark:text-gray-100 min-h-screen flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <HeroSection refreshTrigger={refreshTrigger} />
      <NewContentSection refreshTrigger={refreshTrigger} />
      
      <style jsx global>{`
        /* أنماط الهيرو */
        .hero-container {
          position: relative;
          width: 100%;
          overflow: hidden;
          background-color: #000;
          z-index: 10;
        }

        .video-wrapper {
          position: relative;
          width: 100%;
        }

        .hero-video {
          object-fit: cover;
          width: 100%;
          height: 100%;
        }
        
        .video-mirror {
          transform: scaleX(-1);
        }
        
        .font-arabic {
          font-family: 'Noto Kufi Arabic', 'Cairo', sans-serif;
          letter-spacing: 0.02em;
        }
        
        .line-clamp-1 {
          overflow: hidden;
          display: -webkit-box;
          -webkit-line-clamp: 1;
          -webkit-box-orient: vertical;
        }

        /* === أنماط العنوان والوصف الجديدة === */
        .hero-title {
          background: linear-gradient(90deg, #22d3ee, #3b82f6, #8b5cf6);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 2px 2px 0px rgba(59, 130, 246, 0.5), 4px 4px 0px rgba(0, 0, 0, 0.3);
        }

        .hero-description {
          background: linear-gradient(90deg, #a5f3fc, #93c5fd);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.5);
        }
      `}</style>
    </div>
  );
}