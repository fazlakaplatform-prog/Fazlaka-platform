'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
  Play
} from 'lucide-react';
import Select, { StylesConfig } from 'react-select';
import { format } from 'date-fns';
import type { SingleValue } from 'react-select';

interface Episode {
  _id: string;
  title: string;
  titleEn: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  content?: Record<string, unknown>;
  contentEn?: Record<string, unknown>;
  videoUrl?: string;
  videoUrlEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  season?: {
    _id: string;
    title: string;
    titleEn: string;
  };
  articles?: Array<{
    _id: string;
    title: string;
    titleEn: string;
  }>;
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Season {
  _id: string;
  title: string;
  titleEn: string;
}

interface SelectOption {
  value: string;
  label: string;
}

// تعريف نوع للبيانات المستخدمة في الترتيب
type SortField = 'title' | 'createdAt' | 'updatedAt' | 'publishedAt';
type SortOrder = 'asc' | 'desc';

export default function EpisodesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  
  // Advanced filter states
  const [filterSeason, setFilterSeason] = useState<string>('');
  const [filterPublished, setFilterPublished] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

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

  const fetchEpisodes = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/episodes');
      if (!response.ok) {
        throw new Error('Failed to fetch episodes');
      }
      const data = await response.json();
      setEpisodes(data.episodes || []);
    } catch (error) {
      console.error('Error fetching episodes:', error);
      setError('Failed to load episodes');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  const fetchSeasons = useCallback(async () => {
    try {
      const response = await fetch('/api/seasons');
      if (response.ok) {
        const data = await response.json();
        setSeasons(data.seasons || []);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  }, []);

  // Fetch data on component mount and when filters change
  useEffect(() => {
    fetchEpisodes();
    fetchSeasons();
  }, [filterSeason, filterPublished, filterDateFrom, filterDateTo, sortBy, sortOrder, fetchEpisodes, fetchSeasons]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchEpisodes();
  }, [fetchEpisodes]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this episode?')) return;
    
    try {
      const response = await fetch(`/api/episodes/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete episode');
      }
      
      // Refresh episodes list
      fetchEpisodes();
      setSuccess('Episode deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting episode:', error);
      setError('Failed to delete episode');
      setTimeout(() => setError(null), 3000);
    }
  }, [fetchEpisodes]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/episodes/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'json',
          language,
          filters: {
            season: filterSeason,
            published: filterPublished,
            dateFrom: filterDateFrom,
            dateTo: filterDateTo,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export episodes');
      }

      const data = await response.json();
      
      // Create and download file without file-saver
      const jsonString = JSON.stringify(data.episodes, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `episodes_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Episodes exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error exporting episodes:', error);
      setError('Failed to export episodes');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsExporting(false);
    }
  }, [language, filterSeason, filterPublished, filterDateFrom, filterDateTo]);

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
      
      const response = await fetch('/api/episodes/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          episodes: Array.isArray(data) ? data : [data],
          format: 'json'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import episodes');
      }

      const result = await response.json();
      setSuccess(`Successfully imported ${result.imported} episodes`);
      if (result.errors && result.errors.length > 0) {
        setError(`Some errors occurred: ${result.errors.slice(0, 3).join(', ')}`);
        setTimeout(() => setError(null), 5000);
      }
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh episodes list
      fetchEpisodes();
    } catch (error) {
      console.error('Error importing episodes:', error);
      setError('Failed to import episodes');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [fetchEpisodes]);

  const clearFilters = useCallback(() => {
    setFilterSeason('');
    setFilterPublished('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
  }, []);

  const filteredEpisodes = episodes.filter(episode => {
    // Search filter
    const title = language === 'ar' ? episode.title : episode.titleEn;
    const description = language === 'ar' ? episode.description : episode.descriptionEn;
    
    const matchesSearch = 
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (description && description.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Season filter
    const matchesSeason = !filterSeason || episode.season?._id === filterSeason;
    
    // Published filter
    let matchesPublished = true;
    if (filterPublished === 'published') {
      matchesPublished = !!episode.publishedAt;
    } else if (filterPublished === 'draft') {
      matchesPublished = !episode.publishedAt;
    }
    
    // Date range filter
    let matchesDateRange = true;
    if (filterDateFrom) {
      matchesDateRange = new Date(episode.createdAt) >= new Date(filterDateFrom);
    }
    if (filterDateTo) {
      matchesDateRange = matchesDateRange && new Date(episode.createdAt) <= new Date(filterDateTo);
    }
    
    return matchesSearch && matchesSeason && matchesPublished && matchesDateRange;
  }).sort((a, b) => {
    // Sort by selected field
    let aValue: string | number | Date;
    let bValue: string | number | Date;
    
    // Handle nested objects
    if (sortBy === 'title') {
      aValue = language === 'ar' ? a.title : a.titleEn;
      bValue = language === 'ar' ? b.title : b.titleEn;
    } else {
      aValue = a[sortBy] || '';
      bValue = b[sortBy] || '';
    }
    
    // Handle dates
    if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'publishedAt') {
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

  // Prepare options for react-select
  const seasonOptions: SelectOption[] = [
    { value: '', label: 'All Seasons' },
    ...seasons.map(season => ({
      value: season._id,
      label: language === 'ar' ? season.title : season.titleEn
    }))
  ];

  const statusOptions: SelectOption[] = [
    { value: 'all', label: 'All' },
    { value: 'published', label: 'Published' },
    { value: 'draft', label: 'Draft' }
  ];

  const sortByOptions: SelectOption[] = [
    { value: 'title', label: 'Title' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'publishedAt', label: 'Published Date' }
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Episodes Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your episodes with Arabic and English content</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <Link
          href="/admin/episodes/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          Add New Episode
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
                Season
              </label>
              <Select<SelectOption>
                options={seasonOptions}
                value={seasonOptions.find(option => option.value === filterSeason)}
                onChange={(option: SingleValue<SelectOption>) => setFilterSeason(option?.value || '')}
                styles={selectStyles}
                className="w-full"
                placeholder="Select season"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select<SelectOption>
                options={statusOptions}
                value={statusOptions.find(option => option.value === filterPublished)}
                onChange={(option: SingleValue<SelectOption>) => setFilterPublished(option?.value || 'all')}
                styles={selectStyles}
                className="w-full"
                placeholder="Select status"
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
                onChange={(option: SingleValue<SelectOption>) => setSortBy(option?.value as SortField || 'updatedAt')}
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
              placeholder="Search episodes..."
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
                  Title
                </th>
                <th scope="col" className="px-6 py-3">
                  Slug
                </th>
                <th scope="col" className="px-6 py-3">
                  Season
                </th>
                <th scope="col" className="px-6 py-3">
                  Articles
                </th>
                <th scope="col" className="px-6 py-3">
                  Published
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredEpisodes.length > 0 ? (
                filteredEpisodes.map((episode) => (
                  <tr key={episode._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {episode.thumbnailUrl && (
                          <Image 
                            src={language === 'ar' ? episode.thumbnailUrl : episode.thumbnailUrlEn || ''} 
                            alt={language === 'ar' ? episode.title : episode.titleEn}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span>
                          {language === 'ar' ? episode.title : episode.titleEn}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {episode.slug}
                    </td>
                    <td className="px-6 py-4">
                      {episode.season ? (
                        <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded">
                          {language === 'ar' ? episode.season.title : episode.season.titleEn}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {episode.articles && episode.articles.length > 0 ? (
                        <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded">
                          {episode.articles.length} {episode.articles.length === 1 ? 'Article' : 'Articles'}
                        </span>
                      ) : (
                        <span className="text-gray-400">No articles</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {episode.publishedAt ? formatDate(episode.publishedAt) : 'No'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        {episode.videoUrl && (
                          <a
                            href={language === 'ar' ? episode.videoUrl : episode.videoUrlEn || ''}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="font-medium text-purple-600 dark:text-purple-500 hover:underline flex items-center gap-1"
                          >
                            <Play size={16} />
                            Play
                          </a>
                        )}
                        <Link
                          href={`/episodes/${episode.slug}`}
                          className="font-medium text-green-600 dark:text-green-500 hover:underline flex items-center gap-1"
                          target="_blank"
                        >
                          <Eye size={16} />
                          Preview
                        </Link>
                        <Link
                          href={`/admin/episodes/${episode.slug}/edit`}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(episode._id)}
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
                    No episodes found
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