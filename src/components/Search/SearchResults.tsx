// src/components/Search/SearchResults.tsx
'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  getRelativeTime,
  isToday,
  isYesterday
} from '@/utils/dateUtils';
import { SemanticSearchResult } from '@/services/semanticSearch';

// تعريف الأنواع الممكنة للغة ونوع المحتوى
type Language = 'ar' | 'en';
type ContentType = 'article' | 'episode' | 'season' | 'playlist' | 'team' | 'faq' | 'privacy' | 'terms';

export default function SearchResults({ 
  results, 
  language
}: { 
  results: SemanticSearchResult[]; 
  language: Language;
}) {
  const getTypeLabel = (type: ContentType) => {
    const labels: Record<Language, Record<ContentType, string>> = {
      ar: {
        article: 'مقال',
        episode: 'حلقة',
        season: 'موسم',
        playlist: 'قائمة تشغيل',
        team: 'عضو فريق',
        faq: 'سؤال شائع',
        privacy: 'سياسة الخصوصية',
        terms: 'شروط وأحكام'
      },
      en: {
        article: 'Article',
        episode: 'Episode',
        season: 'Season',
        playlist: 'Playlist',
        team: 'Team Member',
        faq: 'FAQ',
        privacy: 'Privacy Policy',
        terms: 'Terms & Conditions'
      }
    };
    return labels[language][type] || type;
  };

  const getTypeIcon = (type: ContentType) => {
    const icons: Record<ContentType, React.ReactNode> = {
      article: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      ),
      episode: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      ),
      season: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      playlist: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
        </svg>
      ),
      team: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
        </svg>
      ),
      faq: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      privacy: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
        </svg>
      ),
      terms: (
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      )
    };
    return icons[type] || icons.article;
  };

  const getResultUrl = (result: SemanticSearchResult) => {
    const { type, data } = result;
    
    switch (type) {
      case 'article':
        return `/articles/${data.slug}`;
      case 'episode':
        return `/episodes/${data.slug}`;
      case 'season':
        return `/seasons/${data.slug}`;
      case 'playlist':
        return `/playlists/${data._id || data.id}`;
      case 'team':
        return `/team/${data.slug}`;
      case 'faq':
        return `/faqs#${data._id || data.id}`;
      case 'privacy':
        return `/privacy#${data._id || data.id}`;
      case 'terms':
        return `/terms#${data._id || data.id}`;
      default:
        return '/';
    }
  };

  const getResultImage = (result: SemanticSearchResult): string => {
    const { type, data } = result;
    
    switch (type) {
      case 'article':
        return String(data.featuredImageUrl || data.featuredImageUrlEn || '/images/default-article.jpg');
      case 'episode':
        return String(data.thumbnailUrl || data.thumbnailUrlEn || '/images/default-episode.jpg');
      case 'season':
        return String(data.thumbnailUrl || data.thumbnailUrlEn || '/images/default-season.jpg');
      case 'playlist':
        return String(data.imageUrl || data.imageUrlEn || '/images/default-playlist.jpg');
      case 'team':
        return String(data.imageUrl || data.imageUrlEn || '/images/default-avatar.jpg');
      case 'faq':
      case 'privacy':
      case 'terms':
        // لهذه الأنواع، سنستخدم صورة افتراضية بدلاً من null
        return '/images/default-content.jpg';
      default:
        return '/images/default-content.jpg';
    }
  };

  const getResultTitle = (result: SemanticSearchResult): string => {
    const { type, data } = result;
    
    switch (type) {
      case 'article':
        return String(result.highlightedTitle || data.localizedTitle || data.title || '');
      case 'episode':
        return String(result.highlightedTitle || data.localizedTitle || data.title || '');
      case 'season':
        return String(result.highlightedTitle || data.localizedTitle || data.title || '');
      case 'playlist':
        return String(result.highlightedTitle || data.localizedTitle || data.title || '');
      case 'team':
        return String(result.highlightedTitle || data.localizedName || data.name || '');
      case 'faq':
        return String(result.highlightedTitle || data.localizedQuestion || data.question || '');
      case 'privacy':
        return String(result.highlightedTitle || data.localizedTitle || data.title || '');
      case 'terms':
        return String(result.highlightedTitle || data.localizedTitle || data.title || '');
      default:
        return String(result.highlightedTitle || data.title || data.name || '');
    }
  };

  const getResultDescription = (result: SemanticSearchResult): string => {
    const { type, data } = result;
    
    switch (type) {
      case 'article':
        return String(result.highlightedDescription || data.localizedExcerpt || data.excerpt || '');
      case 'episode':
        return String(result.highlightedDescription || data.localizedDescription || data.description || '');
      case 'season':
        return String(result.highlightedDescription || data.localizedDescription || data.description || '');
      case 'playlist':
        return String(result.highlightedDescription || data.localizedDescription || data.description || '');
      case 'team':
        return String(result.highlightedDescription || data.localizedBio || data.bio || '');
      case 'faq':
        return String(result.highlightedDescription || data.localizedAnswer || data.answer || '');
      case 'privacy':
        return String(result.highlightedDescription || data.localizedDescription || data.description || '');
      case 'terms':
        return String(result.highlightedDescription || data.localizedDescription || data.description || '');
      default:
        return String(result.highlightedDescription || data.description || '');
    }
  };

  const getResultDate = (result: SemanticSearchResult): string => {
    const { data } = result;
    return String(data.publishedAt || data.createdAt || data.updatedAt || '');
  };

  const getFormattedDate = (date: string | Date) => {
    if (isToday(date)) {
      return language === 'ar' ? 'اليوم' : 'Today';
    } else if (isYesterday(date)) {
      return language === 'ar' ? 'أمس' : 'Yesterday';
    } else {
      return getRelativeTime(date, language);
    }
  };

  // تحديد لون الخلفية بناءً على النوع للأقسام التي ليس لها صور
  const getIconBackgroundColor = (type: ContentType) => {
    switch (type) {
      case 'faq':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400';
      case 'privacy':
        return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
      case 'terms':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700/30 text-gray-600 dark:text-gray-400';
    }
  };

  // التحقق مما إذا كان يجب عرض الأيقونة بدلاً من الصورة
  const shouldShowIcon = (result: SemanticSearchResult) => {
    return ['faq', 'privacy', 'terms'].includes(result.type);
  };

  return (
    <div className="space-y-4">
      {results.map((result, index) => (
        <div key={`${result.type}-${result.data._id || result.data.id || index}`} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row">
            {/* Image or Icon */}
            <div className="md:w-1/4 h-48 md:h-auto">
              {shouldShowIcon(result) ? (
                // عرض أيقونة بدلاً من الصورة للأقسام التي ليس لها صور
                <Link href={getResultUrl(result)}>
                  <div className={`h-full w-full relative overflow-hidden flex items-center justify-center ${getIconBackgroundColor(result.type as ContentType)}`}>
                    <div className="text-4xl">
                      {getTypeIcon(result.type as ContentType)}
                    </div>
                    <div className="absolute top-2 left-2 bg-white dark:bg-gray-800 px-2 py-1 rounded-md text-xs font-medium flex items-center shadow-sm">
                      {getTypeIcon(result.type as ContentType)}
                      <span className="mr-1">{getTypeLabel(result.type as ContentType)}</span>
                    </div>
                  </div>
                </Link>
              ) : (
                <Link href={getResultUrl(result)}>
                  <div className="h-full w-full relative overflow-hidden">
                    <Image
                      src={getResultImage(result)}
                      alt={getResultTitle(result)}
                      fill
                      className="object-cover"
                    />
                    <div className="absolute top-2 left-2 bg-amber-500 text-white px-2 py-1 rounded-md text-xs font-medium flex items-center">
                      {getTypeIcon(result.type as ContentType)}
                      <span className="mr-1">{getTypeLabel(result.type as ContentType)}</span>
                    </div>
                  </div>
                </Link>
              )}
            </div>
            
            {/* Content */}
            <div className="md:w-3/4 p-6">
              <div className="flex justify-between items-start mb-2">
                <h3 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
                  <Link href={getResultUrl(result)} className="hover:text-amber-600 dark:hover:text-amber-400 transition-colors">
                    <span dangerouslySetInnerHTML={{ __html: getResultTitle(result) }} />
                  </Link>
                </h3>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {getFormattedDate(getResultDate(result))}
                </span>
              </div>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-3">
                <span dangerouslySetInnerHTML={{ __html: getResultDescription(result) }} />
              </p>
              
              {result.relevance && (
                <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span>{result.relevance}</span>
                  <span className="mx-2">•</span>
                  <span>{Math.round(result.score * 100)}% {language === 'ar' ? 'مطابقة' : 'match'}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}