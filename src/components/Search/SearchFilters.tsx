// src/components/Search/SearchFilters.tsx
'use client';

import { useState } from 'react';

// تعريف واجهة للفلاتر
interface FilterOptions {
  type: string;
  sortBy: string;
  dateRange: string;
}

// تعريف واجهة للنصوص المترجمة
interface LocalizedTexts {
  filters: string;
  contentType: string;
  all: string;
  article: string;
  episode: string;
  season: string;
  playlist: string;
  team: string;
  faq: string;
  privacy: string;
  terms: string;
  sortBy: string;
  relevance: string;
  date: string;
  title: string;
  dateRange: string;
  week: string;
  month: string;
  year: string;
}

interface SearchFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  language: string;
  texts: LocalizedTexts;
}

export default function SearchFilters({ 
  filters, 
  onFilterChange, 
  language, 
  texts 
}: SearchFiltersProps) {
  const [expanded, setExpanded] = useState(true);

  const handleFilterChange = (key: keyof FilterOptions, value: string) => {
    onFilterChange({
      ...filters,
      [key]: value
    });
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-6 border border-gray-100 dark:border-gray-700">
      <div 
        className="flex justify-between items-center mb-4 cursor-pointer"
        onClick={() => setExpanded(!expanded)}
      >
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200">
          {texts.filters}
        </h3>
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          className={`h-5 w-5 text-gray-500 transform transition-transform ${expanded ? 'rotate-180' : ''}`} 
          fill="none" 
          viewBox="0 0 24 24" 
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </div>
      
      {expanded && (
        <div className="space-y-6">
          {/* Content Type Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {texts.contentType}
            </h4>
            <div className="space-y-2">
              {[
                { value: 'all', label: texts.all },
                { value: 'article', label: texts.article },
                { value: 'episode', label: texts.episode },
                { value: 'season', label: texts.season },
                { value: 'playlist', label: texts.playlist },
                { value: 'team', label: texts.team },
                { value: 'faq', label: texts.faq },
                { value: 'privacy', label: texts.privacy },
                { value: 'terms', label: texts.terms }
              ].map(option => (
                <label key={option.value} className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="type"
                    value={option.value}
                    checked={filters.type === option.value}
                    onChange={() => handleFilterChange('type', option.value)}
                    className="mr-2 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Sort By Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {texts.sortBy}
            </h4>
            <div className="space-y-2">
              {[
                { value: 'relevance', label: texts.relevance },
                { value: 'date', label: texts.date },
                { value: 'title', label: texts.title }
              ].map(option => (
                <label key={option.value} className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="sortBy"
                    value={option.value}
                    checked={filters.sortBy === option.value}
                    onChange={() => handleFilterChange('sortBy', option.value)}
                    className="mr-2 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Date Range Filter */}
          <div>
            <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              {texts.dateRange}
            </h4>
            <div className="space-y-2">
              {[
                { value: 'all', label: texts.all },
                { value: 'week', label: texts.week },
                { value: 'month', label: texts.month },
                { value: 'year', label: texts.year }
              ].map(option => (
                <label key={option.value} className="flex items-center p-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-colors">
                  <input
                    type="radio"
                    name="dateRange"
                    value={option.value}
                    checked={filters.dateRange === option.value}
                    onChange={() => handleFilterChange('dateRange', option.value)}
                    className="mr-2 text-amber-500 focus:ring-amber-500"
                  />
                  <span className="text-gray-700 dark:text-gray-300">{option.label}</span>
                </label>
              ))}
            </div>
          </div>
          
          {/* Reset Filters Button */}
          <button
            onClick={() => onFilterChange({
              type: 'all',
              sortBy: 'relevance',
              dateRange: 'all'
            })}
            className="w-full py-2 px-4 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-colors"
          >
            {language === 'ar' ? 'إعادة تعيين الفلاتر' : 'Reset Filters'}
          </button>
        </div>
      )}
    </div>
  );
}