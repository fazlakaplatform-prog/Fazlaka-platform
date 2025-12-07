'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  FileText, 
  Play, 
  Users, 
  Calendar,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  ChevronDown,
  HelpCircle,
  Shield,
  Layers,
  FileCheck,
  ListVideo
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import {
  LineChart,
  Line,
  PieChart as RePieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useLanguage } from '@/components/Language/LanguageProvider';

// أنواع البيانات
interface StatCard {
  title: string;
  titleEn: string;
  value: number;
  change: number;
  changeType: 'increase' | 'decrease';
  icon: React.ReactNode;
  color: string;
  link?: string;
}

interface ChartData {
  name: string;
  nameEn: string;
  articles: number;
  episodes: number;
  users: number;
}

// تم إصلاح الواجهة هنا عن طريق إضافة [key: string]: unknown;
interface ContentTypeData {
  name: string;
  nameEn: string;
  value: number;
  color?: string;
  [key: string]: unknown; // هذا السطر يضيف التوافق مع مكتبة recharts
}

interface RecentActivity {
  id: string;
  type: 'article' | 'episode' | 'user' | 'faq' | 'team' | 'season' | 'playlist' | 'terms' | 'privacy';
  title: string;
  titleEn: string;
  timestamp: Date;
  user?: string;
  userEn?: string;
}

// Define a strict, explicit type for the Pie label props to avoid using `any`
interface PieLabelProps {
  cx?: number;
  cy?: number;
  midAngle?: number;
  innerRadius?: number;
  outerRadius?: number;
  percent?: number;
  payload?: {
    name?: string;
    nameEn?: string;
    value?: number;
    color?: string;
  };
}

