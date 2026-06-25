'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Edit, Trash2, Search, RefreshCw, Download, Upload, X, Filter, ChevronDown } from 'lucide-react';
import { useLanguage } from '@/components/Language/LanguageProvider';

interface Subscriber {
  id: string;
  email: string;
  name: string | null;
  status: string;
  language: string;
  source: string;
  tags: string[];
  openCount: number;
  clickCount: number;
  subscribedAt: string;
  createdAt: string;
}

const translations = {
  ar: {
    title: 'المشتركون',
    subtitle: 'إدارة المشتركين في النشرة البريدية',
    import: 'استيراد',
    export: 'تصدير',
    loading: 'جاري التحميل...',
    noSubscribers: 'لا يوجد مشتركون',
    searchPlaceholder: 'بحث بالبريد أو الاسم...',
    filter: 'فلتر',
    allStatuses: 'كل الحالات',
    allLanguages: 'كل اللغات',
    email: 'البريد',
    name: 'الاسم',
    status: 'الحالة',
    language: 'اللغة',
    opens: 'فتح',
    clicks: 'نقر',
    subscribedAt: 'تاريخ الاشتراك',
    deleteConfirmTitle: 'تأكيد الحذف',
    deleteConfirmMsg: 'هل أنت متأكد من حذف هذا المشترك؟',
    delete: 'حذف',
    cancel: 'إلغاء',
    deleteSuccess: 'تم حذف المشترك',
    deleteFailed: 'فشل الحذف',
    fetchFailed: 'فشل تحميل المشتركين',
    connectionError: 'خطأ في الاتصال',
    importSuccess: 'تم استيراد {count} مشترك',
    importFailed: 'فشل استيراد الملف',
    active: 'نشط',
    unsubscribed: 'ملغي',
    bounced: 'مرتد',
    spam: 'مزعج',
    arabic: 'العربية',
    english: 'English',
  },
  en: {
    title: 'Subscribers',
    subtitle: 'Manage newsletter subscribers',
    import: 'Import',
    export: 'Export',
    loading: 'Loading...',
    noSubscribers: 'No subscribers',
    searchPlaceholder: 'Search by email or name...',
    filter: 'Filter',
    allStatuses: 'All Statuses',
    allLanguages: 'All Languages',
    email: 'Email',
    name: 'Name',
    status: 'Status',
    language: 'Language',
    opens: 'Opens',
    clicks: 'Clicks',
    subscribedAt: 'Subscribed At',
    deleteConfirmTitle: 'Confirm Delete',
    deleteConfirmMsg: 'Are you sure you want to delete this subscriber?',
    delete: 'Delete',
    cancel: 'Cancel',
    deleteSuccess: 'Subscriber deleted',
    deleteFailed: 'Delete failed',
    fetchFailed: 'Failed to load subscribers',
    connectionError: 'Connection error',
    importSuccess: 'Imported {count} subscriber(s)',
    importFailed: 'Failed to import file',
    active: 'Active',
    unsubscribed: 'Unsubscribed',
    bounced: 'Bounced',
    spam: 'Spam',
    arabic: 'العربية',
    english: 'English',
  },
};

const statusLabels: Record<string, { ar: string; en: string }> = {
  ACTIVE: { ar: 'نشط', en: 'Active' },
  UNSUBSCRIBED: { ar: 'ملغي', en: 'Unsubscribed' },
  BOUNCED: { ar: 'مرتد', en: 'Bounced' },
  SPAM: { ar: 'مزعج', en: 'Spam' },
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  UNSUBSCRIBED: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  BOUNCED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  SPAM: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
};

