// src/components/Search/SearchSuggestions.tsx
'use client';

interface SearchSuggestionsProps {
  suggestions: string[];
  onSuggestionClick: (suggestion: string) => void;
  isRTL: boolean;
}

export default function SearchSuggestions({ 
  suggestions, 
  onSuggestionClick, 
  isRTL 
}: SearchSuggestionsProps) {
  return (
    <div className={`absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 ${isRTL ? 'rtl' : ''}`}>
      <ul className="py-2">
        {suggestions.map((suggestion, index) => (
          <li key={index}>
            <button
              className="w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors flex items-center"
              onClick={() => onSuggestionClick(suggestion)}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}