"use client";

import React, { useState, useEffect, useRef, MouseEvent } from 'react';
import Image from 'next/image'; // إضافة استيراد مكون Image من Next.js
import { 
  Video, List, Users, Calendar, Heart, 
  Lightbulb, Rocket, TrendingUp, FileText, 
  Share2, ArrowDown, Fingerprint, Compass
} from 'lucide-react';

// --- Types ---
export interface TeamMember {
  _id?: string;
  nameAr?: string;
  nameEn?: string;
  roleAr?: string;
  roleEn?: string;
  bioAr?: string;
  bioEn?: string;
  image?: string;
  language?: 'ar' | 'en';
}

// --- Helpers ---
function getLocalizedText(arText: string | undefined, enText: string | undefined, language: 'ar' | 'en'): string {
  if (language === 'ar' && arText) return arText;
  if (language === 'en' && enText) return enText;
  return arText || enText || '';
}

// --- Social Icons (SVGs) ---
const YouTubeIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/></svg>;
const InstagramIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/></svg>;
const FacebookIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>;
const TiktokIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.49-3.35-3.98-5.6-1.1-4.96 2.4-9.92 7.29-10.45 1.05-.13 2.11-.06 3.16.14l.03 4.02c-.52-.16-1.06-.29-1.6-.32-1.68-.05-3.33.68-4.32 2.01-.98 1.33-1.06 3.14-.26 4.58 1.15 2.07 4.08 2.8 5.98 1.48 1.25-.86 1.99-2.29 2-3.81.01-3.69.01-7.39.01-11.08z"/></svg>;
const XIcon = () => <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>;

const socialLinks = [
  { href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA", icon: <YouTubeIcon />, label: "يوتيوب", color: "from-red-500 to-red-600" },
  { href: "https://www.instagram.com/fazlaka_platform/", icon: <InstagramIcon />, label: "انستجرام", color: "from-pink-500 to-purple-500" },
  { href: "https://www.facebook.com/profile.php?id=61579582675453", icon: <FacebookIcon />, label: "فيس بوك", color: "from-blue-500 to-blue-600" },
  { href: "https://www.tiktok.com/@fazlaka_platform", icon: <TiktokIcon />, label: "تيك توك", color: "from-gray-800 to-black" },
  { href: "https://x.com/FazlakaPlatform", icon: <XIcon />, label: "X", color: "from-sky-400 to-sky-600" },
];

// --- APIs ---
async function getMembers(language: string = 'ar'): Promise<TeamMember[]> {
  try {
    const response = await fetch(`/api/team?language=${language}`);
    if (!response.ok) throw new Error('Failed to fetch');
    const data = await response.json();
    const members = Array.isArray(data) ? data : (data.members || []);
    return members.map((member: TeamMember) => ({ ...member, language: language as 'ar' | 'en' })) || [];
  } catch (error) {
    console.error(error);
    return [];
  }
}

async function getSubscribers(): Promise<number | null> {
  try {
    const response = await fetch(
      `https://www.googleapis.com/youtube/v3/channels?part=statistics&id=UCWftbKWXqj0wt-UHMLAcsJA&key=AIzaSyBcPhsKTsQ7YGqKiP-eG6TZh2P9DKN1QnA`, 
      { cache: "no-store" }
    );
    if (!response.ok) return null;
    const data = await response.json();
    return data.items?.[0]?.statistics?.subscriberCount ? parseInt(data.items[0].statistics.subscriberCount, 10) : null;
  } catch { return null; }
}

// --- Hooks for Animation ---
const useScrollProgress = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const updateScroll = () => {
      const totalScroll = document.documentElement.scrollTop;
      const windowHeight = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scroll = totalScroll / windowHeight;
      setProgress(Number(scroll));
    }
    window.addEventListener('scroll', updateScroll);
    return () => window.removeEventListener('scroll', updateScroll);
  }, []);
  return progress;
}

const useParallax = (speed: number = 0.5) => {
  const [offset, setOffset] = useState(0);
  useEffect(() => {
    const handleScroll = () => requestAnimationFrame(() => setOffset(window.scrollY * speed));
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed]);
  return offset;
};

// --- Components ---