export default function SubscribersPage() {
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  const locale = language === 'ar' ? 'ar-EG' : 'en-US';

  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [langFilter, setLangFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [pages, setPages] = useState(0);
  const [isDark, setIsDark] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const fetchSubscribers = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ page: String(page), limit: '30', sortBy: 'createdAt', sortOrder: 'desc' });
      if (search) params.set('search', search);
      if (statusFilter) params.set('status', statusFilter);
      if (langFilter) params.set('lang', langFilter);
      const res = await fetch(`/api/newsletter/subscribers?${params}`);
      const json = await res.json();
      if (json.success) {
        setSubscribers(json.data);
        setTotal(json.pagination.total);
        setPages(json.pagination.pages);
      } else setError(t.fetchFailed);
    } catch { setError(t.connectionError); }
    setLoading(false);
  }, [page, search, statusFilter, langFilter, t.fetchFailed, t.connectionError]);

  useEffect(() => { fetchSubscribers(); }, [fetchSubscribers]);

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/newsletter/subscribers/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) {
        setSuccess(t.deleteSuccess);
        fetchSubscribers();
      } else setError(t.deleteFailed);
    } catch { setError(t.deleteFailed); }
    setDeleteId(null);
  };

  const handleExport = () => {
    const data = subscribers.map(s => ({ email: s.email, name: s.name, status: s.status, language: s.language, tags: s.tags?.join(', ') }));
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `subscribers-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]; if (!file) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      let imported = 0;
      for (const item of data) {
        if (item.email) {
          await fetch('/api/newsletter/subscribe', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: item.email, name: item.name, language: item.language || 'ar', tags: item.tags ? item.tags.split(',').map((t: string) => t.trim()) : [], source: 'IMPORT' }),
          });
          imported++;
        }
      }
      setSuccess(t.importSuccess.replace('{count}', String(imported)));
      fetchSubscribers();
    } catch { setError(t.importFailed); }
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const formatDate = (dateStr: string) => {
    try {
      return new Intl.DateTimeFormat(locale, { year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(dateStr));
    } catch {
      return dateStr;
    }
  };

  const thClass = `py-3 px-4 font-medium text-xs uppercase tracking-wider ${isRTL ? 'text-right' : 'text-left'} ${isDark ? 'text-gray-400' : 'text-gray-500'}`;
  const tdClass = `py-3 px-4 ${isRTL ? 'text-right' : 'text-left'}`;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="pt-20">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className={`text-3xl font-bold bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent ${isDark ? '' : ''}`}>
            {t.title}
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <input type="file" ref={fileInputRef} accept=".json" onChange={handleImport} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'}`}>
            <Upload className="w-4 h-4" /> {t.import}
          </button>
          <button onClick={handleExport} className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700 hover:border-gray-600' : 'border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-gray-300'}`}>
            <Download className="w-4 h-4" /> {t.export}
          </button>
          <button onClick={fetchSubscribers} className={`p-2.5 rounded-xl transition-all duration-200 ${isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
          <X className="w-4 h-4 shrink-0 cursor-pointer" onClick={() => setError('')} />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl text-sm flex items-center gap-2">
          <X className="w-4 h-4 shrink-0 cursor-pointer" onClick={() => setSuccess('')} />
          {success}
        </div>
      )}

      <div className={`rounded-2xl border ${isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-100'} shadow-sm overflow-hidden backdrop-blur-sm`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
              <input
                type="text"
                placeholder={t.searchPlaceholder}
                value={search}
                onChange={e => { setSearch(e.target.value); setPage(1); }}
                className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-200 text-gray-900'}`}
              />
            </div>
            <button onClick={() => setShowFilters(!showFilters)} className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm border transition-all duration-200 ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
              <Filter className="w-4 h-4" /> {t.filter} <ChevronDown className={`w-3 h-3 transition-transform duration-200 ${showFilters ? 'rotate-180' : ''}`} />
            </button>
          </div>
          {showFilters && (
            <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <select value={statusFilter} onChange={e => { setStatusFilter(e.target.value); setPage(1); }} className={`px-3 py-2 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <option value="">{t.allStatuses}</option>
                <option value="ACTIVE">{t.active}</option>
                <option value="UNSUBSCRIBED">{t.unsubscribed}</option>
                <option value="BOUNCED">{t.bounced}</option>
                <option value="SPAM">{t.spam}</option>
              </select>
              <select value={langFilter} onChange={e => { setLangFilter(e.target.value); setPage(1); }} className={`px-3 py-2 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-gray-50 border-gray-200 text-gray-700'}`}>
                <option value="">{t.allLanguages}</option>
                <option value="ar">{t.arabic}</option>
                <option value="en">{t.english}</option>
              </select>
            </div>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <th className={thClass}>{t.email}</th>
                <th className={thClass}>{t.name}</th>
                <th className={thClass}>{t.status}</th>
                <th className={thClass}>{t.language}</th>
                <th className={`py-3 px-4 font-medium text-xs uppercase tracking-wider text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.opens}</th>
                <th className={`py-3 px-4 font-medium text-xs uppercase tracking-wider text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.clicks}</th>
                <th className={thClass}>{t.subscribedAt}</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={8} className="text-center py-16">
                  <div className="flex items-center justify-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin text-indigo-500" />
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>{t.loading}</span>
                  </div>
                </td></tr>
              ) : subscribers.length === 0 ? (
                <tr><td colSpan={8} className={`text-center py-16 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{t.noSubscribers}</td></tr>
              ) : subscribers.map(sub => (
                <tr key={sub.id} className={`border-b transition-all duration-150 ${isDark ? 'border-gray-700/50 hover:bg-gray-700/40' : 'border-gray-100 hover:bg-gray-50'} group`}>
                  <td className={tdClass}>
                    <span className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>{sub.email}</span>
                  </td>
                  <td className={tdClass}>{sub.name || '—'}</td>
                  <td className={tdClass}>
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${statusColors[sub.status] || statusColors.ACTIVE}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${sub.status === 'ACTIVE' ? 'bg-green-500' : sub.status === 'UNSUBSCRIBED' ? 'bg-gray-400' : sub.status === 'BOUNCED' ? 'bg-red-500' : 'bg-yellow-500'}`} />
                      {statusLabels[sub.status]?.[language] || sub.status}
                    </span>
                  </td>
                  <td className={tdClass}>
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {sub.language === 'ar' ? t.arabic : t.english}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">{sub.openCount}</td>
                  <td className="py-3 px-4 text-center">{sub.clickCount}</td>
                  <td className={tdClass}>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(sub.subscribedAt)}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-center gap-1">
                      <Link href={`/admin/newsletter/subscribers/${sub.id}/edit`} className={`p-1.5 rounded-lg transition-all duration-200 ${isDark ? 'hover:bg-gray-700 text-gray-400 hover:text-indigo-400' : 'hover:bg-gray-100 text-gray-500 hover:text-indigo-600'}`}>
                        <Edit className="w-4 h-4" />
                      </Link>
                      <button onClick={() => setDeleteId(sub.id)} className="p-1.5 rounded-lg transition-all duration-200 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500 hover:text-red-600">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {pages > 1 && (
          <div className={`flex items-center justify-center gap-2 p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            {Array.from({ length: pages }, (_, i) => i + 1).map(p => (
              <button key={p} onClick={() => setPage(p)} className={`w-9 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${p === page ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-md shadow-indigo-500/20' : isDark ? 'hover:bg-gray-700 text-gray-300' : 'hover:bg-gray-100 text-gray-600'}`}>
                {p}
              </button>
            ))}
          </div>
        )}
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center backdrop-blur-sm">
          <div className={`rounded-2xl p-6 max-w-sm w-full mx-4 shadow-2xl ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white'} transform transition-all`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.deleteConfirmTitle}</h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.deleteConfirmMsg}</p>
            <div className="flex gap-3">
              <button onClick={() => handleDelete(deleteId)} className="flex-1 px-4 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl hover:from-red-600 hover:to-red-700 text-sm font-medium transition-all duration-200 shadow-md shadow-red-500/20">
                {t.delete}
              </button>
              <button onClick={() => setDeleteId(null)} className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all duration-200 ${isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}>
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
