'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
// تم حذف useRouter من الاستيرادات لأنه غير مستخدم
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
  X
} from 'lucide-react';
import Select, { StylesConfig } from 'react-select';
import { format } from 'date-fns';
import type { SingleValue } from 'react-select';

// قائمة المنصات المتاحة
const availablePlatforms = [
  { value: 'youtube', label: 'YouTube', icon: '📺' },
  { value: 'instagram', label: 'Instagram', icon: '📷' },
  { value: 'facebook', label: 'Facebook', icon: '📘' },
  { value: 'tiktok', label: 'TikTok', icon: '🎵' },
  { value: 'x', label: 'X (Twitter)', icon: '𝕏' },
  { value: 'linkedin', label: 'LinkedIn', icon: '💼' },
  { value: 'threads', label: 'Threads', icon: '🧵' },
  { value: 'snapchat', label: 'Snapchat', icon: '👻' },
  { value: 'pinterest', label: 'Pinterest', icon: '📌' },
  { value: 'reddit', label: 'Reddit', icon: '🤖' },
  { value: 'whatsapp', label: 'WhatsApp', icon: '💬' },
  { value: 'telegram', label: 'Telegram', icon: '✈️' },
  { value: 'github', label: 'GitHub', icon: '💻' },
  { value: 'behance', label: 'Behance', icon: '🎨' },
  { value: 'dribbble', label: 'Dribbble', icon: '🏀' },
  { value: 'mobile_app', label: 'Mobile App', icon: '📱' },
  { value: 'desktop_app', label: 'Desktop App', icon: '🖥️' },
  { value: 'app_store', label: 'App Store', icon: '🍎' },
  { value: 'google_play', label: 'Google Play', icon: '🤖' },
  { value: 'download_link', label: 'Download Link', icon: '⬇️' },
  { value: 'website', label: 'Website', icon: '🌐' },
  { value: 'other', label: 'Other', icon: '🔗' }
];

