"use client";

import Image from 'next/image';
import React, { useState, useEffect, useRef, ReactNode } from 'react';
import Link from 'next/link';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import "swiper/css";
import "swiper/css/pagination";
import { useLanguage } from '@/components/Language/LanguageProvider';
import { useSession } from 'next-auth/react';

// --- Interfaces ---
interface HeroSlider { 
  id: string; 
  mediaType: 'IMAGE' | 'VIDEO'; 
  image?: string; 
  imageEn?: string; 
  videoUrl?: string; 
  title?: string; 
  titleEn?: string; 
  linkUrl?: string; 
  linkText?: string; 
  linkTextEn?: string; 
}
interface Episode { id: string; slug: string; localizedTitle?: string; localizedThumbnailUrl?: string; }
interface Article { id: string; slug: string; localizedTitle?: string; localizedExcerpt?: string; localizedFeaturedImageUrl?: string; }
interface FAQ { id: string; localizedQuestion?: string; localizedAnswer?: string; }

// --- Translations ---
const translations = {
  ar: {
    platformName: "فذلكة",
    slogan: "نُبسّط المعرفة.. لنصنع عقولاً واعية.",
    subSlogan: "منصة علمية عربية تقدم المحتوى العميق بأسلوب مبسط وجذاب.",
    explore: "استكشف المحتوى",
    latestEpisodes: "أحدث الحلقات",
    latestArticles: "أحدث المقالات",
    faqs: "الأسئلة الشائعة",
    viewAll: "عرض الكل",
    whyUs: "لماذا فذلكة؟",
    why_simplified: "تبسيط عميق",
    why_simplified_desc: "نحول المفاهيم المعقدة إلى أفكار سهلة وممتعة.",
    why_quality: "محتوى موثوق",
    why_quality_desc: "مصادر علمية دقيقة ومراجع واضحة لكل معلومة.",
    why_community: "مجتمع واعي",
    why_community_desc: "نقاشات هادفة وبيئة تعليمية محفزة.",
    newsletter_title: "ابقَ على اطلاع",
    newsletter_desc: "اشترك في نشرتنا البريدية ليصلك كل جديد فوراً.",
    newsletter_placeholder: "بريدك الإلكتروني",
    newsletter_btn: "اشترك",
    footer_rights: "جميع الحقوق محفوظة",
  },
  en: {
    platformName: "Fazlaka",
    slogan: "Simplifying Knowledge.. Creating Conscious Minds.",
    subSlogan: "An Arabic scientific platform delivering deep content in a simplified and engaging way.",
    explore: "Explore Content",
    latestEpisodes: "Latest Episodes",
    latestArticles: "Latest Articles",
    faqs: "FAQs",
    viewAll: "View All",
    whyUs: "Why Fazlaka?",
    why_simplified: "Deep Simplification",
    why_simplified_desc: "Turning complex concepts into easy, enjoyable ideas.",
    why_quality: "Reliable Content",
    why_quality_desc: "Accurate scientific sources and clear references.",
    why_community: "Conscious Community",
    why_community_desc: "Meaningful discussions and a stimulating environment.",
    newsletter_title: "Stay Updated",
    newsletter_desc: "Subscribe to our newsletter to receive updates instantly.",
    newsletter_placeholder: "Your email",
    newsletter_btn: "Subscribe",
    footer_rights: "All rights reserved",
  }
};

const getT = (lang: string) => translations[lang as keyof typeof translations] || translations.ar;
const getText = (ar?: string, en?: string, lang?: string) => lang === 'en' ? (en || ar || '') : (ar || en || '');

// --- Custom Hook for Scroll Animation ---
function useScrollAnimation() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => {
      if (ref.current) observer.unobserve(ref.current);
    };
  }, []);

  return [ref, isVisible] as const;
}

// --- Icons ---
const SimplifyIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/></svg>
);
const QualityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z"/></svg>
);
const CommunityIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/></svg>
);

// --- Skeleton Components ---
const Skeleton = ({ className }: { className: string }) => (
  <div className={`bg-slate-800/50 rounded-lg animate-pulse ${className}`}></div>
);

