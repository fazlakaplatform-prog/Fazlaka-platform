// src/services/searchUtils.ts

import { SemanticSearchResult } from './semanticSearch';

// تعريف واجهة لعناصر سجل البحث
interface SearchHistoryItem {
  query: string;
  timestamp: string;
}

// دالة لتنظيف وتطبيع نص البحث
export function normalizeSearchQuery(query: string): string {
  return query
    .trim()
    .toLowerCase()
    .replace(/[^\w\s\u0600-\u06FF]/g, '') // إزالة الرموز مع الاحتفاظ بالأحرف العربية
    .replace(/\s+/g, ' ') // دمج المسافات المتعددة
    .substring(0, 100); // تحديد طول الاستعلام
}

// دالة للتحقق من جودة الاستعلام
export function validateSearchQuery(query: string): {
  isValid: boolean;
  reason?: string;
  suggestions?: string[];
} {
  const normalizedQuery = normalizeSearchQuery(query);
  
  if (!normalizedQuery) {
    return {
      isValid: false,
      reason: 'empty_query',
      suggestions: []
    };
  }
  
  if (normalizedQuery.length < 2) {
    return {
      isValid: false,
      reason: 'too_short',
      suggestions: []
    };
  }
  
  if (normalizedQuery.length > 100) {
    return {
      isValid: false,
      reason: 'too_long',
      suggestions: [normalizedQuery.substring(0, 50)]
    };
  }
  
  // قائمة الكلمات المحظورة
  const forbiddenWords = ['xxx', 'adult', 'spam'];
  if (forbiddenWords.some(word => normalizedQuery.includes(word))) {
    return {
      isValid: false,
      reason: 'forbidden_content',
      suggestions: []
    };
  }
  
  return {
    isValid: true
  };
}

// دالة لتوليد اقتراحات تصحيح الأخطاء الإملائية
export function generateSpellingSuggestions(query: string): string[] {
  // في تطبيق حقيقي، استخدم خدمة مثل:
  // - Arabic spell checker
  // - Levenshtein distance
  // - Soundex algorithm
  
  const commonMisspellings: { [key: string]: string } = {
    'ذكاء اصطناعي': 'ذكاء اصطناعي',
    'برمجه': 'برمجة',
    'تطوير': 'تطوير',
    'واجهات': 'واجهات',
    'قواعد بيانات': 'قواعد بيانات'
  };
  
  const suggestions: string[] = [];
  
  for (const [incorrect, correct] of Object.entries(commonMisspellings)) {
    if (query.includes(incorrect)) {
      suggestions.push(query.replace(incorrect, correct));
    }
  }
  
  return [...new Set(suggestions)];
}

// دالة لتحسين نتائج البحث
export function enhanceSearchResults(
  results: SemanticSearchResult[],
  query: string,
  userHistory?: string[]
): SemanticSearchResult[] {
  const enhancedResults = [...results];
  
  // تعزيز النتائج بناءً على تاريخ البحث الخاص بالمستخدم
  if (userHistory && userHistory.length > 0) {
    enhancedResults.forEach(result => {
      const title = (result.data.title || result.data.name || '').toLowerCase();
      const isPreviouslySearched = userHistory.some(historyItem => 
        title.includes(historyItem.toLowerCase())
      );
      
      if (isPreviouslySearched) {
        result.score += 0.1;
      }
    });
  }
  
  // إعادة ترتيب النتائج المحسنة
  return enhancedResults.sort((a, b) => b.score - a.score);
}

// دالة لتجميع النتائج حسب النوع
export function groupResultsByType(results: SemanticSearchResult[]): {
  [key: string]: SemanticSearchResult[];
} {
  return results.reduce((groups, result) => {
    const type = result.type;
    if (!groups[type]) {
      groups[type] = [];
    }
    groups[type].push(result);
    return groups;
  }, {} as { [key: string]: SemanticSearchResult[] });
}

// دالة للحصول على ملخص النتائج
export function getResultsSummary(results: SemanticSearchResult[]): {
  total: number;
  byType: { [key: string]: number };
  topScore: number;
  averageScore: number;
} {
  const byType = groupResultsByType(results);
  const scores = results.map(r => r.score);
  
  return {
    total: results.length,
    byType: Object.keys(byType).reduce((acc, type) => {
      acc[type] = byType[type].length;
      return acc;
    }, {} as { [key: string]: number }),
    topScore: Math.max(...scores, 0),
    averageScore: scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0
  };
}

// دالة للتحقق من صحة النتائج
export function validateSearchResults(results: SemanticSearchResult[]): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  
  if (!Array.isArray(results)) {
    issues.push('results_not_array');
    return { isValid: false, issues };
  }
  
  results.forEach((result, index) => {
    if (!result.type) {
      issues.push(`result_${index}_missing_type`);
    }
    
    if (!result.data) {
      issues.push(`result_${index}_missing_data`);
    }
    
    if (typeof result.score !== 'number') {
      issues.push(`result_${index}_invalid_score`);
    }
  });
  
  return {
    isValid: issues.length === 0,
    issues
  };
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