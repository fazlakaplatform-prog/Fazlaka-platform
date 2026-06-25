'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Plus, RefreshCw, Send, Edit, Trash2, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/Language/LanguageProvider';

interface Campaign {
  id: string;
  subject: string;
  subjectEn: string | null;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openCount: number;
  clickCount: number;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
}

const translations = {
  ar: {
    title: 'الحملات البريدية',
    subtitle: 'إنشاء وإدارة حملات البريد الإلكتروني',
    newCampaign: 'حملة جديدة',
    allStatuses: 'كل الحالات',
    filterDraft: 'مسودة',
    filterScheduled: 'مجدولة',
    filterSent: 'مرسلة',
    filterFailed: 'فاشلة',
    subject: 'العنوان',
    status: 'الحالة',
    recipients: 'المستلمون',
    sent: 'أُرسلت',
    opened: 'فُتحت',
    clicks: 'نقرات',
    openRate: 'نسبة الفتح',
    clickRate: 'نسبة النقر',
    rate: 'نسبة',
    date: 'التاريخ',
    noCampaigns: 'لا توجد حملات',
    sendSuccess: 'تم إرسال الحملة بنجاح',
    deleteSuccess: 'تم حذف الحملة',
    deleteFailed: 'فشل الحذف',
    sendFailed: 'فشل الإرسال',
    loadFailed: 'فشل التحميل',
    deleteTitle: 'تأكيد الحذف',
    deleteMessage: 'هل أنت متأكد من حذف هذه الحملة؟',
    delete: 'حذف',
    cancel: 'إلغاء',
    view: 'عرض',
    edit: 'تعديل',
    send: 'إرسال',
    recipientsLabel: 'مستلم',
    statusLabels: { DRAFT: 'مسودة', SCHEDULED: 'مجدولة', SENDING: 'جارٍ الإرسال', SENT: 'مرسلة', PAUSED: 'موقفة', FAILED: 'فاشلة' },
  },
  en: {
    title: 'Email Campaigns',
    subtitle: 'Create and manage email campaigns',
    newCampaign: 'New Campaign',
    allStatuses: 'All Statuses',
    filterDraft: 'Draft',
    filterScheduled: 'Scheduled',
    filterSent: 'Sent',
    filterFailed: 'Failed',
    subject: 'Subject',
    status: 'Status',
    recipients: 'Recipients',
    sent: 'Sent',
    opened: 'Opened',
    clicks: 'Clicks',
    openRate: 'Open Rate',
    clickRate: 'Click Rate',
    rate: 'Rate',
    date: 'Date',
    noCampaigns: 'No campaigns found',
    sendSuccess: 'Campaign sent successfully',
    deleteSuccess: 'Campaign deleted',
    deleteFailed: 'Delete failed',
    sendFailed: 'Send failed',
    loadFailed: 'Failed to load',
    deleteTitle: 'Confirm Delete',
    deleteMessage: 'Are you sure you want to delete this campaign?',
    delete: 'Delete',
    cancel: 'Cancel',
    view: 'View',
    edit: 'Edit',
    send: 'Send',
    recipientsLabel: 'recipient',
    statusLabels: { DRAFT: 'Draft', SCHEDULED: 'Scheduled', SENDING: 'Sending', SENT: 'Sent', PAUSED: 'Paused', FAILED: 'Failed' },
  },
};