// --- Main Components ---

const HeroSection = () => {
  const { language, isRTL } = useLanguage();
  const t = getT(language);
  const [sliders, setSliders] = useState<HeroSlider[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/hero-slider?lang=${language}`)
      .then(res => res.json())
      .then(data => { setSliders(data || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [language]);

  return (
    <section className="relative min-h-screen w-full flex items-center justify-center bg-[#030712] overflow-hidden">
      {/* Advanced Background Effects */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-[radial-gradient(ellipse_at_center,rgba(6,182,212,0.15),transparent_70%)]"></div>
        <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-[#030712] to-transparent"></div>
        
        {/* Floating Orbs */}
        <div className="absolute top-1/4 left-1/4 w-4 h-4 bg-cyan-500 rounded-full blur-sm opacity-60 animate-bounce"></div>
        <div className="absolute bottom-1/3 right-1/4 w-3 h-3 bg-indigo-500 rounded-full blur-sm opacity-40 animate-bounce delay-1000"></div>
        
        {/* Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000,transparent)]"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-24 lg:py-0">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24 h-full">
          
          {/* Text Content */}
          <div className={`flex-1 flex flex-col justify-center text-center lg:text-left ${isRTL ? 'lg:order-2' : 'lg:order-1'}`}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 mb-8 self-center lg:self-start backdrop-blur-sm animate-fade-in-down">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              <span className="text-sm text-cyan-300 font-medium">{t.platformName}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold text-white leading-tight tracking-tight mb-6 animate-fade-in-up">
              <span className="bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                {t.slogan.split('..')[0]}
              </span>
              <br />
              <span className="bg-gradient-to-r from-cyan-400 via-sky-400 to-indigo-500 bg-clip-text text-transparent">
                {t.slogan.split('..')[1]}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-slate-400 max-w-2xl mb-10 leading-relaxed font-light animate-fade-in-up delay-100">
              {t.subSlogan}
            </p>

            <div className="flex gap-4 justify-center lg:justify-start animate-fade-in-up delay-200">
              <Link href="/episodes" className="group relative px-8 py-4 bg-gradient-to-r from-cyan-500 to-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-500/25 transition-all hover:shadow-indigo-500/40 hover:-translate-y-0.5 flex items-center gap-2 overflow-hidden">
                <span className="relative z-10">{t.explore}</span>
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 relative z-10 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              </Link>
            </div>
          </div>

          {/* Slider Section */}
          <div className={`flex-1 w-full relative ${isRTL ? 'lg:order-1' : 'lg:order-2'}`}>
            <div className="relative w-full max-w-xl mx-auto">
              {/* Glow Effect Behind Card */}
              <div className="absolute -inset-4 bg-gradient-to-tr from-cyan-500 to-indigo-600 rounded-[2.5rem] blur-3xl opacity-20 scale-95 group-hover:scale-100 transition-transform duration-500"></div>
              
              <div className="relative aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10 bg-black/40 backdrop-blur-xl">
                
                {loading ? (
                  <Skeleton className="w-full h-full" />
                ) : sliders.length > 0 ? (
                  <Swiper modules={[Autoplay, Pagination]} spaceBetween={0} slidesPerView={1} autoplay={{ delay: 6000 }} pagination={{ clickable: true, dynamicBullets: true }} className="w-full h-full">
                    {sliders.map((slide) => (
                      <SwiperSlide key={slide.id} className="relative w-full h-full">
                        {slide.mediaType === 'VIDEO' && slide.videoUrl ? (
                          <video src={slide.videoUrl} className="w-full h-full object-cover" autoPlay muted loop playsInline />
                        ) : (
                          <Image src={language === 'ar' ? slide.image! : slide.imageEn || slide.image!} alt={getText(slide.title, slide.titleEn, language)} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent opacity-90"></div>
                        <div className="absolute inset-0 flex flex-col justify-end p-6 md:p-8">
                          <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{getText(slide.title, slide.titleEn, language)}</h3>
                          {slide.linkUrl && (
                            <Link href={slide.linkUrl} className="inline-flex items-center gap-2 text-cyan-300 text-sm font-semibold hover:text-cyan-200 transition-colors self-start">
                              {getText(slide.linkText, slide.linkTextEn, language)}
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                            </Link>
                          )}
                        </div>
                      </SwiperSlide>
                    ))}
                  </Swiper>
                ) : (
                  <div className="w-full h-full bg-slate-900 flex items-center justify-center text-gray-500">No Content</div>
                )}
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

// Wrapper for Section Animation
const AnimatedSection = ({ children, className }: { children: ReactNode, className?: string }) => {
  const [ref, isVisible] = useScrollAnimation();
  return (
    <div ref={ref} className={`transition-all duration-1000 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'} ${className}`}>
      {children}
    </div>
  );
};