export default function AdminDashboard() {
  const { language, isRTL } = useLanguage();
  
  // حالة التحميل
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30days');
  const [showDateFilter, setShowDateFilter] = useState(false);
  
  // البيانات الإحصائية
  const [stats, setStats] = useState<StatCard[]>([]);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [contentTypeData, setContentTypeData] = useState<ContentTypeData[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  
  // جلب البيانات عند تحميل الصفحة
  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      // حساب نطاق التاريخ
      let startDate: Date;
      let endDate: Date;
      const today = new Date();
      
      switch (dateRange) {
        case '7days':
          startDate = startOfDay(subDays(today, 7));
          endDate = endOfDay(today);
          break;
        case '30days':
          startDate = startOfDay(subDays(today, 30));
          endDate = endOfDay(today);
          break;
        case '90days':
          startDate = startOfDay(subDays(today, 90));
          endDate = endOfDay(today);
          break;
        case '1year':
          startDate = startOfDay(subDays(today, 365));
          endDate = endOfDay(today);
          break;
        default:
          startDate = startOfDay(subDays(today, 30));
          endDate = endOfDay(today);
      }
      
      // جلب البيانات من الـ API
      const response = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
        }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }
      
      const data = await response.json();
      
      // تحديث البيانات الإحصائية (بدون بيانات وهمية)
      setStats([
        {
          title: 'المقالات',
          titleEn: 'Articles',
          value: data.stats?.articles || 0,
          change: data.stats?.articlesChange || 0,
          changeType: data.stats?.articlesChangeType || 'increase',
          icon: <FileText size={24} />,
          color: 'bg-blue-500',
          link: '/admin/articles'
        },
        {
          title: 'الحلقات',
          titleEn: 'Episodes',
          value: data.stats?.episodes || 0,
          change: data.stats?.episodesChange || 0,
          changeType: data.stats?.episodesChangeType || 'increase',
          icon: <Play size={24} />,
          color: 'bg-green-500',
          link: '/admin/episodes'
        },
        {
          title: 'المستخدمون',
          titleEn: 'Users',
          value: data.stats?.users || 0,
          change: data.stats?.usersChange || 0,
          changeType: data.stats?.usersChangeType || 'increase',
          icon: <Users size={24} />,
          color: 'bg-purple-500',
          link: '/admin/users'
        },
        {
          title: 'المواسم',
          titleEn: 'Seasons',
          value: data.stats?.seasons || 0,
          change: data.stats?.seasonsChange || 0,
          changeType: data.stats?.seasonsChangeType || 'increase',
          icon: <Layers size={24} />,
          color: 'bg-orange-500',
          link: '/admin/seasons'
        }
      ]);
      
      // تحديث بيانات الرسم البياني
      setChartData(Array.isArray(data.chartData) ? data.chartData : []);
      
      // تحديث بيانات أنواع المحتوى
      // Map incoming data to ensure it has the expected fields (safe defaults)
      const safeContentTypes: ContentTypeData[] = Array.isArray(data.contentTypeData)
        ? data.contentTypeData.map((c: unknown) => {
            const item = c as { [k: string]: unknown };
            return {
              name: String(item.name ?? item.title ?? ''),
              nameEn: String(item.nameEn ?? item.titleEn ?? item.name ?? ''),
              value: typeof item.value === 'number' ? (item.value as number) : Number(item.count ?? 0),
              color: typeof item.color === 'string' ? (item.color as string) : undefined
            };
          })
        : [];

      setContentTypeData(safeContentTypes);
      
      // تحديث النشاط الأخير
      // Ensure timestamps are Date objects
      const safeRecent: RecentActivity[] = Array.isArray(data.recentActivity)
        ? data.recentActivity.map((r: unknown) => {
            const item = r as { [k: string]: unknown };
            return {
              id: String(item.id ?? item._id ?? Math.random()),
              type: (String(item.type) as RecentActivity['type']) ?? 'article',
              title: String(item.title ?? item.name ?? ''),
              titleEn: String(item.titleEn ?? item.nameEn ?? item.title ?? ''),
              timestamp: item.timestamp ? new Date(String(item.timestamp)) : new Date(),
              user: item.user ? String(item.user) : undefined,
              userEn: item.userEn ? String(item.userEn) : undefined
            };
          })
        : [];

      setRecentActivity(safeRecent);
      
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      // Set empty data on error to prevent crashes
      setChartData([]);
      setContentTypeData([]);
      setRecentActivity([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [dateRange]);
  
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);
  
  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchDashboardData();
  };
  
  const formatDate = (date: Date) => {
    return format(date, 'MMM dd, yyyy');
  };
  
  const formatTime = (date: Date) => {
    return format(date, 'h:mm a');
  };
  
  // خيارات نطاق التاريخ
  const dateRangeOptions = [
    { value: '7days', label: language === 'ar' ? 'آخر 7 أيام' : 'Last 7 days' },
    { value: '30days', label: language === 'ar' ? 'آخر 30 يوم' : 'Last 30 days' },
    { value: '90days', label: language === 'ar' ? 'آخر 90 يوم' : 'Last 90 days' },
    { value: '1year', label: language === 'ar' ? 'السنة الماضية' : 'Last year' }
  ];
  
  // ألوان المخطط الدائري
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];
  
  // روابط سريعة لجميع صفحات الإدارة
  const quickLinks = [
    {
      title: 'المقالات',
      titleEn: 'Articles',
      icon: <FileText size={24} />,
      color: 'bg-blue-500',
      link: '/admin/articles',
      count: stats[0]?.value || 0
    },
    {
      title: 'الحلقات',
      titleEn: 'Episodes',
      icon: <Play size={24} />,
      color: 'bg-green-500',
      link: '/admin/episodes',
      count: stats[1]?.value || 0
    },
    {
      title: 'المواسم',
      titleEn: 'Seasons',
      icon: <Layers size={24} />,
      color: 'bg-orange-500',
      link: '/admin/seasons',
      count: stats[3]?.value || 0
    },
    {
      title: 'قوائم التشغيل',
      titleEn: 'Playlists',
      icon: <ListVideo size={24} />,
      color: 'bg-pink-500',
      link: '/admin/playlists',
      count: 0
    },
    {
      title: 'أعضاء الفريق',
      titleEn: 'Team Members',
      icon: <Users size={24} />,
      color: 'bg-indigo-500',
      link: '/admin/team',
      count: 0
    },
    {
      title: 'أسئلة الشائعة',
      titleEn: 'FAQs',
      icon: <HelpCircle size={24} />,
      color: 'bg-cyan-500',
      link: '/admin/faqs',
      count: 0
    },
    {
      title: 'الشروط والأحكام',
      titleEn: 'Terms & Conditions',
      icon: <FileCheck size={24} />,
      color: 'bg-red-500',
      link: '/admin/terms',
      count: 0
    },
    {
      title: 'سياسة الخصوصية',
      titleEn: 'Privacy Policy',
      icon: <Shield size={24} />,
      color: 'bg-amber-500',
      link: '/admin/privacy',
      count: 0
    }
  ];

  // Function to get activity text based on type and language
  const getActivityText = (activity: RecentActivity) => {
    switch (activity.type) {
      case 'article':
        return language === 'ar' ? 'مقال جديد' : 'New article';
      case 'episode':
        return language === 'ar' ? 'حلقة جديدة' : 'New episode';
      case 'season':
        return language === 'ar' ? 'موسم جديد' : 'New season';
      case 'playlist':
        return language === 'ar' ? 'قائمة تشغيل جديدة' : 'New playlist';
      case 'team':
        return language === 'ar' ? 'عضو فريق جديد' : 'New team member';
      case 'faq':
        return language === 'ar' ? 'سؤال شائع جديد' : 'New FAQ';
      case 'terms':
        return language === 'ar' ? 'تحديث في الشروط والأحكام' : 'Terms & Conditions update';
      case 'privacy':
        return language === 'ar' ? 'تحديث في سياسة الخصوصية' : 'Privacy policy update';
      default:
        return language === 'ar' ? activity.title : activity.titleEn;
    }
  };

  // Function to get activity icon based on type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText size={16} />;
      case 'episode':
        return <Play size={16} />;
      case 'season':
        return <Layers size={16} />;
      case 'playlist':
        return <ListVideo size={16} />;
      case 'team':
        return <Users size={16} />;
      case 'faq':
        return <HelpCircle size={16} />;
      case 'terms':
        return <FileCheck size={16} />;
      case 'privacy':
        return <Shield size={16} />;
      default:
        return <FileText size={16} />;
    }
  };

  // Function to get activity color based on type
  const getActivityColor = (type: string) => {
    switch (type) {
      case 'article':
        return 'bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300';
      case 'episode':
        return 'bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300';
      case 'season':
        return 'bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300';
      case 'playlist':
        return 'bg-pink-100 dark:bg-pink-900 text-pink-600 dark:text-pink-300';
      case 'team':
        return 'bg-indigo-100 dark:bg-indigo-900 text-indigo-600 dark:text-indigo-300';
      case 'faq':
        return 'bg-cyan-100 dark:bg-cyan-900 text-cyan-600 dark:text-cyan-300';
      case 'terms':
        return 'bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-300';
      case 'privacy':
        return 'bg-amber-100 dark:bg-amber-900 text-amber-600 dark:text-amber-300';
      default:
        return 'bg-gray-100 dark:bg-gray-900 text-gray-600 dark:text-gray-300';
    }
  };

  // Robust custom label for Pie chart using explicit type instead of `any`
  const renderCustomizedLabel = (props: PieLabelProps) => {
    try {
      const {
        cx = 0,
        cy = 0,
        midAngle = 0,
        innerRadius = 0,
        outerRadius = 0,
        percent = 0,
        payload = {}
      } = props || {};

      const entryName = payload.name ?? '';
      const entryNameEn = payload.nameEn ?? '';

      // If percent is not a finite number or data is missing, don't render a label
      if (!Number.isFinite(percent) || percent <= 0 || (!entryName && !entryNameEn)) {
        return null;
      }

      const RADIAN = Math.PI / 180;
      const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
      const x = cx + radius * Math.cos(-midAngle * RADIAN);
      const y = cy + radius * Math.sin(-midAngle * RADIAN);

      const labelText = `${language === 'ar' ? entryName : entryNameEn}: ${Math.round(percent * 100)}%`;

      return (
        <text
          x={x}
          y={y}
          fill="white"
          textAnchor={x > cx ? 'start' : 'end'}
          dominantBaseline="central"
          style={{ fontSize: 12, fontWeight: 600 }}
        >
          {labelText}
        </text>
      );
    } catch {
      // If anything unexpected happens, return null to avoid breaking the chart
      return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* مسافة فارغة في بداية الصفحة */}
      <div className="h-8 mb-6"></div>
      
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {language === 'ar' ? 'لوحة التحكم' : 'Admin Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {language === 'ar' ? 'نظرة عامة على إحصائيات وأداء الموقع' : 'Overview of site statistics and performance'}
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 flex items-center gap-2"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing 
              ? (language === 'ar' ? 'جاري التحديث...' : 'Refreshing...') 
              : (language === 'ar' ? 'تحديث' : 'Refresh')
            }
          </button>
          
          <div className="relative">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center gap-2"
            >
              <Calendar size={16} />
              {language === 'ar' ? 'نطاق التاريخ' : 'Date Range'}
              <ChevronDown size={16} className={showDateFilter ? 'rotate-180' : ''} />
            </button>
            
            {showDateFilter && (
              <div className={`absolute ${isRTL ? 'left-0 right-auto' : 'right-0 left-auto'} mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg z-10`}>
                <div className="p-2">
                  {dateRangeOptions.map(option => (
                    <button
                      key={option.value}
                      onClick={() => {
                        setDateRange(option.value);
                        setShowDateFilter(false);
                      }}
                      className={`w-full text-left px-3 py-2 rounded-md text-sm ${
                        dateRange === option.value
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* بطاقات الإحصائيات */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat, index) => (
              <Link
                key={index}
                href={stat.link || '#'}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className={`p-3 rounded-full ${stat.color} bg-opacity-10`}>
                    <div className={`${stat.color.replace('bg-', 'text-')}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className={`flex items-center text-sm font-medium ${
                    stat.changeType === 'increase' 
                      ? 'text-green-600 dark:text-green-400' 
                      : 'text-red-600 dark:text-red-400'
                  }`}>
                    {stat.changeType === 'increase' ? (
                      <ArrowUp size={16} className="ml-1" />
                    ) : (
                      <ArrowDown size={16} className="ml-1" />
                    )}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
                  {stat.value.toLocaleString()}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {language === 'ar' ? stat.title : stat.titleEn}
                </p>
              </Link>
            ))}
          </div>
          
          {/* الرسوم البيانية */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* رسم بياني خطي لنمو المحتوى */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'ar' ? 'نمو المحتوى' : 'Content Growth'}
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis 
                    dataKey={language === 'ar' ? 'name' : 'nameEn'} 
                    tick={{ fill: isRTL ? '#fff' : '#000' }}
                  />
                  <YAxis tick={{ fill: isRTL ? '#fff' : '#000' }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: isRTL ? '#1f2937' : '#fff',
                      borderColor: isRTL ? '#374151' : '#e5e7eb',
                      borderRadius: '8px'
                    }}
                  />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="articles" 
                    stroke="#3b82f6" 
                    strokeWidth={2}
                    name={language === 'ar' ? 'المقالات' : 'Articles'}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="episodes" 
                    stroke="#10b981" 
                    strokeWidth={2}
                    name={language === 'ar' ? 'الحلقات' : 'Episodes'}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            
            {/* رسم بياني دائري لأنواع المحتوى */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'ar' ? 'توزيع المحتوى' : 'Content Distribution'}
              </h3>

              {contentTypeData.length === 0 ? (
                <div className="flex items-center justify-center h-72">
                  <p className="text-gray-500 dark:text-gray-400">{language === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}</p>
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <RePieChart>
                    <Pie
                      data={contentTypeData}
                      cx="50%"
                      cy="50%"
                      nameKey={language === 'ar' ? 'name' : 'nameEn'}
                      labelLine={false}
                      label={renderCustomizedLabel}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {contentTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isRTL ? '#1f2937' : '#fff',
                        borderColor: isRTL ? '#374151' : '#e5e7eb',
                        borderRadius: '8px'
                      }}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
          
          {/* روابط سريعة لجميع صفحات الإدارة */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {language === 'ar' ? 'الوصول السريع' : 'Quick Access'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickLinks.map((link, index) => (
                <Link
                  key={index}
                  href={link.link}
                  className="flex flex-col items-center justify-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors group"
                >
                  <div className={`p-3 rounded-full ${link.color} bg-opacity-10 group-hover:bg-opacity-20 transition-colors mb-3`}>
                    <div className={`${link.color.replace('bg-', 'text-')}`}>
                      {link.icon}
                    </div>
                  </div>
                  <span className="text-sm font-medium text-gray-900 dark:text-white text-center">
                    {language === 'ar' ? link.title : link.titleEn}
                  </span>
                  {link.count > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {link.count} {language === 'ar' ? 'عنصر' : 'items'}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
          
          {/* النشاط الأخير */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
            </h3>
            <div className="space-y-4">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3">
                    <div className={`flex-shrink-0 p-2 rounded-full ${getActivityColor(activity.type)}`}>
                      {getActivityIcon(activity.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {getActivityText(activity)}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {formatDate(activity.timestamp)} • {formatTime(activity.timestamp)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  {language === 'ar' ? 'لا توجد بيانات متاحة' : 'No data available'}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}