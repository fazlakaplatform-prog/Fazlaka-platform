'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Users, Send, BarChart3, TrendingUp, MousePointerClick, Newspaper, AlertCircle, RefreshCw, Plus, Eye, FileText, Film, type LucideIcon } from 'lucide-react';
import { useLanguage } from '@/components/Language/LanguageProvider';

interface DailyStats {
  users: { total: number; newToday: number };
  subscribers: { total: number; newToday: number };
  content: { episodes: number; articles: number };
  views: { today: number; week: number };
  dailyViews: { date: string; views: number }[];
}

interface Stats {
  subscribers: { total: number; active: number; unsubscribed: number; bounced: number };
  campaigns: { total: number; sent: number; drafts: number };
  engagement: { totalSent: number; totalOpens: number; totalClicks: number; totalFailed: number; totalUnsubscribes: number; openRate: string; clickRate: string };
  recentSubscribers: { id: string; email: string; name: string | null; status: string; createdAt: string }[];
}

const translations = {
  ar: {
    title: 'النشرة البريدية',
    desc: 'إدارة المشتركين والحملات البريدية',
    totalSubs: 'إجمالي المشتركين',
    active: 'نشط',
    sentCampaigns: 'الحملات المرسلة',
    drafts: 'مسودة',
    openRate: 'معدل الفتح',
    open: 'فتح',
    clickRate: 'معدل النقر',
    click: 'نقرة',
    campaignStats: 'إحصائيات الحملات',
    sent: 'أُرسلت',
    opened: 'فُتحت',
    clicks: 'نقرات',
    failed: 'فشلت',
    subscriberStatus: 'حالة المشتركين',
    unsubscribed: 'ألغى الاشتراك',
    bounced: 'مرتد',
    recentSubs: 'آخر المشتركين',
    viewAll: 'عرض الكل',
    email: 'البريد',
    name: 'الاسم',
    status: 'الحالة',
    date: 'التاريخ',
    activeLabel: 'نشط',
    unsubLabel: 'ملغي',
    bounceLabel: 'مرتد',
    loadError: 'تعذر تحميل الإحصائيات',
    newCampaign: 'حملة جديدة',
    allPeriods: 'كل الفترات',
    last7: 'آخر 7 أيام',
    last30: 'آخر 30 يوم',
    last90: 'آخر 90 يوم',
    dailyViews: 'المشاهدات اليومية',
    growthTitle: 'اتجاه النمو',
    totalUsers: 'إجمالي المستخدمين',
    newUsersToday: 'مستخدمون جدد اليوم',
    totalActiveSubs: 'إجمالي المشتركين النشطين',
    newSubsToday: 'مشتركون جدد اليوم',
    totalContent: 'إجمالي المحتوى',
    viewsToday: 'المشاهدات اليوم',
    viewsThisWeek: 'المشاهدات هذا الأسبوع',
    quickActions: 'إجراءات سريعة',
    createCampaign: 'إنشاء حملة',
    viewSubscribers: 'عرض المشتركين',
    createEpisode: 'إنشاء حلقة',
    createArticle: 'إنشاء مقال',
    noData: 'لا توجد بيانات متاحة',
  },
  en: {
    title: 'Newsletter',
    desc: 'Manage subscribers and email campaigns',
    totalSubs: 'Total Subscribers',
    active: 'Active',
    sentCampaigns: 'Sent Campaigns',
    drafts: 'Drafts',
    openRate: 'Open Rate',
    open: 'Opens',
    clickRate: 'Click Rate',
    click: 'Clicks',
    campaignStats: 'Campaign Statistics',
    sent: 'Sent',
    opened: 'Opened',
    clicks: 'Clicks',
    failed: 'Failed',
    subscriberStatus: 'Subscriber Status',
    unsubscribed: 'Unsubscribed',
    bounced: 'Bounced',
    recentSubs: 'Recent Subscribers',
    viewAll: 'View All',
    email: 'Email',
    name: 'Name',
    status: 'Status',
    date: 'Date',
    activeLabel: 'Active',
    unsubLabel: 'Unsubscribed',
    bounceLabel: 'Bounced',
    loadError: 'Failed to load statistics',
    newCampaign: 'New Campaign',
    allPeriods: 'All Periods',
    last7: 'Last 7 Days',
    last30: 'Last 30 Days',
    last90: 'Last 90 Days',
    dailyViews: 'Daily Views',
    growthTitle: 'Growth Trend',
    totalUsers: 'Total Users',
    newUsersToday: 'New Users Today',
    totalActiveSubs: 'Active Subscribers',
    newSubsToday: 'New Subscribers Today',
    totalContent: 'Total Content',
    viewsToday: 'Views Today',
    viewsThisWeek: 'Views This Week',
    quickActions: 'Quick Actions',
    createCampaign: 'Create Campaign',
    viewSubscribers: 'View Subscribers',
    createEpisode: 'Create Episode',
    createArticle: 'Create Article',
    noData: 'No data available',
  },
};

