'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Save, ArrowRight, Plus, Trash2, X } from 'lucide-react';
import { useLanguage } from '@/components/Language/LanguageProvider';

const translations = {
  ar: {
    back: 'رجوع',
    title: 'حملة بريدية جديدة',
    arabic: 'العربية',
    english: 'English',
    subject: 'العنوان *',
    subjectPlaceholder: 'عنوان البريد الإلكتروني',
    subjectEn: 'Subject *',
    subjectEnPlaceholder: 'Email subject',
    previewText: 'نص المعاينة',
    previewTextPlaceholder: 'نص يظهر قبل فتح البريد',
    previewTextEn: 'Preview Text',
    previewTextEnPlaceholder: 'Preview text',
    content: 'محتوى البريد',
    contentEn: 'Content',
    addBlock: 'إضافة فقرة',
    addBlockEn: 'Add block',
    block: 'فقرة',
    blockEn: 'Block',
    htmlPlaceholder: 'HTML',
    advanced: 'إعدادات متقدمة',
    targetTags: 'الوسوم المستهدفة',
    targetTagsHint: 'اكتب واضغط Enter لإضافة وسم',
    targetLanguages: 'اللغة المستهدفة',
    targetLanguagesHint: 'أرسل للغات محددة فقط',
    schedule: 'جدولة الإرسال',
    saveDraft: 'حفظ كمسودة',
    saveAndSend: 'حفظ وإرسال',
    saving: 'جاري الحفظ...',
    errorSave: 'خطأ في الحفظ',
    errorSend: 'فشل الإرسال',
    errorGeneric: 'فشل الحفظ',
    selectLanguages: 'اختر اللغة/اللغات',
  },
  en: {
    back: 'Back',
    title: 'New Email Campaign',
    arabic: 'العربية',
    english: 'English',
    subject: 'Subject *',
    subjectPlaceholder: 'Email subject',
    subjectEn: 'Subject (English) *',
    subjectEnPlaceholder: 'Email subject (English)',
    previewText: 'Preview Text',
    previewTextPlaceholder: 'Preview text',
    previewTextEn: 'Preview Text (English)',
    previewTextEnPlaceholder: 'Preview text (English)',
    content: 'Content',
    contentEn: 'Content (English)',
    addBlock: 'Add block',
    addBlockEn: 'Add block (English)',
    block: 'Block',
    blockEn: 'Block',
    htmlPlaceholder: 'HTML',
    advanced: 'Advanced Settings',
    targetTags: 'Target Tags',
    targetTagsHint: 'Type and press Enter to add a tag',
    targetLanguages: 'Target Languages',
    targetLanguagesHint: 'Send to specific languages only',
    schedule: 'Schedule',
    saveDraft: 'Save as Draft',
    saveAndSend: 'Save & Send',
    saving: 'Saving...',
    errorSave: 'Error saving campaign',
    errorSend: 'Failed to send',
    errorGeneric: 'Save error',
    selectLanguages: 'Select language(s)',
  },
};

