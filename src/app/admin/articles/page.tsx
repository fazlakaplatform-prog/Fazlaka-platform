"use client";

import { useState, useEffect, useRef } from 'react';
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
  X
} from 'lucide-react';
import Select from 'react-select';
import type { SingleValue } from 'react-select';
import { format } from 'date-fns';

// تعريف أنواع الخيارات لـ react-select
interface SelectOption {
  value: string;
  label: string;
}

// تعريف واجهات الأنواع بدلاً من استخدام any
interface ArticleContent {
  type: string;
  children?: ArticleContent[];
  text?: string;
  marks?: {
    [key: string]: unknown;
  };
}

interface Article {
  _id: string;
  title: string;
  titleEn: string;
  slug: string;
  excerpt?: string;
  excerptEn?: string;
  content?: ArticleContent[];
  contentEn?: ArticleContent[];
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  season?: {
    _id: string;
    title: string;
    titleEn: string;
  };
  episode?: {
    _id: string;
    title: string;
    titleEn: string;
  };
  publishedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface Season {
  _id: string;
  title: string;
  titleEn: string;
}

interface Episode {
  _id: string;
  title: string;
  titleEn: string;
  season?: string;
}

// تعريف نوع للبيانات المستخدمة في الترتيب
type SortField = 'title' | 'createdAt' | 'updatedAt' | 'publishedAt';
type SortOrder = 'asc' | 'desc';

export default function ArticlesPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [language, setLanguage] = useState<'ar' | 'en'>('ar');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  
  // Advanced filter states
  const [filterSeason, setFilterSeason] = useState<string>('');
  const [filterEpisode, setFilterEpisode] = useState<string>('');
  const [filterPublished, setFilterPublished] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('updatedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // استرجاع البيانات عند تحميل المكون لأول مرة
  useEffect(() => {
    fetchArticles();
    fetchSeasons();
    fetchEpisodes();
  }, []);

  // استرجاع البيانات عند تغيير الفلاتر
  useEffect(() => {
    fetchArticles();
  }, [filterSeason, filterEpisode, filterPublished, filterDateFrom, filterDateTo, sortBy, sortOrder]);

  const fetchArticles = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/articles');
      if (!response.ok) {
        throw new Error('Failed to fetch articles');
      }
      const data = await response.json();
      setArticles(data.articles || []);
    } catch (error) {
      console.error('Error fetching articles:', error);
      setError('Failed to load articles');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const fetchSeasons = async () => {
    try {
      const response = await fetch('/api/seasons');
      if (response.ok) {
        const data = await response.json();
        setSeasons(data.seasons || []);
      }
    } catch (error) {
      console.error('Error fetching seasons:', error);
    }
  };

  const fetchEpisodes = async () => {
    try {
      const response = await fetch('/api/episodes');
      if (response.ok) {
        const data = await response.json();
        setEpisodes(data.episodes || []);
      }
    } catch (error) {
      console.error('Error fetching episodes:', error);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchArticles();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this article?')) return;
    
    try {
      const response = await fetch(`/api/articles/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete article');
      }
      
      // Refresh articles list
      fetchArticles();
      setSuccess('Article deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting article:', error);
      setError('Failed to delete article');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/articles/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'json',
          language,
          filters: {
            season: filterSeason,
            episode: filterEpisode,
            published: filterPublished,
            dateFrom: filterDateFrom,
            dateTo: filterDateTo,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export articles');
      }

      const data = await response.json();
      
      // Create and download file without file-saver
      const jsonString = JSON.stringify(data.articles, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `articles_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Articles exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error exporting articles:', error);
      setError('Failed to export articles');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
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
      
      const response = await fetch('/api/articles/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          articles: Array.isArray(data) ? data : [data],
          format: 'json'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import articles');
      }

      const result = await response.json();
      setSuccess(`Successfully imported ${result.imported} articles`);
      if (result.errors && result.errors.length > 0) {
        setError(`Some errors occurred: ${result.errors.slice(0, 3).join(', ')}`);
        setTimeout(() => setError(null), 5000);
      }
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh articles list
      fetchArticles();
    } catch (error) {
      console.error('Error importing articles:', error);
      setError('Failed to import articles');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const clearFilters = () => {
    setFilterSeason('');
    setFilterEpisode('');
    setFilterPublished('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
  };

  const filteredArticles = articles.filter(article => {
    // Search filter
    const title = language === 'ar' ? article.title : article.titleEn;
    const excerpt = language === 'ar' ? article.excerpt : article.excerptEn;
    
    const matchesSearch = 
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (excerpt && excerpt.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Season filter
    const matchesSeason = !filterSeason || article.season?._id === filterSeason;
    
    // Episode filter
    const matchesEpisode = !filterEpisode || article.episode?._id === filterEpisode;
    
    // Published filter
    let matchesPublished = true;
    if (filterPublished === 'published') {
      matchesPublished = !!article.publishedAt;
    } else if (filterPublished === 'draft') {
      matchesPublished = !article.publishedAt;
    }
    
    // Date range filter
    let matchesDateRange = true;
    if (filterDateFrom) {
      matchesDateRange = new Date(article.createdAt) >= new Date(filterDateFrom);
    }
    if (filterDateTo) {
      matchesDateRange = matchesDateRange && new Date(article.createdAt) <= new Date(filterDateTo);
    }
    
    return matchesSearch && matchesSeason && matchesEpisode && matchesPublished && matchesDateRange;
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

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* مسافة فارغة في بداية الصفحة */}
      <div className="h-8 mb-6"></div>
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Articles Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your articles with Arabic and English content</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <Link
          href="/admin/articles/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          Add New Article
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
                options={[
                  { value: '', label: 'All Seasons' },
                  ...seasons.map(season => ({
                    value: season._id,
                    label: language === 'ar' ? season.title : season.titleEn
                  }))
                ]}
                value={seasons.find(s => s._id === filterSeason) ? { value: filterSeason, label: language === 'ar' ? seasons.find(s => s._id === filterSeason)?.title || '' : seasons.find(s => s._id === filterSeason)?.titleEn || '' } : null}
                onChange={(option: SingleValue<SelectOption>) => setFilterSeason(option?.value || '')}
                className="w-full"
                placeholder="Select season"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Episode
              </label>
              <Select<SelectOption>
                options={[
                  { value: '', label: 'All Episodes' },
                  ...episodes.map(episode => ({
                    value: episode._id,
                    label: language === 'ar' ? episode.title : episode.titleEn
                  }))
                ]}
                value={episodes.find(e => e._id === filterEpisode) ? { value: filterEpisode, label: language === 'ar' ? episodes.find(e => e._id === filterEpisode)?.title || '' : episodes.find(e => e._id === filterEpisode)?.titleEn || '' } : null}
                onChange={(option: SingleValue<SelectOption>) => setFilterEpisode(option?.value || '')}
                className="w-full"
                placeholder="Select episode"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <Select<SelectOption>
                options={[
                  { value: 'all', label: 'All' },
                  { value: 'published', label: 'Published' },
                  { value: 'draft', label: 'Draft' }
                ]}
                value={filterPublished ? { value: filterPublished, label: filterPublished.charAt(0).toUpperCase() + filterPublished.slice(1) } : null}
                onChange={(option: SingleValue<SelectOption>) => setFilterPublished(option?.value || 'all')}
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
                options={[
                  { value: 'title', label: 'Title' },
                  { value: 'createdAt', label: 'Created Date' },
                  { value: 'updatedAt', label: 'Updated Date' },
                  { value: 'publishedAt', label: 'Published Date' }
                ]}
                value={sortBy ? { value: sortBy, label: sortBy.charAt(0).toUpperCase() + sortBy.slice(1).replace(/([A-Z])/g, ' $1') } : null}
                onChange={(option: SingleValue<SelectOption>) => setSortBy(option?.value as SortField || 'updatedAt')}
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
              placeholder="Search articles..."
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
                  Season/Episode
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
              {filteredArticles.length > 0 ? (
                filteredArticles.map((article) => (
                  <tr key={article._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {article.featuredImageUrl && (
                          <Image 
                            src={language === 'ar' ? article.featuredImageUrl : article.featuredImageUrlEn || ''} 
                            alt={language === 'ar' ? article.title : article.titleEn}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover rounded"
                          />
                        )}
                        <span>
                          {language === 'ar' ? article.title : article.titleEn}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {article.slug}
                    </td>
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        {article.season && (
                          <span className="px-2 py-1 text-xs bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 rounded">
                            {language === 'ar' ? article.season.title : article.season.titleEn}
                          </span>
                        )}
                        {article.episode && (
                          <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100 rounded">
                            {language === 'ar' ? article.episode.title : article.episode.titleEn}
                          </span>
                        )}
                        {!article.season && !article.episode && (
                          <span className="text-gray-400">-</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {article.publishedAt ? formatDate(article.publishedAt) : 'No'}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/articles/${article.slug}`}
                          className="font-medium text-green-600 dark:text-green-500 hover:underline flex items-center gap-1"
                          target="_blank"
                        >
                          <Eye size={16} />
                          Preview
                        </Link>
                        <Link
                          href={`/admin/articles/${article.slug}/edit`}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(article._id)}
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
                  <td colSpan={5} className="px-6 py-4 text-center">
                    No articles found
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