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
  ListVideo,
  LucideIcon
} from 'lucide-react';
import { format, subDays, startOfDay, endOfDay } from 'date-fns';
import { useLanguage } from '@/components/Language/LanguageProvider';
import { LineChartComponent, PieChartComponent } from '@/components/charts';

// --- أنواع البيانات (Interfaces) ---

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

interface ChartDataItem {
  name: string;
  nameEn: string;
  articles: number;
  episodes: number;
  users: number;
  [key: string]: string | number;
}

interface ContentTypeItem {
  name: string;
  nameEn: string;
  value: number;
  color?: string;
  [key: string]: string | number | boolean | undefined;
}

interface RecentActivity {
  id: string;
  type: 'article' | 'episode' | 'user' | 'faq' | 'team' | 'season' | 'playlist' | 'terms' | 'privacy';
  title: string;
  titleEn: string;
  timestamp: Date;
}

interface ContentDataItemRaw {
  name?: string;
  title?: string;
  nameEn?: string;
  titleEn?: string;
  value?: number;
  count?: number;
  color?: string;
}

interface ActivityDataRaw {
  id?: string;
  _id?: string;
  type?: RecentActivity['type'];
  title?: string;
  name?: string;
  titleEn?: string;
  nameEn?: string;
  timestamp?: string | Date;
}

const activityConfig: Record<RecentActivity['type'], {
  icon: LucideIcon;
  color: string;
  label: { ar: string; en: string };
}> = {
  article: {
    icon: FileText,
    color: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-300',
    label: { ar: 'مقال جديد', en: 'New article' }
  },
  episode: {
    icon: Play,
    color: 'bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-300',
    label: { ar: 'حلقة جديدة', en: 'New episode' }
  },
  season: {
    icon: Layers,
    color: 'bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-300',
    label: { ar: 'موسم جديد', en: 'New season' }
  },
  playlist: {
    icon: ListVideo,
    color: 'bg-pink-100 dark:bg-pink-900/40 text-pink-600 dark:text-pink-300',
    label: { ar: 'قائمة تشغيل جديدة', en: 'New playlist' }
  },
  team: {
    icon: Users,
    color: 'bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-300',
    label: { ar: 'عضو فريق جديد', en: 'New team member' }
  },
  faq: {
    icon: HelpCircle,
    color: 'bg-cyan-100 dark:bg-cyan-900/40 text-cyan-600 dark:text-cyan-300',
    label: { ar: 'سؤال شائع جديد', en: 'New FAQ' }
  },
  terms: {
    icon: FileCheck,
    color: 'bg-red-100 dark:bg-red-900/40 text-red-600 dark:text-red-300',
    label: { ar: 'تحديث الشروط', en: 'Terms Update' }
  },
  privacy: {
    icon: Shield,
    color: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-300',
    label: { ar: 'تحديث الخصوصية', en: 'Privacy Update' }
  },
  user: {
    icon: Users,
    color: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-300',
    label: { ar: 'مستخدم جديد', en: 'New user' }
  }
};