// Spotlight Effect Card
const SpotlightCard = ({ children, className = "", isActive = false }: { children: React.ReactNode, className?: string, isActive?: boolean }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setOpacity(1)}
      onMouseLeave={() => setOpacity(0)}
      className={`relative overflow-hidden rounded-2xl transition-all duration-500 border ${isActive ? 'border-blue-500/50 shadow-[0_0_30px_rgba(59,130,246,0.15)]' : 'border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900'} ${className}`}
    >
      <div
        className="pointer-events-none absolute -inset-px opacity-0 transition duration-300 z-10"
        style={{
          opacity,
          background: `radial-gradient(600px circle at ${position.x}px ${position.y}px, rgba(59, 130, 246, 0.1), transparent 40%)`,
        }}
      />
      <div className="relative z-20">{children}</div>
    </div>
  );
};

// Scroll Reveal with Stagger
const Reveal = ({ children, delay = 0, className = "" }: { children: React.ReactNode, delay?: number, className?: string }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        observer.unobserve(entry.target);
      }
    }, { threshold: 0.1, rootMargin: "0px 0px -50px 0px" });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div 
      ref={ref} 
      className={`transform transition-all duration-1000 cubic-bezier(0.17, 0.55, 0.55, 1) ${isVisible ? 'translate-y-0 opacity-100 scale-100' : 'translate-y-20 opacity-0 scale-95'} ${className}`} 
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
};

// Connected Timeline Node
interface TimelineNodeProps {
  icon: React.ComponentType<{ size?: number; className?: string }>;
  title: string;
  description: string;
  index: number;
  total: number;
}

const TimelineNode = ({ icon: Icon, title, description, index }: TimelineNodeProps) => {
  const [isActive, setIsActive] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      setIsActive(entry.isIntersecting);
    }, { threshold: 0.5 });
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref} className="relative flex flex-col md:flex-row items-stretch min-h-[300px] md:min-h-[250px] group">
      {/* Central Line Container */}
      <div className="absolute left-8 md:left-1/2 md:-ml-px h-full w-0.5 bg-gray-200 dark:bg-gray-800">
        {/* Animated Active Line */}
        <div className={`absolute top-0 left-0 w-full bg-gradient-to-b from-blue-500 via-purple-500 to-blue-500 transition-all duration-1000 ease-out ${isActive ? 'h-full opacity-100' : 'h-0 opacity-0'}`} />
      </div>

      {/* Node Point */}
      <div className={`absolute left-8 md:left-1/2 transform -translate-x-1/2 flex items-center justify-center w-12 h-12 rounded-full border-4 z-20 transition-all duration-500 ${isActive ? 'border-blue-500 bg-white dark:bg-gray-900 scale-110 shadow-[0_0_20px_rgba(59,130,246,0.5)]' : 'border-gray-300 dark:border-gray-700 bg-gray-100 dark:bg-gray-800'}`}>
        <Icon size={20} className={`transition-colors duration-500 ${isActive ? 'text-blue-500' : 'text-gray-400'}`} />
      </div>

      {/* Content Side */}
      <div className={`flex-1 pl-20 md:pl-0 py-8 md:py-0 ${index % 2 === 0 ? 'md:pr-16 md:text-right order-1' : 'md:pl-16 md:text-left order-3'}`}>
        <Reveal delay={100}>
          <SpotlightCard isActive={isActive} className={`p-6 md:p-8 h-full flex flex-col justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm ${index % 2 === 0 ? 'md:items-end' : 'md:items-start'}`}>
            <h3 className={`text-2xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r ${isActive ? 'from-blue-600 to-purple-600' : 'from-gray-800 to-gray-600 dark:from-gray-200 dark:to-gray-400'}`}>
              {title}
            </h3>
            <p className="text-gray-600 dark:text-gray-300 leading-relaxed text-lg font-medium font-arabic">
              {description}
            </p>
          </SpotlightCard>
        </Reveal>
      </div>

      {/* Empty Side for Balance */}
      <div className="hidden md:block flex-1 order-2" />
    </div>
  );
};

