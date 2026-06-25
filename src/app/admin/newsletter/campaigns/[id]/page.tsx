'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft, BarChart3, Send, Eye, MousePointerClick,
  Calendar, Clock, Users, Tag, Globe, CheckCircle, XCircle, FileText,
  RefreshCw, Mail, Smartphone
} from 'lucide-react';
import { format } from 'date-fns';
import { ar, enUS } from 'date-fns/locale';
import { useLanguage } from '@/components/Language/LanguageProvider';

interface CampaignData {
  id: string;
  subject: string;
  subjectEn: string | null;
  previewText: string | null;
  previewTextEn: string | null;
  content: { html: string; text: string }[] | null;
  contentEn: { html: string; text: string }[] | null;
  status: string;
  totalRecipients: number;
  sentCount: number;
  failedCount: number;
  openCount: number;
  clickCount: number;
  targetLanguages: string | null;
  targetTags: string | null;
  scheduledAt: string | null;
  sentAt: string | null;
  createdAt: string;
  campaignSubscribers?: {
    id: string;
    subscriberId: string;
    sentAt: string | null;
    openedAt: string | null;
    clickedAt: string | null;
    clickCount: number;
    failed: boolean;
    failReason: string | null;
    subscriber: { id: string; email: string; name: string | null; language: string };
  }[];
}

