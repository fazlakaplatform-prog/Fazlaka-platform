"use client";
import { motion } from "framer-motion";
import { 
  ChevronRight, Mail, HelpCircle
} from "lucide-react";
import { FaXTwitter } from "react-icons/fa6";
import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";

// استيراد أيقونات إضافية من react-icons/fa
import { FaYoutube, FaInstagram, FaFacebookF, FaTiktok as FaTiktokIcon } from 'react-icons/fa';

// كائن الترجمات - نفس المستخدم في الناف بار
const translations = {
  ar: {
    followUs: "تابعنا على منصات التواصل الاجتماعي",
    contact: "التواصل",
    contactUs: "تواصل معنا",
    support: "الدعم الفني",
    faq: "الأسئلة الشائعة",
    policies: "السياسات",
    privacyPolicy: "سياسة الخصوصية",
    termsConditions: "الشروط والأحكام",
    backToHome: "العودة إلى الصفحة الرئيسية",
    copyright: "جميع الحقوق محفوظة.",
    platformDescription: "منصة تعليمية حديثة لعرض العلوم بشكل ممتع ومنظم وسهل لتطوير مهاراتك.",
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    twitter: "Twitter",
    home: "الرئيسية",
    search: "بحث"
  },
  en: {
    followUs: "Follow us on social media",
    contact: "Contact",
    contactUs: "Contact Us",
    support: "Support",
    faq: "FAQ",
    policies: "Policies",
    privacyPolicy: "Privacy Policy",
    termsConditions: "Terms & Conditions",
    backToHome: "Back to Home",
    copyright: "All rights reserved.",
    platformDescription: "A modern educational platform for presenting science in a fun, organized, and easy way to develop your skills.",
    youtube: "YouTube",
    instagram: "Instagram",
    facebook: "Facebook",
    tiktok: "TikTok",
    twitter: "Twitter",
    home: "Home",
    search: "Search"
  }
};

// واجهة للروابط الاجتماعية
export interface SocialLink {
  _id: string
  platform: string
  url: string
  createdAt?: Date
  updatedAt?: Date
}

// دالة لجلب الروابط الاجتماعية من MongoDB
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
      return FaTiktokIcon;
    case 'x':
    case 'twitter':
      return FaXTwitter;
    default:
      return FaXTwitter;
  }
}

// دالة للحصول على اسم المنصة حسب اللغة
function getPlatformName(platform: string, language: string) {
  const names: Record<string, { ar: string; en: string }> = {
    youtube: { ar: 'يوتيوب', en: 'YouTube' },
    instagram: { ar: 'انستجرام', en: 'Instagram' },
    facebook: { ar: 'فيس بوك', en: 'Facebook' },
    tiktok: { ar: 'تيك توك', en: 'TikTok' },
    x: { ar: 'إكس', en: 'X' },
    twitter: { ar: 'إكس', en: 'X' }
  };
  
  return names[platform]?.[language as 'ar' | 'en'] || platform;
}

// دالة للحصول على لون الخلفية للمنصة
function getSocialColor(platform: string) {
  switch (platform) {
    case 'youtube':
      return 'from-red-500 to-red-600';
    case 'instagram':
      return 'from-pink-500 to-purple-500';
    case 'facebook':
      return 'from-blue-500 to-blue-600';
    case 'tiktok':
      return 'from-black to-gray-800';
    case 'x':
    case 'twitter':
      return 'from-gray-700 to-gray-900';
    default:
      return 'from-gray-500 to-gray-600';
  }
}

