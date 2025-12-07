// src/services/searchClient.ts

import { SemanticSearchResult, SearchSuggestion } from './semanticSearch';

// واجهة لنتائج البحث من الـ API
export interface SearchResultFromAPI {
  semanticResults: SemanticSearchResult[];
  suggestions: SearchSuggestion[];
  trendingSearches: string[];
  relatedContent: SemanticSearchResult[];
  totalCount: number;
  searchTime: number;
}

// تعريف واجهة لعناصر سجل البحث
interface SearchHistoryItem {
  query: string;
  timestamp: string;
}

// دالة للبحث من الـ client-side
export async function searchFromClient(
  query: string,
  language: string = 'ar',
  options: {
    limit?: number;
    type?: string;
    dateRange?: string;
  } = {}
): Promise<SearchResultFromAPI> {
  try {
    const params = new URLSearchParams({
      q: query,
      language,
      limit: options.limit?.toString() || '20',
      type: options.type || 'all',
      dateRange: options.dateRange || 'all'
    });

    const response = await fetch(`/api/search?${params}`);
    
    if (!response.ok) {
      throw new Error('Search request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error searching from client:', error);
    return {
      semanticResults: [],
      suggestions: [],
      trendingSearches: [],
      relatedContent: [],
      totalCount: 0,
      searchTime: 0
    };
  }
}

// دالة للحصول على اقتراحات البحث
export async function getSearchSuggestionsFromClient(
  query: string,
  language: string = 'ar'
): Promise<SearchSuggestion[]> {
  try {
    const params = new URLSearchParams({
      q: query,
      language,
      suggestions: 'true'
    });

    const response = await fetch(`/api/search?${params}`);
    
    if (!response.ok) {
      throw new Error('Suggestions request failed');
    }
    
    const data = await response.json();
    return data.suggestions || [];
  } catch (error) {
    console.error('Error getting suggestions from client:', error);
    return [];
  }
}

// دالة للحصول على البحث الشائع
export async function getTrendingSearchesFromClient(
  language: string = 'ar'
): Promise<string[]> {
  try {
    const params = new URLSearchParams({
      language,
      trending: 'true'
    });

    const response = await fetch(`/api/search?${params}`);
    
    if (!response.ok) {
      throw new Error('Trending searches request failed');
    }
    
    const data = await response.json();
    return data.trending || [];
  } catch (error) {
    console.error('Error getting trending searches from client:', error);
    return [];
  }
}

// دالة للبحث المتقدم
export async function advancedSearchFromClient(
  query: string,
  language: string = 'ar',
  filters: {
    type?: string;
    dateRange?: string;
    category?: string;
  } = {},
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<SearchResultFromAPI> {
  try {
    const response = await fetch('/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query,
        language,
        filters,
        options
      })
    });
    
    if (!response.ok) {
      throw new Error('Advanced search request failed');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error in advanced search from client:', error);
    return {
      semanticResults: [],
      suggestions: [],
      trendingSearches: [],
      relatedContent: [],
      totalCount: 0,
      searchTime: 0
    };
  }
}

// دالة لتخزين سجل البحث محلياً
export function saveSearchHistory(query: string, userId?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const historyKey = userId ? `search_history_${userId}` : 'search_history';
    const history: SearchHistoryItem[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
    
    // إزالة التكرارات وإضافة الاستعلام الجديد في البداية
    const updatedHistory = [
      { query, timestamp: new Date().toISOString() },
      ...history.filter((item: SearchHistoryItem) => item.query !== query)
    ].slice(0, 50); // حفظ آخر 50 بحث
    
    localStorage.setItem(historyKey, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error('Error saving search history:', error);
  }
}

// دالة لجلب سجل البحث
export function getSearchHistory(userId?: string): SearchHistoryItem[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const historyKey = userId ? `search_history_${userId}` : 'search_history';
    const history: SearchHistoryItem[] = JSON.parse(localStorage.getItem(historyKey) || '[]');
    return history;
  } catch (error) {
    console.error('Error getting search history:', error);
    return [];
  }
}

// دالة لمسح سجل البحث
export function clearSearchHistory(userId?: string): void {
  if (typeof window === 'undefined') return;
  
  try {
    const historyKey = userId ? `search_history_${userId}` : 'search_history';
    localStorage.removeItem(historyKey);
  } catch (error) {
    console.error('Error clearing search history:', error);
  }
}

// دالة للحصول على اقتراحات سريعة (بدون API)
export function getQuickSuggestions(
  query: string,
  language: string = 'ar'
): string[] {
  const commonSearches = language === 'ar' 
    ? [
        'ذكاء اصطناعي',
        'تطوير الويب',
        'البرمجة',
        'تصميم',
        'قواعد البيانات',
        'الأمن السيبراني',
        'تطبيقات الموبايل',
        'التعلم الآلي',
        'تحليل البيانات'
      ]
    : [
        'Artificial Intelligence',
        'Web Development',
        'Programming',
        'Design',
        'Databases',
        'Cybersecurity',
        'Mobile Apps',
        'Machine Learning',
        'Data Analysis'
      ];
  
  return commonSearches.filter(search => 
    search.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);
}

// دالة لتتبع أداء البحث
export class SearchPerformanceTracker {
  private static instance: SearchPerformanceTracker;
  private metrics: {
    searchCount: number;
    totalSearchTime: number;
    averageSearchTime: number;
    errorCount: number;
    cacheHits: number;
  } = {
    searchCount: 0,
    totalSearchTime: 0,
    averageSearchTime: 0,
    errorCount: 0,
    cacheHits: 0
  };

  static getInstance(): SearchPerformanceTracker {
    if (!SearchPerformanceTracker.instance) {
      SearchPerformanceTracker.instance = new SearchPerformanceTracker();
    }
    return SearchPerformanceTracker.instance;
  }

  trackSearch(searchTime: number, success: boolean, fromCache: boolean = false): void {
    this.metrics.searchCount++;
    this.metrics.totalSearchTime += searchTime;
    this.metrics.averageSearchTime = this.metrics.totalSearchTime / this.metrics.searchCount;
    
    if (!success) {
      this.metrics.errorCount++;
    }
    
    if (fromCache) {
      this.metrics.cacheHits++;
    }
  }

  getMetrics(): typeof SearchPerformanceTracker.prototype.metrics {
    return { ...this.metrics };
  }

  reset(): void {
    this.metrics = {
      searchCount: 0,
      totalSearchTime: 0,
      averageSearchTime: 0,
      errorCount: 0,
      cacheHits: 0
    };
  }
}