const WhyUsSection = () => {
  const { language } = useLanguage();
  const t = getT(language);

  const features = [
    { key: 'why_simplified', Icon: SimplifyIcon, color: 'text-cyan-400', bgGradient: 'from-cyan-500/10 to-transparent' },
    { key: 'why_quality', Icon: QualityIcon, color: 'text-indigo-400', bgGradient: 'from-indigo-500/10 to-transparent' },
    { key: 'why_community', Icon: CommunityIcon, color: 'text-purple-400', bgGradient: 'from-purple-500/10 to-transparent' },
  ];

  return (
    <AnimatedSection className="py-24 bg-[#030712] relative overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-4">{t.whyUs}</h2>
          <div className="w-20 h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 mx-auto rounded-full"></div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <div key={f.key} className={`group relative p-8 rounded-3xl border border-white/5 backdrop-blur-sm transition-all duration-500 hover:-translate-y-3 hover:border-white/10 overflow-hidden`}
                 style={{ transitionDelay: `${i * 100}ms` }}>
              
              {/* Shine effect on hover */}
              <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-tr from-white/5 to-transparent"></div>
              
              <div className={`relative z-10`}>
                <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-br ${f.bgGradient} ${f.color} mb-6`}>
                  <f.Icon />
                </div>
                <h3 className="text-2xl font-bold text-white mb-3">{t[f.key as keyof typeof t]}</h3>
                <p className="text-slate-400 leading-relaxed">{t[`${f.key}_desc` as keyof typeof t]}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

const LatestEpisodes = () => {
  const { language } = useLanguage();
  const t = getT(language);
  const [eps, setEps] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/episodes?language=${language}`)
      .then(res => res.json())
      .then(data => { setEps(data.episodes || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [language]);

  return (
    <AnimatedSection className="py-24 bg-[#030712] relative">
      <div className="container mx-auto px-4 relative z-10">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">{t.latestEpisodes}</h2>
            <div className="w-16 h-1 bg-cyan-500 rounded-full"></div>
          </div>
          <Link href="/episodes" className="text-cyan-400 hover:text-cyan-300 text-sm font-semibold flex items-center gap-2 group">
            {t.viewAll} 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {loading ? (
            // Skeletons
            [...Array(4)].map((_, i) => (
              <div key={i} className="block">
                <Skeleton className="aspect-video mb-4" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ))
          ) : (
            eps.slice(0, 4).map((ep) => (
              <Link href={`/episodes/${ep.slug}`} key={ep.id} className="group block">
                <div className="relative aspect-video rounded-2xl overflow-hidden bg-slate-800 border border-white/5 group-hover:border-cyan-500/50 transition-all duration-500 shadow-lg mb-4">
                  {ep.localizedThumbnailUrl && (
                    <Image src={ep.localizedThumbnailUrl} alt={ep.localizedTitle || ''} fill className="object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" />
                  )}
                  
                  {/* Gradient Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent"></div>
                  
                  {/* Play Button */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center shadow-xl transform scale-50 group-hover:scale-100 transition-transform border border-white/30">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white ml-1" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  </div>
                </div>
                <h3 className="text-white font-semibold text-lg group-hover:text-cyan-400 transition-colors line-clamp-2">{ep.localizedTitle}</h3>
              </Link>
            ))
          )}
        </div>
      </div>
    </AnimatedSection>
  );
};

const LatestArticles = () => {
  const { language } = useLanguage();
  const t = getT(language);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/articles?language=${language}`)
      .then(res => res.json())
      .then(data => { setArticles(data.articles || []); setLoading(false); })
      .catch(() => setLoading(false));
  }, [language]);

  return (
    <AnimatedSection className="py-24 bg-[#030712]">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">{t.latestArticles}</h2>
            <div className="w-16 h-1 bg-indigo-500 rounded-full"></div>
          </div>
          <Link href="/articles" className="text-indigo-400 hover:text-indigo-300 text-sm font-semibold flex items-center gap-2 group">
            {t.viewAll}
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
          </Link>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {loading ? (
             [...Array(3)].map((_, i) => (
               <div key={i} className="rounded-3xl overflow-hidden border border-white/5">
                 <Skeleton className="h-56 w-full" />
                 <div className="p-6 space-y-3">
                   <Skeleton className="h-6 w-3/4" />
                   <Skeleton className="h-4 w-full" />
                   <Skeleton className="h-4 w-5/6" />
                 </div>
               </div>
             ))
          ) : (
            articles.slice(0, 3).map(article => (
              <Link href={`/articles/${article.slug}`} key={article.id} className="group relative rounded-3xl overflow-hidden border border-white/5 hover:border-indigo-500/30 transition-all duration-500 hover:-translate-y-2 bg-gradient-to-b from-white/[0.03] to-transparent">
                <div className="relative h-56 bg-slate-800 overflow-hidden">
                  {article.localizedFeaturedImageUrl && (
                    <Image src={article.localizedFeaturedImageUrl} alt={article.localizedTitle || ''} fill className="object-cover opacity-80 group-hover:scale-110 group-hover:opacity-100 transition-all duration-700" />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#030712] via-transparent to-transparent"></div>
                </div>
                <div className="p-6 relative">
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-indigo-400 transition-colors line-clamp-2">{article.localizedTitle}</h3>
                  <p className="text-slate-400 text-sm line-clamp-3 leading-relaxed">{article.localizedExcerpt}</p>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </AnimatedSection>
  );
};

const MostViewed = () => {
  const { language } = useLanguage();
  interface PopularItem { contentId: string; contentType: string; slug?: string; title?: string; titleEn?: string | null; _sum?: { count: number }; item?: { thumbnailUrl?: string } | null }
  const [popularItems, setPopularItems] = useState<PopularItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const res = await fetch('/api/content/popular?type=EPISODE&limit=4');
        const data = await res.json();
        if (data.success) setPopularItems(data.data);
      } catch (err) {}
      setLoading(false);
    };
    fetchPopular();
  }, [language]);

  if (!loading && popularItems.length === 0) return null;

  return (
    <AnimatedSection className="py-24 bg-[#030712]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12" data-aos="fade-up">
          <h2 className="text-3xl md:text-4xl font-bold bg-gradient-to-l from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            {language === 'ar' ? 'الأكثر مشاهدة' : 'Most Viewed'}
          </h2>
          <p className="text-gray-400 mt-3 text-lg">
            {language === 'ar' ? 'أكثر الحلقات مشاهدة على المنصة' : 'Most watched episodes on the platform'}
          </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i}>
                <Skeleton className="aspect-video mb-3" />
                <Skeleton className="h-6 w-3/4" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {popularItems.map((item: PopularItem) => (
              <a
                key={item.contentId}
                href={`/episodes/${item.slug}`}
                className="group relative rounded-xl overflow-hidden bg-gray-800/50 border border-gray-700/50 hover:border-indigo-500/50 transition-all duration-300 hover:shadow-lg hover:shadow-indigo-500/10 hover:-translate-y-1"
              >
                <div className="aspect-video relative overflow-hidden">
                  <img
                    src={item.item?.thumbnailUrl || '/placeholder.jpg'}
                    alt={item.title || ''}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-transparent" />
                  <div className="absolute top-2 right-2 bg-indigo-500/80 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
                    {item._sum?.count || 0} {language === 'ar' ? 'مشاهدة' : 'views'}
                  </div>
                </div>
                <div className="p-4">
                  <h3 className="text-white font-semibold line-clamp-2 group-hover:text-indigo-400 transition-colors">
                    {language === 'ar' ? item.title : item.titleEn || item.title}
                  </h3>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </AnimatedSection>
  );
};

const NewsletterSection = () => {
  const { language } = useLanguage();
  const { data: session } = useSession();
  const t = getT(language);
  const [email, setEmail] = useState('');
  const [nlStatus, setNlStatus] = useState<'idle' | 'loading' | 'success' | 'existing' | 'error'>('idle');
  const [nlMsg, setNlMsg] = useState('');
  const [nlSubscribed, setNlSubscribed] = useState<boolean | null>(null);
  const [nlUnsubscribing, setNlUnsubscribing] = useState(false);

  useEffect(() => {
    if (!session?.user?.email) return;
    fetch(`/api/newsletter/preferences?email=${encodeURIComponent(session.user.email)}`)
      .then(res => res.json())
      .then(json => setNlSubscribed(json.data?.status === 'ACTIVE'))
      .catch(() => setNlSubscribed(false));
  }, [session?.user?.email]);

  const handleNLSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setNlStatus('error');
      setNlMsg(language === 'ar' ? 'بريد إلكتروني غير صحيح' : 'Invalid email');
      return;
    }
    setNlStatus('loading');
    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, language }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.message === 'AlreadySubscribed') {
          setNlSubscribed(true);
          setNlStatus('existing');
          setNlMsg(language === 'ar' ? 'أنت مشترك بالفعل!' : 'Already subscribed!');
        } else {
          setNlSubscribed(true);
          setNlStatus('success');
          setNlMsg(language === 'ar' ? 'تم الاشتراك! تحقق من بريدك' : 'Subscribed! Check your email');
          setEmail('');
        }
      } else {
        setNlStatus('error');
        setNlMsg(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
      }
    } catch {
      setNlStatus('error');
      setNlMsg(language === 'ar' ? 'حدث خطأ' : 'Something went wrong');
    }
  };

  const handleNLUnsubscribe = async () => {
    if (!session?.user?.email) return;
    setNlUnsubscribing(true);
    try {
      await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session.user.email }),
      });
      setNlSubscribed(false);
      setNlMsg(language === 'ar' ? 'تم إلغاء الاشتراك' : 'Unsubscribed');
      setNlStatus('success');
    } catch {}
    setNlUnsubscribing(false);
  };

  return (
    <AnimatedSection className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-600 via-cyan-600 to-cyan-500"></div>
      <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 mix-blend-overlay"></div>
      
      <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-indigo-900/50 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl"></div>

      <div className="container mx-auto px-4 relative z-10 text-center">
        {nlSubscribed === true ? (
          <div className="flex flex-col items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center">
              <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-2 drop-shadow-lg">
              {language === 'ar' ? 'أنت مشترك!' : 'You\'re subscribed!'}
            </h2>
            <p className="text-white/80 max-w-lg mx-auto text-lg">
              {language === 'ar' ? 'أنت مشترك في نشرتنا البريدية' : 'You are subscribed to our newsletter'}
            </p>
            <button
              onClick={handleNLUnsubscribe}
              disabled={nlUnsubscribing}
              className="mt-2 px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-sm transition-all border border-white/20 disabled:opacity-50"
            >
              {nlUnsubscribing ? '...' : (language === 'ar' ? 'إلغاء الاشتراك' : 'Unsubscribe')}
            </button>
          </div>
        ) : (
          <>
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-4 drop-shadow-lg">{t.newsletter_title}</h2>
            <p className="text-white/90 mb-10 max-w-lg mx-auto text-lg">{t.newsletter_desc}</p>

            <form onSubmit={handleNLSubmit} className="flex flex-col sm:flex-row gap-4 max-w-xl mx-auto">
              <input 
                type="email" 
                value={email}
                onChange={e => { setEmail(e.target.value); setNlStatus('idle'); }}
                placeholder={t.newsletter_placeholder}
                className="flex-1 px-6 py-4 rounded-xl bg-white/20 border border-white/30 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-white/60 backdrop-blur-md text-lg shadow-lg"
              />
              <button type="submit" disabled={nlStatus === 'loading'} className="px-8 py-4 bg-white text-indigo-600 rounded-xl font-bold hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl transform hover:-translate-y-0.5 disabled:opacity-70">
                {nlStatus === 'loading' ? (language === 'ar' ? 'جاري...' : 'Sending...') : t.newsletter_btn}
              </button>
            </form>

            {nlStatus !== 'idle' && nlStatus !== 'loading' && (
              <p className={`mt-4 text-sm ${nlStatus === 'success' || nlStatus === 'existing' ? 'text-green-200' : 'text-red-200'}`}>
                {nlMsg}
              </p>
            )}
          </>
        )}
      </div>
    </AnimatedSection>
  );
};

const FAQSection = () => {
  const { language } = useLanguage();
  const t = getT(language);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  useEffect(() => { 
    fetch(`/api/faqs?language=${language}`)
      .then(res => res.json())
      .then(data => setFaqs(data.data || [])); 
  }, [language]);

  return (
    <AnimatedSection className="py-24 bg-[#030712]">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-white mb-4">{t.faqs}</h2>
          <div className="w-20 h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500 mx-auto rounded-full"></div>
        </div>
        <div className="space-y-4">
          {faqs.map((faq, index) => (
            <div key={faq.id} className={`bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden transition-all duration-300 ${openIndex === index ? 'bg-white/[0.05] border-cyan-500/20' : ''}`}>
              <button 
                onClick={() => setOpenIndex(prev => prev === index ? null : index)} 
                className="w-full p-6 flex justify-between items-center text-white font-medium text-lg hover:text-cyan-400 transition-colors text-right"
              >
                <span>{faq.localizedQuestion}</span>
                <div className={`flex-shrink-0 w-8 h-8 rounded-full border border-white/10 flex items-center justify-center transition-transform duration-300 ${openIndex === index ? 'rotate-180 bg-cyan-500/10 border-cyan-500/30' : ''}`}>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </div>
              </button>
              <div className={`overflow-hidden transition-all duration-500 ease-in-out ${openIndex === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}`}>
                <div className="px-6 pb-6 text-slate-400 leading-relaxed" dir={language === 'ar' ? 'rtl' : 'ltr'}>
                  {faq.localizedAnswer}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
};

const Footer = () => {
  const { language } = useLanguage();
  const t = getT(language);
  return (
    <footer className="py-8 border-t border-white/5 bg-[#030712]">
      <div className="container mx-auto px-4 text-center text-gray-500 text-sm">
        <p>&copy; {new Date().getFullYear()} {t.platformName}. {t.footer_rights}.</p>
      </div>
    </footer>
  );
};

// --- Main Page ---
export default function Home() {
  const { isRTL } = useLanguage();
  return (
    <div className={`min-h-screen bg-[#030712] text-white antialiased selection:bg-cyan-500/30 selection:text-cyan-200 ${isRTL ? 'rtl' : 'ltr'}`} dir={isRTL ? 'rtl' : 'ltr'}>
      <HeroSection />
      <WhyUsSection />
      <LatestEpisodes />
      <LatestArticles />
      <MostViewed />
      <NewsletterSection />
      <FAQSection />
      <Footer />
      
      <style jsx global>{`
        @keyframes fade-in-up {
          from { opacity: 0; transform: translate3d(0, 20px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        @keyframes fade-in-down {
          from { opacity: 0; transform: translate3d(0, -20px, 0); }
          to { opacity: 1; transform: translate3d(0, 0, 0); }
        }
        .animate-fade-in-up { animation: fade-in-up 0.8s ease-out forwards; }
        .animate-fade-in-down { animation: fade-in-down 0.8s ease-out forwards; }
        
        .delay-100 { animation-delay: 0.1s; }
        .delay-200 { animation-delay: 0.2s; }
        .delay-300 { animation-delay: 0.3s; }
        .delay-1000 { animation-delay: 1s; animation-duration: 3s; }

        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #030712; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #334155; }
        
        .line-clamp-2 { display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
        .line-clamp-3 { display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
      `}</style>
    </div>
  );
}