export default function AdminDashboard() {
  const { language, isRTL } = useLanguage();

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState('30days');
  const [showDateFilter, setShowDateFilter] = useState(false);

  const [stats, setStats] = useState<StatCard[]>([]);
  const [chartData, setChartData] = useState<ChartDataItem[]>([]);
  const [contentTypeData, setContentTypeData] = useState<ContentTypeItem[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);

  const fetchDashboardData = useCallback(async () => {
    setIsLoading(true);
    try {
      const today = new Date();
      let startDate: Date;

      switch (dateRange) {
        case '7days': startDate = subDays(today, 7); break;
        case '90days': startDate = subDays(today, 90); break;
        case '1year': startDate = subDays(today, 365); break;
        default: startDate = subDays(today, 30);
      }

      const response = await fetch('/api/admin/dashboard', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          startDate: startOfDay(startDate).toISOString(),
          endDate: endOfDay(today).toISOString(),
        }),
      });

      if (!response.ok) throw new Error('Failed to fetch data');

      const data = await response.json();

      const newStats: StatCard[] = [
        {
          title: 'المقالات', titleEn: 'Articles', value: data.stats?.articles || 0,
          change: data.stats?.articlesChange || 0, changeType: data.stats?.articlesChangeType || 'increase',
          icon: <FileText size={22} />, color: 'bg-blue-500', link: '/admin/articles'
        },
        {
          title: 'الحلقات', titleEn: 'Episodes', value: data.stats?.episodes || 0,
          change: data.stats?.episodesChange || 0, changeType: data.stats?.episodesChangeType || 'increase',
          icon: <Play size={22} />, color: 'bg-green-500', link: '/admin/episodes'
        },
        {
          title: 'المستخدمون', titleEn: 'Users', value: data.stats?.users || 0,
          change: data.stats?.usersChange || 0, changeType: data.stats?.usersChangeType || 'increase',
          icon: <Users size={22} />, color: 'bg-purple-500', link: '/admin/users'
        },
        {
          title: 'المواسم', titleEn: 'Seasons', value: data.stats?.seasons || 0,
          change: data.stats?.seasonsChange || 0, changeType: data.stats?.seasonsChangeType || 'increase',
          icon: <Layers size={22} />, color: 'bg-orange-500', link: '/admin/seasons'
        }
      ];
      setStats(newStats);

      setChartData(Array.isArray(data.chartData) ? data.chartData : []);

      const safeContentTypes = Array.isArray(data.contentTypeData)
        ? data.contentTypeData.map((c: ContentDataItemRaw) => ({
            name: c.name || c.title,
            nameEn: c.nameEn || c.titleEn || c.name,
            value: Number(c.value || c.count || 0),
            color: c.color
          }))
        : [];
      setContentTypeData(safeContentTypes);

      const safeActivity = Array.isArray(data.recentActivity)
        ? data.recentActivity.map((r: ActivityDataRaw) => ({
            id: r.id || r._id || Math.random().toString(),
            type: r.type || 'article',
            title: r.title || r.name,
            titleEn: r.titleEn || r.nameEn || r.title,
            timestamp: r.timestamp ? new Date(r.timestamp) : new Date()
          }))
        : [];
      setRecentActivity(safeActivity);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
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

  const formatTime = (date: Date) => format(date, 'h:mm a');

  const dateRangeOptions = [
    { value: '7days', label: language === 'ar' ? 'آخر 7 أيام' : 'Last 7 days' },
    { value: '30days', label: language === 'ar' ? 'آخر 30 يوم' : 'Last 30 days' },
    { value: '90days', label: language === 'ar' ? 'آخر 90 يوم' : 'Last 90 days' },
    { value: '1year', label: language === 'ar' ? 'السنة الماضية' : 'Last year' }
  ];

  const quickLinks = [
    { title: 'المقالات', titleEn: 'Articles', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-50 dark:bg-blue-900/30', link: '/admin/articles', count: stats[0]?.value },
    { title: 'الحلقات', titleEn: 'Episodes', icon: Play, color: 'text-green-500', bg: 'bg-green-50 dark:bg-green-900/30', link: '/admin/episodes', count: stats[1]?.value },
    { title: 'المواسم', titleEn: 'Seasons', icon: Layers, color: 'text-orange-500', bg: 'bg-orange-50 dark:bg-orange-900/30', link: '/admin/seasons', count: stats[3]?.value },
    { title: 'قوائم التشغيل', titleEn: 'Playlists', icon: ListVideo, color: 'text-pink-500', bg: 'bg-pink-50 dark:bg-pink-900/30', link: '/admin/playlists' },
    { title: 'الفريق', titleEn: 'Team', icon: Users, color: 'text-indigo-500', bg: 'bg-indigo-50 dark:bg-indigo-900/30', link: '/admin/team' },
    { title: 'الأسئلة الشائعة', titleEn: 'FAQs', icon: HelpCircle, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-900/30', link: '/admin/faqs' },
    { title: 'الشروط', titleEn: 'Terms', icon: FileCheck, color: 'text-red-500', bg: 'bg-red-50 dark:bg-red-900/30', link: '/admin/terms' },
    { title: 'الخصوصية', titleEn: 'Privacy', icon: Shield, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-900/30', link: '/admin/privacy' },
  ];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6">
      <div className="mb-8 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">
            {language === 'ar' ? 'لوحة التحكم' : 'Admin Dashboard'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base">
            {language === 'ar' ? 'نظرة عامة على إحصائيات وأداء الموقع' : 'Overview of site statistics and performance'}
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="flex-1 sm:flex-none px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 text-sm font-medium"
          >
            <RefreshCw size={16} className={isRefreshing ? 'animate-spin' : ''} />
            {isRefreshing ? (language === 'ar' ? 'جاري...' : 'Loading...') : (language === 'ar' ? 'تحديث' : 'Refresh')}
          </button>

          <div className="relative flex-1 sm:flex-none">
            <button
              onClick={() => setShowDateFilter(!showDateFilter)}
              className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2 text-sm font-medium"
            >
              <Calendar size={16} />
              <span className="hidden sm:inline">
                {dateRangeOptions.find(o => o.value === dateRange)?.label || (language === 'ar' ? 'الفترة' : 'Period')}
              </span>
              <ChevronDown size={16} className={showDateFilter ? 'rotate-180' : ''} />
            </button>

            {showDateFilter && (
              <div className={`absolute ${isRTL ? 'left-0' : 'right-0'} mt-2 w-full sm:w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-20 border border-gray-200 dark:border-gray-700 overflow-hidden`}>
                {dateRangeOptions.map(option => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setDateRange(option.value);
                      setShowDateFilter(false);
                    }}
                    className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                      dateRange === option.value
                        ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 font-semibold'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <Link
                key={index}
                href={stat.link || '#'}
                className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-all duration-200 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2.5 rounded-lg ${stat.color} bg-opacity-10`}>
                    <div className={`${stat.color.replace('bg-', 'text-')}`}>
                      {stat.icon}
                    </div>
                  </div>
                  <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full ${
                    stat.changeType === 'increase'
                      ? 'text-green-700 bg-green-100 dark:bg-green-900/50 dark:text-green-300'
                      : 'text-red-700 bg-red-100 dark:bg-red-900/50 dark:text-red-300'
                  }`}>
                    {stat.changeType === 'increase' ? <ArrowUp size={12} className="mr-0.5" /> : <ArrowDown size={12} className="mr-0.5" />}
                    {Math.abs(stat.change)}%
                  </div>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-0.5">
                  {stat.value.toLocaleString()}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? stat.title : stat.titleEn}
                </p>
              </Link>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'ar' ? 'نمو المحتوى' : 'Content Growth'}
              </h3>
              {chartData.length > 0 ? (
                <LineChartComponent
                  data={chartData}
                  lines={[
                    { dataKey: 'articles', stroke: '#3b82f6', name: 'المقالات', nameEn: 'Articles' },
                    { dataKey: 'episodes', stroke: '#10b981', name: 'الحلقات', nameEn: 'Episodes' },
                    { dataKey: 'users', stroke: '#8b5cf6', name: 'المستخدمون', nameEn: 'Users' }
                  ]}
                  xAxisDataKey="name"
                  language={language}
                  isRTL={isRTL}
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  {language === 'ar' ? 'لا توجد بيانات كافية' : 'Not enough data'}
                </div>
              )}
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {language === 'ar' ? 'توزيع المحتوى' : 'Content Distribution'}
              </h3>
              {contentTypeData.length > 0 ? (
                <PieChartComponent
                  data={contentTypeData}
                  language={language}
                  isRTL={isRTL}
                  height={300}
                />
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500">
                  {language === 'ar' ? 'لا توجد بيانات كافية' : 'Not enough data'}
                </div>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
              {language === 'ar' ? 'الوصول السريع' : 'Quick Access'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {quickLinks.map((item, index) => (
                <Link
                  key={index}
                  href={item.link}
                  className="flex flex-col items-center justify-center p-4 rounded-lg border border-gray-100 dark:border-gray-700 hover:border-gray-200 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-all group"
                >
                  <div className={`p-3 rounded-full ${item.bg} mb-2 group-hover:scale-110 transition-transform`}>
                    <item.icon className={item.color} size={22} />
                  </div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-200 text-center">
                    {language === 'ar' ? item.title : item.titleEn}
                  </span>
                  {item.count !== undefined && (
                    <span className="text-xs text-gray-400 mt-1">{item.count}</span>
                  )}
                </Link>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {language === 'ar' ? 'النشاط الأخير' : 'Recent Activity'}
            </h3>
            <div className="space-y-3">
              {recentActivity.length > 0 ? (
                recentActivity.map((activity) => {
                  const config = activityConfig[activity.type] || activityConfig.article;
                  const Icon = config.icon;
                  return (
                    <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <div className={`flex-shrink-0 p-2 rounded-full ${config.color}`}>
                        <Icon size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start gap-2">
                          <div>
                            <p className="text-sm font-medium text-gray-900 dark:text-white">
                              {config.label[language]}
                            </p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                              {language === 'ar' ? activity.title : activity.titleEn}
                            </p>
                          </div>
                          <div className="text-xs text-gray-400 whitespace-nowrap mt-1">
                            {formatTime(activity.timestamp)}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  {language === 'ar' ? 'لا يوجد نشاط حديث' : 'No recent activity'}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}