// src/app/search/page.tsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { useSearchParams } from 'next/navigation';
import { 
  searchFromClient, 
  getSearchSuggestionsFromClient,
  getTrendingSearchesFromClient,
  saveSearchHistory
} from '@/services/searchClient';
import { SearchResultFromAPI } from '@/services/searchClient';
import SearchFilters from '@/components/Search/SearchFilters';
import SearchResults from '@/components/Search/SearchResults';
import SearchSuggestions from '@/components/Search/SearchSuggestions';
import AIAssistantSearch from '@/components/Search/AIAssistantSearch';
import LoadingSpinner from '@/components/UI/LoadingSpinner';
import Image from 'next/image';

export default function SearchPage() {
  const { data: session } = useSession();
  const { language, isRTL } = useLanguage();
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState<SearchResultFromAPI | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filters, setFilters] = useState({
    type: 'all', // all, article, episode, season, playlist, team, faq, privacy, terms
    sortBy: 'relevance', // relevance, date, title
    dateRange: 'all', // all, week, month, year
  });
  
  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Memoize the handleSearch function to prevent unnecessary re-renders
  const handleSearch = useCallback(async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      setResults(null);
      return;
    }

    setIsLoading(true);
    setShowSuggestions(false);
    
    try {
      const searchResults = await searchFromClient(searchQuery, language, {
        limit: 20,
        ...filters
      });
      
      setResults(searchResults);
      
      // حفظ البحث في السجل
      saveSearchHistory(searchQuery, session?.user?.id);
      
    } catch (error) {
      console.error('Error searching:', error);
      setResults(null);
    } finally {
      setIsLoading(false);
    }
  }, [language, filters, session?.user?.id]);

  // Memoize the getSuggestions function to prevent unnecessary re-renders
  const getSuggestions = useCallback(async (value: string) => {
    try {
      const searchSuggestions = await getSearchSuggestionsFromClient(value, language);
      setSuggestions(searchSuggestions.map(s => s.text));
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error getting suggestions:', error);
    }
  }, [language]);

  // Memoize the handleSuggestionClick function to prevent unnecessary re-renders
  const handleSuggestionClick = useCallback((suggestion: string) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    handleSearch(suggestion);
  }, [handleSearch]);

  // Memoize the handleInputChange function to prevent unnecessary re-renders
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Debounce search
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
    
    debounceTimerRef.current = setTimeout(() => {
      if (value.trim()) {
        handleSearch(value);
      } else {
        setResults(null);
      }
    }, 500);
    
    // Get suggestions
    if (value.trim()) {
      getSuggestions(value);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [handleSearch, getSuggestions]);

  // Memoize the handleFilterChange function to prevent unnecessary re-renders
  const handleFilterChange = useCallback((newFilters: typeof filters) => {
    setFilters(newFilters);
    if (query.trim()) {
      handleSearch(query);
    }
  }, [query, handleSearch]);

  // Memoize the handleSearchSubmit function to prevent unnecessary re-renders
  const handleSearchSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  }, [query, handleSearch]);

  // Memoize the loadTrendingSearches function to prevent unnecessary re-renders
  const loadTrendingSearches = useCallback(async () => {
    try {
      const trending = await getTrendingSearchesFromClient(language);
      // تحديث النتائج مع البحث الشائع
      setResults(prev => prev ? { ...prev, trendingSearches: trending } : null);
    } catch (error) {
      console.error('Error loading trending searches:', error);
    }
  }, [language]);

  useEffect(() => {
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery, handleSearch]);

  useEffect(() => {
    if (!results && !query) {
      loadTrendingSearches();
    }
  }, [results, query, loadTrendingSearches]);

  const texts = {
    ar: {
      pageTitle: 'البحث في فذلكه',
      subtitle: 'اكتشف محتوى غني ومنوع',
      placeholder: 'ابحث عن مقالات، حلقات، مواسم، قوائم تشغيل، أعضاء الفريق...',
      searchButton: 'بحث',
      noResults: 'لم يتم العثور على نتائج',
      loading: 'جاري البحث...',
      filters: 'الفلاتر',
      sortBy: 'ترتيب حسب',
      relevance: 'الصلة',
      date: 'التاريخ',
      title: 'العنوان',
      dateRange: 'نطاق التاريخ',
      all: 'الكل',
      week: 'الأسبوع الماضي',
      month: 'الشهر الماضي',
      year: 'السنة الماضية',
      contentType: 'نوع المحتوى',
      article: 'مقالات',
      episode: 'حلقات',
      season: 'مواسم',
      playlist: 'قوائم تشغيل',
      team: 'الفريق',
      faq: 'الأسئلة الشائعة',
      privacy: 'سياسة الخصوصية',
      terms: 'شروط وأحكام',
      suggestions: 'اقتراحات البحث',
      searchHistory: 'سجل البحث',
      trendingSearches: 'عمليات البحث الشائعة',
      advancedSearch: 'بحث متقدم',
      resultsCount: '{count} نتيجة',
      relatedContent: 'محتوى ذو صلة',
      searchTime: 'وقت البحث: {time}ms'
    },
    en: {
      pageTitle: 'Search in Fazlaka',
      subtitle: 'Discover rich and diverse content',
      placeholder: 'Search for articles, episodes, seasons, playlists, team members...',
      searchButton: 'Search',
      noResults: 'No results found',
      loading: 'Searching...',
      filters: 'Filters',
      sortBy: 'Sort by',
      relevance: 'Relevance',
      date: 'Date',
      title: 'Title',
      dateRange: 'Date range',
      all: 'All',
      week: 'Last week',
      month: 'Last month',
      year: 'Last year',
      contentType: 'Content type',
      article: 'Articles',
      episode: 'Episodes',
      season: 'Seasons',
      playlist: 'Playlists',
      team: 'Team',
      faq: 'FAQs',
      privacy: 'Privacy Policy',
      terms: 'Terms & Conditions',
      suggestions: 'Search suggestions',
      searchHistory: 'Search history',
      trendingSearches: 'Trending searches',
      advancedSearch: 'Advanced search',
      resultsCount: '{count} results',
      relatedContent: 'Related content',
      searchTime: 'Search time: {time}ms'
    }
  };

  const t = texts[language];

  // استخراج النصوص المترجمة لمكون SearchFilters
  const filterTexts = {
    filters: t.filters,
    contentType: t.contentType,
    all: t.all,
    article: t.article,
    episode: t.episode,
    season: t.season,
    playlist: t.playlist,
    team: t.team,
    faq: t.faq,
    privacy: t.privacy,
    terms: t.terms,
    sortBy: t.sortBy,
    relevance: t.relevance,
    date: t.date,
    title: t.title,
    dateRange: t.dateRange,
    week: t.week,
    month: t.month,
    year: t.year
  };

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${isRTL ? 'rtl' : ''}`}>
      {/* Hero Section - تصميم أكثر أناقة وبساطة */}
      <div className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-light text-gray-800 dark:text-gray-200 mb-2">
              {t.pageTitle}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {t.subtitle}
            </p>
          </div>
          
          {/* Search Bar */}
          <form onSubmit={handleSearchSubmit} className="relative max-w-2xl mx-auto">
            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                className="w-full py-3 px-6 pr-12 rounded-full text-gray-800 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 focus:outline-none focus:ring-2 focus:ring-amber-500/50 focus:border-transparent"
                placeholder={t.placeholder}
                value={query}
                onChange={handleInputChange}
                onFocus={() => query.trim() && setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white p-3 rounded-full transition-colors"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="small" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
            
            {/* Search Suggestions */}
            {showSuggestions && suggestions.length > 0 && (
              <SearchSuggestions 
                suggestions={suggestions} 
                onSuggestionClick={handleSuggestionClick}
                isRTL={isRTL}
              />
            )}
          </form>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <div className="lg:w-1/4">
            <SearchFilters 
              filters={filters} 
              onFilterChange={handleFilterChange}
              language={language}
              texts={filterTexts}
            />
          </div>
          
          {/* Results */}
          <div className="lg:w-3/4">
            {isLoading ? (
              <div className="flex justify-center py-12">
                <LoadingSpinner size="large" />
              </div>
            ) : results ? (
              <>
                {query && (
                  <div className="mb-6">
                    <h2 className="text-2xl font-light text-gray-800 dark:text-gray-200 mb-2">
                      {t.resultsCount.replace('{count}', results.totalCount.toString())}
                    </h2>
                    <p className="text-gray-600 dark:text-gray-400">
                      {language === 'ar' 
                        ? `نتائج البحث عن: "${query}"`
                        : `Search results for: "${query}"`
                      }
                    </p>
                    {results.searchTime && (
                      <p className="text-sm text-gray-500 dark:text-gray-500 mt-1">
                        {t.searchTime.replace('{time}', results.searchTime.toString())}
                      </p>
                    )}
                  </div>
                )}
                
                {results.semanticResults.length > 0 ? (
                  <>
                    <SearchResults 
                      results={results.semanticResults} 
                      language={language}
                    />
                    
                    {/* AI Assistant Search Component */}
                    <AIAssistantSearch 
                      query={query}
                      language={language}
                    />
                  </>
                ) : query ? (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <h3 className="text-xl font-light text-gray-800 dark:text-gray-200 mb-2">
                      {t.noResults}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {language === 'ar' 
                        ? 'جرب استخدام كلمات مفتاحية مختلفة أو تحقق من تهجئة الكلمات'
                        : 'Try using different keywords or check the spelling of your words'
                      }
                    </p>
                    
                    {/* AI Assistant Search Component */}
                    <AIAssistantSearch 
                      query={query}
                      language={language}
                    />
                    
                    <button
                      onClick={() => setQuery('')}
                      className="mt-4 px-6 py-3 bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white rounded-lg transition-colors"
                    >
                      {language === 'ar' ? 'بحث جديد' : 'New search'}
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <div className="w-24 h-24 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <Image
                        src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
                        alt="Fazlaka AI Assistant"
                        width={60}
                        height={60}
                        className="object-cover rounded-full"
                      />
                    </div>
                    <h3 className="text-xl font-light text-gray-800 dark:text-gray-200 mb-2">
                      {language === 'ar' ? 'ابدأ البحث' : 'Start searching'}
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                      {language === 'ar' 
                        ? 'اكتب كلمات مفتاحية في مربع البحث للعثور على المحتوى الذي تبحث عنه'
                        : 'Type keywords in the search box to find the content you are looking for'
                      }
                    </p>
                    
                    {/* Trending Searches */}
                    <div className="max-w-md mx-auto">
                      <h4 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-3">
                        {t.trendingSearches}
                      </h4>
                      <div className="flex flex-wrap gap-2 justify-center">
                        {results?.trendingSearches?.map((trending, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(trending)}
                            className="px-3 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-full text-sm transition-colors"
                          >
                            {trending}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* Related Content */}
                {results.relatedContent && results.relatedContent.length > 0 && (
                  <div className="mt-12 pt-8 border-t border-gray-200 dark:border-gray-700">
                    <h3 className="text-xl font-light text-gray-800 dark:text-gray-200 mb-4">
                      {t.relatedContent}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {results.relatedContent.map((item, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow border border-gray-100 dark:border-gray-700">
                          <div className="p-4">
                            <h4 className="font-medium text-gray-800 dark:text-gray-200 mb-2">
                              {item.data.title || item.data.name}
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                              {item.data.description || item.data.excerpt || item.data.bio}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}