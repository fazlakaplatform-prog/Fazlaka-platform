'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';

function PreferencesForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email') || '';
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [language, setLanguage] = useState('ar');
  const [tags, setTags] = useState('');
  const [isRTL, setIsRTL] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const savedLang = localStorage.getItem('language');
    setIsRTL(savedLang !== 'en');
  }, []);

  useEffect(() => {
    if (!email) { setLoading(false); return; }
    fetch(`/api/newsletter/preferences?email=${encodeURIComponent(email)}`)
      .then(r => r.json())
      .then(json => {
        if (json.success) {
          setName(json.data.name || '');
          setLanguage(json.data.language);
          setTags(Array.isArray(json.data.tags) ? json.data.tags.join(', ') : '');
        }
      })
      .catch(() => setError('فشل تحميل التفضيلات'))
      .finally(() => setLoading(false));
  }, [email]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/newsletter/preferences', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, name, language, tags: tags.split(',').map(t => t.trim()).filter(Boolean) }),
      });
      const json = await res.json();
      if (json.success) router.push('/?preferences=updated');
    } catch { setError('حدث خطأ') }
    setSaving(false);
  };

  const handleUnsubscribe = async () => {
    try {
      await fetch('/api/newsletter/unsubscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      router.push('/newsletter/unsubscribe?success=true');
    } catch { setError('حدث خطأ') }
  };

  const t = isRTL ? {
    title: 'تفضيلات النشرة البريدية',
    nameLabel: 'الاسم',
    langLabel: 'اللغة',
    tagsLabel: 'الوسوم',
    save: 'حفظ التغييرات',
    unsubscribe: 'إلغاء الاشتراك',
    back: 'العودة للرئيسية',
    loading: 'جاري التحميل...',
  } : {
    title: 'Newsletter Preferences',
    nameLabel: 'Name',
    langLabel: 'Language',
    tagsLabel: 'Tags',
    save: 'Save Changes',
    unsubscribe: 'Unsubscribe',
    back: 'Back to Home',
    loading: 'Loading...',
  };

  if (!email) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900" dir={isRTL ? 'rtl' : 'ltr'}>
      <p className="text-gray-500">الرابط غير صالح</p>
    </div>
  );

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4" dir={isRTL ? 'rtl' : 'ltr'}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
      >
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{t.title}</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">{email}</p>

        {loading ? (
          <p className="text-center text-gray-400 py-8">{t.loading}</p>
        ) : (
          <div className="space-y-5">
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.nameLabel}</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.langLabel}</label>
              <select value={language} onChange={e => setLanguage(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                <option value="ar">العربية</option>
                <option value="en">English</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.tagsLabel}</label>
              <input type="text" value={tags} onChange={e => setTags(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" placeholder="tag1, tag2" />
            </div>

            <div className="flex gap-3">
              <button onClick={handleSave} disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-sm font-medium">
                {saving ? '...' : t.save}
              </button>
              <button onClick={handleUnsubscribe} className="px-4 py-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl text-sm font-medium border border-red-200 dark:border-red-800">
                {t.unsubscribe}
              </button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}

export default function PreferencesPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <PreferencesForm />
    </Suspense>
  );
}
