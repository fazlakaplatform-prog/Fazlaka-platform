'use client';

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
import Select, { StylesConfig, SingleValue } from 'react-select';
import { format } from 'date-fns';

interface TeamMember {
  _id: string;
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  bio: string;
  bioEn: string;
  imageUrl: string;
  imageUrlEn: string;
  slug: string;
  socialMedia: { platform: string; url: string }[];
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface SortOption {
  value: string;
  label: string;
}

// تعريف نوع للبيانات المستخدمة في الترتيب
type SortField = 'name' | 'nameEn' | 'order' | 'createdAt' | 'updatedAt';
type SortOrder = 'asc' | 'desc';

export default function TeamPage() {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
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
  const [sortBy, setSortBy] = useState<SortField>('order');
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

  useEffect(() => {
    fetchTeamMembers();
  }, []);

  const fetchTeamMembers = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/team');
      if (!response.ok) {
        throw new Error('Failed to fetch team members');
      }
      const data = await response.json();
      setTeamMembers(data.teamMembers || []);
    } catch (error) {
      console.error('Error fetching team members:', error);
      setError('Failed to load team members');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchTeamMembers();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this team member?')) return;
    
    try {
      const response = await fetch(`/api/team/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete team member');
      }
      
      // Refresh team members list
      fetchTeamMembers();
      setSuccess('Team member deleted successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error deleting team member:', error);
      setError('Failed to delete team member');
      setTimeout(() => setError(null), 3000);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const response = await fetch('/api/team/export', {
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
        throw new Error('Failed to export team members');
      }

      const data = await response.json();
      
      // Create a blob and download it using native browser API
      const blob = new Blob([JSON.stringify(data.teamMembers, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `team_members_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      setSuccess('Team members exported successfully');
      setTimeout(() => setSuccess(null), 3000);
    } catch (error) {
      console.error('Error exporting team members:', error);
      setError('Failed to export team members');
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
      
      const response = await fetch('/api/team/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          teamMembers: Array.isArray(data) ? data : [data],
          format: 'json'
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to import team members');
      }

      const result = await response.json();
      setSuccess(`Successfully imported ${result.imported} team members`);
      if (result.errors && result.errors.length > 0) {
        setError(`Some errors occurred: ${result.errors.slice(0, 3).join(', ')}`);
        setTimeout(() => setError(null), 5000);
      }
      setTimeout(() => setSuccess(null), 3000);
      
      // Refresh team members list
      fetchTeamMembers();
    } catch (error) {
      console.error('Error importing team members:', error);
      setError('Failed to import team members');
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
    setSearchTerm('');
  };

  const filteredTeamMembers = teamMembers.filter(member => {
    // Search filter
    const name = language === 'ar' ? member.name : member.nameEn;
    const role = language === 'ar' ? member.role : member.roleEn;
    const bio = language === 'ar' ? member.bio : member.bioEn;
    
    const matchesSearch = 
      name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      role.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (bio && bio.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesSearch;
  }).sort((a, b) => {
    // Sort by selected field
    let aValue: string | number | Date;
    let bValue: string | number | Date;
    
    if (sortBy === 'name' || sortBy === 'nameEn') {
      aValue = language === 'ar' ? a.name : a.nameEn;
      bValue = language === 'ar' ? b.name : b.nameEn;
    } else if (sortBy === 'createdAt' || sortBy === 'updatedAt') {
      aValue = a[sortBy] ? new Date(a[sortBy]).getTime() : 0;
      bValue = b[sortBy] ? new Date(b[sortBy]).getTime() : 0;
    } else {
      aValue = a[sortBy] || 0;
      bValue = b[sortBy] || 0;
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
  const sortByOptions: SortOption[] = [
    { value: 'name', label: 'Name' },
    { value: 'order', label: 'Display Order' },
    { value: 'createdAt', label: 'Created Date' },
    { value: 'updatedAt', label: 'Updated Date' }
  ];

  // Custom styles for react-select with dark mode support
  const selectStyles: StylesConfig<SortOption, false> = {
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Team Members Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your team members with Arabic and English content</p>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
        <Link
          href="/admin/team/add"
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
        >
          Add New Team Member
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
              <Select<SortOption, false>
                options={sortByOptions}
                value={sortByOptions.find(option => option.value === sortBy)}
                onChange={(option: SingleValue<SortOption>) => setSortBy(option?.value as SortField || 'order')}
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
              placeholder="Search team members..."
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
                  Name
                </th>
                <th scope="col" className="px-6 py-3">
                  Role
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
              {filteredTeamMembers.length > 0 ? (
                filteredTeamMembers.map((member) => (
                  <tr key={member._id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-white whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        {member.imageUrl && (
                          <Image 
                            src={language === 'ar' ? member.imageUrl : member.imageUrlEn} 
                            alt={language === 'ar' ? member.name : member.nameEn}
                            width={40}
                            height={40}
                            className="w-10 h-10 object-cover rounded-full"
                          />
                        )}
                        <span>
                          {language === 'ar' ? member.name : member.nameEn}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {language === 'ar' ? member.role : member.roleEn}
                    </td>
                    <td className="px-6 py-4">
                      {member.order}
                    </td>
                    <td className="px-6 py-4">
                      {formatDate(member.createdAt)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex space-x-2">
                        <Link
                          href={`/team/${member.slug}`}
                          className="font-medium text-green-600 dark:text-green-500 hover:underline flex items-center gap-1"
                          target="_blank"
                        >
                          <Eye size={16} />
                          Preview
                        </Link>
                        <Link
                          href={`/admin/team/${member._id}/edit`}
                          className="font-medium text-blue-600 dark:text-blue-500 hover:underline flex items-center gap-1"
                        >
                          <Edit size={16} />
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(member._id)}
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
                    No team members found
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