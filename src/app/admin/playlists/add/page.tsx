'use client';

import { useState, useRef, FormEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { RefreshCw } from 'lucide-react';
import Select, { StylesConfig } from 'react-select';

export default function AddPlaylistPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrlEn, setImageUrlEn] = useState('');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [selectedEpisodes, setSelectedEpisodes] = useState<string[]>([]);
  const [selectedArticles, setSelectedArticles] = useState<string[]>([]);
  // Updated state types for Prisma (id instead of _id)
  const [episodes, setEpisodes] = useState<{ id: string; title: string; titleEn: string }[]>([]);
  const [articles, setArticles] = useState<{ id: string; title: string; titleEn: string }[]>([]);
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
      const [episodesRes, articlesRes] = await Promise.all([fetch('/api/episodes'), fetch('/api/articles')]);
      setEpisodes((await episodesRes.json()).episodes || []);
      setArticles((await articlesRes.json()).articles || []);
    } catch (err) { console.error(err); setMessage({ type: 'error', text: 'Failed to load data' }); }
    finally { setIsLoading(false); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateSlug = useCallback(() => {
    if (titleEn || title) setSlug((titleEn || title).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
  }, [titleEn, title]);

  const handleImageUpload = useCallback(async (file: File, isEnglish: boolean = false) => {
    if (isEnglish) setIsUploadingEn(true); else setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const res = await fetch('/api/upload', { method: 'POST', body: formData });
      if (res.ok) { const data = await res.json(); isEnglish ? setImageUrlEn(data.url) : setImageUrl(data.url); }
    } catch (err) { console.error(err); }
    finally { if (isEnglish) setIsUploadingEn(false); else setIsUploading(false); }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, isEnglish: boolean = false) => {
    const file = e.target.files?.[0]; if (file) await handleImageUpload(file, isEnglish);
  }, [handleImageUpload]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const playlistData = {
      title, titleEn, slug,
      description, descriptionEn,
      imageUrl, imageUrlEn,
      episodes: selectedEpisodes,
      articles: selectedArticles,
    };

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(playlistData),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Playlist created!' });
        setTimeout(() => router.push('/admin/playlists'), 2000);
      } else setMessage({ type: 'error', text: result.error || 'Failed' });
    } catch (err) { setMessage({ type: 'error', text: 'Error' }); }
    finally { setIsSubmitting(false); }
  };

  // Updated options to use id
  const episodeOptions = episodes.map(e => ({ value: e.id, label: `${e.title} / ${e.titleEn}` }));
  const articleOptions = articles.map(a => ({ value: a.id, label: `${a.title} / ${a.titleEn}` }));

  const selectStyles: StylesConfig<{ value: string; label: string }, true> = {
    control: (base) => ({ ...base, backgroundColor: isDarkMode ? '#374151' : '#ffffff', borderColor: isDarkMode ? '#4B5563' : '#D1D5DB', color: isDarkMode ? '#ffffff' : '#111827' }),
    menu: (base) => ({ ...base, backgroundColor: isDarkMode ? '#374151' : '#ffffff' }),
    option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? (isDarkMode ? '#4B5563' : '#F3F4F6') : 'transparent', color: isDarkMode ? '#ffffff' : '#111827' }),
    multiValue: (base) => ({ ...base, backgroundColor: isDarkMode ? '#4B5563' : '#E5E7EB' }),
    multiValueLabel: (base) => ({ ...base, color: isDarkMode ? '#ffffff' : '#111827' }),
    input: (base) => ({ ...base, color: isDarkMode ? '#ffffff' : '#111827' }),
    placeholder: (base) => ({ ...base, color: isDarkMode ? '#9CA3AF' : '#6B7280' }),
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="h-16"></div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New Playlist</h1>
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
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Description</label><textarea value={description} onChange={(e) => setDescription(e.target.value)} dir="rtl" className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" rows={3} placeholder="Description..." /></div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Image</label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, false)} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-4 py-2 bg-blue-500 text-white rounded-md">{isUploading ? 'Uploading...' : 'Upload'}</button>
                  <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="Or URL" className="flex-1 p-2 border rounded-md dark:bg-gray-700" />
                </div>
                {imageUrl && <Image src={imageUrl} alt="Img" width={160} height={160} className="mt-2 h-40 w-auto object-cover rounded" />}
              </div>
            </div>
          </div>
          
          {/* English */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold mb-4 dark:text-white flex items-center gap-2"><span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">EN</span> English</h2>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Title</label><input type="text" required value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" /></div>
              <div className="mb-4"><label className="block text-sm font-medium mb-2">Description</label><textarea value={descriptionEn} onChange={(e) => setDescriptionEn(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:text-white" rows={3} placeholder="Description..." /></div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Image</label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputEnRef} onChange={(e) => handleFileChange(e, true)} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputEnRef.current?.click()} disabled={isUploadingEn} className="px-4 py-2 bg-blue-500 text-white rounded-md">{isUploadingEn ? 'Uploading...' : 'Upload'}</button>
                  <input type="text" value={imageUrlEn} onChange={(e) => setImageUrlEn(e.target.value)} placeholder="Or URL" className="flex-1 p-2 border rounded-md dark:bg-gray-700" />
                </div>
                {imageUrlEn && <Image src={imageUrlEn} alt="Img" width={160} height={160} className="mt-2 h-40 w-auto object-cover rounded" />}
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
              <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} className="flex-1 p-3 border rounded-md dark:bg-gray-700" />
              <button type="button" onClick={generateSlug} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Generate</button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Episodes</label>
            <Select isMulti value={episodeOptions.filter(o => selectedEpisodes.includes(o.value))} onChange={(opts) => setSelectedEpisodes(opts ? opts.map(o => o.value) : [])} options={episodeOptions} styles={selectStyles} isClearable placeholder={isLoading ? 'Loading...' : 'Select'} />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Articles</label>
            <Select isMulti value={articleOptions.filter(o => selectedArticles.includes(o.value))} onChange={(opts) => setSelectedArticles(opts ? opts.map(o => o.value) : [])} options={articleOptions} styles={selectStyles} isClearable placeholder={isLoading ? 'Loading...' : 'Select'} />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400">
            {isSubmitting ? 'Creating...' : 'Create Playlist'}
          </button>
        </div>
      </form>
    </div>
  );
}