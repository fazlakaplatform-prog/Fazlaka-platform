'use client'
import { useState, useEffect, useRef, useCallback } from 'react'
import { PortableText, PortableTextReactComponents } from '@portabletext/react'
import { PortableTextBlock } from '@sanity/types'
import { 
  getPrivacyPolicy, 
  getUserRights, 
  getDataTypes, 
  getSecurityMeasures
} from '@/services/privacyService'
import { portableTextComponents } from '@/components/Formats/portable-text/PortableTextComponents'
import { useLanguage } from '@/components/Language/LanguageProvider'
import { FaSync } from 'react-icons/fa'

// Define a more flexible type for PortableTextBlock that includes optional _key
type FlexiblePortableTextBlock = Omit<PortableTextBlock, '_key'> & {
  _key?: string;
};

// ✅ تم تحديث _id إلى id
interface PrivacyPolicyData {
  id: string;
  lastUpdated: string;
  content: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
}

interface UserRightData {
  id?: string;
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
}

interface DataTypeData {
  id?: string;
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
  color?: string;
  textColor?: string;
}

interface SecurityMeasureData {
  id?: string;
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
}

// كائن الترجمات
const translations = {
  ar: {
    loading: "جاري تحميل البيانات...",
    privacyPolicy: "سياسة الخصوصية",
    privacyDescription: "نحن نلتزم بحماية خصوصيتك وبياناتك الشخصية. يرجى قراءة سياسة الخصوصية التالية بعناية.",
    lastUpdated: "آخر تحديث:",
    printPage: "طباعة الصفحة",
    userRights: "حقوق المستخدم",
    userRightsDescription: "تعرف على حقوقك فيما يتعلق ببياناتك الشخصية وكيفية ممارستها",
    dataTypes: "أنواع البيانات التي نجمعها",
    dataTypesDescription: "نوضح أنواع البيانات التي نقوم بجمعها وسبب جمعها",
    securityMeasures: "الإجراءات الأمنية",
    securityMeasuresDescription: "الإجراءات التي نتخذها لحماية بياناتك الشخصية",
    allRightsReserved: "جميع الحقوق محفوظة",
    policy: "السياسة",
    rights: "الحقوق",
    data: "البيانات",
    security: "الأمان",
    updating: "جاري التحديث..."
  },
  en: {
    loading: "Loading data...",
    privacyPolicy: "Privacy Policy",
    privacyDescription: "We are committed to protecting your privacy and personal data. Please read the following privacy policy carefully.",
    lastUpdated: "Last updated:",
    printPage: "Print Page",
    userRights: "User Rights",
    userRightsDescription: "Learn about your rights regarding your personal data and how to exercise them",
    dataTypes: "Data Types We Collect",
    dataTypesDescription: "We explain the types of data we collect and why we collect it",
    securityMeasures: "Security Measures",
    securityMeasuresDescription: "Measures we take to protect your personal data",
    allRightsReserved: "All rights reserved",
    policy: "Policy",
    rights: "Rights",
    data: "Data",
    security: "Security",
    updating: "Updating..."
  }
};

