'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { RefreshCw, Link as LinkIcon, Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Palette, Highlighter, Upload } from 'lucide-react';
import Select, { StylesConfig, OnChangeValue } from 'react-select';
import Image from 'next/image';

// Updated Interfaces for Prisma
interface Episode { id: string; title: string; titleEn: string; }
interface Article { id: string; title: string; titleEn: string; }
interface SelectOption { value: string; label: string; }

// Simple Text Editor (Shortened)
function SimpleTextEditor({ content, onChange, placeholder = '', language = 'ar' }: { content: string; onChange: (content: string) => void; placeholder?: string; language?: 'ar' | 'en'; }) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  return (
    <div className="border rounded-lg overflow-hidden dark:border-gray-700">
       <div className="p-4 dark:bg-gray-800">
        <textarea ref={textareaRef} value={content} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }} />
      </div>
    </div>
  );
}

export default function EditSeasonPage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailUrlEn, setThumbnailUrlEn] = useState('');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [seasonSlug, setSeasonSlug] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingEn, setIsUploadingEn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputEnRef = useRef<HTMLInputElement>(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [episodesRes, articlesRes] = await Promise.all([fetch('/api/episodes'), fetch('/api/articles')]);
      setEpisodes((await episodesRes.json()).episodes || []);
      setArticles((await articlesRes.json()).articles || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  };

  // Fetch Season Data
  useEffect(() => {
    const fetchSeason = async () => {
      try {
        const res = await fetch(`/api/seasons/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const s = data.season;
        
        setTitle(s.title || ''); setTitleEn(s.titleEn || '');
        setSeasonSlug(s.slug || '');
        setDescription(s.description || ''); setDescriptionEn(s.descriptionEn || '');
        setThumbnailUrl(s.thumbnailUrl || ''); setThumbnailUrlEn(s.thumbnailUrlEn || '');
        
        // Updated: Map Prisma objects (use id)
        if (s.episodes && Array.isArray(s.episodes)) {
          setSelectedEpisodes(s.episodes.map((e: Episode | string) => typeof e === 'object' ? e.id : e));
        }
        if (s.articles && Array.isArray(s.articles)) {
          setSelectedArticles(s.articles.map((a: Article | string) => typeof a === 'object' ? a.id : a));
        }
      } catch (err) { setMessage({ type: 'error', text: 'Failed to load' }); }
      finally { setIsFetching(false); }
    };
    fetchSeason();
    fetchData();
  }, [slug]);

  const generateSlug = () => { if (titleEn || title) setSeasonSlug((titleEn || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')); };

  const handleImageUpload = async (file: File, isEnglish: boolean = false) => {
    if (isEnglish) setIsUploadingEn(true); else setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) { const data = await res.json(); isEnglish ? setThumbnailUrlEn(data.url) : setThumbnailUrl(data.url); }
    } catch (err) { console.error(err); }
    finally { if (isEnglish) setIsUploadingEn(false); else setIsUploading(false); }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEnglish: boolean = false) => {
    const file = e.target.files?.[0]; if (file) await handleImageUpload(file, isEnglish);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const seasonData = {
      title, titleEn, slug: seasonSlug,
      description, descriptionEn,
      thumbnailUrl, thumbnailUrlEn,
      episodes: selectedEpisodes,
      articles: selectedArticles,
    };

    try {
      const res = await fetch(`/api/seasons/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(seasonData),
      });
      const result = await res.json();
      if (res.ok) { setMessage({ type: 'success', text: 'Updated!' }); setTimeout(() => router.push('/admin/seasons'), 2000); }
      else setMessage({ type: 'error', text: result.error || 'Failed' });
    } catch (err) { setMessage({ type: 'error', text: 'Error' }); }
    finally { setIsSubmitting(false); }
  };

  // Updated: Use id
  const episodeOptions: SelectOption[] = episodes.map(e => ({ value: e.id, label: `${e.title} / ${e.titleEn}` }));
  const articleOptions: SelectOption[] = articles.map(a => ({ value: a.id, label: `${a.title} / ${a.titleEn}` }));

  const selectStyles: StylesConfig<SelectOption, true> = {
    control: (base) => ({ ...base, backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff', borderColor: document.documentElement.classList.contains('dark') ? '#4B5563' : '#D1D5DB', color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827' }),
    menu: (base) => ({ ...base, backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff' }),
    option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? (document.documentElement.classList.contains('dark') ? '#4B5563' : '#F3F4F6') : 'transparent', color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827' }),
    multiValue: (base) => ({ ...base, backgroundColor: document.documentElement.classList.contains('dark') ? '#4B5563' : '#E5E7EB' }),
    multiValueLabel: (base) => ({ ...base, color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827' }),
    input: (base) => ({ ...base, color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827' }),
    placeholder: (base) => ({ ...base, color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280' }),
  };

  const handleEpisodesChange = (newValue: OnChangeValue<SelectOption, true>) => {
    setSelectedEpisodes(newValue ? newValue.map(option => option.value) : []);
  };

  const handleArticlesChange = (newValue: OnChangeValue<SelectOption, true>) => {
    setSelectedArticles(newValue ? newValue.map(option => option.value) : []);
  };

  if (isFetching) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="h-16"></div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Edit Season</h1>
      </div>
      {message && <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

      <div className="mb-6 flex justify-end">
        <button type="button" onClick={fetchData} disabled={isLoading} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Arabic */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center gap-2"><span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">AR</span> Arabic</h2>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Title</label><input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" dir="rtl" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Description</label><SimpleTextEditor content={description} onChange={setDescription} language="ar" /></div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Thumbnail</label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, false)} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-4 py-2 bg-blue-500 text-white rounded-md">{isUploading ? 'Uploading...' : 'Upload'}</button>
                  <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="flex-1 p-2 border rounded-md dark:bg-gray-700" />
                </div>
                {thumbnailUrl && <Image src={thumbnailUrl} alt="Thumb" width={160} height={160} className="mt-2 h-40 w-auto object-cover rounded" />}
              </div>
            </div>
          </div>
          
          {/* English */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center gap-2"><span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">EN</span> English</h2>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Title</label><input type="text" required value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Description</label><SimpleTextEditor content={descriptionEn} onChange={setDescriptionEn} language="en" /></div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Thumbnail</label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputEnRef} onChange={(e) => handleFileChange(e, true)} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputEnRef.current?.click()} disabled={isUploadingEn} className="px-4 py-2 bg-blue-500 text-white rounded-md">{isUploadingEn ? 'Uploading...' : 'Upload'}</button>
                  <input type="text" value={thumbnailUrlEn} onChange={(e) => setThumbnailUrlEn(e.target.value)} className="flex-1 p-2 border rounded-md dark:bg-gray-700" />
                </div>
                {thumbnailUrlEn && <Image src={thumbnailUrlEn} alt="Thumb" width={160} height={160} className="mt-2 h-40 w-auto object-cover rounded" />}
              </div>
            </div>
          </div>
        </div>
        
        {/* Settings */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Settings</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Slug</label>
            <div className="flex gap-2">
              <input type="text" required value={seasonSlug} onChange={(e) => setSeasonSlug(e.target.value)} className="flex-1 p-3 border rounded-md dark:bg-gray-700" />
              <button type="button" onClick={generateSlug} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Generate</button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Episodes</label>
            <Select isMulti value={episodeOptions.filter(o => selectedEpisodes.includes(o.value))} onChange={handleEpisodesChange} options={episodeOptions} styles={selectStyles} isClearable />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Articles</label>
            <Select isMulti value={articleOptions.filter(o => selectedArticles.includes(o.value))} onChange={handleArticlesChange} options={articleOptions} styles={selectStyles} isClearable />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
            {isSubmitting ? 'Updating...' : 'Update Season'}
          </button>
        </div>
      </form>
    </div>
  );
}