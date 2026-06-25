'use client';

import { useState, useRef, FormEvent, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, RefreshCw, Link as LinkIcon, Image as ImageIcon, Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Palette, Highlighter } from 'lucide-react';
import Select from 'react-select';
import Image from 'next/image';

interface Season { id: string; title: string; titleEn: string; }
interface Article { id: string; title: string; titleEn: string; }
interface Episode {
  id: string;
  title: string; titleEn: string; slug: string;
  description?: string; descriptionEn?: string;
  content?: string; contentEn?: string;
  videoUrl?: string; videoUrlEn?: string;
  thumbnailUrl?: string; thumbnailUrlEn?: string;
  season?: Season | null; // Prisma object or null
  articles?: Article[]; // Prisma returns objects
}

// Simple Text Editor (Shortened, use full implementation)
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

export default function EditEpisodePage() {
  const router = useRouter();
  const params = useParams();
  const slug = params.slug as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [thumbnailUrl, setThumbnailUrl] = useState('');
  const [thumbnailUrlEn, setThumbnailUrlEn] = useState('');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [episodeSlug, setEpisodeSlug] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [content, setContent] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrlEn, setVideoUrlEn] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<{ value: string; label: string } | null>(null);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingEn, setIsUploadingEn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputEnRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [seasonsRes, articlesRes] = await Promise.all([fetch('/api/seasons'), fetch('/api/articles')]);
      setSeasons((await seasonsRes.json()).seasons || []);
      setArticles((await articlesRes.json()).articles || []);
    } catch (err) { console.error(err); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => {
    const fetchEpisode = async () => {
      try {
        const res = await fetch(`/api/episodes/${slug}`);
        if (!res.ok) throw new Error('Not found');
        const data = await res.json();
        const ep = data.episode as Episode;
        
        setTitle(ep.title || ''); setTitleEn(ep.titleEn || '');
        setEpisodeSlug(ep.slug || '');
        setDescription(ep.description || ''); setDescriptionEn(ep.descriptionEn || '');
        setContent(ep.content || ''); setContentEn(ep.contentEn || '');
        setVideoUrl(ep.videoUrl || ''); setVideoUrlEn(ep.videoUrlEn || '');
        setThumbnailUrl(ep.thumbnailUrl || ''); setThumbnailUrlEn(ep.thumbnailUrlEn || '');
        
        // Map Prisma relations
        if (ep.season && typeof ep.season === 'object') {
          sessionStorage.setItem('tempSeasonId', ep.season.id);
        }
        if (ep.articles && Array.isArray(ep.articles)) {
          const ids = ep.articles.map(a => a.id);
          sessionStorage.setItem('tempArticleIds', JSON.stringify(ids));
        }
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load episode' });
      } finally {
        setIsFetching(false);
      }
    };
    fetchEpisode();
    fetchData();
  }, [slug, fetchData]);

  // Set selected options after data is loaded
  useEffect(() => {
    if (!isLoading && seasons.length > 0) {
      const tempSeasonId = sessionStorage.getItem('tempSeasonId');
      if (tempSeasonId) {
        const season = seasons.find(s => s.id === tempSeasonId);
        if (season) setSelectedSeason({ value: season.id, label: `${season.title} / ${season.titleEn}` });
        sessionStorage.removeItem('tempSeasonId');
      }
    }
    if (!isLoading && articles.length > 0) {
      const tempArticleIds = sessionStorage.getItem('tempArticleIds');
      if (tempArticleIds) {
        setSelectedArticles(JSON.parse(tempArticleIds));
        sessionStorage.removeItem('tempArticleIds');
      }
    }
  }, [isLoading, seasons, articles]);

  useEffect(() => {
    const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDarkMode();
    const obs = new MutationObserver(checkDarkMode);
    obs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const generateSlug = () => {
    if (titleEn || title) setEpisodeSlug((titleEn || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  };

  const handleImageUpload = async (file: File, isEnglish: boolean = false) => {
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
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEnglish: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) await handleImageUpload(file, isEnglish);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const episodeData = {
      title, titleEn, slug: episodeSlug,
      description, descriptionEn,
      content, contentEn,
      videoUrl, videoUrlEn,
      thumbnailUrl, thumbnailUrlEn,
      seasonId: selectedSeason ? selectedSeason.value : null, // Updated key
      articles: selectedArticles,
    };

    try {
      const res = await fetch(`/api/episodes/${slug}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(episodeData),
      });
      const result = await res.json();
      if (res.ok) {
        setMessage({ type: 'success', text: 'Updated!' });
        setTimeout(() => router.push('/admin/episodes'), 2000);
      } else setMessage({ type: 'error', text: result.error || 'Failed' });
    } catch (err) { setMessage({ type: 'error', text: 'Error' }); }
    finally { setIsSubmitting(false); }
  };

  const seasonOptions = useMemo(() => seasons.map(s => ({ value: s.id, label: `${s.title} / ${s.titleEn}` })), [seasons]);
  const articleOptions = useMemo(() => articles.map(a => ({ value: a.id, label: `${a.title} / ${a.titleEn}` })), [articles]);

  const selectStyles = useMemo(() => ({
    control: (base: object) => ({ ...base, backgroundColor: isDarkMode ? '#374151' : '#ffffff', borderColor: isDarkMode ? '#4B5563' : '#D1D5DB', color: isDarkMode ? '#ffffff' : '#111827' }),
    menu: (base: object) => ({ ...base, backgroundColor: isDarkMode ? '#374151' : '#ffffff' }),
    option: (base: object) => ({ ...base, backgroundColor: isDarkMode ? '#374151' : '#ffffff', color: isDarkMode ? '#ffffff' : '#111827' }),
    singleValue: (base: object) => ({ ...base, color: isDarkMode ? '#ffffff' : '#111827' }),
    multiValue: (base: object) => ({ ...base, backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB' }),
    multiValueLabel: (base: object) => ({ ...base, color: isDarkMode ? '#ffffff' : '#111827' }),
    input: (base: object) => ({ ...base, color: isDarkMode ? '#ffffff' : '#111827' }),
    placeholder: (base: object) => ({ ...base, color: isDarkMode ? '#9CA3AF' : '#6B7280' }),
  }), [isDarkMode]);

  if (isFetching) return <div className="flex justify-center p-10"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div></div>;

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="h-16"></div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Edit Episode</h1>
      </div>
      {message && <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>{message.text}</div>}

      <div className="mb-6 flex justify-end">
        <button type="button" onClick={fetchData} disabled={isLoading} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2">
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} /> Refresh Data
        </button>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Form Fields - Same layout as Add Page */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center gap-2"><span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">AR</span> Arabic</h2>
              <div className="mb-4"><label className="block text-sm font-medium mb-2 dark:text-gray-300">Title</label><input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" dir="rtl" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2 dark:text-gray-300">Description</label><SimpleTextEditor content={description} onChange={setDescription} language="ar" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2 dark:text-gray-300">Content</label><SimpleTextEditor content={content} onChange={setContent} language="ar" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2 dark:text-gray-300">Video URL</label><input type="url" value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700" /></div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Thumbnail</label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, false)} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-4 py-2 bg-blue-500 text-white rounded-md">{isUploading ? 'Uploading...' : 'Upload'}</button>
                  <input type="text" value={thumbnailUrl} onChange={(e) => setThumbnailUrl(e.target.value)} className="flex-1 p-2 border rounded-md dark:bg-gray-700" />
                </div>
                {thumbnailUrl && <Image src={thumbnailUrl} alt="Thumb" width={160} height={160} className="mt-2 h-40 w-auto object-cover rounded" />}
              </div>
            </div>
          </div>
          
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center gap-2"><span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">EN</span> English</h2>
              <div className="mb-4"><label className="block text-sm font-medium mb-2 dark:text-gray-300">Title</label><input type="text" value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2 dark:text-gray-300">Description</label><SimpleTextEditor content={descriptionEn} onChange={setDescriptionEn} language="en" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2 dark:text-gray-300">Content</label><SimpleTextEditor content={contentEn} onChange={setContentEn} language="en" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2 dark:text-gray-300">Video URL</label><input type="url" value={videoUrlEn} onChange={(e) => setVideoUrlEn(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700" /></div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2 dark:text-gray-300">Thumbnail</label>
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
        
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Settings</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Slug (URL)</label>
            <div className="flex gap-2">
              <input type="text" value={episodeSlug} onChange={(e) => setEpisodeSlug(e.target.value)} className="flex-1 p-3 border rounded-md dark:bg-gray-700" />
              <button type="button" onClick={generateSlug} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Generate</button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Season</label>
            <Select value={selectedSeason} onChange={setSelectedSeason} options={seasonOptions} styles={selectStyles} isClearable />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2 dark:text-gray-300">Articles</label>
            <Select isMulti value={articleOptions.filter(o => selectedArticles.includes(o.value))} onChange={(opts) => setSelectedArticles(opts ? opts.map(o => o.value) : [])} options={articleOptions} styles={selectStyles} isClearable />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
            {isSubmitting ? 'Updating...' : 'Update Episode'}
          </button>
        </div>
      </form>
    </div>
  );
}