export default function AddCampaignPage() {
  const router = useRouter();
  const { isRTL, language } = useLanguage();
  const t = translations[language];
  const [isDark, setIsDark] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    subject: '',
    subjectEn: '',
    previewText: '',
    previewTextEn: '',
    targetLanguages: [] as string[],
    targetTags: '',
    scheduledAt: '',
  });
  const [blocks, setBlocks] = useState<{ html: string; text: string }[]>([{ html: '<p style="font-size:16px;line-height:1.8;color:#555">مرحباً {{NAME}}،</p>', text: '' }]);
  const [blocksEn, setBlocksEn] = useState<{ html: string; text: string }[]>([{ html: '<p style="font-size:16px;line-height:1.8;color:#555">Hello {{NAME}},</p>', text: '' }]);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const tagInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkDark = () => setIsDark(document.documentElement.classList.contains('dark'));
    checkDark();
    const obs = new MutationObserver(checkDark);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const handleSave = async (sendAfter = false) => {
    setSaving(true);
    setError('');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const payload: Record<string, any> = {
      subject: form.subject,
      subjectEn: form.subjectEn || undefined,
      previewText: form.previewText || undefined,
      previewTextEn: form.previewTextEn || undefined,
      content: blocks.filter(b => b.html || b.text),
      contentEn: blocksEn.filter(b => b.html || b.text).length > 0 ? blocksEn.filter(b => b.html || b.text) : undefined,
      targetTags: tags.length > 0 ? tags : undefined,
      targetLanguages: form.targetLanguages.length > 0 ? form.targetLanguages.join(',') : undefined,
    };
    if (form.scheduledAt) payload.scheduledAt = form.scheduledAt;

    try {
      const res = await fetch('/api/newsletter/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const json = await res.json();
      if (json.success) {
        if (sendAfter) {
          const sendRes = await fetch(`/api/newsletter/campaigns/${json.data.id}/send`, { method: 'POST' });
          const sendJson = await sendRes.json();
          if (sendJson.success) {
            router.push('/admin/newsletter/campaigns');
            return;
          }
          setError(sendJson.error || t.errorSend);
        } else {
          router.push('/admin/newsletter/campaigns');
        }
      } else setError(json.error || t.errorGeneric);
    } catch { setError(t.errorSave); }
    setSaving(false);
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
      const newBlocks = [...blocks];
      newBlocks[index] = { ...newBlocks[index], [field]: value };
      setBlocks(newBlocks);
    } else {
      const newBlocks = [...blocksEn];
      newBlocks[index] = { ...newBlocks[index], [field]: value };
      setBlocksEn(newBlocks);
    }
  };

  const addTag = () => {
    const trimmed = tagInput.trim();
    if (trimmed && !tags.includes(trimmed)) {
      setTags([...tags, trimmed]);
    }
    setTagInput('');
  };

  const removeTag = (index: number) => {
    setTags(tags.filter((_, i) => i !== index));
  };

  const handleTagKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  };

  const handleLanguageSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = Array.from(e.target.selectedOptions, opt => opt.value);
    setForm({ ...form, targetLanguages: selected });
  };

  const baseInputClass = `w-full px-4 py-2.5 rounded-xl border text-sm transition-colors duration-150 ${
    isDark
      ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400'
      : 'bg-white border-gray-200 text-gray-900'
  } focus:outline-none focus:ring-2 focus:ring-indigo-500`;

  const inputClass = `${baseInputClass} ${
    isRTL ? 'text-right' : 'text-left'
  }`;

  const labelClass = `block text-sm font-medium mb-2 ${
    isDark ? 'text-gray-300' : 'text-gray-700'
  } ${isRTL ? 'text-right' : 'text-left'}`;

  const cardClass = `rounded-2xl p-6 border shadow-sm transition-colors duration-200 ${
    isDark ? 'bg-gray-800/90 border-gray-700' : 'bg-white border-gray-100'
  }`;

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'} className="pt-20 max-w-5xl mx-auto">
      <button
        onClick={() => router.back()}
        className={`flex items-center gap-2 mb-6 transition-colors ${
          isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
        } ${isRTL ? 'flex-row-reverse' : ''}`}
      >
        <ArrowRight className={`w-4 h-4 ${isRTL ? 'rotate-180' : ''}`} />
        {t.back}
      </button>

      <h1 className={`text-3xl font-bold mb-8 bg-gradient-to-r from-indigo-500 to-purple-600 bg-clip-text text-transparent`}>
        {t.title}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 rounded-xl text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className={cardClass}>
          <h2 className={`text-lg font-semibold mb-5 pb-3 border-b ${
            isDark ? 'text-white border-gray-700' : 'text-gray-900 border-gray-100'
          }`}>
            {t.arabic}
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>{t.subject}</label>
              <input
                type="text"
                value={form.subject}
                onChange={e => setForm({ ...form, subject: e.target.value })}
                className={inputClass}
                placeholder={t.subjectPlaceholder}
              />
            </div>
            <div>
              <label className={labelClass}>{t.previewText}</label>
              <input
                type="text"
                value={form.previewText}
                onChange={e => setForm({ ...form, previewText: e.target.value })}
                className={inputClass}
                placeholder={t.previewTextPlaceholder}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>{t.content}</label>
                <button
                  onClick={() => addBlock('ar')}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {t.addBlock}
                </button>
              </div>
              {blocks.map((block, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border relative transition-colors ${
                    isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {t.block} {i + 1}
                    </span>
                    {blocks.length > 1 && (
                      <button
                        onClick={() => removeBlock(i, 'ar')}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={block.html}
                    onChange={e => updateBlock(i, 'html', e.target.value, 'ar')}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${
                      isDark
                        ? 'bg-gray-950 border-gray-600 text-green-400'
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    placeholder={t.htmlPlaceholder}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className={cardClass}>
          <h2 className={`text-lg font-semibold mb-5 pb-3 border-b ${
            isDark ? 'text-white border-gray-700' : 'text-gray-900 border-gray-100'
          }`}>
            {t.english}
          </h2>
          <div className="space-y-5">
            <div>
              <label className={labelClass}>{t.subjectEn}</label>
              <input
                type="text"
                value={form.subjectEn}
                onChange={e => setForm({ ...form, subjectEn: e.target.value })}
                className={inputClass}
                placeholder={t.subjectEnPlaceholder}
              />
            </div>
            <div>
              <label className={labelClass}>{t.previewTextEn}</label>
              <input
                type="text"
                value={form.previewTextEn}
                onChange={e => setForm({ ...form, previewTextEn: e.target.value })}
                className={inputClass}
                placeholder={t.previewTextEnPlaceholder}
              />
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelClass}>{t.contentEn}</label>
                <button
                  onClick={() => addBlock('en')}
                  className="flex items-center gap-1 text-xs font-medium text-indigo-500 hover:text-indigo-400 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  {t.addBlockEn}
                </button>
              </div>
              {blocksEn.map((block, i) => (
                <div
                  key={i}
                  className={`p-4 rounded-xl border relative transition-colors ${
                    isDark ? 'border-gray-700 bg-gray-900/50' : 'border-gray-200 bg-gray-50/50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {t.blockEn} {i + 1}
                    </span>
                    {blocksEn.length > 1 && (
                      <button
                        onClick={() => removeBlock(i, 'en')}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                  <textarea
                    value={block.html}
                    onChange={e => updateBlock(i, 'html', e.target.value, 'en')}
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border text-sm font-mono transition-colors ${
                      isDark
                        ? 'bg-gray-950 border-gray-600 text-green-400'
                        : 'bg-white border-gray-200 text-gray-900'
                    } focus:outline-none focus:ring-1 focus:ring-indigo-500`}
                    placeholder={t.htmlPlaceholder}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className={`${cardClass} mb-8`}>
        <h2 className={`text-lg font-semibold mb-5 pb-3 border-b ${
          isDark ? 'text-white border-gray-700' : 'text-gray-900 border-gray-100'
        }`}>
          {t.advanced}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label className={labelClass}>{t.targetTags}</label>
            <div
              className={`flex flex-wrap gap-1.5 p-2 rounded-xl border min-h-[42px] transition-colors ${
                isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
              }`}
              onClick={() => tagInputRef.current?.focus()}
            >
              {tags.map((tag, i) => (
                <span
                  key={i}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-colors ${
                    isDark
                      ? 'bg-indigo-500/20 text-indigo-300'
                      : 'bg-indigo-100 text-indigo-700'
                  }`}
                >
                  {tag}
                  <button
                    onClick={(e) => { e.stopPropagation(); removeTag(i); }}
                    className="hover:opacity-70"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <input
                ref={tagInputRef}
                type="text"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
                className={`flex-1 min-w-[80px] bg-transparent border-none outline-none text-sm ${
                  isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-400'
                } ${isRTL ? 'text-right' : 'text-left'}`}
                placeholder={tags.length === 0 ? t.targetTagsHint : ''}
              />
            </div>
            <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t.targetTagsHint}
            </p>
          </div>
          <div>
            <label className={labelClass}>{t.targetLanguages}</label>
            <select
              multiple
              value={form.targetLanguages}
              onChange={handleLanguageSelect}
              className={`${baseInputClass} min-h-[100px] ${
                isRTL ? 'text-right' : 'text-left'
              }`}
            >
              <option value="ar">العربية / ar</option>
              <option value="en">English / en</option>
            </select>
            <p className={`text-xs mt-1.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {t.targetLanguagesHint}
            </p>
          </div>
          <div>
            <label className={labelClass}>{t.schedule}</label>
            <input
              type="datetime-local"
              value={form.scheduledAt}
              onChange={e => setForm({ ...form, scheduledAt: e.target.value })}
              className={inputClass}
            />
          </div>
        </div>
      </div>

      <div className={`flex gap-4 ${isRTL ? 'flex-row-reverse' : ''}`}>
        <button
          onClick={() => handleSave(false)}
          disabled={saving || !form.subject}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 disabled:opacity-50 text-sm font-medium shadow-lg shadow-indigo-500/20 transition-all duration-200"
        >
          <Save className="w-4 h-4" />
          {saving ? t.saving : t.saveDraft}
        </button>
        <button
          onClick={() => handleSave(true)}
          disabled={saving || !form.subject}
          className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 text-sm font-medium shadow-lg shadow-green-500/20 transition-all duration-200"
        >
          <Save className="w-4 h-4" />
          {t.saveAndSend}
        </button>
      </div>
    </div>
  );
}