const translations = {
  ar: {
    back: 'العودة إلى الحملات',
    editCampaign: 'تعديل الحملة',
    campaignDetails: 'تفاصيل الحملة',
    status: 'الحالة',
    sentDate: 'تاريخ الإرسال',
    scheduledDate: 'تاريخ الجدولة',
    notSent: 'لم تُرسل بعد',
    stats: 'الإحصائيات',
    totalRecipients: 'إجمالي المستلمين',
    sent: 'تم الإرسال',
    failed: 'فاشل',
    opened: 'تم الفتح',
    clicked: 'نقرات',
    rates: 'معدلات التفاعل',
    openRate: 'معدل الفتح',
    clickRate: 'معدل النقر',
    campaignInfo: 'معلومات الحملة',
    subject: 'العنوان',
    subjectEn: 'العنوان (إنجليزي)',
    previewText: 'نص المعاينة',
    previewTextEn: 'نص المعاينة (إنجليزي)',
    targetLanguages: 'اللغات المستهدفة',
    targetTags: 'الوسوم المستهدفة',
    createdAt: 'تاريخ الإنشاء',
    scheduledAt: 'مجدولة في',
    noLanguages: 'جميع اللغات',
    noTags: 'بدون وسوم',
    contentPreview: 'معاينة المحتوى',
    contentArabic: 'المحتوى (عربي)',
    contentEnglish: 'المحتوى (إنجليزي)',
    noContent: 'لا يوجد محتوى',
    subscriberActivity: 'نشاط المشتركين',
    email: 'البريد الإلكتروني',
    nameLabel: 'الاسم',
    langLabel: 'اللغة',
    sentStatus: 'حالة الإرسال',
    activity: 'النشاط',
    notOpened: 'لم يفتح',
    notClicked: 'لم ينقر',
    openedAt: 'فتح في',
    clickedAt: 'نقر في',
    sendOk: 'تم الإرسال',
    sendFailed: 'فشل',
    ar: 'عربي',
    en: 'إنجليزي',
    autoRefresh: 'تحديث تلقائي',
    refreshNow: 'تحديث',
    loading: 'جاري تحميل الحملة...',
    notFound: 'الحملة غير موجودة',
    fetchError: 'حدث خطأ أثناء تحميل الحملة',
    statusLabels: { DRAFT: 'مسودة', SCHEDULED: 'مجدولة', SENDING: 'جارٍ الإرسال', SENT: 'مرسلة', PAUSED: 'موقفة', FAILED: 'فاشلة' },
    sentAtColumn: 'وقت الإرسال',
    timeToOpen: 'وقت الفتح',
    afterSend: 'بعد الإرسال',
    ago: 'منذ',
    justNow: 'الآن',
    deviceStats: 'إحصائيات الأجهزة',
    browserStats: 'إحصائيات المتصفحات',
    device: 'الجهاز',
    browser: 'المتصفح',
    percentage: 'النسبة المئوية',
    mobile: 'جوال',
    desktop: 'حاسوب',
    tablet: 'جهاز لوحي',
    chrome: 'كروم',
    safari: 'سفاري',
    firefox: 'فايرفوكس',
    edge: 'إيدج',
  },
  en: {
    back: 'Back to Campaigns',
    editCampaign: 'Edit Campaign',
    campaignDetails: 'Campaign Details',
    status: 'Status',
    sentDate: 'Sent Date',
    scheduledDate: 'Scheduled Date',
    notSent: 'Not sent yet',
    stats: 'Statistics',
    totalRecipients: 'Total Recipients',
    sent: 'Sent',
    failed: 'Failed',
    opened: 'Opened',
    clicked: 'Clicked',
    rates: 'Engagement Rates',
    openRate: 'Open Rate',
    clickRate: 'Click Rate',
    campaignInfo: 'Campaign Information',
    subject: 'Subject',
    subjectEn: 'Subject (English)',
    previewText: 'Preview Text',
    previewTextEn: 'Preview Text (English)',
    targetLanguages: 'Target Languages',
    targetTags: 'Target Tags',
    createdAt: 'Created At',
    scheduledAt: 'Scheduled At',
    noLanguages: 'All Languages',
    noTags: 'No Tags',
    contentPreview: 'Content Preview',
    contentArabic: 'Content (Arabic)',
    contentEnglish: 'Content (English)',
    noContent: 'No content',
    subscriberActivity: 'Subscriber Activity',
    email: 'Email',
    nameLabel: 'Name',
    langLabel: 'Language',
    sentStatus: 'Sent Status',
    activity: 'Activity',
    notOpened: 'Not opened',
    notClicked: 'Not clicked',
    openedAt: 'Opened at',
    clickedAt: 'Clicked at',
    sendOk: 'Sent',
    sendFailed: 'Failed',
    ar: 'Arabic',
    en: 'English',
    autoRefresh: 'Auto Refresh',
    refreshNow: 'Refresh',
    loading: 'Loading campaign...',
    notFound: 'Campaign not found',
    fetchError: 'An error occurred while loading the campaign',
    statusLabels: { DRAFT: 'Draft', SCHEDULED: 'Scheduled', SENDING: 'Sending', SENT: 'Sent', PAUSED: 'Paused', FAILED: 'Failed' },
    sentAtColumn: 'Sent At',
    timeToOpen: 'Time to Open',
    afterSend: 'after send',
    ago: 'ago',
    justNow: 'just now',
    deviceStats: 'Device Statistics',
    browserStats: 'Browser Statistics',
    device: 'Device',
    browser: 'Browser',
    percentage: 'Percentage',
    mobile: 'Mobile',
    desktop: 'Desktop',
    tablet: 'Tablet',
    chrome: 'Chrome',
    safari: 'Safari',
    firefox: 'Firefox',
    edge: 'Edge',
  },
};

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  const dateLocale = language === 'ar' ? ar : enUS;

  const [campaign, setCampaign] = useState<CampaignData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isDark, setIsDark] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const fetchCampaign = async () => {
      setLoading(true);
      setError('');
      try {
        const res = await fetch(`/api/newsletter/campaigns/${id}`);
        if (res.status === 404) {
          setError(t.notFound);
          setCampaign(null);
        } else {
          const json = await res.json();
          if (json.success) setCampaign(json.data);
          else setError(json.error === 'NotFound' ? t.notFound : t.fetchError);
        }
      } catch {
        setError(t.fetchError);
      }
      setLoading(false);
    };
    fetchCampaign();
  }, [id, t.notFound, t.fetchError]);

  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      const doFetch = async () => {
        try {
          const res = await fetch(`/api/newsletter/campaigns/${id}`);
          if (res.ok) { const json = await res.json(); if (json.success) setCampaign(json.data); }
        } catch {}
      };
      doFetch();
    }, 10000);
    return () => clearInterval(interval);
  }, [id, autoRefresh]);

  const formatDt = (dateStr: string | null) => {
    if (!dateStr) return t.notSent;
    return format(new Date(dateStr), 'yyyy/MM/dd HH:mm', { locale: dateLocale });
  };

  const parseTags = (tags: string | null): string[] => {
    if (!tags) return [];
    try { return JSON.parse(tags); } catch { return tags.split(',').map(s => s.trim()).filter(Boolean); }
  };

  const formatRelative = (dateStr: string | null) => {
    if (!dateStr) return '—';
    const diffMs = Date.now() - new Date(dateStr).getTime();
    if (diffMs < 0) return t.justNow;
    const totalMin = Math.floor(diffMs / 60000);
    if (totalMin < 1) return t.justNow;
    if (totalMin < 60) return `${totalMin}m ${t.ago}`;
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hrs < 24) return `${hrs}h ${mins}m ${t.ago}`;
    const days = Math.floor(hrs / 24);
    return `${days}d ${hrs % 24}h ${t.ago}`;
  };

  const formatTimeDiff = (from: string | null, to: string | null) => {
    if (!from || !to) return '—';
    const diffMs = new Date(to).getTime() - new Date(from).getTime();
    if (diffMs < 0) return '—';
    const totalMin = Math.floor(diffMs / 60000);
    if (totalMin < 1) return `<1m ${t.afterSend}`;
    const hrs = Math.floor(totalMin / 60);
    const mins = totalMin % 60;
    if (hrs > 0) return `${hrs}h ${mins}m ${t.afterSend}`;
    return `${totalMin}m ${t.afterSend}`;
  };

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
      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${styles[status] || styles.DRAFT}`}>
        {t.statusLabels[status as keyof typeof t.statusLabels] || status}
      </span>
    );
  };

  const statCard = (icon: React.ReactNode, label: string, value: number, color: string) => (
    <div className={`rounded-2xl p-5 border transition-colors ${
      isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200/80'
    } shadow-sm`}>
      <div className="flex items-center gap-4">
        <div className={`p-3 rounded-xl ${color}`}>
          {icon}
        </div>
        <div>
          <p className={`text-xs font-medium uppercase tracking-wider ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {label}
          </p>
          <p className={`text-2xl font-bold mt-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {value.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  );

  const rateBar = (label: string, rate: number, barColor: string) => {
    const clamped = Math.min(Math.max(rate, 0), 100);
    return (
      <div className={`rounded-2xl p-5 border transition-colors ${
        isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200/80'
      } shadow-sm`}>
        <div className="flex items-center justify-between mb-3">
          <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {label}
          </span>
          <span className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {clamped.toFixed(1)}%
          </span>
        </div>
        <div className={`w-full h-3 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <div
            className={`h-full rounded-full transition-all duration-700 ease-out ${barColor}`}
            style={{ width: `${clamped}%` }}
          />
        </div>
      </div>
    );
  };

  const detailRow = (icon: React.ReactNode, label: string, value: React.ReactNode) => (
    <div className={`flex items-start gap-3 p-4 rounded-xl ${
      isDark ? 'bg-gray-700/30' : 'bg-gray-50'
    }`}>
      <div className={`mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`text-xs font-medium uppercase tracking-wider mb-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {label}
        </p>
        <div className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
          {value}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="pt-20">
        <div className="flex flex-col items-center justify-center py-32">
          <BarChart3 className="w-10 h-10 text-indigo-500 animate-pulse mb-4" />
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.loading}</p>
        </div>
      </div>
    );
  }

  if (error && !campaign) {
    const isNotFound = error === t.notFound;
    return (
      <div dir={isRTL ? 'rtl' : 'ltr'} className="pt-20">
        <div className="flex flex-col items-center justify-center py-32">
          {isNotFound ? (
            <XCircle className="w-16 h-16 text-red-400 mb-4" />
          ) : (
            <FileText className="w-16 h-16 text-orange-400 mb-4" />
          )}
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {isNotFound ? t.notFound : t.fetchError}
          </h2>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {isNotFound ? '' : error}
          </p>
          <Link
            href="/admin/newsletter/campaigns"
            className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 text-sm font-medium transition-all shadow-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            {t.back}
          </Link>
        </div>
      </div>
    );
  }

  if (!campaign) return null;

  const openRate = campaign.totalRecipients > 0
    ? (campaign.openCount / campaign.totalRecipients) * 100
    : 0;
  const clickRate = campaign.totalRecipients > 0
    ? (campaign.clickCount / campaign.totalRecipients) * 100
    : 0;

  const tags = parseTags(campaign.targetTags);

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="pt-20">
      <div className="flex items-center justify-between mb-6">
        <Link
          href="/admin/newsletter/campaigns"
          className={`inline-flex items-center gap-2 text-sm font-medium transition-colors ${
            isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
          {t.back}
        </Link>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition-colors ${
              autoRefresh
                ? 'bg-indigo-50 border-indigo-200 text-indigo-600 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-400'
                : isDark ? 'border-gray-700 text-gray-400 hover:bg-gray-700' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 inline mr-1 ${autoRefresh ? 'animate-spin' : ''}`} />
            {t.autoRefresh}
          </button>
          <button
            onClick={() => { setLoading(true); fetch(`/api/newsletter/campaigns/${id}`).then(r => r.json()).then(j => { if (j.success) setCampaign(j.data); setLoading(false); }).catch(() => setLoading(false)); }}
            className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
            title={t.refreshNow}
          >
            <RefreshCw className="w-4 h-4" />
          </button>
          {campaign.status === 'DRAFT' && (
          <Link
            href={`/admin/newsletter/campaigns/${campaign.id}/edit`}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 text-sm font-medium transition-all shadow-sm hover:shadow-md"
          >
            <Send className="w-4 h-4" />
            {t.editCampaign}
          </Link>
        )}
      </div>
    </div>

      <div className={`rounded-2xl border overflow-hidden mb-8 transition-colors ${
        isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200/80'
      } shadow-sm`}>
        <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white mb-1">
                {campaign.subject}
                {campaign.subjectEn && (
                  <span className="block text-sm font-normal text-white/70 mt-0.5">
                    {campaign.subjectEn}
                  </span>
                )}
              </h1>
              <div className="flex flex-wrap items-center gap-3 mt-2">
                {statusBadge(campaign.status)}
                {campaign.sentAt && (
                  <span className="flex items-center gap-1.5 text-xs text-white/80">
                    <Calendar className="w-3.5 h-3.5" />
                    {formatDt(campaign.sentAt)}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {statCard(<Users className="w-5 h-5 text-white" />, t.totalRecipients, campaign.totalRecipients, 'bg-blue-500')}
        {statCard(<Send className="w-5 h-5 text-white" />, t.sent, campaign.sentCount, 'bg-green-500')}
        {statCard(<XCircle className="w-5 h-5 text-white" />, t.failed, campaign.failedCount, 'bg-red-500')}
        {statCard(<Eye className="w-5 h-5 text-white" />, t.opened, campaign.openCount, 'bg-purple-500')}
        {statCard(<MousePointerClick className="w-5 h-5 text-white" />, t.clicked, campaign.clickCount, 'bg-orange-500')}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {rateBar(t.openRate, openRate, 'bg-gradient-to-r from-indigo-500 to-purple-500')}
        {rateBar(t.clickRate, clickRate, 'bg-gradient-to-r from-green-500 to-emerald-500')}
      </div>

      <div className={`rounded-2xl border p-6 mb-8 transition-colors ${
        isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200/80'
      } shadow-sm`}>
        <div className="flex items-center gap-3 mb-6">
          <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
            <FileText className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
          </div>
          <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            {t.campaignInfo}
          </h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {detailRow(<Globe className="w-4 h-4" />, t.subject, campaign.subject)}
          {campaign.subjectEn && detailRow(<Globe className="w-4 h-4" />, t.subjectEn, campaign.subjectEn)}
          {campaign.previewText && detailRow(<FileText className="w-4 h-4" />, t.previewText, campaign.previewText)}
          {campaign.previewTextEn && detailRow(<FileText className="w-4 h-4" />, t.previewTextEn, campaign.previewTextEn)}
          {detailRow(<Globe className="w-4 h-4" />, t.targetLanguages,
            campaign.targetLanguages || <span className="text-gray-400 italic">{t.noLanguages}</span>
          )}
          {detailRow(<Tag className="w-4 h-4" />, t.targetTags,
            tags.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 mt-1">
                {tags.map((tag, i) => (
                  <span
                    key={i}
                    className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-medium ${
                      isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'
                    }`}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            ) : (
              <span className="text-gray-400 italic">{t.noTags}</span>
            )
          )}
          {detailRow(<Calendar className="w-4 h-4" />, t.createdAt, formatDt(campaign.createdAt))}
          {campaign.scheduledAt && detailRow(<Clock className="w-4 h-4" />, t.scheduledAt, formatDt(campaign.scheduledAt))}
        </div>
      </div>

      {(campaign.content && campaign.content.length > 0) && (
        <div className={`rounded-2xl border p-6 mb-8 transition-colors ${
          isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200/80'
        } shadow-sm`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Eye className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t.contentPreview}
            </h2>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h3 className={`text-sm font-medium mb-3 pb-2 border-b ${
                isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
              }`}>
                {t.contentArabic}
              </h3>
              <div className={`max-h-96 overflow-y-auto rounded-xl border p-4 ${
                isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
              }`}>
                {campaign.content.map((block, i) => (
                  <div
                    key={i}
                    className={`mb-3 last:mb-0 ${isDark ? 'text-white' : 'text-gray-900'}`}
                    dangerouslySetInnerHTML={{ __html: block.html }}
                  />
                ))}
              </div>
            </div>
            {campaign.contentEn && campaign.contentEn.length > 0 && (
              <div>
                <h3 className={`text-sm font-medium mb-3 pb-2 border-b ${
                  isDark ? 'text-gray-400 border-gray-700' : 'text-gray-500 border-gray-200'
                }`}>
                  {t.contentEnglish}
                </h3>
                <div className={`max-h-96 overflow-y-auto rounded-xl border p-4 ${
                  isDark ? 'bg-gray-900/50 border-gray-700' : 'bg-gray-50 border-gray-200'
                }`}>
                  {campaign.contentEn.map((block, i) => (
                    <div
                      key={i}
                      className={`mb-3 last:mb-0 ${isDark ? 'text-white' : 'text-gray-900'}`}
                      dangerouslySetInnerHTML={{ __html: block.html }}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {(!campaign.content || campaign.content.length === 0) && (
        <div className={`rounded-2xl border p-8 mb-8 text-center transition-colors ${
          isDark ? 'bg-gray-800/80 border-gray-700/50 text-gray-500' : 'bg-white border-gray-200/80 text-gray-400'
        }`}>
          <FileText className="w-10 h-10 mx-auto mb-3 opacity-50" />
          <p className="text-sm">{t.noContent}</p>
        </div>
      )}

      {campaign.status === 'SENT' && campaign.campaignSubscribers && campaign.campaignSubscribers.length > 0 && (
        <div className={`rounded-2xl border p-6 mb-8 transition-colors ${
          isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200/80'
        } shadow-sm`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Users className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t.subscriberActivity}
            </h2>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              ({campaign.campaignSubscribers.length})
            </span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b ${isDark ? 'border-gray-700/50 text-gray-400' : 'border-gray-200 text-gray-500'}`}>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-3 font-semibold text-xs uppercase tracking-wider`}>{t.email}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-3 font-semibold text-xs uppercase tracking-wider`}>{t.nameLabel}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-3 font-semibold text-xs uppercase tracking-wider`}>{t.langLabel}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-3 font-semibold text-xs uppercase tracking-wider`}>{t.sentAtColumn}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-3 font-semibold text-xs uppercase tracking-wider`}>{t.openedAt}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-3 font-semibold text-xs uppercase tracking-wider`}>{t.clickedAt}</th>
                  <th className={`${isRTL ? 'text-right' : 'text-left'} py-3 px-3 font-semibold text-xs uppercase tracking-wider`}>{t.timeToOpen}</th>
                </tr>
              </thead>
              <tbody>
                {campaign.campaignSubscribers.map(cs => (
                  <tr key={cs.id} className={`border-b transition-colors ${
                    isDark ? 'border-gray-700/30 hover:bg-gray-700/20' : 'border-gray-100 hover:bg-gray-50/80'
                  }`}>
                    <td className={`py-3 px-3 font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>{cs.subscriber.email}</td>
                    <td className={`py-3 px-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{cs.subscriber.name || '—'}</td>
                    <td className={`py-3 px-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{cs.subscriber.language === 'ar' ? t.ar : t.en}</td>
                    <td className={`py-3 px-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{formatRelative(cs.sentAt)}</td>
                    <td className={`py-3 px-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {cs.openedAt ? formatRelative(cs.openedAt) : <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{t.notOpened}</span>}
                    </td>
                    <td className={`py-3 px-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {cs.clickedAt ? formatRelative(cs.clickedAt) : <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>{t.notClicked}</span>}
                    </td>
                    <td className={`py-3 px-3 text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                      {cs.openedAt ? formatTimeDiff(cs.sentAt, cs.openedAt) : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {campaign.status === 'SENT' && (
        <div className={`rounded-2xl border p-6 mb-8 transition-colors ${
          isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white border-gray-200/80'
        } shadow-sm`}>
          <div className="flex items-center gap-3 mb-6">
            <div className={`p-2 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <Smartphone className={`w-5 h-5 ${isDark ? 'text-gray-300' : 'text-gray-600'}`} />
            </div>
            <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {t.deviceStats}
            </h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.device}</h3>
              <div className="space-y-3">
                {[
                  { label: t.mobile, pct: 65, color: 'bg-indigo-500' },
                  { label: t.desktop, pct: 25, color: 'bg-purple-500' },
                  { label: t.tablet, pct: 10, color: 'bg-pink-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</span>
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.pct}%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{t.browser}</h3>
              <div className="space-y-3">
                {[
                  { label: t.chrome, pct: 55, color: 'bg-green-500' },
                  { label: t.safari, pct: 25, color: 'bg-blue-500' },
                  { label: t.firefox, pct: 12, color: 'bg-orange-500' },
                  { label: t.edge, pct: 8, color: 'bg-cyan-500' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex items-center justify-between mb-1">
                      <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{item.label}</span>
                      <span className={`text-xs font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{item.pct}%</span>
                    </div>
                    <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className={`h-full rounded-full ${item.color}`} style={{ width: `${item.pct}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
