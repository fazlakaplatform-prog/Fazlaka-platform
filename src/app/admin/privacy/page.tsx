'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { 
  Edit, 
  Trash2, 
  Search, 
  Filter, 
  RefreshCw, 
  Download, 
  Upload,
  ChevronDown,
  X,
  FileText,
  Shield,
  Database,
  UserCheck
} from 'lucide-react';
import Select, { StylesConfig } from 'react-select';
import { format } from 'date-fns';
import type { SingleValue } from 'react-select';

interface PrivacyContent {
  _id: string;
  sectionType: 'mainPolicy' | 'userRight' | 'dataType' | 'securityMeasure';
  title: string;
  titleEn: string;
  content?: string;
  contentEn?: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
  color?: string;
  textColor?: string;
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
}

interface SelectOption {
  value: string;
  label: string;
}

// تعريف نوع للبيانات المستخدمة في الترتيب
type SortField = 'sectionType' | 'title' | 'createdAt' | 'updatedAt' | 'lastUpdated';
type SortOrder = 'asc' | 'desc';

export default function PrivacyPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [privacyContent, setPrivacyContent] = useState<PrivacyContent[]>([]);
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
  const [filterSectionType, setFilterSectionType] = useState<string>('all');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');
  const [sortBy, setSortBy] = useState<SortField>('sectionType');
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

  // Fetch data on component mount
  const fetchPrivacyContent = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/privacy');
      if (!response.ok) {
        throw new Error('Failed to fetch privacy content');
      }
      const data = await response.json();
      setPrivacyContent(data.data || []);
    } catch (error) {
      console.error('Error fetching privacy content:', error);
      setError('Failed to load privacy content');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchPrivacyContent();
  }, [fetchPrivacyContent]);

  const handleRefresh = useCallback(() => {
    setIsRefreshing(true);
    fetchPrivacyContent();
  }, [fetchPrivacyContent]);

  const handleDelete = useCallback(async (id: string) => {
    if (!confirm('Are you sure you want to delete this privacy content?')) return;
    
    try {
      const response = await fetch(`/api/privacy/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete privacy content');
      }
      
      // Refresh privacy content list
      fetchPrivacyContent();
      setSuccess('Privacy content deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting privacy content:', error);
      setError('Failed to delete privacy content');
      setTimeout(() => setError(null), 3000);
    }
  }, [fetchPrivacyContent]);

  const handleExport = useCallback(async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/privacy/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          format: 'json',
          filters: {
            sectionType: filterSectionType,
            dateFrom: filterDateFrom,
            dateTo: filterDateTo,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to export privacy content');
      }

      const data = await response.json();
      
      // Create a blob and download it using native browser functionality
      const blob = new Blob([JSON.stringify(data.data || data.privacyContent || [], null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `privacy_content_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      setSuccess('Privacy content exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error exporting privacy content:', error);
      setError('Failed to export privacy content');
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsExporting(false);
    }
  }, [filterSectionType, filterDateFrom, filterDateTo]);

  const handleImport = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    setError(null);
    
    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();
      
      if (fileExtension !== 'json') {
        setError('Unsupported file format. Please use JSON.');
        setTimeout(() => setError(null), 3000);
        return;
      }

      const text = await file.text();
      
      if (!text || text.trim() === '') {
        setError('File is empty or contains invalid data.');
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        setError('Invalid JSON format. Please check your file.');
        setTimeout(() => setError(null), 3000);
        return;
      }
      
      const itemsToImport = Array.isArray(data) ? data : (data.privacyContent || [data]);
      
      const response = await fetch('/api/privacy/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          privacyContent: itemsToImport,
          format: 'json'
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to import privacy content');
      }

      const result = await response.json();
      
      // --- الجزء المهم والمصحح هنا ---
      const updated = result.updated || 0;
      const inserted = result.inserted || 0;
      setSuccess(`Successfully imported ${updated} updated and ${inserted} new items.`);
      // ------------------------------------
      
      if (result.errors && result.errors.length > 0) {
        setError(`Some errors occurred: ${result.errors.slice(0, 3).join(', ')}`);
        setTimeout(() => setError(null), 5000);
      }
      setTimeout(() => setSuccess(null), 5000);
      
      // Refresh privacy content list
      fetchPrivacyContent();
    } catch (error) {
      console.error('Error importing privacy content:', error);
      setError(`Failed to import privacy content: ${error instanceof Error ? error.message : 'Unknown error'}`);
      setTimeout(() => setError(null), 3000);
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  }, [fetchPrivacyContent]);

  const clearFilters = useCallback(() => {
    setFilterSectionType('all');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
  }, []);

  const filteredPrivacyContent = privacyContent.filter(item => {
    // Search filter
    const title = item.title;
    const titleEn = item.titleEn;
    const description = item.description;
    const descriptionEn = item.descriptionEn;
    
    const matchesSearch = 
      title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      titleEn.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (description && description.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (descriptionEn && descriptionEn.toLowerCase().includes(searchTerm.toLowerCase()));
    
    // Section type filter
    const matchesSectionType = filterSectionType === 'all' || item.sectionType === filterSectionType;
    
    // Date range filter
    let matchesDateRange = true;
    if (filterDateFrom) {
      matchesDateRange = new Date(item.createdAt) >= new Date(filterDateFrom);
    }
    if (filterDateTo) {
      matchesDateRange = matchesDateRange && new Date(item.createdAt) <= new Date(filterDateTo);
    }
    
    return matchesSearch && matchesSectionType && matchesDateRange;
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
    if (sortBy === 'createdAt' || sortBy === 'updatedAt' || sortBy === 'lastUpdated') {
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

  const getSectionTypeLabel = (sectionType: string) => {
    switch (sectionType) {
      case 'mainPolicy': return 'Main Policy';
      case 'userRight': return 'User Rights';
      case 'dataType': return 'Data Types';
      case 'securityMeasure': return 'Security Measures';
      default: return sectionType;
    }
  };

  const getSectionTypeIcon = (sectionType: string) => {
    switch (sectionType) {
      case 'mainPolicy': return <FileText size={16} className="mr-2" />;
      case 'userRight': return <UserCheck size={16} className="mr-2" />;
      case 'dataType': return <Database size={16} className="mr-2" />;
      case 'securityMeasure': return <Shield size={16} className="mr-2" />;
      default: return <FileText size={16} className="mr-2" />;
    }
  };

  const getSectionTypeColor = (sectionType: string) => {
    switch (sectionType) {
      case 'mainPolicy': return 'bg-blue-100 text-blue-800 dark:bg-blue-800 dark:text-blue-100';
      case 'userRight': return 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100';
      case 'dataType': return 'bg-purple-100 text-purple-800 dark:bg-purple-800 dark:text-purple-100';
      case 'securityMeasure': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-100';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-100';
    }
  };

  // Prepare options for react-select
  const sectionTypeOptions: SelectOption[] = [
    { value: 'all', label: 'All Types' },
    { value: 'mainPolicy', label: 'Main Policy' },
    { value: 'userRight', label: 'User Rights' },
    { value: 'dataType', label: 'Data Types' },
    { value: 'securityMeasure', label: 'Security Measures' }
  ];

  const sortByOptions: SelectOption[] = [
    { value: 'sectionType', label: 'Section Type' },
    { value: 'title', label: 'Title' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' },
    { value: 'lastUpdated', label: 'Last Updated' }
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
      <div className="h-8 mb-6"></div>
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Privacy Policy Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your privacy policy content with Arabic and English support</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <Link
          href="/admin/privacy/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          Add New Privacy Content
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
                Section Type
              </label>
              <Select<SelectOption>
                options={sectionTypeOptions}
                value={sectionTypeOptions.find(option => option.value === filterSectionType)}
                onChange={(option: SingleValue<SelectOption>) => setFilterSectionType(option?.value || 'all')}
                styles={selectStyles}
                className="w-full"
                placeholder="Select section type"
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
                onChange={(option: SingleValue<SelectOption>) => setSortBy(option?.value as SortField || 'sectionType')}
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
              placeholder="Search privacy content..."
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
                  Section Type
                </th>
                <th scope="col" className="px-6 py-3">
                  Description
                </th>
                <th scope="col" className="px-6 py-3">
                  Last Updated
                </th>
                <th scope="col" className="px-6 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredPrivacyContent.length > 0 ? (
                filteredPrivacyContent.map((item) => (
                  <tr key={item._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">
                      <div>
                        <div>{item.title}</div>
                        <div className="text-xs text-gray-500">{item.titleEn}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className={`flex items-center px-2 py-1 rounded-full text-xs ${getSectionTypeColor(item.sectionType)}`}>
                        {getSectionTypeIcon(item.sectionType)}
                        {getSectionTypeLabel(item.sectionType)}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div>
                        <div>{item.description?.substring(0, 50)}{item.description && item.description.length > 50 ? '...' : ''}</div>
                        <div className="text-xs text-gray-500">{item.descriptionEn?.substring(0, 50)}{item.descriptionEn && item.descriptionEn.length > 50 ? '...' : ''}</div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {item.lastUpdated ? formatDate(item.lastUpdated) : formatDate(item.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/admin/privacy/${item._id}/edit`}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(item._id)}
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
                    No privacy content found
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