'use client';

import React, { useState, useEffect, useRef, MouseEvent, useCallback } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FaEnvelope, FaUsers, FaMedal, FaLightbulb, FaFlask,
  FaChartLine, FaBalanceScale, FaBook, FaArrowDown,
  FaShareAlt, FaArrowRight, FaPlay, FaGraduationCap,
  FaFileAlt, FaQuestionCircle
} from 'react-icons/fa';

// تعريف النوع TeamMember مباشرة في الملف بدلاً من استيراده
interface TeamMember {
  _id: string;
  slug: string;
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
}

// Helper function to get localized text
function getLocalizedText(arText: string | undefined, enText: string | undefined, language: 'ar' | 'en'): string {
  if (language === 'ar' && arText) return arText;
  if (language === 'en' && enText) return enText;
  return arText || enText || '';
}

// Fetch team members data based on language
async function getTeamMembersData(language: string = 'ar'): Promise<TeamMember[]> {
  try {
    console.log("Fetching team members with language:", language);
    const response = await fetch(`/api/team?language=${language}`);
    
    if (!response.ok) {
      throw new Error('Failed to fetch team members');
    }
    
    const data = await response.json();
    console.log("Fetched team members data:", data);
    
    // Fix: Extracts teamMembers array from response object
    const members = data.teamMembers || [];
    console.log("Extracted team members:", members);
    return members;
  } catch (error) {
    console.error("Error fetching team members:", error);
    return [];
  }
}

// Fetch real stats from database
async function getStatsData() {
  try {
    const [articlesRes, episodesRes, playlistsRes, seasonsRes] = await Promise.all([
      fetch('/api/articles'),
      fetch('/api/episodes'),
      fetch('/api/playlists'),
      fetch('/api/seasons')
    ]);

    const [articlesData, episodesData, playlistsData, seasonsData] = await Promise.all([
      articlesRes.json(),
      episodesRes.json(),
      playlistsRes.json(),
      seasonsRes.json()
    ]);

    return {
      articles: (articlesData.articles || []).length,
      episodes: (episodesData.episodes || []).length,
      playlists: (playlistsData.playlists || []).length,
      seasons: (seasonsData.seasons || []).length
    };
  } catch (error) {
    console.error("Error fetching stats:", error);
    return {
      articles: 0,
      episodes: 0,
      playlists: 0,
      seasons: 0
    };
  }
}

// Social Icons
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
  icon: React.ElementType;
  title: string;
  description: string;
  index: number;
  total: number;
  isRTL: boolean;
}