export default function PrivacyPolicyPage() {
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  
  const [showScrollTop, setShowScrollTop] = useState(false)
  const [activeSection, setActiveSection] = useState('policy')
  const [expandedRights, setExpandedRights] = useState<number | null>(null)
  
  const [privacyData, setPrivacyData] = useState<PrivacyPolicyData | null>(null)
  const [userRights, setUserRights] = useState<UserRightData[]>([])
  const [dataTypes, setDataTypes] = useState<DataTypeData[]>([])
  const [securityMeasures, setSecurityMeasures] = useState<SecurityMeasureData[]>([])
  const [loading, setLoading] = useState(true)
  const [isUpdating, setIsUpdating] = useState(false)
  const [mounted, setMounted] = useState(false)
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const policyRef = useRef<HTMLDivElement>(null)
  const rightsRef = useRef<HTMLDivElement>(null)
  const dataRef = useRef<HTMLDivElement>(null)
  const securityRef = useRef<HTMLDivElement>(null)
  
  // دالة لتحويل المحتوى لتكون أكثر قوة
  const transformContent = useCallback((content: unknown): PortableTextBlock[] => {
    if (!content) {
      return [];
    }
    
    if (Array.isArray(content)) {
      return content.map((block: unknown, index: number): PortableTextBlock => ({
        ...(block as FlexiblePortableTextBlock),
        _key: (block as FlexiblePortableTextBlock)._key || `key-${index}`,
        markDefs: (block as FlexiblePortableTextBlock).markDefs || [],
        style: (block as FlexiblePortableTextBlock).style || 'normal',
      }));
    }
    
    if (typeof content === 'string') {
      return [{
        _type: 'block',
        _key: 'string-content',
        style: 'normal',
        children: [{
          _type: 'span',
          text: content
        }]
      }];
    }
    
    console.warn('Unsupported content type:', typeof content, content);
    return [{
      _type: 'block',
      _key: 'fallback-content',
      style: 'normal',
      children: [{
        _type: 'span',
        text: String(content)
      }]
    }];
  }, []);
  
  // دالة لتحميل البيانات
  const fetchData = useCallback(async () => {
    try {
      if (!isUpdating) {
        setLoading(true);
      }
      
      // ✅ تم تحديث قيم sectionType إلى UPPER_SNAKE_CASE
      const [policyResponse, rightsResponse, typesResponse, securityResponse] = await Promise.all([
        fetch(`/api/privacy?sectionType=MAIN_POLICY&language=${language}`),
        fetch(`/api/privacy?sectionType=USER_RIGHT&language=${language}`),
        fetch(`/api/privacy?sectionType=DATA_TYPE&language=${language}`),
        fetch(`/api/privacy?sectionType=SECURITY_MEASURE&language=${language}`)
      ]);
      
      const [policyResult, rightsResult, typesResult, securityResult] = await Promise.all([
        policyResponse.json(),
        rightsResponse.json(),
        typesResponse.json(),
        securityResponse.json()
      ]);
      
      if (!policyResult.success || !rightsResult.success || !typesResult.success || !securityResult.success) {
        throw new Error('Failed to fetch data');
      }
      
      const policy = policyResult.data.length > 0 ? policyResult.data[0] : null;
      const rights = rightsResult.data;
      const types = typesResult.data;
      const security = securityResult.data;
      
      // ✅ تم تحديث _id إلى id
      const transformedPrivacy = policy ? {
        id: policy.id,
        lastUpdated: policy.lastUpdated,
        content: transformContent(language === 'ar' ? (policy.content || []) : (policy.contentEn || []))
      } : null
      
      const transformedRights = rights
        .filter((right: { id?: string }) => right.id)
        .map((right: { id?: string; title?: string; titleEn?: string; description?: string; descriptionEn?: string; icon?: string }) => ({
          id: right.id,
          title: language === 'ar' ? (right.title || '') : (right.titleEn || right.title || ''),
          description: language === 'ar' ? (right.description || '') : (right.descriptionEn || right.description || ''),
          icon: right.icon || ''
        }))
      
      const transformedTypes = types
        .filter((type: { id?: string }) => type.id)
        .map((type: { id?: string; title?: string; titleEn?: string; description?: string; descriptionEn?: string; icon?: string; color?: string; textColor?: string }) => ({
          id: type.id,
          title: language === 'ar' ? (type.title || '') : (type.titleEn || type.title || ''),
          description: language === 'ar' ? (type.description || '') : (type.descriptionEn || type.description || ''),
          icon: type.icon || '',
          color: type.color || 'bg-blue-50',
          textColor: type.textColor || 'text-blue-800'
        }))
      
      const transformedSecurity = security
        .filter((measure: { id?: string }) => measure.id)
        .map((measure: { id?: string; title?: string; titleEn?: string; description?: string; descriptionEn?: string; icon?: string }) => ({
          id: measure.id,
          title: language === 'ar' ? (measure.title || '') : (measure.titleEn || measure.title || ''),
          description: language === 'ar' ? (measure.description || '') : (measure.descriptionEn || measure.description || ''),
          icon: measure.icon || ''
        }))
      
      setPrivacyData(transformedPrivacy)
      setUserRights(transformedRights)
      setDataTypes(transformedTypes)
      setSecurityMeasures(transformedSecurity)
    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
      setIsUpdating(false)
    }
  }, [language, isUpdating, transformContent]);
  
  // دالة لتحديث البيانات تلقائياً
  const autoRefresh = useCallback(async () => {
    setIsUpdating(true);
    await fetchData();
  }, [fetchData]);
  
  const setupEventSource = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    
    eventSourceRef.current = new EventSource('/api/stream');
    
    eventSourceRef.current.onopen = () => {
      console.log('SSE connection opened');
    };
    
    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'change') {
          console.log('Change detected:', data);
          // ✅ تم تحديث اسم المجموعة
          if (data.collection === 'privacy' || data.collection === 'privacyContent') {
            autoRefresh();
          }
        }
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };
    
    eventSourceRef.current.onerror = (error) => {
      console.error('SSE connection error:', error);
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      reconnectTimeoutRef.current = setTimeout(setupEventSource, 2000);
    };
  }, [autoRefresh]);
  
  useEffect(() => {
    setMounted(true);
    
    fetchData();
    
    setupEventSource();
    
    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [language, mounted, fetchData, setupEventSource]);
  
  // مراقبة التمرير
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300)
      
      const sections = [
        { id: 'policy', ref: policyRef },
        { id: 'rights', ref: rightsRef },
        { id: 'data', ref: dataRef },
        { id: 'security', ref: securityRef }
      ]
      
      for (const section of sections) {
        if (section.ref.current) {
          const rect = section.ref.current.getBoundingClientRect()
          if (rect.top <= 100 && rect.bottom >= 100) {
            setActiveSection(section.id)
            break
          }
        }
      }
    }
    
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])
  
  // التحقق من وجود جزء من الرابط (#)
  useEffect(() => {
    const hash = window.location.hash.substring(1);
    if (hash) {
      setActiveSection(hash);
      const section = document.getElementById(hash);
      if (section) {
        setTimeout(() => {
          section.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
      }
    }
  }, []);
  
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  
  const scrollToSection = (sectionId: string) => {
    setActiveSection(sectionId)
    const section = document.getElementById(sectionId)
    if (section) {
      section.scrollIntoView({ behavior: 'smooth', block: 'start' })
      window.history.pushState(null, '', `#${sectionId}`)
    }
  }
  
  const toggleRight = (index: number) => {
    if (expandedRights === index) {
      setExpandedRights(null)
    } else {
      setExpandedRights(index)
    }
  }
  
  const handlePrint = () => {
    window.print()
  }
  
  if (loading && !isUpdating) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600 dark:border-blue-400 mx-auto"></div>
          <p className="mt-4 text-gray-700 dark:text-blue-200">{t.loading}</p>
        </div>
      </div>
    )
  }
  
  const formattedLastUpdated = privacyData?.lastUpdated 
    ? new Date(privacyData.lastUpdated).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US') 
    : '';
  
  const baseComponents = portableTextComponents as Partial<PortableTextReactComponents> || {};
  
  const typedComponents: PortableTextReactComponents = {
    block: baseComponents.block || {},
    list: baseComponents.list || {},
    listItem: baseComponents.listItem || {},
    marks: baseComponents.marks || {},
    types: baseComponents.types || {},
    hardBreak: baseComponents.hardBreak || (() => <br />),
    unknownMark: baseComponents.unknownMark || ((props) => <span>{props.children}</span>),
    unknownType: baseComponents.unknownType || ((props) => <div>Unknown type: {props.value._type}</div>),
    unknownBlockStyle: baseComponents.unknownBlockStyle || ((props) => <p>{props.children}</p>),
    unknownList: baseComponents.unknownList || ((props) => <ul>{props.children}</ul>),
    unknownListItem: baseComponents.unknownListItem || ((props) => <li>{props.children}</li>),
  };
  
  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 py-12 px-4 transition-colors duration-300">
      {/* مؤشر التحديث التلقائي */}
      {isUpdating && (
        <div className="fixed top-20 right-4 z-50 bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center gap-3">
          <FaSync className="h-5 w-5 animate-spin" />
          <span>{t.updating}</span>
        </div>
      )}
      
      {/* قائمة التنقل الجانبية */}
      <div className={`fixed ${isRTL ? 'right-4' : 'left-4'} top-1/2 transform -translate-y-1/2 z-40 hidden lg:block`}>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg dark:shadow-gray-900/30 p-4">
          <div className="space-y-3">
            <button 
              onClick={() => scrollToSection('policy')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'policy' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className={isRTL ? 'ml-2' : 'mr-2'}>📄</span>
              <span>{t.policy}</span>
            </button>
            <button 
              onClick={() => scrollToSection('rights')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'rights' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className={isRTL ? 'ml-2' : 'mr-2'}>👤</span>
              <span>{t.rights}</span>
            </button>
            <button 
              onClick={() => scrollToSection('data')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'data' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className={isRTL ? 'ml-2' : 'mr-2'}>📊</span>
              <span>{t.data}</span>
            </button>
            <button 
              onClick={() => scrollToSection('security')}
              className={`flex items-center w-full p-2 rounded-lg transition-all duration-300 ${activeSection === 'security' ? 'bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
            >
              <span className={isRTL ? 'ml-2' : 'mr-2'}>🔒</span>
              <span>{t.security}</span>
            </button>
          </div>
        </div>
      </div>
      
      {/* زر العودة للأعلى */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          className={`fixed bottom-6 ${isRTL ? 'right-6' : 'left-6'} bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white p-3 rounded-full shadow-lg dark:shadow-gray-900/30 z-40 transition-all duration-300 transform hover:scale-110`}
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
        </button>
      )}
      
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        {/* رأس الصفحة */}
        <div className="text-center mb-12 animate-fade-in">
          <div className="inline-block p-4 bg-blue-100 dark:bg-blue-900/30 rounded-full mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold mb-4 text-blue-900 dark:text-blue-200">{t.privacyPolicy}</h1>
          <div className="w-24 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-6"></div>
          <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
            {t.privacyDescription}
          </p>
          <div className="mt-4">
            <span className="text-gray-600 dark:text-blue-300">{t.lastUpdated} {formattedLastUpdated}</span>
          </div>
          <button 
            onClick={handlePrint}
            className="mt-4 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-full inline-flex items-center transition duration-300 transform hover:scale-105"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clipRule="evenodd" />
            </svg>
            {t.printPage}
          </button>
        </div>
        
        {/* محتوى سياسة الخصوصية */}
        {privacyData && privacyData.content && (
          <div 
            id="policy" 
            ref={policyRef}
            className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
          >
            <div className="prose prose-lg max-w-none dark:prose-invert prose-headings:text-blue-900 dark:prose-headings:text-blue-200 prose-p:text-gray-700 dark:prose-p:text-blue-100 prose-strong:text-blue-800 dark:prose-strong:text-blue-200">
              <PortableText value={privacyData.content} components={typedComponents} />
            </div>
          </div>
        )}
        
        {/* قسم حقوق المستخدم */}
        <div 
          id="rights" 
          ref={rightsRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">{t.userRights}</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              {t.userRightsDescription}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {userRights.map((right, index) => (
              <div 
                key={right.id}
                className={`bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 cursor-pointer transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg ${expandedRights === index ? 'ring-2 ring-blue-500 dark:ring-blue-400' : ''}`}
                onClick={() => toggleRight(index)}
              >
                <div className="flex items-center mb-3">
                  <div className="text-3xl mr-3">{right.icon}</div>
                  <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">{right.title}</h3>
                </div>
                <div className={`overflow-hidden transition-all duration-500 ${expandedRights === index ? 'max-h-96' : 'max-h-0'}`}>
                  <p className="text-gray-700 dark:text-blue-100">{right.description}</p>
                </div>
                <div className="mt-4 text-left">
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    className={`h-5 w-5 text-blue-600 dark:text-blue-400 transition-transform duration-300 ${expandedRights === index ? 'transform rotate-180' : ''}`} 
                    viewBox="0 0 20 20" 
                    fill="currentColor"
                  >
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* قسم أنواع البيانات */}
        <div 
          id="data" 
          ref={dataRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">{t.dataTypes}</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              {t.dataTypesDescription}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {dataTypes.map((dataType) => (
              <div 
                key={dataType.id}
                className={`${dataType.color} dark:bg-gray-700 rounded-xl p-6 border border-gray-200 dark:border-gray-600 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg`}
              >
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{dataType.icon}</div>
                  <h3 className={`font-bold text-lg ${dataType.textColor} dark:text-blue-200`}>{dataType.title}</h3>
                </div>
                <p className="text-gray-700 dark:text-blue-100">{dataType.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* قسم الإجراءات الأمنية */}
        <div 
          id="security" 
          ref={securityRef}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl dark:shadow-gray-900/30 p-8 mb-12 transition-all duration-500 hover:shadow-2xl"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-bold mb-4 text-blue-800 dark:text-blue-200">{t.securityMeasures}</h2>
            <div className="w-20 h-1 bg-blue-600 dark:bg-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-700 dark:text-blue-100 max-w-2xl mx-auto">
              {t.securityMeasuresDescription}
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {securityMeasures.map((measure) => (
              <div 
                key={measure.id}
                className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-800 rounded-xl p-6 border border-blue-100 dark:border-gray-700 transition-all duration-500 transform hover:-translate-y-1 hover:shadow-lg"
              >
                <div className="flex items-center mb-4">
                  <div className="text-3xl mr-3">{measure.icon}</div>
                  <h3 className="font-bold text-lg text-blue-800 dark:text-blue-200">{measure.title}</h3>
                </div>
                <p className="text-gray-700 dark:text-blue-100">{measure.description}</p>
              </div>
            ))}
          </div>
        </div>
        
        {/* تذييل الصفحة */}
        <div className="text-center text-gray-600 dark:text-blue-300 text-sm animate-fade-in">
          <p>© 2025 {t.allRightsReserved}</p>
          <p className="mt-2">{t.lastUpdated} {formattedLastUpdated}</p>
        </div>
      </div>
      
      <style jsx global>{`
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
