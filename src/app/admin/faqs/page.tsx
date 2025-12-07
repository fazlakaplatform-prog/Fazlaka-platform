'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  Eye, 
  Download, 
  Upload,
  ChevronDown,
  X,
  HelpCircle
} from 'lucide-react';
import Select, { StylesConfig } from 'react-select';
import { format } from 'date-fns';
import type { SingleValue } from 'react-select';

interface FAQ {
  _id: string;
  question: string;
  questionEn: string;
  answer: string;
  answerEn: string;
  category: string;
  categoryEn: string;
  createdAt: string;
  updatedAt: string;
}

interface SelectOption {
  value: string;
  label: string;
}

// تعريف نوع للبيانات المستخدمة في الترتيب
type SortField = 'question' | 'category' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export default function FAQsPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [faqs, setFaqs] = useState<FAQ[]>([]);
  const [categories, setCategories] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Advanced filter states
  const [sortBy, setSortBy] = useState<SortField>('createdAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // Define fetchFAQs before using it in useEffect
  const fetchFAQs = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/faqs');
      if (!response.ok) {
        throw new Error('Failed to fetch FAQs');
      }
      const data = await response.json();
      setFaqs(data.data || []);
    } catch (error) {
      console.error('Error fetching FAQs:', error);
      setError('Failed to load FAQs');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Define fetchCategories before using it in useEffect
  const fetchCategories = useCallback(async () => {
    try {
      const response = await fetch('/api/faqs/categories');
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      const data = await response.json();
      setCategories(data.categories || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  // Check for dark mode
  useEffect(() => {
    const checkDarkMode = () => {
      setIsDarkMode(document.documentElement.classList.contains('dark'));
    };
    
    // Initial check
    checkDarkMode();
    
    // Set up a mutation observer to detect class changes
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    });
    
    return () => observer.disconnect();
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchFAQs();
    fetchCategories();
  }, [fetchFAQs, fetchCategories]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchFAQs();
    fetchCategories();
  }, [fetchFAQs, fetchCategories]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this FAQ?')) return;
    
    try {
      const response = await fetch(`/api/faqs/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete FAQ');
      }
      
      // Refresh FAQs list
      fetchFAQs();
      fetchCategories();
      setSuccess('FAQ deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting FAQ:', error);
      setError('Failed to delete FAQ');
      setTimeout(() => setError(null), 3000);
    }
  }, [fetchFAQs, fetchCategories]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/faqs/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'json',
          language,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export FAQs');
      }

      const data = await response.json();
      
      // Create and download file without file-saver
      const jsonString = JSON.stringify(data.faqs, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `faqs_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('FAQs exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error exporting FAQs:', error);
      setError('Failed to export FAQs');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsExporting(false);
    }
  }, [language]);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension !== 'json') {
        setError('Unsupported file format. Please use JSON.');
        setTimeout(() => setError(null), 3000);
        return;
      }

      const text = await file.text();
      const data = JSON.parse(text);
      
      const response = await fetch('/api/faqs/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          faqs: Array.isArray(data) ? data : [data],
          format: 'json'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import FAQs');
      }

      const result = await response.json();
      setSuccess(`Successfully imported ${result.imported} FAQs`);
      if (result.errors && result.errors.length > 0) {
        setError(`Some errors occurred: ${result.errors.slice(0, 3).join(', ')}`);
        setTimeout(() => setError(null), 5000);
      }
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh FAQs list
      fetchFAQs();
      fetchCategories();
    } catch (error) {
      console.error('Error importing FAQs:', error);
      setError('Failed to import FAQs');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [fetchFAQs, fetchCategories]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedCategory('');
  }, []);

  const filteredFaqs = faqs.filter(faq => {
    // Search filter
    const question = language === 'ar' ? faq.question : faq.questionEn;
    const answer = language === 'ar' ? faq.answer : faq.answerEn;
    const category = language === 'ar' ? faq.category : faq.categoryEn;
    
    const matchesSearch = 
      question.toLowerCase().includes(searchTerm.toLowerCase()) ||
      answer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      category.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Category filter
    const categoryField = language === 'ar' ? 'category' : 'categoryEn';
    const matchesCategory = !selectedCategory || faq[categoryField] === selectedCategory;
    
    return matchesSearch && matchesCategory;
  }).sort((a, b) => {
    // Sort by selected field
    let aValue: string | number | Date;
    let bValue: string | number | Date;
    
    // Handle nested objects
    if (sortBy === 'question') {
      aValue = language === 'ar' ? a.question : a.questionEn;
      bValue = language === 'ar' ? b.question : b.questionEn;
    } else if (sortBy === 'category') {
      aValue = language === 'ar' ? a.category : a.categoryEn;
      bValue = language === 'ar' ? b.category : b.categoryEn;
    } else {
      aValue = a[sortBy] || '';
      bValue = b[sortBy] || '';
    }
    
    // Handle dates
    if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = aValue ? new Date(aValue as string).getTime() : 0;
      bValue = bValue ? new Date(bValue as string).getTime() : 0;
    }
    
    // Handle strings
    if (typeof aValue === 'string' && typeof bValue === 'string') {
      aValue = aValue.toLowerCase();
      bValue = bValue.toLowerCase();
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'MMM dd, yyyy');
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Prepare options for react-select
  const sortByOptions: SelectOption[] = [
    { value: 'question', label: 'Question' },
    { value: 'category', label: 'Category' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' }
  ];

  const categoryOptions: SelectOption[] = [
    { value: '', label: 'All Categories' },
    ...categories.map(cat => ({ value: cat, label: cat }))
  ];

  // Custom styles for react-select with dark mode support
  const selectStyles: StylesConfig<SelectOption, false> = {
    control: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? '#374151' : '#ffffff',
      borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
      color: isDarkMode ? '#ffffff' : '#111827',
      '&:hover': {
        borderColor: isDarkMode ? '#6B7280' : '#9CA3AF',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: isDarkMode ? '#374151' : '#ffffff',
      borderColor: isDarkMode ? '#4B5563' : '#D1D5DB',
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused 
        ? (isDarkMode ? '#4B5563' : '#F3F4F6')
        : (isDarkMode ? '#374151' : '#ffffff'),
      color: isDarkMode ? '#ffffff' : '#111827',
      '&:active': {
        backgroundColor: isDarkMode ? '#6B7280' : '#E5E7EB',
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: isDarkMode ? '#ffffff' : '#111827',
    }),
    input: (base) => ({
      ...base,
      color: isDarkMode ? '#ffffff' : '#111827',
    }),
    placeholder: (base) => ({
      ...base,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: isDarkMode ? '#9CA3AF' : '#6B7280',
    }),
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* مسافة فارغة في بداية الصفحة */}
      <div className="h-8 mb-6"></div>
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">FAQs Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your frequently asked questions with Arabic and English content</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <Link
          href="/admin/faqs/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          Add New FAQ
        </Link>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 flex items-center gap-2"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center gap-2"
            >
              <Filter size={16} />
              Filters
              <ChevronDown size={16} className={showAdvancedFilters ? 'rotate-180' : ''} />
            </button>
          </div>
          
          <div className="relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isImporting}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-400 flex items-center gap-2"
            >
              <Upload size={16} />
              {isImporting ? 'Importing...' : 'Import'}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </div>
          
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2"
          >
            <Download size={16} />
            {isExporting ? 'Exporting...' : 'Export JSON'}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 mb-6 rounded-md bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-600 hover:text-red-800">
            <X size={18} />
          </button>
        </div>
      )}

      {success && (
        <div className="p-4 mb-6 rounded-md bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 flex items-center justify-between">
          <span>{success}</span>
          <button onClick={() => setSuccess(null)} className="text-green-600 hover:text-green-800">
            <X size={18} />
          </button>
        </div>
      )}

      {showAdvancedFilters && (
        <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <Select<SelectOption>
                options={sortByOptions}
                value={sortByOptions.find(option => option.value === sortBy)}
                onChange={(option: SingleValue<SelectOption>) => setSortBy(option?.value as SortField || 'createdAt')}
                styles={selectStyles}
                className="w-full"
                placeholder="Sort by"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <Select<SelectOption>
                options={categoryOptions}
                value={categoryOptions.find(option => option.value === selectedCategory)}
                onChange={(option: SingleValue<SelectOption>) => setSelectedCategory(option?.value || '')}
                styles={selectStyles}
                className="w-full"
                placeholder="Filter by category"
              />
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Sort Order:
              </label>
              <button
                onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
                className="px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-md text-sm"
              >
                {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
              </button>
            </div>
            
            <button
              onClick={clearFilters}
              className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 text-sm"
            >
              Clear Filters
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search FAQs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter size={18} className="text-gray-500" />
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as 'ar' | 'en')}
              className="p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            >
              <option value="ar">Arabic</option>
              <option value="en">English</option>
            </select>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="overflow-x-auto shadow-md sm:rounded-lg">
          <table className="w-full text-sm text-left text-gray-500 dark:text-gray-400">
            <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
              <tr>
                <th scope="col" className="px-6 py-3">
                  Question
                </th>
                <th scope="col" className="px-6 py-3">
                  Category
                </th>
                <th scope="col" className="px-6 py-3">
                  Created
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredFaqs.length > 0 ? (
                filteredFaqs.map((faq) => (
                  <tr key={faq._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-start gap-2">
                        <HelpCircle size={18} className="text-gray-400 mt-0.5" />
                        <div>
                          <div>
                            {language === 'ar' ? faq.question : faq.questionEn}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {truncateText(language === 'ar' ? faq.answer : faq.answerEn)}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        {language === 'ar' ? faq.category : faq.categoryEn}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(faq.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/faq#${faq._id}`}
                          className="font-medium text-green-600 dark:text-green-500 hover:underline flex items-center gap-1"
                          target="_blank"
                        >
                          <Eye size={16} />
                          Preview
                        </Link>
                        <Link
                          href={`/admin/faqs/${faq._id}/edit`}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(faq._id)}
                          className="font-medium text-red-600 dark:text-red-500 hover:underline flex items-center gap-1"
                        >
                          <Trash2 size={16} />
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700">
                  <td colSpan={4} className="px-6 py-4 text-center">
                    No FAQs found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}