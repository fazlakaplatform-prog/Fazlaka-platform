'use client';

import { useState, useRef, FormEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw } from 'lucide-react';
import Select, { StylesConfig } from 'react-select';
import Image from 'next/image';

interface SeasonOption { value: string; label: string; }
interface OptionType { value: string; label: string; }
interface Season { id: string; title: string; titleEn: string; }
interface Article { id: string; title: string; titleEn: string; }

// Simple Text Editor (Shortened for brevity, use the full one from your code)
function SimpleTextEditor({ content, onChange, placeholder = '', language = 'ar' }: { content: string; onChange: (content: string) => void; placeholder?: string; language?: 'ar' | 'en'; }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  // ... (Insert full SimpleTextEditor logic here, same as provided in previous responses)
  // For the sake of the example, assuming it's the same component
  return (
    <div className="border rounded-lg overflow-hidden dark:border-gray-700">
       <div className="p-4 dark:bg-gray-800">
        <textarea ref={textareaRef} value={content} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }} />
      </div>
    </div>
  );
}

export default function AddEpisodePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailUrlEn, setThumbnailUrlEn] = useState('');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [descriptionMobile, setDescriptionMobile] = useState('');
  const [descriptionMobileEn, setDescriptionMobileEn] = useState('');
  const [content, setContent] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrlEn, setVideoUrlEn] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<SeasonOption | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingEn, setIsUploadingEn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputEnRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [seasonsRes, articlesRes] = await Promise.all([fetch('/api/seasons'), fetch('/api/articles')]);
      setSeasons((await seasonsRes.json()).seasons || []);
      setArticles((await articlesRes.json()).articles || []);
    } catch (err) { console.error(err); setMessage({ type: 'error', text: 'Failed to load data' }); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateSlug = useCallback(() => {
    if (titleEn || title) {
      const titleToUse = titleEn || title;
      setSlug(titleToUse.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    }
  }, [title, titleEn]);

  const handleImageUpload = useCallback(async (file: File, isEnglish: boolean = false) => {
    if (isEnglish) setIsUploadingEn(true); else setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) {
        const data = await res.json();
        if (isEnglish) setThumbnailUrlEn(data.url); else setThumbnailUrl(data.url);
      }
    } catch (err) { console.error(err); }
    finally { if (isEnglish) setIsUploadingEn(false); else setIsUploading(false); }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, isEnglish: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) await handleImageUpload(file, isEnglish);
  }, [handleImageUpload]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Updated payload to match Prisma Service expectations (seasonId)
    const episodeData = {
      title, titleEn, slug,
      description, descriptionEn,
      descriptionMobile, descriptionMobileEn,
      content, contentEn,
      videoUrl, videoUrlEn,
      thumbnailUrl, thumbnailUrlEn,
      seasonId: selectedSeason ? selectedSeason.value : null,
      articles: selectedArticles, // Backend expects array of IDs
      publishedAt: new Date(),
    };

    try {
      const response = await fetch('/api/episodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(episodeData),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Episode created successfully!' });
        setTimeout(() => router.push('/admin/episodes'), 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create episode' });
      }
    } catch (_err) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const seasonOptions: SeasonOption[] = seasons.map(s => ({ value: s.id, label: `${s.title} / ${s.titleEn}` }));
  const articleOptions: OptionType[] = articles.map(a => ({ value: a.id, label: `${a.title} / ${a.titleEn}` }));

  const selectStyles: StylesConfig<OptionType, boolean> = {
    control: (base) => ({ ...base, backgroundColor: isDarkMode ? '#374151' : '#ffffff', borderColor: isDarkMode ? '#4B5563' : '#D1D5DB', color: isDarkMode ? '#ffffff' : '#111827' }),
    menu: (base) => ({ ...base, backgroundColor: isDarkMode ? '#374151' : '#ffffff' }),
    option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? (isDarkMode ? '#4B5563' : '#F3F4F6') : 'transparent', color: isDarkMode ? '#ffffff' : '#111827' }),
    singleValue: (base) => ({ ...base, color: isDarkMode ? '#ffffff' : '#111827' }),
    multiValue: (base) => ({ ...base, backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB' }),
    multiValueLabel: (base) => ({ ...base, color: isDarkMode ? '#ffffff' : '#111827' }),
    input: (base) => ({ ...base, color: isDarkMode ? '#ffffff' : '#111827' }),
    placeholder: (base) => ({ ...base, color: isDarkMode ? '#9CA3AF' : '#6B7280' }),
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="h-16"></div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New Episode</h1>
      </div>
      
      {message && <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

      <div className="mb-6 flex justify-end">
        <button type="button" onClick={fetchData} disabled={isLoading} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Arabic Content */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">AR</span> Arabic Content</h2>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Title (Arabic)</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" dir="rtl" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Description (Arabic) <span className="text-gray-400 text-xs">(website - HTML)</span></label><SimpleTextEditor content={description} onChange={setDescription} language="ar" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Mobile Description (Arabic) <span className="text-gray-400 text-xs">(plain text - shown in app)</span></label><textarea value={descriptionMobile} onChange={(e) => setDescriptionMobile(e.target.value)} dir="rtl" className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" rows={3} placeholder="Mobile-specific description..." /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Content (Arabic)</label><SimpleTextEditor content={content} onChange={setContent} language="ar" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Video URL (Arabic)</label><input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" /></div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Thumbnail (Arabic)</label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, false)} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-4 py-2 bg-blue-500 text-white rounded-md">{isUploading ? 'Uploading...' : 'Upload'}</button>
                  <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} placeholder="Or enter URL" className="flex-1 p-2 border rounded-md dark:bg-gray-700" />
                </div>
                {thumbnailUrl && <Image src={thumbnailUrl} alt="Thumb" width={160} height={160} className="mt-2 h-40 w-auto object-cover rounded" />}
              </div>
            </div>
          </div>
          
          {/* English Content */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">EN</span> English Content</h2>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Title (English)</label><input type="text" required value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Description (English) <span className="text-gray-400 text-xs">(website - HTML)</span></label><SimpleTextEditor content={descriptionEn} onChange={setDescriptionEn} language="en" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Mobile Description (English) <span className="text-gray-400 text-xs">(plain text - shown in app)</span></label><textarea value={descriptionMobileEn} onChange={(e) => setDescriptionMobileEn(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" rows={3} placeholder="Mobile-specific description..." /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Content (English)</label><SimpleTextEditor content={contentEn} onChange={setContentEn} language="en" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Video URL (English)</label><input type="url" value={videoUrlEn} onChange={(e) => setVideoUrlEn(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" /></div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Thumbnail (English)</label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputEnRef} onChange={(e) => handleFileChange(e, true)} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputEnRef.current?.click()} disabled={isUploadingEn} className="px-4 py-2 bg-blue-500 text-white rounded-md">{isUploadingEn ? 'Uploading...' : 'Upload'}</button>
                  <input type="text" value={thumbnailUrlEn} onChange={(e) => setThumbnailUrlEn(e.target.value)} placeholder="Or enter URL" className="flex-1 p-2 border rounded-md dark:bg-gray-700" />
                </div>
                {thumbnailUrlEn && <Image src={thumbnailUrlEn} alt="Thumb" width={160} height={160} className="mt-2 h-40 w-auto object-cover rounded" />}
              </div>
            </div>
          </div>
        </div>
        
        {/* Common Fields */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Episode Settings</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Slug (URL)</label>
            <div className="flex gap-2">
              <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} className="flex-1 p-3 border rounded-md dark:bg-gray-700" />
              <button type="button" onClick={generateSlug} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Generate</button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Season</label>
            <Select value={selectedSeason} onChange={(option) => setSelectedSeason(option as SeasonOption)} options={seasonOptions} styles={selectStyles} isClearable placeholder={isLoading ? 'Loading...' : 'Select season'} />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Articles</label>
            <Select isMulti value={articleOptions.filter(o => selectedArticles.includes(o.value))} onChange={(opts) => setSelectedArticles(opts ? opts.map(o => o.value) : [])} options={articleOptions} styles={selectStyles} isClearable placeholder={isLoading ? 'Loading...' : 'Select articles'} />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
            {isSubmitting ? 'Creating...' : 'Create Episode'}
          </button>
        </div>
      </form>
    </div>
  );
}