export default function NewsletterDashboardPage() {
  const { language, isRTL } = useLanguage();
  const t = translations[language];
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('all');
  const [isDark, setIsDark] = useState(false);
  const [dailyStats, setDailyStats] = useState<DailyStats | null>(null);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/newsletter/stats?period=${period}`);
      const json = await res.json();
      if (json.success) setStats(json.data);
    } catch (e) { console.error(e); }
    setLoading(false);
  };

  const fetchDailyStats = async () => {
    try {
      const res = await fetch('/api/stats/daily');
      const json = await res.json();
      if (json.success) setDailyStats(json.data);
    } catch (e) { console.error(e); }
  };

  useEffect(() => { fetchStats(); fetchDailyStats(); }, [period]);

  const last7Days = dailyStats?.dailyViews?.slice(-7)?.map(d => ({
    ...d,
    dayName: new Date(d.date).toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', { weekday: language === 'ar' ? 'long' : 'short' }),
  })) || [];
  const maxViews = Math.max(...last7Days.map(d => d.views), 1);

  const StatCard = ({ icon: Icon, label, value, sub, color }: { icon: LucideIcon; label: string; value: string | number; sub?: string; color: string }) => (
    <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm hover:shadow-md transition-shadow`}>
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-xl ${color}`}><Icon className="w-6 h-6 text-white" /></div>
      </div>
      <p className="text-3xl font-bold mb-1">{value}</p>
      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{label}</p>
      {sub && <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{sub}</p>}
    </div>
  );

  return (
    <div className="pt-20" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.desc}</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={period} onChange={e => setPeriod(e.target.value)} className={`px-4 py-2 rounded-xl border text-sm ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-700'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
            <option value="all">{t.allPeriods}</option>
            <option value="7d">{t.last7}</option>
            <option value="30d">{t.last30}</option>
            <option value="90d">{t.last90}</option>
          </select>
          <button onClick={fetchStats} className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}><RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} /></button>
          <Link href="/admin/newsletter/campaigns/add" className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all text-sm font-medium">
            <Plus className="w-4 h-4" /> {t.newCampaign}
          </Link>
        </div>
      </div>

      {loading && !stats ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'} animate-pulse`}>
              <div className="w-12 h-12 rounded-xl bg-gray-300 dark:bg-gray-600 mb-4" />
              <div className="h-8 w-20 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
              <div className="h-4 w-32 bg-gray-200 dark:bg-gray-700 rounded" />
            </div>
          ))}
        </div>
      ) : stats ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard icon={Users} label={t.totalSubs} value={stats.subscribers.total} sub={`${stats.subscribers.active} ${t.active}`} color="bg-gradient-to-br from-blue-500 to-blue-600" />
            <StatCard icon={Newspaper} label={t.sentCampaigns} value={stats.campaigns.sent} sub={`${stats.campaigns.drafts} ${t.drafts}`} color="bg-gradient-to-br from-purple-500 to-purple-600" />
            <StatCard icon={TrendingUp} label={t.openRate} value={`${stats.engagement.openRate}%`} sub={`${stats.engagement.totalOpens} ${t.open}`} color="bg-gradient-to-br from-green-500 to-green-600" />
            <StatCard icon={MousePointerClick} label={t.clickRate} value={`${stats.engagement.clickRate}%`} sub={`${stats.engagement.totalClicks} ${t.click}`} color="bg-gradient-to-br from-orange-500 to-orange-600" />
          </div>

          {/* Daily Views + Growth Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className={`lg:col-span-2 rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-indigo-500" />
                  {t.dailyViews}
                </span>
              </h2>
              {dailyStats ? (
                <div className="space-y-3">
                  {last7Days.length > 0 ? last7Days.map((day, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <span className={`w-20 text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{day.dayName}</span>
                      <div className="flex-1">
                        <div className={`h-6 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                          <div
                            className="h-6 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-500"
                            style={{ width: `${(day.views / maxViews) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-sm font-semibold w-12 text-right ${isDark ? 'text-white' : 'text-gray-900'}`}>{day.views}</span>
                    </div>
                  )) : (
                    <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.noData}</p>
                  )}
                </div>
              ) : (
                <div className="space-y-3 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className="w-16 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
                      <div className="flex-1 h-6 bg-gray-300 dark:bg-gray-600 rounded-full" />
                      <div className="w-8 h-4 bg-gray-300 dark:bg-gray-600 rounded" />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                <span className="flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-green-500" />
                  {t.growthTitle}
                </span>
              </h2>
              {dailyStats ? (
                <div className="space-y-3">
                  {[
                    { label: t.totalUsers, value: dailyStats.users.total },
                    { label: t.newUsersToday, value: dailyStats.users.newToday },
                    { label: t.totalActiveSubs, value: dailyStats.subscribers.total },
                    { label: t.newSubsToday, value: dailyStats.subscribers.newToday },
                    { label: t.totalContent, value: dailyStats.content.episodes + dailyStats.content.articles },
                    { label: t.viewsToday, value: dailyStats.views.today },
                    { label: t.viewsThisWeek, value: dailyStats.views.week },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</span>
                      <span className={`text-sm font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="space-y-3 animate-pulse">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-1">
                      <div className="h-4 w-24 bg-gray-300 dark:bg-gray-600 rounded" />
                      <div className="h-4 w-12 bg-gray-300 dark:bg-gray-600 rounded" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm mb-8`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              <span className="flex items-center gap-2">
                <Send className="w-5 h-5 text-purple-500" />
                {t.quickActions}
              </span>
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Link href="/admin/newsletter/campaigns/add" className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:bg-gray-700/50 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'} transition-all hover:shadow-sm`}>
                <div className="p-3 rounded-full bg-gradient-to-r from-indigo-500 to-purple-600">
                  <Plus className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{t.createCampaign}</span>
              </Link>
              <Link href="/admin/newsletter/subscribers" className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:bg-gray-700/50 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'} transition-all hover:shadow-sm`}>
                <div className="p-3 rounded-full bg-gradient-to-r from-blue-500 to-blue-600">
                  <Users className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{t.viewSubscribers}</span>
              </Link>
              <Link href="/admin/episodes/add" className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:bg-gray-700/50 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'} transition-all hover:shadow-sm`}>
                <div className="p-3 rounded-full bg-gradient-to-r from-green-500 to-green-600">
                  <Film className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{t.createEpisode}</span>
              </Link>
              <Link href="/admin/articles/add" className={`flex flex-col items-center gap-2 p-4 rounded-xl border ${isDark ? 'border-gray-700 hover:bg-gray-700/50 text-gray-300' : 'border-gray-200 hover:bg-gray-50 text-gray-600'} transition-all hover:shadow-sm`}>
                <div className="p-3 rounded-full bg-gradient-to-r from-orange-500 to-orange-600">
                  <FileText className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm font-medium">{t.createArticle}</span>
              </Link>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
            <div className={`lg:col-span-2 rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
              <div className="flex items-center justify-between mb-4">
                <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.campaignStats}</h2>
                <Link href="/admin/newsletter/campaigns" className={`text-sm flex items-center gap-1 ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
                  <Eye className="w-4 h-4" /> {t.viewAll}
                </Link>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: t.sent, value: stats.engagement.totalSent, color: 'bg-blue-500' },
                  { label: t.opened, value: stats.engagement.totalOpens, color: 'bg-green-500' },
                  { label: t.clicks, value: stats.engagement.totalClicks, color: 'bg-orange-500' },
                  { label: t.failed, value: stats.engagement.totalFailed, color: 'bg-red-500' },
                ].map((item, i) => (
                  <div key={i} className="text-center">
                    <div className={`h-2 rounded-full ${item.color} mb-2`} style={{ opacity: 0.3 }}>
                      <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${stats.engagement.totalSent ? (item.value / stats.engagement.totalSent) * 100 : 0}%` }} />
                    </div>
                    <p className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
              <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.subscriberStatus}</h2>
              <div className="space-y-3">
                {[
                  { label: t.active, value: stats.subscribers.active, color: 'bg-green-500', total: stats.subscribers.total },
                  { label: t.unsubscribed, value: stats.subscribers.unsubscribed, color: 'bg-gray-400', total: stats.subscribers.total },
                  { label: t.bounced, value: stats.subscribers.bounced, color: 'bg-red-500', total: stats.subscribers.total },
                ].map((item, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{item.label}</span>
                      <span className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.value}</span>
                    </div>
                    <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full">
                      <div className={`h-2 rounded-full ${item.color}`} style={{ width: `${item.total ? (item.value / item.total) * 100 : 0}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.recentSubs}</h2>
              <Link href="/admin/newsletter/subscribers" className={`text-sm flex items-center gap-1 ${isDark ? 'text-indigo-400 hover:text-indigo-300' : 'text-indigo-600 hover:text-indigo-700'}`}>
                <Eye className="w-4 h-4" /> {t.viewAll}
              </Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className={`border-b ${isDark ? 'border-gray-700 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                    <th className={`py-3 px-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t.email}</th>
                    <th className={`py-3 px-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t.name}</th>
                    <th className={`py-3 px-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t.status}</th>
                    <th className={`py-3 px-2 ${isRTL ? 'text-right' : 'text-left'}`}>{t.date}</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentSubscribers.map(sub => (
                    <tr key={sub.id} className={`border-b ${isDark ? 'border-gray-700/50 hover:bg-gray-700/30' : 'border-gray-100 hover:bg-gray-50'} transition-colors`}>
                      <td className="py-3 px-2 font-medium">{sub.email}</td>
                      <td className="py-3 px-2">{sub.name || '—'}</td>
                      <td className="py-3 px-2">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${sub.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : sub.status === 'UNSUBSCRIBED' ? 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400' : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'}`}>
                          {sub.status === 'ACTIVE' ? t.activeLabel : sub.status === 'UNSUBSCRIBED' ? t.unsubLabel : t.bounceLabel}
                        </span>
                      </td>
                      <td className="py-3 px-2">{new Date(sub.createdAt).toLocaleDateString(language === 'ar' ? 'ar-EG' : 'en-US')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <AlertCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>{t.loadError}</p>
        </div>
      )}
    </div>
  );
}