export default function Footer() {
  const year = new Date().getFullYear();
  const [mounted, setMounted] = useState(false);
  const [isRTL, setIsRTL] = useState(true); // القيمة الافتراضية هي العربية (RTL)
  const [isMobile, setIsMobile] = useState(false);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    setMounted(true);
    
    // التحقق من حجم الشاشة
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    
    // التحقق من تفضيل اللغة المحفوظ في localStorage
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
      setIsRTL(savedLanguage === 'ar');
    } else {
      // إذا لم يكن هناك تفضيل محفوظ، استخدم لغة المتصفح
      const browserLang = navigator.language || (navigator as { userLanguage?: string }).userLanguage || 'en';
      setIsRTL(browserLang.includes('ar'));
    }
    
    // جلب الروابط الاجتماعية من MongoDB
    const fetchLinks = async () => {
      try {
        const links = await fetchSocialLinksFromMongoDB();
        setSocialLinks(links);
      } catch (error) {
        console.error('Error fetching social links:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchLinks();
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  const t = translations[isRTL ? 'ar' : 'en'];
  
  // تحديد الشعار بناءً على اللغة
  const logoSrc = isRTL ? "/logo.png" : "/logoE.png";
  const logoAlt = isRTL ? "فذلكة" : "fazlaka";
  
  // روابط التواصل
  const contactLinks = [
    { href: "/contact", text: t.contactUs, icon: <Mail className="w-4 h-4" /> },
    { href: "/support", text: t.support, icon: <HelpCircle className="w-4 h-4" /> },
  ];
  
  // روابط السياسات (للاسفل)
  const policyLinks = [
    { href: "/privacy-policy", text: t.privacyPolicy, gradient: "from-blue-500 to-blue-600" },
    { href: "/terms-conditions", text: t.termsConditions, gradient: "from-purple-500 to-purple-600" },
  ];

  const handleLogoClick = () => {
    // التمرير السلس إلى بداية الصفحة
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };
  
  if (!mounted) return null;
  
  // فلترة الروابط الاجتماعية الصالحة للعرض
  const validSocialLinks = socialLinks.filter(social => 
    ['youtube', 'instagram', 'facebook', 'tiktok', 'x', 'twitter'].includes(social.platform)
  );
  
  return (
    <>
      {/* فاصل علوي متحرك */}
      <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
        <motion.div 
          className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
          initial={{ width: "0%" }}
          animate={{ width: "100%" }}
          transition={{ duration: 2, ease: "easeInOut" }}
        />
      </div>
      
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
        className="bg-gradient-to-br from-[#0a0a1a] via-[#1a1a3a] to-[#0f172a] text-gray-200 pt-16 pb-12 relative overflow-hidden"
        dir={isRTL ? 'rtl' : 'ltr'}
      >
        {/* خلفية متحركة - مبسطة على الموبايل */}
        <div className="absolute inset-0 overflow-hidden">
          {!isMobile && <div className="absolute top-0 left-0 w-full h-full bg-grid-pattern opacity-5"></div>}
          
          {/* تقليل عدد الدوائر المتحركة على الموبايل */}
          {!isMobile && (
            <>
              <motion.div 
                className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl"
                animate={{ 
                  x: [0, 30, 0],
                  y: [0, -30, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 15, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
              <motion.div 
                className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl"
                animate={{ 
                  x: [0, -30, 0],
                  y: [0, 30, 0],
                  scale: [1, 1.1, 1]
                }}
                transition={{ 
                  duration: 18, 
                  repeat: Infinity,
                  repeatType: "reverse"
                }}
              />
            </>
          )}
        </div>
        
        <div className="max-w-7xl mx-auto px-6 relative z-10">
          {/* قسم الشعار والروابط الاجتماعية المدمج */}
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.8 }}
            className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-3xl p-8 border border-gray-700/30 shadow-xl mb-16"
          >
            <div className="flex flex-col items-center text-center">
              {/* قسم الشعار */}
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.8 }}
                className="relative cursor-pointer transition-all duration-300 mb-6"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleLogoClick}
              >
                <Image
                  src={logoSrc}
                  alt={logoAlt}
                  width={isMobile ? 120 : 140}
                  height={isMobile ? 120 : 140}
                  className="object-contain transition-all duration-300"
                  priority
                />
              </motion.div>
              
              {/* الوصف */}
              <motion.p 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.8 }}
                className="text-gray-300 text-base max-w-2xl mb-8 leading-relaxed"
              >
                {t.platformDescription}
              </motion.p>
              
              {/* عنوان تابعنا - يظهر فقط إذا كانت هناك روابط اجتماعية */}
              {!loading && validSocialLinks.length > 0 && (
                <motion.div 
                  className="mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                >
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                    {t.followUs}
                  </h3>
                </motion.div>
              )}
              
              {/* الروابط الاجتماعية في المنتصف - تظهر فقط إذا كانت هناك روابط */}
              {!loading && validSocialLinks.length > 0 && (
                <motion.div 
                  className="flex flex-wrap justify-center gap-4"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1, duration: 0.8 }}
                >
                  {validSocialLinks.map((social, index) => {
                    const Icon = getSocialIcon(social.platform);
                    const platformName = getPlatformName(social.platform, isRTL ? 'ar' : 'en');
                    const socialColor = getSocialColor(social.platform);
                    
                    return (
                      <motion.a
                        key={social._id}
                        href={social.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 1.2 + index * 0.1, type: "spring", stiffness: 100 }}
                        whileHover={{ 
                          y: -5, 
                          scale: 1.05,
                        }}
                        whileTap={{ scale: 0.95 }}
                        className={`flex flex-col items-center justify-center ${isMobile ? 'w-14 h-14' : 'w-16 h-16'} rounded-2xl bg-gray-700/60 hover:bg-gradient-to-br ${socialColor} transition-all duration-300 border border-gray-600/50 group overflow-hidden shadow-lg relative`}
                        aria-label={platformName}
                      >
                        {/* تأثير التوهج عند الهوفر - مبسط على الموبايل */}
                        {!isMobile && (
                          <div className="absolute inset-0 rounded-2xl border border-transparent group-hover:border-white/30 transition-all duration-300"></div>
                        )}
                        
                        {/* الأيقونة مع تأثير اللمعان - بسيطة بيضاء */}
                        <div className={`${isMobile ? 'text-xl' : 'text-2xl'} text-gray-300 group-hover:text-white transition-all duration-300 group-hover:scale-110 z-10`}>
                          <Icon />
                        </div>
                      </motion.a>
                    );
                  })}
                </motion.div>
              )}
            </div>
          </motion.div>
          
          {/* الأقسام الرئيسية - تصميم شبكي جديد مع تحسين الهوفر */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.4, duration: 0.8 }}
            className={`${isMobile ? 'grid grid-cols-1 gap-6' : 'grid grid-cols-1 md:grid-cols-2 gap-8'} mb-16`}
          >
            {/* قسم التواصل */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.6, duration: 0.6 }}
              className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 shadow-xl"
            >
              <motion.div 
                className="flex justify-center items-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.8, duration: 0.5 }}
              >
                <div className="flex-1 h-12 rounded-xl bg-green-500/20 flex items-center justify-center">
                  <h3 className="text-xl font-bold text-white">{t.contact}</h3>
                </div>
              </motion.div>
              <ul className="space-y-3">
                {contactLinks.map((link, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2 + index * 0.1, duration: 0.5 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group p-3 rounded-xl hover:bg-gray-700/30 relative overflow-hidden"
                    >
                      {/* تأثير التوهج الخلفي - فقط على سطح المكتب */}
                      {!isMobile && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-green-400/50 transition-all duration-300"></div>
                        </>
                      )}
                      
                      {/* الأيقونة مع تأثير اللمعان */}
                      <span className={`${isRTL ? 'ml-3' : 'mr-3'} text-green-400 transition-all duration-300 group-hover:scale-110 z-10`}>{link.icon}</span>
                      
                      {/* النص مع تأثير اللمعان */}
                      <span className="flex-1 transition-all duration-300 group-hover:text-white z-10">{link.text}</span>
                      
                      {/* السهم مع تأثير الحركة واللمعان - فقط على سطح المكتب */}
                      {!isMobile && (
                        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-300 z-10`} />
                      )}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
            
            {/* قسم السياسات */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.7, duration: 0.6 }}
              className="bg-gradient-to-br from-gray-800/30 to-gray-900/30 backdrop-blur-sm rounded-2xl p-6 border border-gray-700/30 shadow-xl"
            >
              <motion.div 
                className="flex justify-center items-center mb-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.9, duration: 0.5 }}
              >
                <div className="flex-1 h-12 rounded-xl bg-purple-500/20 flex items-center justify-center">
                  <h3 className="text-xl font-bold text-white">{t.policies}</h3>
                </div>
              </motion.div>
              <ul className="space-y-3">
                {policyLinks.map((link, index) => (
                  <motion.li 
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 2.1 + index * 0.1, duration: 0.5 }}
                  >
                    <Link
                      href={link.href}
                      className="text-gray-300 hover:text-white transition-all duration-300 flex items-center group p-3 rounded-xl hover:bg-gray-700/30 relative overflow-hidden"
                    >
                      {/* تأثير التوهج الخلفي - فقط على سطح المكتب */}
                      {!isMobile && (
                        <>
                          <div className="absolute inset-0 bg-gradient-to-r from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                          <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-purple-400/50 transition-all duration-300"></div>
                        </>
                      )}
                      
                      {/* النص مع تأثير اللمعان */}
                      <span className="flex-1 transition-all duration-300 group-hover:text-white z-10">{link.text}</span>
                      
                      {/* السهم مع تأثير الحركة واللمعان - فقط على سطح المكتب */}
                      {!isMobile && (
                        <ChevronRight className={`w-4 h-4 opacity-0 group-hover:opacity-100 ${isRTL ? 'group-hover:-translate-x-1' : 'group-hover:translate-x-1'} transition-all duration-300 z-10`} />
                      )}
                    </Link>
                  </motion.li>
                ))}
              </ul>
            </motion.div>
          </motion.div>
          
          {/* حقوق النشر */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.4, duration: 0.8 }}
            className="pt-8 border-t border-gray-700/30 text-center"
          >
            <motion.p 
              className="text-gray-400"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.6, duration: 0.8 }}
            >
              {year} {isRTL ? 'فذلكة' : 'fazlaka'}. {t.copyright}
            </motion.p>
          </motion.div>
        </div>
        
        {/* زخرفة سفلية */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500">
          <motion.div 
            className="h-full bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2, ease: "easeInOut", delay: 3 }}
          />
        </div>
      </motion.footer>
      
      <style jsx global>{`
        .bg-grid-pattern {
          background-image: linear-gradient(rgba(255, 255, 255, 0.1) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 255, 255, 0.1) 1px, transparent 1px);
          background-size: 20px 20px;
        }
      `}</style>
    </>
  );
}