export default function AboutContent() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [subscribers, setSubscribers] = useState<number | null>(null);
  const [stats, setStats] = useState({ articles: 0, episodes: 0, playlists: 0, seasons: 0 });
  const [loading, setLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(true);
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  
  const heroOffset = useParallax(0.3);
  const scrollProgress = useScrollProgress();

  useEffect(() => {
    const init = async () => {
      const savedLang = localStorage.getItem('language') || 'ar';
      const isAr = savedLang === 'ar';
      setLanguage(isAr ? 'ar' : 'en');
      setIsRTL(isAr);
      document.documentElement.dir = isAr ? 'rtl' : 'ltr';

      try {
        const [mems, subs, arts, eps, lists, seas] = await Promise.all([
          getMembers(savedLang),
          getSubscribers(),
          fetch('/api/articles').then(r => r.json()),
          fetch('/api/episodes').then(r => r.json()),
          fetch('/api/playlists').then(r => r.json()),
          fetch('/api/seasons').then(r => r.json())
        ]);

        setMembers(mems);
        setSubscribers(subs);
        setStats({
          articles: (arts.articles || []).length,
          episodes: (eps.episodes || []).length,
          playlists: (lists.playlists || []).length,
          seasons: (seas.seasons || []).length
        });
      } catch (e) {
        console.error("Data load error", e);
      } finally {
        setLoading(false);
      }
    };
    init();
  }, []);

  // Egyptian Arabic Content - محتوى باللهجة المصرية
  const t = {
    ar: {
      heroTitle: "حكاية فذلكة.. لما الشغف يقلب جد",
      heroSubtitle: "من مجرد فكرة بسيطة لمنارة علم.. رحلتنا لسة بتبتدي، وانتو جزء منها.",
      scrollText: "عيش الحكاية",
      storySections: [
        {
          title: "ليه فذلكة؟",
          desc: "بدأنا عشان زهقنا من الكلام المكلكع والمعقد. قولنا لازم المعلومة توصل ببساطة، وتدخل القلب قبل العقل، من غير أي تعقيدات.",
          icon: Lightbulb
        },
        {
          title: "شايفين إيه لبكرة؟",
          desc: "نفسنا نكون المكان اللي أي حد عربي يدخله وهو مغمض يلاقي اللي بيدور عليه.. بنحلم نكون 'المرجع' بس بروح مصرية ولمسة عالمية.",
          icon: Compass
        },
        {
          title: "بنعمل إيه بالظبط؟",
          desc: "بناخد المعلومة الخام، ونطبخها على نار هادية في المطبخ الإبداعي بتاعنا، عشان تطلعلك في فيديو أو مقال يفتح النفس على التعلم.",
          icon: Rocket
        },
        {
          title: "مبادئنا خط أحمر",
          desc: "السالك بيمشي.. المصداقية عندنا أهم من التريند، والإبداع مالوش سقف، واحترام عقل المشاهد هو رأس مالنا الحقيقي.",
          icon: Fingerprint
        }
      ],
      teamTitle: "صنايعية الحكاية",
      teamDesc: "دول بقى الجنود المجهولة.. ناس بتشتغل بحب عشان تطلعلك المحتوى بالشكل ده.",
      statsTitle: "لغة الأرقام مابتكدبش",
      statsSubtitle: "كل رقم وراه ثقة ناس غالية علينا",
      joinUs: "تعالى وسطنا",
      followUs: "تابعنا وسيب الباقي علينا"
    },
    en: {
      heroTitle: "Fazlaka Story: When Passion Gets Real",
      heroSubtitle: "From a simple idea to a beacon of knowledge.. Our journey is just beginning, and you are part of it.",
      scrollText: "Live the Story",
      storySections: [
        {
          title: "Why Fazlaka?",
          desc: "We started because we were tired of complicated jargon. We believed knowledge must be delivered simply, reaching the heart before the mind.",
          icon: Lightbulb
        },
        {
          title: "Our Vision for Tomorrow",
          desc: "We dream of being the place any Arab turns to blindly to find what they seek.. To be 'The Reference' with an Egyptian soul and global touch.",
          icon: Compass
        },
        {
          title: "What Do We Actually Do?",
          desc: "We take raw information and cook it slowly in our creative kitchen, serving it as a video or article that whets your appetite for learning.",
          icon: Rocket
        },
        {
          title: "Our Non-Negotiable Values",
          desc: "Credibility is more important than trends. Creativity has no ceiling. Respecting the viewer's intellect is our true capital.",
          icon: Fingerprint
        }
      ],
      teamTitle: "The Story Craftsmen",
      teamDesc: "The unknown soldiers.. People working with love to deliver content this way.",
      statsTitle: "Numbers Don't Lie",
      statsSubtitle: "Behind every number is the trust of people we cherish",
      joinUs: "Join Us",
      followUs: "Follow Us"
    }
  }[isRTL ? 'ar' : 'en'];

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <div className="relative w-24 h-24">
        <div className="absolute inset-0 border-t-4 border-blue-500 rounded-full animate-spin"></div>
        <div className="absolute inset-2 border-t-4 border-purple-500 rounded-full animate-spin" style={{ animationDirection: 'reverse' }}></div>
      </div>
    </div>
  );

  return (
    <div className="bg-white dark:bg-gray-950 min-h-screen text-gray-800 dark:text-gray-100 overflow-x-hidden font-sans selection:bg-blue-500/30">
      
      {/* --- Progress Bar --- */}
      <div className="fixed top-0 left-0 h-1.5 bg-gray-200 dark:bg-gray-800 z-50 w-full">
         <div 
           className="h-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 transition-all duration-150 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]" 
           style={{ width: `${scrollProgress * 100}%` }}
         ></div>
      </div>

      {/* --- HERO SECTION --- */}
      <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
        {/* Animated Background */}
        <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20 pointer-events-none">
           <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
           <div className="absolute top-[40%] right-[20%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
           <div className="absolute bottom-[10%] left-[40%] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
           <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
        </div>

        <div className="relative z-10 max-w-5xl mx-auto space-y-8" style={{ transform: `translateY(${heroOffset * 0.5}px)` }}>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-black/30 backdrop-blur-md border border-gray-200 dark:border-gray-800 text-sm font-bold shadow-lg animate-fade-in-up">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">قصتنا في {new Date().getFullYear()}</span>
          </div>

          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-b from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 animate-fade-in-up delay-100 drop-shadow-sm">
            {t.heroTitle}
          </h1>

          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium animate-fade-in-up delay-200">
            {t.heroSubtitle}
          </p>

          <div className="pt-12 animate-bounce-slow opacity-80">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">{t.scrollText}</span>
              <ArrowDown className="text-gray-400" />
            </div>
          </div>
        </div>
      </section>

      {/* --- STORY TIMELINE SECTION (Connected) --- */}
      <section className="relative py-20 md:py-32 bg-gray-50/50 dark:bg-gray-900/50">
        <div className="container mx-auto px-4 max-w-5xl relative z-10">
          <div className="flex flex-col">
            {t.storySections.map((section, idx) => (
              <TimelineNode 
                key={idx}
                index={idx}
                total={t.storySections.length}
                icon={section.icon}
                title={section.title}
                description={section.desc}
              />
            ))}
          </div>
        </div>
      </section>

      {/* --- STATS SECTION (Glassmorphism) --- */}
      <section className="relative py-32 overflow-hidden">
        {/* Deep Space Background */}
        <div className="absolute inset-0 bg-[#0a0a0a]">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1451187580459-43490279c0fa?q=80&w=2072&auto=format&fit=crop')] bg-cover bg-center bg-fixed opacity-20 mix-blend-screen"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]"></div>
        </div>

        <div className="container mx-auto px-4 relative z-10 text-white">
          <Reveal>
            <div className="text-center mb-20">
              <div className="inline-block p-3 rounded-2xl bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
                <TrendingUp size={32} className="text-blue-400" />
              </div>
              <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
                {t.statsTitle}
              </h2>
              <p className="text-xl text-gray-400 font-medium max-w-2xl mx-auto">{t.statsSubtitle}</p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
            {[
              { val: stats.articles, label: isRTL ? "مقال مميز" : "Articles", icon: FileText, color: "blue" },
              { val: stats.episodes, label: isRTL ? "حلقة" : "Episodes", icon: Video, color: "purple" },
              { val: stats.playlists, label: isRTL ? "سلسلة كاملة" : "Playlists", icon: List, color: "pink" },
              { val: stats.seasons, label: isRTL ? "موسم" : "Seasons", icon: Calendar, color: "orange" },
            ].map((item, idx) => (
              <Reveal key={idx} delay={idx * 100}>
                <div className="group relative p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-500 hover:-translate-y-2 backdrop-blur-md overflow-hidden text-center">
                  <div className={`absolute inset-0 bg-gradient-to-br from-${item.color}-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500`}></div>
                  <item.icon className={`w-10 h-10 mx-auto mb-6 text-${item.color}-400 group-hover:scale-110 transition-transform duration-300`} />
                  <div className="text-5xl font-black mb-2 tracking-tight">{item.val}</div>
                  <div className="text-sm font-bold text-gray-400 uppercase tracking-widest">{item.label}</div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* --- TEAM SECTION (Spotlight Cards) --- */}
      {members.length > 0 && (
        <section className="py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 dark:from-blue-900/10 to-transparent"></div>
          
          <div className="container mx-auto px-4 max-w-7xl relative z-10">
            <Reveal>
              <div className="max-w-3xl mx-auto text-center mb-20">
                <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-sm mb-3 block">{t.joinUs}</span>
                <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">{t.teamTitle}</h2>
                <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">{t.teamDesc}</p>
              </div>
            </Reveal>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {members.map((member, idx) => (
                <Reveal key={member._id} delay={idx * 100}>
                  <div className="group relative h-[420px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 shadow-md hover:shadow-2xl transition-all duration-500">
                    {/* Image Layer */}
                    <div className="absolute inset-0">
                      {member.image ? (
                        <Image 
                          src={member.image} 
                          alt={getLocalizedText(member.nameAr, member.nameEn, language)}
                          width={400}
                          height={420}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale group-hover:grayscale-0"
                        />
                      ) : (
                        <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-800">
                          <Users size={48} className="text-gray-400" />
                        </div>
                      )}
                    </div>
                    
                    {/* Content Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
                    
                    {/* Info Card - Slide Up */}
                    <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                      <h3 className="text-2xl font-bold text-white mb-1">
                        {getLocalizedText(member.nameAr, member.nameEn, language)}
                      </h3>
                      <div className="w-12 h-1 bg-blue-500 rounded-full mb-3 group-hover:w-24 transition-all duration-300"></div>
                      <p className="text-blue-300 font-medium mb-3 text-sm uppercase tracking-wider">
                        {getLocalizedText(member.roleAr, member.roleEn, language)}
                      </p>
                      <p className="text-gray-300 text-sm line-clamp-0 group-hover:line-clamp-3 transition-all duration-500 opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-24 overflow-hidden">
                        {getLocalizedText(member.bioAr, member.bioEn, language)}
                      </p>
                    </div>
                  </div>
                </Reveal>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* --- FOOTER / CTA --- */}
      <section className="relative py-24 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
        <div className="container mx-auto px-4 text-center">
          <Reveal>
            <div className="inline-block p-4 rounded-full bg-white dark:bg-gray-800 shadow-xl mb-8 animate-bounce-slow">
              <Share2 size={32} className="text-purple-500" />
            </div>
            <h2 className="text-3xl font-bold mb-10">{t.followUs}</h2>
            
            <div className="flex flex-wrap justify-center gap-6 mb-16">
              {socialLinks.map((social, idx) => (
                <a 
                  key={idx}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex flex-col items-center gap-2"
                >
                  <div className={`w-16 h-16 rounded-2xl bg-white dark:bg-gray-800 shadow-lg flex items-center justify-center text-gray-400 group-hover:text-white group-hover:scale-110 group-hover:-rotate-3 transition-all duration-300 relative overflow-hidden`}>
                     <div className={`absolute inset-0 bg-gradient-to-br ${social.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`}></div>
                     <span className="relative z-10">{social.icon}</span>
                  </div>
                  <span className="text-sm font-medium text-gray-500 group-hover:text-blue-500 transition-colors opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0">{social.label}</span>
                </a>
              ))}
            </div>

            {subscribers && (
              <div className="relative inline-flex group">
                 <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 blur-lg opacity-50 group-hover:opacity-75 transition-opacity"></div>
                 <div className="relative px-8 py-4 bg-white dark:bg-gray-800 rounded-full border border-gray-200 dark:border-gray-700 flex items-center gap-4">
                    <span className="text-red-500 animate-pulse"><Heart fill="currentColor" /></span>
                    <div className="text-left">
                      <div className="text-3xl font-black leading-none bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400">
                        {new Intl.NumberFormat(isRTL ? 'ar-EG' : 'en-US').format(subscribers)}
                      </div>
                      <div className="text-xs font-bold text-gray-400 uppercase tracking-widest">{isRTL ? 'مشترك في العيلة' : 'Subscribers'}</div>
                    </div>
                 </div>
              </div>
            )}
          </Reveal>
        </div>
      </section>

    </div>
  );
}