interface SocialLink {
  _id: string;
  platform: string;
  url: string;
  isActive: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface SelectOption {
  value: string;
  label: string;
}

// تعريف نوع للبيانات المستخدمة في الترتيب
type SortField = 'platform' | 'order' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export default function SocialLinksPage() {
  // تم حذف const router = useRouter(); لأنه غير مستخدم
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState<string>('');
  const [showActiveOnly, setShowActiveOnly] = useState<boolean>(false);
  
  // Advanced filter states
  const [sortBy, setSortBy] = useState<SortField>('order');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  // تم نقل تعريف fetchSocialLinks إلى هنا قبل استخدامه في useEffect
  const fetchSocialLinks = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/social-links');
      if (!response.ok) {
        throw new Error('Failed to fetch social links');
      }
      const data = await response.json();
      setSocialLinks(data.data || []);
    } catch (error) {
      console.error('Error fetching social links:', error);
      setError('Failed to load social links');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
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

  // Fetch data on component mount - الآن يمكن استخدام fetchSocialLinks بأمان
  useEffect(() => {
    fetchSocialLinks();
  }, [fetchSocialLinks]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchSocialLinks();
  }, [fetchSocialLinks]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this social link?')) return;
    
    try {
      const response = await fetch(`/api/social-links/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete social link');
      }
      
      // Refresh social links list
      fetchSocialLinks();
      setSuccess('Social link deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting social link:', error);
      setError('Failed to delete social link');
      setTimeout(() => setError(null), 3000);
    }
  }, [fetchSocialLinks]);

  const handleToggleActive = useCallback(async (id: string, isActive: boolean) => {
    try {
      const response = await fetch(`/api/social-links/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ isActive }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update social link');
      }
      
      // Refresh social links list
      fetchSocialLinks();
    } catch (error) {
      console.error('Error updating social link:', error);
      setError('Failed to update social link');
      setTimeout(() => setError(null), 3000);
    }
  }, [fetchSocialLinks]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/social-links/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to export social links');
      }

      const data = await response.json();
      
      // Create a blob and download it using native browser API
      const blob = new Blob([JSON.stringify(data.socialLinks, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `social_links_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Social links exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error exporting social links:', error);
      setError('Failed to export social links');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsExporting(false);
    }
  }, []);

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
      
      const response = await fetch('/api/social-links/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          socialLinks: Array.isArray(data) ? data : [data],
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import social links');
      }

      const result = await response.json();
      setSuccess(`Successfully imported ${result.imported} social links`);
      if (result.errors && result.errors.length > 0) {
        setError(`Some errors occurred: ${result.errors.slice(0, 3).join(', ')}`);
        setTimeout(() => setError(null), 5000);
      }
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh social links list
      fetchSocialLinks();
    } catch (error) {
      console.error('Error importing social links:', error);
      setError('Failed to import social links');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsImporting(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [fetchSocialLinks]);

  const clearFilters = useCallback(() => {
    setSearchTerm('');
    setSelectedPlatform('');
    setShowActiveOnly(false);
  }, []);

  const filteredSocialLinks = socialLinks.filter(link => {
    // Search filter
    const platform = link.platform;
    const url = link.url;
    
    const matchesSearch = 
      platform.toLowerCase().includes(searchTerm.toLowerCase()) ||
      url.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Platform filter
    const matchesPlatform = !selectedPlatform || platform === selectedPlatform;
    
    // Active filter
    const matchesActive = !showActiveOnly || link.isActive;
    
    return matchesSearch && matchesPlatform && matchesActive;
  }).sort((a, b) => {
    // Sort by selected field
    let aValue: string | number | boolean | Date;
    let bValue: string | number | boolean | Date;
    
    if (sortBy === 'platform') {
      aValue = a.platform;
      bValue = b.platform;
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

  const getPlatformIcon = (platform: string) => {
    const platformData = availablePlatforms.find(p => p.value === platform);
    return platformData ? platformData.icon : '🔗';
  };

  const getPlatformLabel = (platform: string) => {
    const platformData = availablePlatforms.find(p => p.value === platform);
    return platformData ? platformData.label : platform;
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  // Prepare options for react-select
  const platformOptions: SelectOption[] = [
    { value: '', label: 'All Platforms' },
    ...availablePlatforms.map(p => ({ value: p.value, label: p.label }))
  ];

  const sortByOptions: SelectOption[] = [
    { value: 'platform', label: 'Platform' },
    { value: 'order', label: 'Display Order' },
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Social Links Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your social media links and contact options</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <Link
          href="/admin/social-links/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          Add New Social Link
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
              <Select<SelectOption, false>
                options={sortByOptions}
                value={sortByOptions.find(option => option.value === sortBy)}
                onChange={(option: SingleValue<SelectOption>) => setSortBy(option?.value as SortField || 'order')}
                styles={selectStyles}
                className="w-full"
                placeholder="Sort by"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Platform
              </label>
              <Select<SelectOption, false>
                options={platformOptions}
                value={platformOptions.find(option => option.value === selectedPlatform)}
                onChange={(option: SingleValue<SelectOption>) => setSelectedPlatform(option?.value || '')}
                styles={selectStyles}
                className="w-full"
                placeholder="Filter by platform"
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
            
            <div className="flex items-center gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Show Active Only:
              </label>
              <button
                onClick={() => setShowActiveOnly(!showActiveOnly)}
                className={`px-3 py-1 rounded-md text-sm ${
                  showActiveOnly 
                    ? 'bg-green-200 text-green-800 dark:bg-green-800 dark:text-green-200' 
                    : 'bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                }`}
              >
                {showActiveOnly ? 'Yes' : 'No'}
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
              placeholder="Search social links..."
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
                  Platform
                </th>
                <th scope="col" className="px-6 py-3">
                  URL
                </th>
                <th scope="col" className="px-6 py-3">
                  Status
                </th>
                <th scope="col" className="px-6 py-3">
                  Order
                </th>
                <th scope="col" className="px-6 py-3">
                  Updated
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSocialLinks.length > 0 ? (
                filteredSocialLinks.map((link) => (
                  <tr key={link._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      <div className="flex items-center gap-2">
                        <span className="text-xl">{getPlatformIcon(link.platform)}</span>
                        <span>
                          {getPlatformLabel(link.platform)}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <a 
                        href={link.url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline truncate max-w-xs block"
                      >
                        {truncateText(link.url)}
                      </a>
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleActive(link._id, !link.isActive)}
                        className={`px-2 py-1 text-xs rounded-full ${
                          link.isActive 
                            ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-200' 
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                        }`}
                      >
                        {link.isActive ? 'Active' : 'Inactive'}
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      {link.order}
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(link.updatedAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <a
                          href={link.url}
                          className="font-medium text-green-600 dark:text-green-500 hover:underline flex items-center gap-1"
                          target="_blank"
                        >
                          <Eye size={16} />
                          Preview
                        </a>
                        <Link
                          href={`/admin/social-links/${link._id}/edit`}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(link._id)}
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
                  <td colSpan={7} className="px-6 py-4 text-center">
                    No social links found
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