const TimelineNode = ({ icon: Icon, title, description, index, total, isRTL }: TimelineNodeProps) => {
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
      <div className={`flex-1 pl-20 md:pl-0 py-8 md:py-0 ${isRTL ? (index % 2 === 0 ? 'md:pr-16 md:text-right order-1' : 'md:pl-16 md:text-left order-3') : (index % 2 === 0 ? 'md:pr-16 md:text-left order-1' : 'md:pl-16 md:text-right order-3')}`}>
        <Reveal delay={100}>
          <SpotlightCard isActive={isActive} className={`p-6 md:p-8 h-full flex flex-col justify-center bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm ${isRTL ? (index % 2 === 0 ? 'md:items-end' : 'md:items-start') : (index % 2 === 0 ? 'md:items-start' : 'md:items-end')}`}>
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

// Team member card component with spotlight effect
interface TeamMemberCardProps {
  member: TeamMember;
  index: number;
  isRTL: boolean;
}

const TeamMemberCard = ({ member, index, isRTL }: TeamMemberCardProps) => {
  // Use appropriate image URL based on language
  const imageUrl = isRTL && member.imageUrl ? member.imageUrl : 
                  !isRTL && member.imageUrlEn ? member.imageUrlEn : 
                  member.imageUrl || member.imageUrlEn || "/placeholder.png";
  
  const name = getLocalizedText(member.name, member.nameEn, isRTL ? 'ar' : 'en');
  const role = getLocalizedText(member.role, member.roleEn, isRTL ? 'ar' : 'en');
  const bio = getLocalizedText(member.bio, member.bioEn, isRTL ? 'ar' : 'en');
  
  return (
    <Reveal delay={index * 100}>
      <div className="group relative h-[420px] rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-900 shadow-md hover:shadow-2xl transition-all duration-500">
        {/* Image Layer */}
        <div className="absolute inset-0">
          <Image 
            src={imageUrl}
            alt={name}
            width={400}
            height={400}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 filter grayscale group-hover:grayscale-0"
          />
        </div>
        
        {/* Content Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent opacity-60 group-hover:opacity-90 transition-opacity duration-300"></div>
        
        {/* Info Card - Slide Up */}
        <div className="absolute bottom-0 left-0 right-0 p-6 transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
          <h3 className="text-2xl font-bold text-white mb-1">
            {name}
          </h3>
          <div className="w-12 h-1 bg-blue-500 rounded-full mb-3 group-hover:w-24 transition-all duration-300"></div>
          <p className="text-blue-300 font-medium mb-3 text-sm uppercase tracking-wider">
            {role}
          </p>
          <p className="text-gray-300 text-sm line-clamp-0 group-hover:line-clamp-3 transition-all duration-500 opacity-0 group-hover:opacity-100 max-h-0 group-hover:max-h-24 overflow-hidden">
            {bio}
          </p>
          
          {/* View profile button */}
          <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
            <Link 
              href={`/team/${member.slug}`}
              className="inline-flex items-center text-white font-medium text-sm hover:text-blue-300 transition-colors"
            >
              {isRTL ? 'شوف البروفايل بتاعه' : 'View Profile'}
              <FaArrowRight className="mr-2 w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>
        </div>
      </div>
    </Reveal>
  );
};

// Hero section component
interface HeroSectionProps {
  isRTL: boolean;
}

const HeroSection = ({ isRTL }: HeroSectionProps) => {
  const heroOffset = useParallax(0.3);
  
  const translations = {
    ar: {
      badge: "فريق العمل",
      title: "تعرف على <span class='text-yellow-300'>ابطال</span> فذلكة",
      subtitle: "نفتخر بفريقنا من المحترفين الموهوبين اللي بيبضوا علشان يحققوا رؤيتنا ويقدموا أحسن تجربة لعملائنا.",
      experience: "خبرة عالية",
      innovation: "إبداع وابتكار",
      passion: "شغف بالعمل"
    },
    en: {
      badge: "Team",
      title: "Meet Our <span class='text-yellow-300'>Heroes</span>",
      subtitle: "We are proud of our team of talented professionals who work hard to achieve our vision and provide best experience for our clients.",
      experience: "High Expertise",
      innovation: "Creativity & Innovation",
      passion: "Passion for Work"
    }
  };
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
  return (
    <section className="relative min-h-[90vh] flex flex-col items-center justify-center text-center px-4 overflow-hidden">
      {/* Animated Background */}
      <div className="absolute inset-0 z-0 opacity-30 dark:opacity-20 pointer-events-none">
        <div className="absolute top-[20%] left-[20%] w-96 h-96 bg-blue-500 rounded-full mix-blend-multiply filter blur-[100px] animate-blob"></div>
        <div className="absolute top-[40%] right-[20%] w-96 h-96 bg-purple-500 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-2000"></div>
        <div className="absolute bottom-[10%] left-[40%] w-96 h-96 bg-pink-500 rounded-full mix-blend-multiply filter blur-[100px] animate-blob animation-delay-4000"></div>
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-40 mix-blend-overlay"></div>
      </div>

      <div className="relative z-10 max-w-5xl mx-auto space-y-8" style={{ transform: `translateY(${heroOffset * 0.5}px)` }}>
        <Reveal>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/50 dark:bg-black/30 backdrop-blur-md border border-gray-200 dark:border-gray-800 text-sm font-bold shadow-lg">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </span>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">{t.badge}</span>
          </div>
        </Reveal>

        <Reveal delay={100}>
          <h1 className="text-5xl md:text-7xl lg:text-8xl font-black tracking-tight leading-tight bg-clip-text text-transparent bg-gradient-to-b from-gray-900 via-gray-700 to-gray-500 dark:from-white dark:via-gray-300 dark:to-gray-600 drop-shadow-sm" dangerouslySetInnerHTML={{ __html: t.title }}></h1>
        </Reveal>

        <Reveal delay={200}>
          <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed font-medium">
            {t.subtitle}
          </p>
        </Reveal>

        <Reveal delay={300}>
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all duration-700 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105">
              <FaMedal className="text-yellow-300 text-xl" />
              <span className="text-white">{t.experience}</span>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all duration-700 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105">
              <FaLightbulb className="text-yellow-300 text-xl" />
              <span className="text-white">{t.innovation}</span>
            </div>
            
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20 transition-all duration-700 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-105">
              <FaFlask className="text-yellow-300 text-xl" />
              <span className="text-white">{t.passion}</span>
            </div>
          </div>
        </Reveal>

        <Reveal delay={400}>
          <div className="pt-12 animate-bounce-slow opacity-80">
            <div className="flex flex-col items-center gap-2">
              <span className="text-xs font-bold tracking-[0.2em] uppercase text-gray-400">{isRTL ? 'استمر في التمرير' : 'Continue Scrolling'}</span>
              <FaArrowDown className="text-gray-400" />
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// Values section component with timeline
interface ValuesSectionProps {
  isRTL: boolean;
}

const ValuesSection = ({ isRTL }: ValuesSectionProps) => {
  const translations = {
    ar: {
      title: "مبادئنا",
      cooperation: "التعاون",
      cooperationDesc: "بنؤمن بقوة الشغل كمانة وبنسعى نحقق أهدافنا من خلال التعاون المستمر ودعم بعضنا البعض.",
      innovation: "الابتكار",
      innovationDesc: "بنسعى دايماً نقدم حلول مبتكرة وإبداعية تلبي احتياجات عملائنا وتساهم في نجاحهم.",
      excellence: "التميز",
      excellenceDesc: "بنلتزم بأعلى معايير الجودة في كل إللي بنعمله ونسعى نحقق التميز في كل جوانب شغلنا."
    },
    en: {
      title: "Our Core Values",
      cooperation: "Cooperation",
      cooperationDesc: "We believe in power of teamwork and strive to achieve our goals through continuous cooperation and mutual support.",
      innovation: "Innovation",
      innovationDesc: "We always strive to provide innovative and creative solutions that meet our clients' needs and contribute to their success.",
      excellence: "Excellence",
      excellenceDesc: "We are committed to highest standards of quality in everything we do and strive for excellence in all aspects of our work."
    }
  };
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
  const values = [
    {
      title: t.cooperation,
      description: t.cooperationDesc,
      icon: FaUsers
    },
    {
      title: t.innovation,
      description: t.innovationDesc,
      icon: FaLightbulb
    },
    {
      title: t.excellence,
      description: t.excellenceDesc,
      icon: FaBalanceScale
    }
  ];
  
  return (
    <section className="relative py-20 md:py-32 bg-gray-50/50 dark:bg-gray-900/50">
      <div className="container mx-auto px-4 max-w-5xl relative z-10">
        <Reveal>
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
              {t.title}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-purple-500 mx-auto rounded-full shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20"></div>
          </div>
        </Reveal>
        
        <div className="flex flex-col">
          {values.map((value, idx) => (
            <TimelineNode 
              key={idx}
              index={idx}
              total={values.length}
              icon={value.icon}
              title={value.title}
              description={value.description}
              isRTL={isRTL}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

// Stats section component with glassmorphism (Updated to use real data)
interface StatsSectionProps {
  isRTL: boolean;
  stats: {
    articles: number;
    episodes: number;
    playlists: number;
    seasons: number;
  };
}

const StatsSection = ({ isRTL, stats }: StatsSectionProps) => {
  const translations = {
    ar: {
      title: "لغة الأرقام مابتكدبش",
      subtitle: "كل رقم وراه ثقة ناس غالية علينا",
      articles: "مقال مميز",
      episodes: "حلقة",
      playlists: "سلسلة كاملة",
      seasons: "موسم"
    },
    en: {
      title: "Numbers Don't Lie",
      subtitle: "Behind every number is a trust of people we cherish",
      articles: "Articles",
      episodes: "Episodes",
      playlists: "Playlists",
      seasons: "Seasons"
    }
  };
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
  return (
    <section className="relative py-32 overflow-hidden">
      {/* Deep Space Background */}
      <div className="absolute inset-0 bg-[#0a0a0a]">
        <div className="absolute inset-0 bg-cover bg-center bg-fixed" style={{ backgroundImage: "url('https://plus.unsplash.com/premium_photo-1701207039124-ef7ef4d780a5?q=80&w=865&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D')" }}></div>
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-[#0a0a0a]"></div>
      </div>

      <div className="container mx-auto px-4 relative z-10 text-white">
      <Reveal>
        <div className="text-center mb-20">
          <div className="inline-block p-3 rounded-2xl bg-white/5 border border-white/10 mb-6 backdrop-blur-sm">
            <FaChartLine size={32} className="text-blue-400" />
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 leading-[2.2] pb-4 inline-block bg-clip-text text-transparent bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400">
            {t.title}
          </h2>
          
          <p className="text-xl text-gray-400 font-medium max-w-2xl mx-auto">{t.subtitle}</p>
        </div>
      </Reveal>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {[
            { val: stats.articles, label: t.articles, icon: FaFileAlt, color: "blue" },
            { val: stats.episodes, label: t.episodes, icon: FaPlay, color: "purple" },
            { val: stats.playlists, label: t.playlists, icon: FaBook, color: "pink" },
            { val: stats.seasons, label: t.seasons, icon: FaGraduationCap, color: "orange" },
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
  );
};

// Team section component
interface TeamSectionProps {
  members: TeamMember[];
  isRTL: boolean;
}

const TeamSection = ({ members, isRTL }: TeamSectionProps) => {
  const translations = {
    ar: {
      badge: "فريق العمل",
      title: "صنايعية الحكاية",
      subtitle: "دول بقى الجنود المجهولة.. ناس بتشتغل بحب عشان تطلعلك المحتوى بالشكل ده.",
      noTeamData: "مفيش بيانات عن الفريق حالياً",
      noTeamDataDesc: "هنا هنضيف قريباً"
    },
    en: {
      badge: "Team",
      title: "Our Team Members",
      subtitle: "Meet talented members who form backbone of our success",
      noTeamData: "No team member data available at moment",
      noTeamDataDesc: "This section will be updated soon"
    }
  };
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
  return (
    <section className="py-32 bg-white dark:bg-gray-950 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-blue-50/50 dark:from-blue-900/10 to-transparent"></div>
      
      <div className="container mx-auto px-4 max-w-7xl relative z-10">
        <Reveal>
          <div className="max-w-3xl mx-auto text-center mb-20">
            <span className="text-blue-600 dark:text-blue-400 font-bold tracking-widest uppercase text-sm mb-3 block">{t.badge}</span>
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gray-900 dark:text-white">{t.title}</h2>
            <p className="text-xl text-gray-600 dark:text-gray-400 font-medium">{t.subtitle}</p>
          </div>
        </Reveal>

        {members.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-8">
            {members.map((member, index) => (
              <div key={member._id || index} className="w-full md:w-1/2 lg:w-1/3 xl:w-1/4">
                <TeamMemberCard member={member} index={index} isRTL={isRTL} />
              </div>
            ))}
          </div>
        ) : (
          <Reveal>
            <div className="text-center py-10 bg-white/10 backdrop-blur-sm rounded-2xl shadow-lg shadow-blue-500/30 dark:shadow-blue-500/20">
              <p className="text-white/80 italic">{t.noTeamData}</p>
              <p className="text-white/60 mt-2 text-sm">{t.noTeamDataDesc}</p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
};

// Contact section component
interface ContactSectionProps {
  isRTL: boolean;
}

const ContactSection = ({ isRTL }: ContactSectionProps) => {
  const translations = {
    ar: {
      badge: "تواصل معنا",
      title: "نحن هنا <span class='text-yellow-300'>للمساعدة</span>",
      subtitle: "لو عندك أي استفسار أو عايز تتكلم مع حد من الفريق، متترددش تواصل معانا.",
      contactUs: "تواصل معنا",
      faq: "الأسئلة الشائعة",
      followUs: "تابعنا وسيب الباقي علينا"
    },
    en: {
      badge: "Contact Us",
      title: "We Are Here <span class='text-yellow-300'>To Help</span>",
      subtitle: "If you have any inquiries or would like to contact one of our team members, do not hesitate to contact us.",
      contactUs: "Contact Us",
      faq: "FAQ",
      followUs: "Follow Us and Leave Rest to Us"
    }
  };
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
  return (
    <section className="relative py-24 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
      <div className="container mx-auto px-4 text-center">
        <Reveal>
          <div className="inline-block p-4 rounded-full bg-white dark:bg-gray-800 shadow-xl mb-8 animate-bounce-slow">
            <FaShareAlt size={32} className="text-purple-500" />
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

          <div className="flex justify-center gap-6 flex-wrap">
            <Link 
              href="/contact" 
              className="group relative inline-flex items-center justify-center overflow-hidden bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold py-4 px-8 rounded-full transition-all duration-1000 transform hover:scale-105 shadow-lg shadow-yellow-500/30 dark:shadow-yellow-500/20 hover:shadow-xl hover:shadow-yellow-500/40"
            >
              <span className="relative z-10 flex items-center">
                <FaEnvelope className="text-xl mr-3" />
                {t.contactUs}
              </span>
              
              {/* Hover effect */}
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-yellow-500 to-orange-600 opacity-0 transition-opacity duration-1000 rounded-full transform scale-0 group-hover:scale-100"></span>
            </Link>
            
            <Link 
              href="/faq" 
              className="group relative inline-flex items-center justify-center overflow-hidden bg-white/20 backdrop-blur-sm border border-white/30 text-white font-bold py-4 px-8 rounded-full transition-all duration-1000 transform hover:scale-105 shadow-lg shadow-indigo-500/30 dark:shadow-indigo-500/20 hover:shadow-xl hover:shadow-indigo-500/40"
            >
              <span className="relative z-10 flex items-center">
                <FaQuestionCircle className="text-xl mr-3" />
                {t.faq}
              </span>
              
              {/* Hover effect */}
              <span className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-indigo-500 to-blue-600 opacity-0 transition-opacity duration-1000 rounded-full transform scale-0 group-hover:scale-100"></span>
            </Link>
          </div>
        </Reveal>
      </div>
    </section>
  );
};

// Main Team Page component
const TeamPage = () => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [stats, setStats] = useState({
    articles: 0,
    episodes: 0,
    playlists: 0,
    seasons: 0
  });
  const [loading, setLoading] = useState(true);
  const [isRTL, setIsRTL] = useState(true);
  const [language, setLanguage] = useState('ar');
  const [mounted, setMounted] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const scrollProgress = useScrollProgress();

  useEffect(() => {
    setMounted(true);
    
    // Detect language from browser or localStorage
    const savedLanguage = localStorage.getItem('language');
    let detectedLanguage = 'ar'; // default to Arabic
    
    if (savedLanguage) {
      detectedLanguage = savedLanguage;
    } else {
      // Use browser language as fallback
      const browserLang = navigator.language || (navigator as unknown as { userLanguage: string }).userLanguage || '';
      detectedLanguage = browserLang.includes('ar') ? 'ar' : 'en';
    }
    
    setLanguage(detectedLanguage);
    setIsRTL(detectedLanguage === 'ar');
    
    // Apply language to document
    document.documentElement.dir = detectedLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = detectedLanguage;
  }, []);

  // دالة لتحميل البيانات
  const loadData = useCallback(async () => {
    try {
      // إذا لم يكن تحديثاً تلقائياً، اعرض حالة التحميل
      if (!isUpdating) {
        setLoading(true);
      }
      
      // Fetch all data in parallel
      const [membersData, statsData] = await Promise.all([
        getTeamMembersData(language),
        getStatsData()
      ]);
      
      console.log("Team members data:", membersData);
      console.log("Stats data:", statsData);
      
      setMembers(membersData);
      setStats(statsData);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
      setIsUpdating(false);
    }
  }, [language, isUpdating]);

  // دالة لتحديث البيانات تلقائياً
  const autoRefresh = useCallback(async () => {
    setIsUpdating(true);
    await loadData();
  }, [loadData]);

  useEffect(() => {
    if (!mounted) return;
    
    loadData();
    
    // إعداد EventSource للاستماع إلى تحديثات SSE
    const setupEventSource = () => {
      // إغلاق الاتصال الحالي إذا كان موجوداً
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      
      // إلغاء أي إعادة اتصال مجدولة
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      
      // إنشاء اتصال جديد
      eventSourceRef.current = new EventSource('/api/stream');
      
      eventSourceRef.current.onopen = () => {
        console.log('SSE connection opened');
      };
      
      eventSourceRef.current.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          
          if (data.type === 'change') {
            console.log('Change detected:', data);
            // تحقق مما إذا كان التغيير يتعلق بأعضاء الفريق أو المحتوى
            if (data.collection === 'teams' || data.collection === 'articles' || 
                data.collection === 'episodes' || data.collection === 'playlists' || 
                data.collection === 'seasons') {
              // إذا كان هناك تغيير، قم بتحديث الصفحة
              autoRefresh();
            }
          }
        } catch (error) {
          console.error('Error parsing SSE message:', error);
        }
      };
      
      eventSourceRef.current.onerror = (error) => {
        console.error('SSE connection error:', error);
        // إغلاق الاتصال الحالي
        if (eventSourceRef.current) {
          eventSourceRef.current.close();
        }
        // إعادة الاتصال بعد فترة قصيرة
        reconnectTimeoutRef.current = setTimeout(setupEventSource, 2000);
      };
    };
    
    setupEventSource();
    
    // تنظيف الاتصال عند تفكيك المكون
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [language, mounted, loadData, autoRefresh]);

  if (loading && !isUpdating) return (
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
      
      {/* --- Hero Section --- */}
      <HeroSection isRTL={isRTL} />
      
      {/* --- Values Section with Timeline --- */}
      <ValuesSection isRTL={isRTL} />
      
      {/* --- Stats Section with Glassmorphism --- */}
      <StatsSection isRTL={isRTL} stats={stats} />
      
      {/* --- Team Section --- */}
      <TeamSection members={members} isRTL={isRTL} />
      
      {/* --- Contact Section --- */}
      <ContactSection isRTL={isRTL} />
      
      {/* --- Global Styles --- */}
      <style jsx global>{`
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.4; }
        }
        
        @keyframes bounce-slow {
          0%, 100% { transform: translateY(-100%); }
          50% { transform: translateY(0%); }
        }
        
        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }
        
        @keyframes float-animation {
          0% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(5deg); }
          100% { transform: translateY(0) rotate(0deg); }
        }
        
        @keyframes border-rotate {
          0% { border-color: rgba(59, 130, 246, 1); transform: rotate(0deg); }
          25% { border-color: rgba(59, 130, 246, 1); transform: rotate(90deg); }
          50% { border-color: rgba(59, 130, 246, 1); transform: rotate(180deg); }
          75% { border-color: rgba(59, 130, 246, 1); transform: rotate(270deg); }
          100% { border-color: rgba(59, 130, 246, 1); transform: rotate(360deg); }
        }
        
        @keyframes blob {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.1); }
          66% { transform: translate(-20px, 20px) scale(0.9); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
        
        .animate-blob {
          animation: blob 7s infinite;
        }
        
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        
        .animation-delay-4000 {
          animation-delay: 4s;
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out;
        }
        
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-300 {
          animation-delay: 0.3s;
        }
        
        .delay-400 {
          animation-delay: 0.4s;
        }
        
        .line-clamp-0 {
          display: -webkit-box;
          -webkit-line-clamp: 0;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .line-clamp-3 {
          display: -webkit-box;
          -webkit-line-clamp: 3;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default TeamPage;