export default function CampaignsPage() {
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  const dateLocale = language === 'ar' ? ar : enUS;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [sending, setSending] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const fetchCampaigns = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ sortBy: 'createdAt', sortOrder: 'desc' });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`/api/newsletter/campaigns?${params}`);
      const json = await res.json();
      if (json.success) setCampaigns(json.data);
    } catch { setError(t.loadFailed); }
    setLoading(false);
  }, [statusFilter, t.loadFailed]);

  useEffect(() => { fetchCampaigns(); }, [fetchCampaigns]);

  const handleSend = async (id: string) => {
    setSending(id);
    setError('');
    setSuccess('');
    try {
      const res = await fetch(`/api/newsletter/campaigns/${id}/send`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSuccess(`${t.sendSuccess} (${json.data.sentCount} ${t.recipientsLabel})`);
        fetchCampaigns();
      } else setError(json.error || t.sendFailed);
    } catch { setError(t.sendFailed); }
    setSending(null);
  };

  const handleDelete = async (id: string) => {
    try {
      const res = await fetch(`/api/newsletter/campaigns/${id}`, { method: 'DELETE' });
      const json = await res.json();
      if (json.success) { setSuccess(t.deleteSuccess); fetchCampaigns(); }
      else setError(t.deleteFailed);
    } catch { setError(t.deleteFailed); }
    setDeleteId(null);
  };

  const align = isRTL ? 'text-right' : 'text-left';
  const alignEnd = isRTL ? 'text-left' : 'text-right';

  const statusBadge = (status: string) => {
    const styles: Record<string, string> = {
      DRAFT: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      SCHEDULED: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      SENDING: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      SENT: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      PAUSED: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      FAILED: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return (
      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.DRAFT}`}>
        {t.statusLabels[status as keyof typeof t.statusLabels] || status}
      </span>
    );
  };

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="pt-20">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className={`text-3xl font-bold tracking-tight ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.title}</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.subtitle}</p>
        </div>
        <div className="flex items-center gap-2">
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-xl border text-sm appearance-none cursor-pointer ${
              isDark ? 'bg-gray-800 border-gray-700 text-gray-200' : 'bg-white border-gray-200 text-gray-700'
            } focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
          >
            <option value="">{t.allStatuses}</option>
            <option value="DRAFT">{t.filterDraft}</option>
            <option value="SCHEDULED">{t.filterScheduled}</option>
            <option value="SENT">{t.filterSent}</option>
            <option value="FAILED">{t.filterFailed}</option>
          </select>
          <button
            onClick={fetchCampaigns}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            title={t.allStatuses}
          >
            <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <Link
            href="/admin/newsletter/campaigns/add"
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            <Plus className="w-4 h-4" /> {t.newCampaign}
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0" />
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl text-sm flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0" />
          {success}
        </div>
      )}

      <div className={`rounded-2xl border ${isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200/80'} shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className={`border-b ${isDark ? 'border-gray-700/50 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                <th className={`${align} py-3.5 px-4 font-semibold text-xs uppercase tracking-wider`}>{t.subject}</th>
                <th className={`${align} py-3.5 px-4 font-semibold text-xs uppercase tracking-wider`}>{t.status}</th>
                <th className={`${align} py-3.5 px-4 font-semibold text-xs uppercase tracking-wider`}>{t.recipients}</th>
                <th className={`${align} py-3.5 px-4 font-semibold text-xs uppercase tracking-wider`}>{t.openRate}</th>
                <th className={`${align} py-3.5 px-4 font-semibold text-xs uppercase tracking-wider`}>{t.clickRate}</th>
                <th className={`${align} py-3.5 px-4 font-semibold text-xs uppercase tracking-wider`}>{t.date}</th>
                <th className={`${alignEnd} py-3.5 px-4`}></th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`text-center py-16 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {t.noCampaigns}
                  </td>
                </tr>
              ) : campaigns.map(camp => {
                const dateStr = camp.sentAt
                  ? format(new Date(camp.sentAt), 'yyyy/MM/dd HH:mm', { locale: dateLocale })
                  : camp.scheduledAt
                    ? format(new Date(camp.scheduledAt), 'yyyy/MM/dd HH:mm', { locale: dateLocale })
                    : format(new Date(camp.createdAt), 'yyyy/MM/dd', { locale: dateLocale });
                return (
                  <tr
                    key={camp.id}
                    className={`border-b transition-colors ${
                      isDark ? 'border-gray-700/30 hover:bg-gray-700/20' : 'border-gray-100 hover:bg-gray-50/80'
                    }`}
                  >
                    <td className={`py-3.5 px-4 font-medium max-w-[180px] truncate ${isDark ? 'text-gray-200' : 'text-gray-800'}`} title={camp.subject}>
                      {camp.subject}
                      {camp.subjectEn && <span className={`block text-xs mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{camp.subjectEn}</span>}
                    </td>
                    <td className="py-3.5 px-4">{statusBadge(camp.status)}</td>
                    <td className={`py-3.5 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      <span className="font-semibold">{camp.totalRecipients}</span>
                      {camp.status === 'SENT' && (
                        <div className="flex items-center gap-1 mt-1 text-xs">
                          <span className="text-green-500">{camp.sentCount}</span>
                          <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>/</span>
                          <span className="text-red-500">{camp.failedCount}</span>
                        </div>
                      )}
                    </td>
                    <td className={`py-3.5 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {camp.status === 'SENT' ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-green-400 to-green-500 rounded-full transition-all"
                                style={{ width: `${camp.totalRecipients ? Math.round((camp.openCount / camp.totalRecipients) * 100) : 0}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {camp.totalRecipients ? Math.round((camp.openCount / camp.totalRecipients) * 100) : 0}%
                            </span>
                          </div>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{camp.openCount} {t.opened}</span>
                        </div>
                      ) : (
                        <span className="text-xs opacity-50">—</span>
                      )}
                    </td>
                    <td className={`py-3.5 px-4 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {camp.status === 'SENT' ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                              <div
                                className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all"
                                style={{ width: `${camp.totalRecipients ? Math.round((camp.clickCount / camp.totalRecipients) * 100) : 0}%` }}
                              />
                            </div>
                            <span className={`text-xs font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {camp.totalRecipients ? Math.round((camp.clickCount / camp.totalRecipients) * 100) : 0}%
                            </span>
                          </div>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{camp.clickCount} {t.clicks}</span>
                        </div>
                      ) : (
                        <span className="text-xs opacity-50">—</span>
                      )}
                    </td>
                    <td className={`py-3.5 px-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{dateStr}</td>
                    <td className={`py-3.5 px-4 ${alignEnd}`}>
                      <div className="flex items-center gap-1">
                        <Link
                          href={`/admin/newsletter/campaigns/${camp.id}`}
                          className={`p-1.5 rounded-lg transition-colors ${
                            isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                          }`}
                          title={t.view}
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {camp.status === 'DRAFT' && (
                          <>
                            <Link
                              href={`/admin/newsletter/campaigns/${camp.id}/edit`}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                              }`}
                              title={t.edit}
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleSend(camp.id)}
                              disabled={sending === camp.id}
                              className={`p-1.5 rounded-lg transition-colors ${
                                isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                              } ${sending === camp.id ? 'opacity-50 cursor-not-allowed' : ''}`}
                              title={t.send}
                            >
                              {sending === camp.id ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setDeleteId(camp.id)}
                              className="p-1.5 rounded-lg transition-colors hover:bg-red-50 dark:hover:bg-red-900/20 text-red-500"
                              title={t.delete}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {deleteId && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className={`rounded-2xl p-6 max-w-sm w-full shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>{t.deleteTitle}</h3>
            <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{t.deleteMessage}</p>
            <div className="flex gap-3">
              <button
                onClick={() => handleDelete(deleteId)}
                className="flex-1 px-4 py-2.5 bg-red-500 text-white rounded-xl hover:bg-red-600 text-sm font-medium transition-colors"
              >
                {t.delete}
              </button>
              <button
                onClick={() => setDeleteId(null)}
                className={`flex-1 px-4 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
                  isDark ? 'border-gray-700 text-gray-300 hover:bg-gray-700' : 'border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              >
                {t.cancel}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
