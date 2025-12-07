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
  Image as ImageIcon,
  Video,
  Play
} from 'lucide-react';
import Select, { StylesConfig } from 'react-select';
import { format } from 'date-fns';
import type { SingleValue } from 'react-select';

interface HeroSlider {
  _id: string;
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  mediaType: 'image' | 'video';
  image?: string;
  imageEn?: string;
  videoUrl?: string;
  videoUrlEn?: string;
  link?: {
    text?: string;
    textEn?: string;
    url?: string;
  };
  orderRank?: number;
  createdAt: string;
  updatedAt: string;
}

interface SelectOption {
  value: string;
  label: string;
}

// تعريف نوع للبيانات المستخدمة في الترتيب
type SortField = 'title' | 'orderRank' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

// دالة بديلة لـ file-saver
const downloadFile = (data: string, filename: string, type: string) => {
  const blob = new Blob([data], { type });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

export default function HeroSlidersPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [heroSliders, setHeroSliders] = useState<HeroSlider[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Advanced filter states
  const [filterMediaType, setFilterMediaType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('orderRank');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

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

  const fetchHeroSliders = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/hero-sliders');
      if (!response.ok) {
        throw new Error('Failed to fetch hero sliders');
      }
      const data = await response.json();
      setHeroSliders(data || []);
    } catch (err) {
      console.error('Error fetching hero sliders:', err);
      setError('Failed to load hero sliders');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchHeroSliders();
  }, [fetchHeroSliders]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchHeroSliders();
  }, [fetchHeroSliders]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this hero slider?')) return;
    
    try {
      const response = await fetch(`/api/hero-sliders/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete hero slider');
      }
      
      // Refresh hero sliders list
      fetchHeroSliders();
      setSuccess('Hero slider deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error deleting hero slider:', err);
      setError('Failed to delete hero slider');
      setTimeout(() => setError(null), 3000);
    }
  }, [fetchHeroSliders]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/hero-sliders/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'json',
          filters: {
            mediaType: filterMediaType,
            dateFrom: filterDateFrom,
            dateTo: filterDateTo,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export hero sliders');
      }

      const data = await response.json();
      
      downloadFile(
        JSON.stringify(data.heroSliders, null, 2), 
        `hero_sliders_${new Date().toISOString().split('T')[0]}.json`,
        'application/json'
      );
      
      setSuccess('Hero sliders exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Error exporting hero sliders:', err);
      setError('Failed to export hero sliders');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsExporting(false);
    }
  }, [filterMediaType, filterDateFrom, filterDateTo]);

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
      
      const response = await fetch('/api/hero-sliders/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          heroSliders: Array.isArray(data) ? data : [data],
          format: 'json'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import hero sliders');
      }

      const result = await response.json();
      setSuccess(`Successfully imported ${result.imported} hero sliders`);
      if (result.errors && result.errors.length > 0) {
        setError(`Some errors occurred: ${result.errors.slice(0, 3).join(', ')}`);
        setTimeout(() => setError(null), 5000);
      }
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh hero sliders list
      fetchHeroSliders();
    } catch (err) {
      console.error('Error importing hero sliders:', err);
      setError('Failed to import hero sliders');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [fetchHeroSliders]);

  const clearFilters = useCallback(() => {
    setFilterMediaType('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
  }, []);

  const filteredHeroSliders = heroSliders.filter(slider => {
    // Search filter
    const title = slider.title;
    const titleEn = slider.titleEn;
    const description = slider.description;
    const descriptionEn = slider.descriptionEn;
    
    const matchesSearch = 
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (description && description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (descriptionEn && descriptionEn.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Media type filter
    const matchesMediaType = filterMediaType === 'all' || slider.mediaType === filterMediaType;
    
    // Date range filter
    let matchesDateRange = true;
    if (filterDateFrom) {
      matchesDateRange = new Date(slider.createdAt) >= new Date(filterDateFrom);
    }
    if (filterDateTo) {
      matchesDateRange = matchesDateRange && new Date(slider.createdAt) <= new Date(filterDateTo);
    }
    
    return matchesSearch && matchesMediaType && matchesDateRange;
  }).sort((a, b) => {
    // Sort by selected field
    let aValue: string | number | Date;
    let bValue: string | number | Date;
    
    if (sortBy === 'title') {
      aValue = a.title;
      bValue = b.title;
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

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // دالة لمعاينة الوسائط (صورة أو فيديو)
  const handlePreview = useCallback((slider: HeroSlider) => {
    const mediaUrl = slider.mediaType === 'image' 
      ? (slider.image || slider.imageEn) 
      : (slider.videoUrl || slider.videoUrlEn);
    
    if (mediaUrl) {
      window.open(mediaUrl, '_blank');
    }
  }, []);

  // Prepare options for react-select
  const mediaTypeOptions: SelectOption[] = [
    { value: 'all', label: 'All Types' },
    { value: 'image', label: 'Image' },
    { value: 'video', label: 'Video' }
  ];

  const sortByOptions: SelectOption[] = [
    { value: 'title', label: 'Title' },
    { value: 'orderRank', label: 'Display Order' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Hero Sliders Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your hero sliders with Arabic and English content</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <Link
          href="/admin/hero-sliders/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          Add New Hero Slider
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Media Type
              </label>
              <Select<SelectOption>
                options={mediaTypeOptions}
                value={mediaTypeOptions.find(option => option.value === filterMediaType)}
                onChange={(option: SingleValue<SelectOption>) => setFilterMediaType(option?.value || 'all')}
                styles={selectStyles}
                className="w-full"
                placeholder="Select media type"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date From
              </label>
              <input
                type="date"
                value={filterDateFrom}
                onChange={(e) => setFilterDateFrom(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Date To
              </label>
              <input
                type="date"
                value={filterDateTo}
                onChange={(e) => setFilterDateTo(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Sort By
              </label>
              <Select<SelectOption>
                options={sortByOptions}
                value={sortByOptions.find(option => option.value === sortBy)}
                onChange={(option: SingleValue<SelectOption>) => setSortBy(option?.value as SortField || 'orderRank')}
                styles={selectStyles}
                className="w-full"
                placeholder="Sort by"
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
              placeholder="Search hero sliders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
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
                  Title
                </th>
                <th scope="col" className="px-6 py-3">
                  Description
                </th>
                <th scope="col" className="px-6 py-3">
                  Media Type
                </th>
                <th scope="col" className="px-6 py-3">
                  Order
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
              {filteredHeroSliders.length > 0 ? (
                filteredHeroSliders.map((slider) => (
                  <tr key={slider._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      <div>
                        <div>{slider.title}</div>
                        <div className="text-xs text-gray-500">{slider.titleEn}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div>{truncateText(slider.description)}</div>
                        <div className="text-xs text-gray-500">{truncateText(slider.descriptionEn || '')}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        {slider.mediaType === 'image' ? (
                          <>
                            <ImageIcon size={16} className="mr-2" />
                            Image
                          </>
                        ) : (
                          <>
                            <Video size={16} className="mr-2" />
                            Video
                          </>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {slider.orderRank || 0}
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(slider.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {/* زر المعاينة للصورة والفيديو */}
                        <button
                          onClick={() => handlePreview(slider)}
                          className="font-medium text-green-600 dark:text-green-500 hover:underline flex items-center gap-1"
                          title="Preview Media"
                        >
                          {slider.mediaType === 'image' ? (
                            <Eye size={16} />
                          ) : (
                            <Play size={16} />
                          )}
                          Preview
                        </button>
                        <Link
                          href={`/admin/hero-sliders/${slider._id}/edit`}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(slider._id)}
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
                  <td colSpan={6} className="px-6 py-4 text-center">
                    No hero sliders found
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