"use client";
import React, { useEffect, useState, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useSession } from "next-auth/react";
import { motion, AnimatePresence } from "framer-motion";
import { useDropzone } from "react-dropzone";
import { 
  FaEnvelope, FaStar, FaHandshake, FaComments, FaHeadset,
  FaYoutube, FaInstagram, FaFacebookF, FaTiktok,
  FaPhone, FaMapMarkerAlt, FaClock,
  FaDiscord, FaArrowRight, FaCheckCircle, FaTimesCircle,
  FaFilePdf, FaFileWord, FaFileImage, FaFileArchive,
  FaDownload, FaEye, FaTrash, FaTimes,
  FaShieldAlt, FaRocket, FaAward, FaBolt,
  FaShare, FaHeart, FaLightbulb, FaPaperPlane,
  FaQuestionCircle, FaSearch
} from "react-icons/fa";
import { FaXTwitter } from "react-icons/fa6";

// تعريف واجهة للأسئلة الشائعة
interface FAQ {
  id: string;
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
  category?: string;
  categoryEn?: string;
}

export default function ContactPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [formStatus, setFormStatus] = useState<"idle" | "sending" | "success" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [showToast, setShowToast] = useState(false);
  const [files, setFiles] = useState<File[]>([]);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isRTL, setIsRTL] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [faqsLoading, setFaqsLoading] = useState(true);
  const [faqsError, setFaqsError] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  useEffect(() => {
    // Check for dark mode preference on client side only
    setIsDarkMode(window.matchMedia('(prefers-color-scheme: dark)').matches);
    
    // Listen for changes in color scheme
    const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e: MediaQueryListEvent) => setIsDarkMode(e.matches);
    darkModeMediaQuery.addEventListener('change', handleChange);
    
    // Check for language preference
    const savedLanguage = localStorage.getItem('language');
    if (savedLanguage !== null) {
      setIsRTL(savedLanguage === 'ar');
    } else {
      // Use browser language as fallback
      const browserLang = navigator.language || (navigator as unknown as { userLanguage?: string }).userLanguage || '';
      setIsRTL(browserLang.includes('ar'));
    }
    
    // Listen for language changes
    const handleLanguageChange = () => {
      const currentLanguage = localStorage.getItem('language');
      if (currentLanguage !== null) {
        setIsRTL(currentLanguage === 'ar');
      }
    };
    
    window.addEventListener('storage', handleLanguageChange);
    
    // Also check for local changes
    const checkLanguageInterval = setInterval(() => {
      const currentLanguage = localStorage.getItem('language');
      if (currentLanguage !== null) {
        const shouldBeRTL = currentLanguage === 'ar';
        if (shouldBeRTL !== isRTL) {
          setIsRTL(shouldBeRTL);
        }
      }
    }, 500);
    
    return () => {
      darkModeMediaQuery.removeEventListener('change', handleChange);
      window.removeEventListener('storage', handleLanguageChange);
      clearInterval(checkLanguageInterval);
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl, isRTL]);
  
  useEffect(() => {
    if (session?.user) {
      setEmail(session.user.email || "");
      setName(session.user.name || "");
    }
  }, [session]);

  // Fetch FAQs from database
  useEffect(() => {
    const fetchFaqs = async () => {
      try {
        setFaqsLoading(true);
        const response = await fetch(`/api/faqs?limit=3&language=${isRTL ? 'ar' : 'en'}`);
        const result = await response.json();
        
        if (result.success) {
          setFaqs(result.data);
        } else {
          setFaqsError(true);
        }
      } catch (error) {
        console.error('Error fetching FAQs:', error);
        setFaqsError(true);
      } finally {
        setFaqsLoading(false);
      }
    };

    fetchFaqs();
  }, [isRTL]);
  
  // Text translations based on language
  const texts = {
    ar: {
      pageTitle: "تواصل معنا",
      heroTitle: "تواصل معنا",
      heroHighlight: "فريق فذلكه",
      heroSubtitle: "نحن هنا لمساعدتك. تواصل مع فريق فذلكه للحصول على الدعم الفني أو الإجابة على استفساراتك. نسعى دائماً لتقديم أفضل خدمة ممكنة.",
      contactUs: "تواصل معنا",
      sendMessage: "أرسل رسالة",
      name: "الاسم",
      email: "الإيميل",
      yourMessage: "رسالتك",
      attachments: "مرفقات (اختياري)",
      dragDropText: "اسحب وأفلت الملفات هنا أو انقر للاختيار",
      dragActiveText: "أفلت الملفات هنا",
      allowedFormats: "الصيغ المسموحة: jpg, png, pdf, doc, docx, zip",
      attachedFiles: "الملفات المرفقة:",
      sending: "جاري الإرسال...",
      sendMessageBtn: "إرسال الرسالة",
      successMessage: "تم الإرسال بنجاح!",
      errorMessage: "فشل الإرسال",
      mustSignIn: "يجب تسجيل الدخول لإرسال رسالة.",
      signIn: "تسجيل الدخول",
      directContact: "تواصل مباشر",
      contactUsDirectly: "تواصل معنا مباشرة",
      directContactSubtitle: "يمكنك التواصل معنا مباشرة عبر دسكورد أو البريد الإلكتروني للحصول على إجابات سريعة",
      discord: "دسكورد",
      discordDesc: "انضم إلى سيرفر دسكورد الخاص بنا للمشاركة في المجتمع والحصول على دعم فوري",
      emailAddress: "البريد الإلكتروني",
      emailDesc: "أرسل لنا بريداً إلكترونياً وستصلك إجابتك قريباً",
      openGmail: " تواصل مباشر ",
      preview: "معاينة",
      delete: "حذف",
      close: "إغلاق",
      download: "تحميل",
      cannotPreview: "لا يمكن معاينة هذا الملف",
      fileType: "نوع الملف",
      fileSize: "الحجم",
      downloadFile: "تحميل الملف",
      fileNotImage: "الملف مش صورة",
      fileSizeError: "حجم الصورة أكبر من 5 ميجا",
      tryAgain: "حاول مرةً أخرى أو بلغ الإدارة",
      platformName: "فذلكه",
      unlockFeatures: "فتح جميع الميزات",
      signInPrompt: "سجل دخولك الآن لإرسال رسالة والاستفادة من جميع ميزات منصة فذلكه",
      createAccount: "انشاء حساب",
      exclusiveAccess: "وصول حصري",
      personalizedExperience: "تجربة مخصصة لك",
      pdfPreviewError: "لا يمكن عرض ملف PDF في هذا المتصفح. يرجى تحميل الملف لعرضه.",
      downloadPdf: "تحميل ملف PDF",
      faqTitle: "أسئلة شائعة",
      faqSubtitle: "إجابات سريعة على استفساراتك الشائعة حول منصة فذلكه",
      faqDescription: "اكتشف إجابات للأسئلة الأكثر شيوعاً حول خدماتنا ومنصتنا التعليمية",
      viewMoreFaqs: "اطلع على المزيد من الأسئلة",
      loadingFaqs: "جاري تحميل الأسئلة...",
      errorLoadingFaqs: "حدث خطأ في تحميل الأسئلة",
      noFaqsAvailable: "لا توجد أسئلة شائعة حالياً",
      category: "التصنيف"
    },
    en: {
      pageTitle: "Contact Us",
      heroTitle: "Contact Us",
      heroHighlight: "Falthaka Team",
      heroSubtitle: "We're here to help. Contact Falthaka team for technical support or to answer your inquiries. We always strive to provide best possible service.",
      contactUs: "Contact Us",
      sendMessage: "Send Message",
      name: "Name",
      email: "Email",
      yourMessage: "Your Message",
      attachments: "Attachments (Optional)",
      dragDropText: "Drag and drop files here or click to select",
      dragActiveText: "Drop files here",
      allowedFormats: "Allowed formats: jpg, png, pdf, doc, docx, zip",
      attachedFiles: "Attached files:",
      sending: "Sending...",
      sendMessageBtn: "Send Message",
      successMessage: "Sent successfully!",
      errorMessage: "Sending failed",
      mustSignIn: "You must sign in to send a message.",
      signIn: "Sign In",
      directContact: "Direct Contact",
      contactUsDirectly: "Contact Us Directly",
      directContactSubtitle: "You can contact us directly via Discord or email for quick responses",
      discord: "Discord",
      discordDesc: "Join our Discord server to participate in the community and get instant support",
      emailAddress: "Email",
      emailDesc: "Send us an email and we'll get back to you soon",
      openGmail: "Direct communication",
      preview: "Preview",
      delete: "Delete",
      close: "Close",
      download: "Download",
      cannotPreview: "Cannot preview this file",
      fileType: "File type",
      fileSize: "Size",
      downloadFile: "Download File",
      fileNotImage: "File is not an image",
      fileSizeError: "Image size is larger than 5 MB",
      tryAgain: "Try again or contact support",
      platformName: "Falthaka",
      unlockFeatures: "Unlock All Features",
      signInPrompt: "Sign in now to send a message and take advantage of all features of Falthaka platform",
      createAccount: "Create Account",
      exclusiveAccess: "Exclusive Access",
      personalizedExperience: "A personalized experience for you",
      pdfPreviewError: "Cannot display PDF file in this browser. Please download file to view it.",
      downloadPdf: "Download PDF File",
      faqTitle: "Frequently Asked Questions",
      faqSubtitle: "Quick answers to your common inquiries about Falthaka platform",
      faqDescription: "Discover answers to most common questions about our services and educational platform",
      viewMoreFaqs: "View More FAQs",
      loadingFaqs: "Loading FAQs...",
      errorLoadingFaqs: "Error loading FAQs",
      noFaqsAvailable: "No FAQs available at the moment",
      category: "Category"
    }
  };
  
  const t = texts[isRTL ? 'ar' : 'en'];
  
  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles(prevFiles => [...prevFiles, ...acceptedFiles]);
  }, []);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif'],
      'application/pdf': ['.pdf'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/zip': ['.zip']
    },
    multiple: true
  });
  
  const removeFile = useCallback((fileName: string) => {
    setFiles(files.filter(file => file.name !== fileName));
    if (previewFile && previewFile.name === fileName) {
      closePreview();
    }
  }, [files, previewFile]);
  
  const handlePreview = useCallback((file: File) => {
    setPreviewFile(file);
    setPdfError(false);
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else if (file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  }, []);
  
  const closePreview = useCallback(() => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
    setPdfError(false);
  }, [previewUrl]);
  
  const handleSubmit = useCallback(async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormStatus("sending");
    setErrorMsg("");
    try {
      const formData = new FormData();
      formData.set("name", name);
      formData.set("email", email);
      formData.set("message", message);
      
      // إضافة الملفات إلى FormData
      files.forEach(file => {
        formData.append("attachment", file);
      });
      
      const res = await fetch("/api/contact", { 
        method: "POST", 
        body: formData
      });
      
      if (res.ok) {
        setFormStatus("success");
        setShowToast(true);
        setMessage("");
        setFiles([]);
        closePreview();
        setTimeout(() => setShowToast(false), 3500);
      } else {
        const data = await res.json().catch(() => null);
        setErrorMsg(data?.error || (isRTL ? "تعذر الإرسال." : "Failed to send."));
        setFormStatus("error");
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4500);
      }
    } catch (err: unknown) {
      console.error("Error submitting form:", err);
      const errorMessage = err instanceof Error ? err.message : (isRTL ? "تعذر الإرسال." : "Failed to send.");
      setErrorMsg(errorMessage);
      setFormStatus("error");
      setShowToast(true);
      setTimeout(() => setShowToast(false), 4500);
    }
  }, [name, email, message, files, isRTL, closePreview]);
  
  const getFileIcon = useCallback((fileType: string) => {
    if (fileType.startsWith('image/')) {
      return <FaFileImage className="text-3xl text-indigo-500 dark:text-indigo-400" />;
    } else if (fileType === 'application/pdf') {
      return <FaFilePdf className="text-3xl text-red-500 dark:text-red-400" />;
    } else if (fileType.includes('word')) {
      return <FaFileWord className="text-3xl text-blue-500 dark:text-blue-400" />;
    } else if (fileType.includes('zip')) {
      return <FaFileArchive className="text-3xl text-yellow-500 dark:text-yellow-400" />;
    } else {
      return <FaFileArchive className="text-3xl text-gray-500 dark:text-gray-400" />;
    }
  }, []);
  
  const formatFileSize = useCallback((bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }, []);

  // Social links with enhanced colors
  const socialLinks = [
    { href: "https://www.youtube.com/channel/UCWftbKWXqj0wt-UHMLAcsJA", icon: <FaYoutube />, label: isRTL ? "يوتيوب" : "YouTube", color: "from-red-500 to-red-600", hover: "hover:from-red-600 hover:to-red-700" },
    { href: "https://www.instagram.com/fazlaka_platform/", icon: <FaInstagram />, label: isRTL ? "انستجرام" : "Instagram", color: "from-pink-500 to-purple-500", hover: "hover:from-pink-600 hover:to-purple-600" },
    { href: "https://www.facebook.com/profile.php?id=61579582675453", icon: <FaFacebookF />, label: isRTL ? "فيس بوك" : "Facebook", color: "from-blue-500 to-blue-600", hover: "hover:from-blue-600 hover:to-blue-700" },
    { href: "https://www.tiktok.com/@fazlaka_platform", icon: <FaTiktok />, label: isRTL ? "تيك توك" : "TikTok", color: "from-gray-800 to-black", hover: "hover:from-gray-900 hover:to-black" },
    { href: "https://x.com/FazlakaPlatform", icon: <FaXTwitter />, label: isRTL ? "اكس" : "X", color: "from-gray-700 to-gray-900", hover: "hover:from-gray-800 hover:to-black" },
  ];

  // Hero Section Component with enhanced design
  const HeroSection = () => {
    return (
      <div className="relative mb-16 overflow-hidden rounded-3xl">
        {/* الخلفية المتدرجة */}
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
              <div className="inline-block bg-white/20 backdrop-blur-sm px-3 sm:px-4 py-1 rounded-full mb-4 sm:mb-6">
                <span className="text-white font-medium flex items-center text-sm sm:text-base">
                  <FaEnvelope className="mr-2" />
                  {t.contactUs}
                </span>
              </div>
              <h1 className={`text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold text-white mb-4 sm:mb-6 leading-tight ${isRTL ? '' : 'font-sans tracking-wide'}`}>
                {t.heroTitle} <span className="text-yellow-300">{t.heroHighlight}</span>
              </h1>
              <p className="text-base sm:text-lg text-blue-100 mb-6 sm:mb-8 max-w-2xl">
                <span className={isRTL ? '' : 'font-sans'}>
                  {t.heroSubtitle}
                </span>
              </p>
              
              {/* أزرار التواصل في الأسفل */}
              <div className="flex flex-wrap gap-4 mt-6">
                <Link 
                  href="https://discord.gg/your-server-id" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-all duration-300 flex items-center shadow-lg"
                >
                  <FaDiscord className="mr-2" />
                  {isRTL ? "انضم إلى دسكورد" : "Join Discord"}
                </Link>
                <Link 
                  href="https://mail.google.com/mail/?view=cm&to=fazlaka.contact@gmail.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-full font-medium hover:bg-white/30 transition-all duration-300 flex items-center shadow-lg"
                >
                  <FaEnvelope className="mr-2" />
                  {isRTL ? "أرسل بريداً" : "Send Email"}
                </Link>
              </div>
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
                      <div className="space-y-4">
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full flex items-center justify-center mr-3">
                            <FaEnvelope className="text-white text-xl" />
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-full flex items-center justify-center mr-3">
                            <FaPhone className="text-white text-xl" />
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          </div>
                        </div>
                        <div className="flex items-center">
                          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-500 rounded-full flex items-center justify-center mr-3">
                            <FaDiscord className="text-white text-xl" />
                          </div>
                          <div className="flex-1">
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded mb-2"></div>
                            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                          </div>
                        </div>
                      </div>
                      <div className="mt-6 flex justify-center">
                        <button className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-6 py-2 rounded-full text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all duration-300 flex items-center">
                          <FaPaperPlane className="mr-2" />
                          {t.sendMessageBtn}
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
        
        {/* تأثيرات حركية */}
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-400 to-transparent animate-shimmer"></div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-pink-400 to-transparent animate-shimmer" style={{ animationDelay: '1s', animationDirection: 'reverse' }}></div>
      </div>
    );
  };

  // Enhanced Direct Contact Section with completely new card designs
  const DirectContactSection = () => {
    return (
      <section id="direct-contact" className="mb-16 relative">
        {/* خلفية فاخرة للقسم مع تحسينات */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-100 dark:from-green-900/20 dark:via-emerald-900/20 dark:to-teal-900/20 rounded-3xl overflow-hidden"></div>
        
        {/* عناصر زخرفية محسنة في الخلفية */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
          <div className="absolute top-10 left-10 w-32 h-32 bg-green-300 dark:bg-green-800 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          <div className="absolute top-20 right-20 w-40 h-40 bg-emerald-300 dark:bg-emerald-800 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          <div className="absolute bottom-10 left-1/3 w-36 h-36 bg-teal-300 dark:bg-teal-800 rounded-full mix-blend-multiply filter blur-xl opacity-20"></div>
          
          {/* خطوط زخرفية محسنة */}
          <div className="absolute top-0 left-0 w-full h-full">
            <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <pattern id="grid-green" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(16, 185, 129, 0.05)" strokeWidth="1" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid-green)" />
            </svg>
          </div>
          
          {/* أيقونات تواصل عائمة في الخلفية */}
          <div className="absolute top-1/4 left-1/5 text-green-200 dark:text-green-800 opacity-20">
            <FaDiscord className="text-6xl" />
          </div>
          <div className="absolute bottom-1/4 right-1/5 text-emerald-200 dark:text-emerald-800 opacity-20">
            <FaEnvelope className="text-6xl" />
          </div>
        </div>
        
        {/* المحتوى الرئيسي */}
        <div className="relative z-10 p-8 md:p-12">
          <div className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg flex items-center">
                <FaHandshake className="mr-2" />
                {t.directContact}
              </div>
            </div>
            
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600">
                {t.contactUsDirectly}
              </span>
            </h2>
            
            <p className={`text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto ${isRTL ? '' : 'font-sans'}`}>
              {t.directContactSubtitle}
            </p>
          </div>
          
          {/* بطاقات التواصل المباشر بتصميم جديد وبنفس الطول */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {/* بطاقة دسكورد بتصميم جديد */}
            <div className="h-full">
              {/* الخلفية الرئيسية */}
              <div className="relative bg-gradient-to-br from-indigo-600 via-purple-600 to-indigo-700 rounded-3xl p-1 shadow-2xl overflow-hidden h-full">
                {/* تأثير التوهج */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {/* المحتوى الداخلي */}
                <div className="relative bg-gray-900 dark:bg-gray-800 rounded-3xl p-8 h-full flex flex-col">
                  {/* رأس البطاقة */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <FaDiscord className="text-3xl text-white" />
                      </div>
                      <div className="mr-4">
                        <h3 className={`text-2xl font-bold text-white ${isRTL ? '' : 'font-sans'}`}>
                          {t.discord}
                        </h3>
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                          <span className="text-green-400 text-sm">{isRTL ? "متصل الآن" : "Online Now"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-indigo-400">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 3H4c-1.1 0-2 .9-2 2v11c0 1.1.9 2 2 2h3l-1 1v2h12v-2l-1-1h3c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2zm0 13H4V5h16v11z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* المحتوى الرئيسي */}
                  <div className="flex-grow mb-6">
                    <p className={`text-gray-300 mb-4 ${isRTL ? '' : 'font-sans'}`}>
                      {t.discordDesc}
                    </p>
                    
                    {/* مميزات */}
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-300">
                        <svg className="w-5 h-5 text-indigo-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className={isRTL ? '' : 'font-sans'}>{isRTL ? "دعم فوري 24/7" : "24/7 Instant Support"}</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <svg className="w-5 h-5 text-indigo-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className={isRTL ? '' : 'font-sans'}>{isRTL ? "مجتمع نشط" : "Active Community"}</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <svg className="w-5 h-5 text-indigo-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className={isRTL ? '' : 'font-sans'}>{isRTL ? "قنوات متخصصة" : "Specialized Channels"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* الزر */}
                  <Link 
                    href="https://discord.gg/your-server-id" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3 px-6 rounded-xl font-bold hover:from-indigo-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                  >
                    {isRTL ? "انضم إلى سيرفرنا" : "Join Our Server"}
                    <FaArrowRight className="mr-2" />
                  </Link>
                </div>
              </div>
            </div>
            
            {/* بطاقة البريد الإلكتروني بتصميم جديد */}
            <div className="h-full">
              {/* الخلفية الرئيسية */}
              <div className="relative bg-gradient-to-br from-blue-600 via-cyan-600 to-blue-700 rounded-3xl p-1 shadow-2xl overflow-hidden h-full">
                {/* تأثير التوهج */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                
                {/* المحتوى الداخلي */}
                <div className="relative bg-gray-900 dark:bg-gray-800 rounded-3xl p-8 h-full flex flex-col">
                  {/* رأس البطاقة */}
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <FaEnvelope className="text-3xl text-white" />
                      </div>
                      <div className="mr-4">
                        <h3 className={`text-2xl font-bold text-white ${isRTL ? '' : 'font-sans'}`}>
                          {t.emailAddress}
                        </h3>
                        <div className="flex items-center mt-1">
                          <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                          <span className="text-blue-400 text-sm">{isRTL ? "رد خلال 24 ساعة" : "Response within 24h"}</span>
                        </div>
                      </div>
                    </div>
                    <div className="text-blue-400">
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* المحتوى الرئيسي */}
                  <div className="flex-grow mb-6">
                    <p className={`text-gray-300 mb-4 ${isRTL ? '' : 'font-sans'}`}>
                      {t.emailDesc}
                    </p>
                    
                    {/* مميزات */}
                    <div className="space-y-3">
                      <div className="flex items-center text-gray-300">
                        <svg className="w-5 h-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className={isRTL ? '' : 'font-sans'}>{isRTL ? "ردود رسمية" : "Official Responses"}</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <svg className="w-5 h-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className={isRTL ? '' : 'font-sans'}>{isRTL ? "تتبع الرسائل" : "Message Tracking"}</span>
                      </div>
                      <div className="flex items-center text-gray-300">
                        <svg className="w-5 h-5 text-blue-400 mr-3" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        <span className={isRTL ? '' : 'font-sans'}>{isRTL ? "مرفقات آمنة" : "Secure Attachments"}</span>
                      </div>
                    </div>
                  </div>
                  
                  {/* البريد الإلكتروني */}
                  <div className={`bg-gray-800 rounded-xl p-3 mb-4 ${isRTL ? '' : 'font-sans'}`}>
                    <p className="text-blue-400 text-sm font-mono">fazlaka.contact@gmail.com</p>
                  </div>
                  
                  {/* الزر */}
                  <Link 
                    href="https://mail.google.com/mail/?view=cm&to=fazlaka.contact@gmail.com" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full bg-gradient-to-r from-blue-500 to-cyan-600 text-white py-3 px-6 rounded-xl font-bold hover:from-blue-600 hover:to-cyan-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 flex items-center justify-center"
                  >
                    {t.openGmail}
                    <FaArrowRight className="mr-2" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    );
  };

  // Enhanced FAQ Section with improved cards and smooth animations
  const FAQSection = () => {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    
    const getCardColors = (index: number) => {
      const colors = [
        { border: "border-blue-500", bg: "bg-blue-50", darkBg: "dark:bg-blue-900/20", text: "text-blue-800", darkText: "dark:text-blue-200", icon: "text-blue-500", shadow: "shadow-blue-500/20", hoverShadow: "hover:shadow-blue-500/30", ring: "ring-blue-500" },
        { border: "border-purple-500", bg: "bg-purple-50", darkBg: "dark:bg-purple-900/20", text: "text-purple-800", darkText: "dark:text-purple-200", icon: "text-purple-500", shadow: "shadow-purple-500/20", hoverShadow: "hover:shadow-purple-500/30", ring: "ring-purple-500" },
        { border: "border-green-500", bg: "bg-green-50", darkBg: "dark:bg-green-900/20", text: "text-green-800", darkText: "dark:text-green-200", icon: "text-green-500", shadow: "shadow-green-500/20", hoverShadow: "hover:shadow-green-500/30", ring: "ring-green-500" },
      ];
      return colors[index % colors.length];
    };

    const toggleFAQ = useCallback((index: number) => {
      setActiveIndex(activeIndex === index ? null : index);
    }, [activeIndex]);

    return (
      <section className="mb-16 relative">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100 dark:from-blue-900/20 dark:via-indigo-900/20 dark:to-purple-900/20 rounded-3xl overflow-hidden"></div>
        
        <div className="relative z-10 p-8 md:p-12">
          {/* Header with SEO optimization */}
          <header className="text-center mb-12">
            <div className="inline-block mb-6">
              <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-6 py-2 rounded-full text-sm font-medium shadow-lg flex items-center">
                <FaQuestionCircle className="mr-2" />
                {t.faqTitle}
              </div>
            </div>
            
            <h2 className={`text-3xl md:text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-white ${isRTL ? '' : 'font-sans'}`}>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600">
                {t.faqTitle}
              </span>
            </h2>
            
            <p className={`text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto mb-4 ${isRTL ? '' : 'font-sans'}`}>
              {t.faqSubtitle}
            </p>
            
            <p className={`text-base text-gray-500 dark:text-gray-500 max-w-2xl mx-auto ${isRTL ? '' : 'font-sans'}`}>
              {t.faqDescription}
            </p>
          </header>

          {/* FAQ Cards */}
          <div className="max-w-4xl mx-auto">
            {faqsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
                <span className="mr-3 text-gray-600 dark:text-gray-400">{t.loadingFaqs}</span>
              </div>
            ) : faqsError ? (
              <div className="text-center py-12">
                <p className="text-red-600 dark:text-red-400 mb-4">{t.errorLoadingFaqs}</p>
              </div>
            ) : faqs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-600 dark:text-gray-400">{t.noFaqsAvailable}</p>
              </div>
            ) : (
              <div className="space-y-6 mb-8">
                {faqs.map((faq, index) => {
                  const colors = getCardColors(index);
                  const isActive = activeIndex === index;
                  
                  return (
                    <motion.article
                      key={faq.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className={`group relative overflow-hidden rounded-2xl bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300 border-2 ${colors.border} ${colors.shadow} ${colors.hoverShadow}`}
                    >
                      {/* Card Header - Clickable */}
                      <button
                        onClick={() => toggleFAQ(index)}
                        className={`w-full p-6 ${colors.bg} ${colors.darkBg} border-b border-gray-200 dark:border-gray-700 text-left focus:outline-none focus:ring-2 ${colors.ring} focus:ring-opacity-50 rounded-t-2xl transition-all duration-200`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start">
                            <div className={`flex-shrink-0 w-12 h-12 bg-gradient-to-r ${colors.icon.replace('text-', 'from-')} to-${colors.icon.replace('text-', '')} rounded-xl flex items-center justify-center mr-4 shadow-md`}>
                              <FaQuestionCircle className="text-white text-xl" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className={`text-lg font-bold ${colors.text} ${colors.darkText} mb-2 ${isRTL ? '' : 'font-sans'}`}>
                                {isRTL ? faq.question : faq.questionEn}
                              </h3>
                              {faq.category && (
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${colors.bg} ${colors.text} ${colors.darkBg} ${colors.darkText}`}>
                                    <FaSearch className="mr-1" />
                                    {t.category}: {isRTL ? faq.category : faq.categoryEn}
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className={`flex-shrink-0 ml-4 transition-transform duration-300 ${isActive ? 'rotate-180' : ''}`}>
                            <svg className={`w-6 h-6 ${colors.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                          </div>
                        </div>
                      </button>

                      {/* Card Content - Collapsible */}
                      <AnimatePresence>
                        {isActive && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden"
                          >
                            <div className={`p-6 ${colors.text} ${colors.darkText}`}>
                              <div 
                                className={`prose prose-sm max-w-none ${isRTL ? '' : 'font-sans'} dark:prose-invert`}
                                dangerouslySetInnerHTML={{ 
                                  __html: isRTL ? faq.answer : faq.answerEn 
                                }}
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>

                      {/* Hover Effect Border */}
                      <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${colors.icon.replace('text-', 'from-')} to-${colors.icon.replace('text-', '')} transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300`}></div>
                    </motion.article>
                  );
                })}
              </div>
            )}
            
            {/* View More Button */}
            <div className="text-center">
              <Link 
                href="/faq"
                className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-8 py-4 rounded-full font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 group"
              >
                <span>{t.viewMoreFaqs}</span>
                <FaArrowRight className="mr-2 group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>
          </div>
        </div>
      </section>
    );
  };

  return (
    <div className="min-h-screen pt-24 pb-12 px-4 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* خلفية هندسية عصرية مع تحسينات */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-96 h-96 bg-gradient-to-r from-indigo-200 to-blue-200 dark:from-indigo-900/30 dark:to-blue-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-r from-blue-200 to-cyan-200 dark:from-blue-900/30 dark:to-cyan-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"></div>
        <div className="absolute bottom-0 left-1/2 w-96 h-96 bg-gradient-to-r from-cyan-200 to-teal-200 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-full mix-blend-multiply filter blur-3xl opacity-20 dark:opacity-10"></div>
        
        {/* دوائر صغيرة متحركة مع ألوان محسنة */}
        <div className="absolute top-1/4 left-1/4 w-16 h-16 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-800/20 dark:to-blue-800/20 rounded-full opacity-30 dark:opacity-20 shadow-lg"></div>
        
        <div className="absolute top-1/3 right-1/4 w-24 h-24 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-800/20 dark:to-cyan-800/20 rounded-full opacity-30 dark:opacity-20 shadow-lg"></div>
        
        <div className="absolute bottom-1/4 left-1/3 w-20 h-20 bg-gradient-to-r from-cyan-100 to-teal-100 dark:from-cyan-800/20 dark:to-teal-800/20 rounded-full opacity-30 dark:opacity-20 shadow-lg"></div>
        
        {/* أشكال هندسية متحركة مع تحسينات */}
        <div className="absolute top-1/2 left-10 w-16 h-16 bg-gradient-to-r from-indigo-100 to-blue-100 dark:from-indigo-800/20 dark:to-blue-800/20 transform opacity-30 dark:opacity-20 shadow-lg"></div>
        
        <div className="absolute top-1/4 right-10 w-20 h-20 bg-gradient-to-r from-blue-100 to-cyan-100 dark:from-blue-800/20 dark:to-cyan-800/20 transform opacity-30 dark:opacity-20 shadow-lg"></div>
        
        {/* مربعات ودوائر زخرفية إضافية */}
        <div className="absolute top-1/4 left-1/3 w-8 h-8 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-lg opacity-20 transform rotate-12"></div>
        <div className="absolute bottom-1/4 right-1/3 w-10 h-10 bg-gradient-to-r from-pink-400 to-purple-500 rounded-full opacity-20"></div>
        <div className="absolute top-1/2 left-1/2 w-12 h-12 bg-gradient-to-r from-green-400 to-teal-500 rounded-full opacity-20 transform -translate-x-1/2 -translate-y-1/2"></div>
      </div>
      
      <div className="container mx-auto max-w-6xl relative z-10">
        {/* Hero Section */}
        <HeroSection />
        
        {/* Direct Contact Section - قسم التواصل المباشر */}
        <DirectContactSection />
        
        <main 
          id="contact-form"
          className={`bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 rounded-xl p-4 md:p-6 lg:p-8 relative border border-gray-200 dark:border-gray-700 mb-16 overflow-x-hidden ${
            isDarkMode ? 'dark-mode-shadow' : 'shadow-md'
          }`}
        >
          <h2 id="contact-heading" className={`text-2xl md:text-3xl lg:text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100 relative z-10 flex items-center ${isRTL ? '' : 'font-sans'}`}>
            <svg className="w-8 h-8 ml-3 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {t.sendMessage}
          </h2>
          
          {sessionStatus === "loading" ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
            </div>
          ) : !session ? (
            <div className="bg-gradient-to-r from-indigo-50 via-purple-50 to-pink-50 dark:from-indigo-900/20 dark:via-purple-900/20 dark:to-pink-900/20 border border-indigo-200 dark:border-indigo-800 rounded-2xl p-8 mb-8 relative overflow-hidden">
              {/* خلفية زخرفية */}
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-indigo-200 to-purple-200 dark:from-indigo-800/30 dark:to-purple-800/30 rounded-full filter blur-2xl opacity-30"></div>
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-to-br from-purple-200 to-pink-200 dark:from-purple-800/30 dark:to-pink-800/30 rounded-full filter blur-2xl opacity-30"></div>
              
              <div className="relative z-10 flex flex-col items-center text-center">
                <div className="w-20 h-20 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mb-6 shadow-lg">
                  <svg className="w-10 h-10 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                
                <h3 className={`text-2xl font-bold text-gray-900 dark:text-white mb-3 ${isRTL ? '' : 'font-sans'}`}>
                  {t.unlockFeatures}
                </h3>
                
                <p className={`text-gray-700 dark:text-gray-300 mb-6 max-w-md ${isRTL ? '' : 'font-sans'}`}>
                  {t.signInPrompt}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
                  <Link 
                    href="/sign-in" 
                    className="flex-1 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-3 rounded-xl font-bold text-center hover:from-indigo-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                  >
                    {t.signIn}
                  </Link>
                  <Link 
                    href="/sign-up" 
                    className="flex-1 bg-white dark:bg-gray-800 text-indigo-600 dark:text-indigo-400 px-6 py-3 rounded-xl font-bold text-center border-2 border-indigo-200 dark:border-indigo-700 hover:bg-indigo-50 dark:hover:bg-gray-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-1"
                  >
                    {t.createAccount}
                  </Link>
                </div>
                
                <div className="mt-6 flex items-center justify-center gap-6 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center">
                    <svg className="w-5 h-5 ml-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={isRTL ? '' : 'font-sans'}>{t.exclusiveAccess}</span>
                  </div>
                  <div className="flex items-center">
                    <svg className="w-5 h-5 ml-2 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className={isRTL ? '' : 'font-sans'}>{t.personalizedExperience}</span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-8 relative z-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
                    <svg className="w-5 h-5 ml-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span className={isRTL ? '' : 'font-sans'}>
                      {t.name}
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <input
                      id="name"
                      name="name"
                      type="text"
                      placeholder={t.name}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 p-4 pr-12 h-14 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                      required
                    />
                  </div>
                </div>
                
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
                    <svg className="w-5 h-5 ml-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span className={isRTL ? '' : 'font-sans'}>
                      {t.email}
                    </span>
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                        <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      placeholder={t.email}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full border border-gray-300 dark:border-gray-600 p-4 pr-12 h-14 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                      required
                      disabled={!!session?.user?.email}
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
                  <svg className="w-5 h-5 ml-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                  </svg>
                  <span className={isRTL ? '' : 'font-sans'}>
                    {t.yourMessage}
                  </span>
                </label>
                <div className="relative">
                  <div className="absolute top-4 right-4 pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 5v8a2 2 0 01-2 2h-5l-5 4v-4H4a2 2 0 01-2-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <textarea
                    id="message"
                    name="message"
                    placeholder={isRTL ? "اكتب رسالتك هنا..." : "Write your message here..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    className="w-full border border-gray-300 dark:border-gray-600 p-4 pr-12 pt-4 rounded-lg h-48 resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-300 shadow-sm hover:shadow-md focus:shadow-lg"
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-3 flex items-center">
                  <svg className="w-5 h-5 ml-2 text-indigo-500 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.585a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                  <span className={isRTL ? '' : 'font-sans'}>
                    {t.attachments}
                  </span>
                </label>
                
                <div 
                  {...getRootProps()} 
                  className={`border-2 border-dashed rounded-2xl p-6 md:p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive 
                      ? 'border-indigo-500 bg-gradient-to-br from-indigo-50 to-purple-50 dark:from-indigo-900/30 dark:to-purple-900/30 shadow-lg' 
                      : 'border-gray-300 dark:border-gray-600 hover:border-indigo-400 dark:hover:border-indigo-500 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700/70'
                  }`}
                >
                  <input {...getInputProps()} />
                  <div className="flex flex-col items-center justify-center">
                    <svg className="w-10 h-10 md:w-12 md:h-12 text-gray-400 dark:text-gray-500 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <p className={`text-base md:text-lg text-gray-600 dark:text-gray-300 font-medium mb-2 ${isRTL ? '' : 'font-sans'}`}>
                      {isDragActive ? t.dragActiveText : t.dragDropText}
                    </p>
                    <p className={`text-sm text-gray-500 dark:text-gray-400 ${isRTL ? '' : 'font-sans'}`}>{t.allowedFormats}</p>
                  </div>
                </div>
                
                {files.length > 0 && (
                  <div className="mt-6">
                    <h3 className={`text-sm font-medium text-gray-700 dark:text-gray-300 mb-4 ${isRTL ? '' : 'font-sans'}`}>{t.attachedFiles}</h3>
                    <div className="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-600 shadow-lg">
                      <div className="flex flex-wrap gap-4">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center bg-white dark:bg-gray-700 rounded-xl px-4 py-3 shadow-md hover:shadow-lg transition-all duration-300 border border-gray-200 dark:border-gray-600 flex-1 min-w-[200px]">
                            <div className="flex items-center min-w-0 flex-1">
                              {getFileIcon(file.type)}
                              <div className="mr-3 min-w-0 flex-1">
                                <p className={`text-sm font-medium text-gray-800 dark:text-gray-200 truncate ${isRTL ? '' : 'font-sans'}`}>{file.name}</p>
                                <p className={`text-xs text-gray-500 dark:text-gray-400 ${isRTL ? '' : 'font-sans'}`}>{formatFileSize(file.size)}</p>
                              </div>
                            </div>
                            <div className="flex items-center space-x-2 flex-shrink-0">
                              <button 
                                type="button"
                                onClick={() => handlePreview(file)}
                                className="text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 transition-colors p-1 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/30 shadow-sm"
                                title={t.preview}
                              >
                                <FaEye className="w-4 h-4" />
                              </button>
                              <button 
                                type="button"
                                onClick={() => removeFile(file.name)}
                                className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition-colors p-1 rounded-full hover:bg-red-100 dark:hover:bg-red-900/30 shadow-sm"
                                title={t.delete}
                              >
                                <FaTrash className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                <input 
                  type="file" 
                  ref={fileInputRef}
                  name="attachment" 
                  multiple 
                  accept="image/*,.pdf,.doc,.docx,.zip" 
                  className="hidden" 
                />
              </div>
              
              {previewFile && (
                <div className="mt-6 border-2 border-indigo-200 dark:border-indigo-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-700 shadow-xl dark:shadow-2xl">
                  <div className="p-4 border-b border-indigo-100 dark:border-indigo-800 flex justify-between items-center bg-indigo-50 dark:bg-indigo-900/20">
                    <div className="flex items-center min-w-0">
                      <div className="p-2 bg-indigo-100 dark:bg-indigo-900/30 rounded-lg mr-3 flex-shrink-0">
                        {getFileIcon(previewFile.type)}
                      </div>
                      <h3 className={`text-lg font-bold text-indigo-900 dark:text-indigo-100 truncate ${isRTL ? '' : 'font-sans'}`}>{previewFile.name}</h3>
                    </div>
                    <button
                      onClick={closePreview}
                      className="text-indigo-500 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-200 p-2 rounded-full hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex-shrink-0"
                    >
                      <FaTimes className="w-6 h-6" />
                    </button>
                  </div>
                  
                  <div className="p-4 md:p-6 overflow-auto max-h-[500px] bg-white dark:bg-gray-800">
                    {previewUrl && previewFile.type.startsWith('image/') ? (
                      <div className="flex justify-center">
                        <Image 
                          src={previewUrl} 
                          alt={previewFile.name} 
                          width={800}
                          height={600}
                          className="max-w-full max-h-[400px] object-contain rounded-xl shadow-md"
                        />
                      </div>
                    ) : previewUrl && previewFile.type === 'application/pdf' ? (
                      <div className="flex flex-col items-center">
                        {pdfError ? (
                          <div className="flex flex-col items-center justify-center p-8 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800 max-w-md">
                            <FaTimesCircle className="text-4xl text-red-500 mb-4" />
                            <p className="text-red-700 dark:text-red-300 text-center mb-4">{t.pdfPreviewError}</p>
                            <button
                              onClick={() => {
                                const url = URL.createObjectURL(previewFile);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = previewFile.name;
                                document.body.appendChild(a);
                                a.click();
                                document.body.removeChild(a);
                                URL.revokeObjectURL(url);
                              }}
                              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center"
                            >
                              <FaDownload className="mr-2" />
                              {t.downloadPdf}
                            </button>
                          </div>
                        ) : (
                          <>
                            <div className="w-full max-w-2xl bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden shadow-md">
                              <iframe
                                src={previewUrl}
                                className="w-full h-[400px] border-0"
                                title={previewFile.name}
                                onError={() => setPdfError(true)}
                              />
                            </div>
                          </>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-6">
                        <div className="flex justify-center mb-6">
                          <div className="p-4 bg-indigo-100 dark:bg-indigo-900/30 rounded-full">
                            {getFileIcon(previewFile.type)}
                          </div>
                        </div>
                        <p className={`text-xl text-indigo-800 dark:text-indigo-200 font-medium mb-2 ${isRTL ? '' : 'font-sans'}`}>{t.cannotPreview}</p>
                        <p className={`text-indigo-600 dark:text-indigo-300 mb-1 ${isRTL ? '' : 'font-sans'}`}>{t.fileType}: {previewFile.type}</p>
                        <p className={`text-indigo-600 dark:text-indigo-300 mb-6 ${isRTL ? '' : 'font-sans'}`}>{t.fileSize}: {formatFileSize(previewFile.size)}</p>
                        <button
                          onClick={() => {
                            const url = URL.createObjectURL(previewFile);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = previewFile.name;
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors shadow-md font-medium"
                        >
                          <FaDownload className="mr-2" />
                          <span className={isRTL ? '' : 'font-sans'}>
                            {t.downloadFile}
                          </span>
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-4 bg-indigo-50 dark:bg-indigo-900/20 border-t border-indigo-100 dark:border-indigo-800 flex flex-col sm:flex-row justify-between">
                    <div className={`text-sm text-indigo-700 dark:text-indigo-300 mb-2 sm:mb-0 ${isRTL ? '' : 'font-sans'}`}>
                      {previewFile.name} • {formatFileSize(previewFile.size)}
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={closePreview}
                        className={`px-4 py-2 bg-white dark:bg-gray-700 text-indigo-700 dark:text-indigo-300 rounded-lg border border-indigo-200 dark:border-indigo-600 hover:bg-indigo-100 dark:hover:bg-gray-600 transition-colors font-medium ${isRTL ? '' : 'font-sans'}`}
                      >
                        {t.close}
                      </button>
                      <button
                        onClick={() => {
                          const url = URL.createObjectURL(previewFile);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = previewFile.name;
                          document.body.appendChild(a);
                          a.click();
                          document.body.removeChild(a);
                          URL.revokeObjectURL(url);
                        }}
                        className={`px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium ${isRTL ? '' : 'font-sans'}`}
                      >
                        <FaDownload className="inline mr-2" />
                        {t.download}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="mt-6">
                <button 
                  type="submit" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-4 px-8 rounded-xl hover:from-indigo-700 hover:to-purple-700 disabled:opacity-60 transition-all duration-300 font-bold text-lg shadow-lg hover:shadow-xl flex items-center justify-center"
                  disabled={formStatus === "sending"}
                >
                  {formStatus === "sending" ? (
                    <span className="flex items-center justify-center">
                      <svg className="animate-spin -ml-1 mr-3 h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span className={isRTL ? '' : 'font-sans'}>
                        {t.sending}
                      </span>
                    </span>
                  ) : (
                    <span className="flex items-center justify-center text-center">
                      <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                      </svg>
                      <span className={isRTL ? '' : 'font-sans'}>
                        {t.sendMessageBtn}
                      </span>
                      <svg className="w-6 h-6 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </span>
                  )}
                </button>
                
                <div className="mt-4 text-center">
                  {formStatus === "success" && (
                    <p className="text-green-600 dark:text-green-400 font-bold flex items-center justify-center text-lg">
                      <FaCheckCircle className="mr-2" />
                      <span className={isRTL ? '' : 'font-sans'}>
                        {t.successMessage}
                      </span>
                    </p>
                  )}
                  {formStatus === "error" && (
                    <p className="text-red-600 dark:text-red-400 font-bold flex items-center justify-center text-lg">
                      <FaTimesCircle className="mr-2" />
                      <span className={isRTL ? '' : 'font-sans'}>
                        {t.errorMessage}
                      </span>
                    </p>
                  )}
                </div>
              </div>
            </form>
          )}
        </main>
        
        {/* FAQ Section - Moved to bottom */}
        <FAQSection />
      </div>
      
      {/* Toast محسن مع تأثيرات إضافية */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, x: 100, y: 50, scale: 0.8 }}
            animate={{ opacity: 1, x: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, x: 100, y: 50, scale: 0.8 }}
            transition={{ duration: 0.4, type: "spring", damping: 25 }}
            className="fixed right-4 md:right-6 bottom-4 md:bottom-6 z-50 max-w-xs md:max-w-md"
            role="status"
            aria-live="polite"
          >
            <div className={`${
              formStatus === "success" 
                ? "bg-gradient-to-r from-green-500 to-emerald-600" 
                : "bg-gradient-to-r from-red-500 to-rose-600"
            } text-white rounded-2xl px-6 py-5 flex items-center gap-4 shadow-lg backdrop-blur-sm border border-white border-opacity-20 relative overflow-hidden`}>
              {/* تأثير إضافي */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transform -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              
              <div className="flex-shrink-0">
                {formStatus === "success" ? (
                  <div className="w-8 h-8">
                    <FaCheckCircle className="h-8 w-8" />
                  </div>
                ) : (
                  <div className="w-8 h-8">
                    <FaTimesCircle className="h-8 w-8" />
                  </div>
                )}
              </div>
              <div className="flex flex-col min-w-0">
                <span className={`font-bold text-lg truncate ${isRTL ? '' : 'font-sans'}`}>
                  {formStatus === "success" ? t.successMessage : t.errorMessage}
                </span>
                <span className={`text-sm opacity-90 ${isRTL ? '' : 'font-sans'}`}>
                  {formStatus === "success" 
                    ? (isRTL ? "شكراً لتواصلك معنا، سنرد عليك قريباً" : "Thank you for contacting us, we will get back to you soon") 
                    : (errorMsg || (isRTL ? "يرجى المحاولة مرة أخرى لاحقاً" : "Please try again later"))}
                </span>
              </div>
              <button
                onClick={() => setShowToast(false)}
                className="ml-2 p-1 rounded-full hover:bg-white hover:bg-opacity-20 transition-colors flex-shrink-0"
              >
                <FaTimes className="h-5 w-5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* إضافة أنماط CSS للتأثيرات الإضافية */}
      <style jsx global>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        
        .animate-shimmer {
          animation: shimmer 3s infinite;
        }
        
        @keyframes pulse-slow {
          0%, 100% { opacity: 0.2; }
          50% { opacity: 0.3; }
        }
        
        .animate-pulse-slow {
          animation: pulse-slow 4s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        
        .animate-spin-slow {
          animation: spin-slow 20s linear infinite;
        }
        
        @keyframes float-animation {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-20px); }
        }
        
        .float-animation {
          animation: float-animation 6s ease-in-out infinite;
        }
        
        .dark-mode-shadow {
          box-shadow: 0 20px 40px -10px rgba(99, 102, 241, 0.3), 0 15px 25px -5px rgba(139, 92, 246, 0.2), 0 10px 15px -3px rgba(236, 72, 153, 0.1) !important;
        }
      `}</style>
    </div>
  );
}