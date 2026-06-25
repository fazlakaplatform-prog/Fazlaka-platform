'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowRight, Save, AlertCircle } from 'lucide-react';

export default function EditSubscriberPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ email: '', name: '', status: 'ACTIVE', language: 'ar', tags: '' });

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const fetchSub = async () => {
      try {
        const res = await fetch(`/api/newsletter/subscribers/${id}`);
        const json = await res.json();
        if (json.success) {
          setForm({
            email: json.data.email,
            name: json.data.name || '',
            status: json.data.status,
            language: json.data.language,
            tags: Array.isArray(json.data.tags) ? json.data.tags.join(', ') : '',
          });
        } else setError('المشترك غير موجود');
      } catch { setError('خطأ في التحميل'); }
      setLoading(false);
    };
    fetchSub();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/newsletter/subscribers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || null,
          status: form.status,
          language: form.language,
          tags: form.tags.split(',').map(t => t.trim()).filter(Boolean),
        }),
      });
      const json = await res.json();
      if (json.success) router.push('/admin/newsletter/subscribers');
      else setError('فشل الحفظ');
    } catch { setError('خطأ في الحفظ'); }
    setSaving(false);
  };

  if (loading) return <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>جاري التحميل...</div>;
  if (error && !form.email) return <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{error}</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <button onClick={() => router.back()} className={`flex items-center gap-2 mb-6 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
        <ArrowRight className="w-4 h-4" /> رجوع
      </button>

      <h1 className={`text-2xl font-bold mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>تعديل المشترك</h1>
      <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{form.email}</p>

      {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}

      <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
        <div className="space-y-5">
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>الاسم</label>
            <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`} placeholder="الاسم (اختياري)" />
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>الحالة</label>
            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
              <option value="ACTIVE">نشط</option>
              <option value="UNSUBSCRIBED">ملغي</option>
              <option value="BOUNCED">مرتد</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>اللغة</label>
            <select value={form.language} onChange={e => setForm({ ...form, language: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`}>
              <option value="ar">العربية</option>
              <option value="en">English</option>
            </select>
          </div>
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>الوسوم (مفصولة بفواصل)</label>
            <input type="text" value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} className={`w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`} placeholder="tag1, tag2, tag3" />
          </div>
        </div>

        <div className="flex gap-3 mt-8">
          <button onClick={handleSave} disabled={saving} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-sm font-medium transition-all">
            <Save className="w-4 h-4" /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
          </button>
        </div>
      </div>
    </div>
  );
}
