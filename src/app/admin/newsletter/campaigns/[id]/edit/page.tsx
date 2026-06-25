'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowRight, Plus, Trash2, Send, BarChart3 } from 'lucide-react';

export default function EditCampaignPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isDark, setIsDark] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [form, setForm] = useState({
    subject: '',
    subjectEn: '',
    previewText: '',
    previewTextEn: '',
    targetLanguages: '',
    targetTags: '',
    scheduledAt: '',
    status: 'DRAFT',
  });
  const [blocks, setBlocks] = useState<{ html: string; text: string }[]>([]);
  const [blocksEn, setBlocksEn] = useState<{ html: string; text: string }[]>([]);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    const fetchCamp = async () => {
      try {
        const res = await fetch(`/api/newsletter/campaigns/${id}`);
        const json = await res.json();
        if (json.success) {
          const d = json.data;
          setForm({
            subject: d.subject,
            subjectEn: d.subjectEn || '',
            previewText: d.previewText || '',
            previewTextEn: d.previewTextEn || '',
            targetLanguages: d.targetLanguages || '',
            targetTags: Array.isArray(d.targetTags) ? d.targetTags.join(', ') : '',
            scheduledAt: d.scheduledAt ? d.scheduledAt.slice(0, 16) : '',
            status: d.status,
          });
          setBlocks(Array.isArray(d.content) ? d.content : []);
          setBlocksEn(Array.isArray(d.contentEn) ? d.contentEn : []);
        } else setError('الحملة غير موجودة');
      } catch { setError('خطأ في التحميل'); }
      setLoading(false);
    };
    fetchCamp();
  }, [id]);

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await fetch(`/api/newsletter/campaigns/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subject: form.subject,
          subjectEn: form.subjectEn || undefined,
          previewText: form.previewText || undefined,
          previewTextEn: form.previewTextEn || undefined,
          content: blocks.filter(b => b.html || b.text),
          contentEn: blocksEn.filter(b => b.html || b.text).length > 0 ? blocksEn.filter(b => b.html || b.text) : undefined,
          targetTags: form.targetTags ? form.targetTags.split(',').map((t: string) => t.trim()).filter(Boolean) : [],
          targetLanguages: form.targetLanguages || undefined,
          scheduledAt: form.scheduledAt || null,
        }),
      });
      const json = await res.json();
      if (json.success) { setSuccess('تم الحفظ'); }
      else setError(json.error || 'فشل الحفظ');
    } catch { setError('خطأ في الحفظ'); }
    setSaving(false);
  };

  const handleSend = async () => {
    setSending(true);
    setError('');
    try {
      const res = await fetch(`/api/newsletter/campaigns/${id}/send`, { method: 'POST' });
      const json = await res.json();
      if (json.success) {
        setSuccess(`تم الإرسال بنجاح (${json.data.sentCount} مستلم)`);
        setForm(f => ({ ...f, status: 'SENT' }));
      } else setError(json.error || 'فشل الإرسال');
    } catch { setError('فشل الإرسال'); }
    setSending(false);
  };

  const addBlock = (lang: 'ar' | 'en') => {
    if (lang === 'ar') setBlocks([...blocks, { html: '', text: '' }]);
    else setBlocksEn([...blocksEn, { html: '', text: '' }]);
  };

  const removeBlock = (index: number, lang: 'ar' | 'en') => {
    if (lang === 'ar') setBlocks(blocks.filter((_, i) => i !== index));
    else setBlocksEn(blocksEn.filter((_, i) => i !== index));
  };

  const updateBlock = (index: number, field: 'html' | 'text', value: string, lang: 'ar' | 'en') => {
    if (lang === 'ar') {
      const nb = [...blocks]; nb[index] = { ...nb[index], [field]: value }; setBlocks(nb);
    } else {
      const nb = [...blocksEn]; nb[index] = { ...nb[index], [field]: value }; setBlocksEn(nb);
    }
  };

  const inputClass = `w-full px-4 py-2.5 rounded-xl border text-sm ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-indigo-500`;
  const labelClass = `block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`;

  if (loading) return <div className={`text-center py-20 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>جاري التحميل...</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={() => router.back()} className={`flex items-center gap-2 mb-6 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}>
        <ArrowRight className="w-4 h-4" /> رجوع
      </button>

      <div className="flex items-center justify-between mb-8">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>تعديل الحملة</h1>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${form.status === 'SENT' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'}`}>
          {form.status === 'SENT' ? 'مرسلة' : 'مسودة'}
        </span>
      </div>

      {error && <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">{error}</div>}
      {success && <div className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 rounded-xl text-sm">{success}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>العربية</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>العنوان *</label>
              <input type="text" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>نص المعاينة</label>
              <input type="text" value={form.previewText} onChange={e => setForm({ ...form, previewText: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>المحتوى</label>
                <button onClick={() => addBlock('ar')} className="flex items-center gap-1 text-xs text-indigo-500"><Plus className="w-3 h-3" /> إضافة</button>
              </div>
              {blocks.map((block, i) => (
                <div key={i} className={`p-3 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>فقرة {i + 1}</span>
                    {blocks.length > 1 && <button onClick={() => removeBlock(i, 'ar')} className="text-red-400"><Trash2 className="w-3 h-3" /></button>}
                  </div>
                  <textarea value={block.html} onChange={e => updateBlock(i, 'html', e.target.value, 'ar')} rows={3} className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${isDark ? 'bg-gray-900 border-gray-600 text-green-400' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-1 focus:ring-indigo-500`} />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm`}>
          <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>English</h2>
          <div className="space-y-4">
            <div>
              <label className={labelClass}>Subject</label>
              <input type="text" value={form.subjectEn} onChange={e => setForm({ ...form, subjectEn: e.target.value })} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Preview Text</label>
              <input type="text" value={form.previewTextEn} onChange={e => setForm({ ...form, previewTextEn: e.target.value })} className={inputClass} />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>Content</label>
                <button onClick={() => addBlock('en')} className="flex items-center gap-1 text-xs text-indigo-500"><Plus className="w-3 h-3" /> Add</button>
              </div>
              {blocksEn.map((block, i) => (
                <div key={i} className={`p-3 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Block {i + 1}</span>
                    {blocksEn.length > 1 && <button onClick={() => removeBlock(i, 'en')} className="text-red-400"><Trash2 className="w-3 h-3" /></button>}
                  </div>
                  <textarea value={block.html} onChange={e => updateBlock(i, 'html', e.target.value, 'en')} rows={3} className={`w-full px-3 py-2 rounded-lg border text-sm font-mono ${isDark ? 'bg-gray-900 border-gray-600 text-green-400' : 'bg-gray-50 border-gray-200 text-gray-900'} focus:outline-none focus:ring-1 focus:ring-indigo-500`} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`rounded-2xl p-6 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-100'} border shadow-sm mb-8`}>
        <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>إعدادات متقدمة</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className={labelClass}>الوسوم المستهدفة</label>
            <input type="text" value={form.targetTags} onChange={e => setForm({ ...form, targetTags: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>اللغة المستهدفة</label>
            <input type="text" value={form.targetLanguages} onChange={e => setForm({ ...form, targetLanguages: e.target.value })} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>جدولة الإرسال</label>
            <input type="datetime-local" value={form.scheduledAt} onChange={e => setForm({ ...form, scheduledAt: e.target.value })} className={inputClass} />
          </div>
        </div>
      </div>

      <div className="flex gap-3">
        {form.status !== 'SENT' && (
          <>
            <button onClick={handleSave} disabled={saving || !form.subject} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-sm font-medium">
              <Save className="w-4 h-4" /> {saving ? 'جاري الحفظ...' : 'حفظ التغييرات'}
            </button>
            <button onClick={handleSend} disabled={sending} className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-sm font-medium">
              <Send className="w-4 h-4" /> {sending ? 'جارٍ الإرسال...' : 'إرسال الآن'}
            </button>
          </>
        )}
        {form.status === 'SENT' && (
          <div className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
            <BarChart3 className="w-4 h-4" /> تم إرسال هذه الحملة
          </div>
        )}
      </div>
    </div>
  );
}
