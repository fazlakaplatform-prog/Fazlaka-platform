'use client';

import { useState, useRef, FormEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Upload, RefreshCw, Link as LinkIcon, Image as ImageIcon, Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Palette, Highlighter } from 'lucide-react';
import Select, { StylesConfig } from 'react-select';
import Image from 'next/image';

interface SeasonOption { value: string; label: string; }
interface EpisodeOption { value: string; label: string; }

// Updated Interfaces
interface Season { id: string; title: string; titleEn: string; }
interface Episode { id: string; title: string; titleEn: string; }

function SimpleTextEditor({ content, onChange, placeholder = '', language = 'ar' }: { content: string; onChange: (content: string) => void; placeholder?: string; language?: 'ar' | 'en'; }) {
  const [imageUrl, setImageUrl] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [showImageDialog, setShowImageDialog] = useState(false);
  const [showLinkDialog, setShowLinkDialog] = useState(false);
  const [textColor, setTextColor] = useState('#000000');
  const [highlightColor, setHighlightColor] = useState('#ffff00');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = textareaRef.current.scrollHeight + 'px';
    }
  }, [content]);

  const insertText = useCallback((before: string, after: string = '') => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = content.substring(start, end);
    const newText = before + selectedText + after;
    const newContent = content.substring(0, start) + newText + content.substring(end);
    onChange(newContent);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + before.length, start + before.length + selectedText.length);
    }, 0);
  }, [content, onChange]);

  const insertImage = useCallback(() => {
    if (imageUrl) {
      const imageHtml = `<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto; border-radius: 0.25rem; margin: 0.5rem 0;" />`;
      insertText(imageHtml);
      setImageUrl('');
      setShowImageDialog(false);
    }
  }, [imageUrl, insertText]);

  const insertLink = useCallback(() => {
    if (linkUrl) {
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${linkUrl}</a>`;
      insertText(linkHtml);
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  }, [linkUrl, insertText]);

  const wrapWith = useCallback((tag: string) => { insertText(`<${tag}>`, `</${tag}>`); }, [insertText]);

  return (
    <div className="border rounded-lg overflow-hidden dark:border-gray-700">
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 dark:bg-gray-800 dark:border-gray-700">
        <button type="button" onClick={() => wrapWith('strong')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><Bold size={16} /></button>
        <button type="button" onClick={() => wrapWith('em')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><Italic size={16} /></button>
        <div className="w-px bg-gray-300 mx-1 dark:bg-gray-600" />
        <button type="button" onClick={() => wrapWith('h1')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><Heading1 size={16} /></button>
        <button type="button" onClick={() => wrapWith('h2')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><Heading2 size={16} /></button>
        <button type="button" onClick={() => wrapWith('h3')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><Heading3 size={16} /></button>
        <div className="w-px bg-gray-300 mx-1 dark:bg-gray-600" />
        <button type="button" onClick={() => wrapWith('ul')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><List size={16} /></button>
        <button type="button" onClick={() => wrapWith('ol')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><ListOrdered size={16} /></button>
        <button type="button" onClick={() => wrapWith('blockquote')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><Quote size={16} /></button>
        <div className="w-px bg-gray-300 mx-1 dark:bg-gray-600" />
        <button type="button" onClick={() => setShowLinkDialog(true)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><LinkIcon size={16} /></button>
        <button type="button" onClick={() => setShowImageDialog(true)} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><ImageIcon size={16} /></button>
        <div className="w-px bg-gray-300 mx-1 dark:bg-gray-600" />
        <div className="flex items-center gap-1">
          <input type="color" value={textColor} onChange={(e) => setTextColor(e.target.value)} className="w-6 h-6 border-0" />
          <button type="button" onClick={() => insertText(`<span style="color: ${textColor}">`, '</span>')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><Palette size={16} /></button>
        </div>
        <div className="flex items-center gap-1">
          <input type="color" value={highlightColor} onChange={(e) => setHighlightColor(e.target.value)} className="w-6 h-6 border-0" />
          <button type="button" onClick={() => insertText(`<span style="background-color: ${highlightColor}">`, '</span>')} className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"><Highlighter size={16} /></button>
        </div>
      </div>
      <div className="p-4 dark:bg-gray-800">
        <textarea ref={textareaRef} value={content} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400" style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }} />
      </div>
      <div className="border-t bg-gray-50 p-2 text-xs text-gray-500 text-right dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
        {content.length} {language === 'ar' ? 'حرف' : 'characters'}
      </div>

      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-96 dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-4 dark:text-white">{language === 'ar' ? 'إضافة صورة' : 'Add Image'}</h3>
            <input type="text" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder={language === 'ar' ? 'رابط الصورة' : 'Image URL'} className="w-full p-2 border border-gray-300 rounded mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white" dir={language === 'ar' ? 'rtl' : 'ltr'} />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowImageDialog(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={insertImage} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{language === 'ar' ? 'إضافة' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}

      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-96 dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-4 dark:text-white">{language === 'ar' ? 'إضافة رابط' : 'Add Link'}</h3>
            <input type="text" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)} placeholder="URL" className="w-full p-2 border border-gray-300 rounded mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowLinkDialog(false)} className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white">{language === 'ar' ? 'إلغاء' : 'Cancel'}</button>
              <button onClick={insertLink} className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">{language === 'ar' ? 'إضافة' : 'Add'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function AddArticlePage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredImageUrlEn, setFeaturedImageUrlEn] = useState('');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [slug, setSlug] = useState('');
  const [excerpt, setExcerpt] = useState('');
  const [excerptEn, setExcerptEn] = useState('');
  const [excerptMobile, setExcerptMobile] = useState('');
  const [excerptMobileEn, setExcerptMobileEn] = useState('');
  const [content, setContent] = useState('');
  const [contentEn, setContentEn] = useState('');
  const [selectedSeason, setSelectedSeason] = useState<SeasonOption | null>(null);
  const [selectedEpisode, setSelectedEpisode] = useState<EpisodeOption | null>(null);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingEn, setIsUploadingEn] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputEnRef = useRef<HTMLInputElement>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const [seasonsResponse, episodesResponse] = await Promise.all([fetch('/api/seasons'), fetch('/api/episodes')]);
      const seasonsData = await seasonsResponse.json();
      const episodesData = await episodesResponse.json();
      setSeasons(seasonsData.seasons || []);
      setEpisodes(episodesData.episodes || []);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage({ type: 'error', text: 'Failed to load data.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    const checkDarkMode = () => setIsDarkMode(document.documentElement.classList.contains('dark'));
    checkDarkMode();
    const observer = new MutationObserver(checkDarkMode);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const generateSlug = useCallback(() => {
    if (titleEn || title) {
      const titleToUse = titleEn || title;
      const generatedSlug = titleToUse.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [title, titleEn]);

  const handleImageUpload = useCallback(async (file: File, isEnglish: boolean = false) => {
    if (isEnglish) setIsUploadingEn(true); else setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const response = await fetch('/api/upload', { method: 'POST', body: formData });
      if (response.ok) {
        const data = await response.json();
        if (isEnglish) setFeaturedImageUrlEn(data.url); else setFeaturedImageUrl(data.url);
      } else throw new Error('Upload failed');
    } catch (error) {
      console.error(error);
      setMessage({ type: 'error', text: 'Image upload failed' });
    } finally {
      if (isEnglish) setIsUploadingEn(false); else setIsUploading(false);
    }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, isEnglish: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) await handleImageUpload(file, isEnglish);
  }, [handleImageUpload]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    // Updated payload to use seasonId and episodeId for Prisma
    const articleData = {
      title, titleEn, slug,
      excerpt, excerptEn,
      excerptMobile, excerptMobileEn,
      content, contentEn,
      featuredImageUrl, featuredImageUrlEn,
      seasonId: selectedSeason ? selectedSeason.value : null,
      episodeId: selectedEpisode ? selectedEpisode.value : null,
      publishedAt: new Date(),
    };

    try {
      const response = await fetch('/api/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(articleData),
      });
      const result = await response.json();
      if (response.ok) {
        setMessage({ type: 'success', text: 'Article created successfully!' });
        setTimeout(() => router.push('/admin/articles'), 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create article' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'An error occurred' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const seasonOptions = seasons.map(s => ({ value: s.id, label: `${s.title} / ${s.titleEn}` }));
  const episodeOptions = episodes.map(e => ({ value: e.id, label: `${e.title} / ${e.titleEn}` }));

  const selectStyles: StylesConfig<SeasonOption | EpisodeOption, false> = {
    control: (base) => ({ ...base, backgroundColor: isDarkMode ? '#374151' : '#ffffff', borderColor: isDarkMode ? '#4B5563' : '#D1D5DB', color: isDarkMode ? '#ffffff' : '#111827' }),
    menu: (base) => ({ ...base, backgroundColor: isDarkMode ? '#374151' : '#ffffff' }),
    option: (base, { isFocused }) => ({ ...base, backgroundColor: isFocused ? (isDarkMode ? '#4B5563' : '#F3F4F6') : 'transparent', color: isDarkMode ? '#ffffff' : '#111827' }),
    singleValue: (base) => ({ ...base, color: isDarkMode ? '#ffffff' : '#111827' }),
    input: (base) => ({ ...base, color: isDarkMode ? '#ffffff' : '#111827' }),
    placeholder: (base) => ({ ...base, color: isDarkMode ? '#9CA3AF' : '#6B7280' }),
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="h-16"></div>
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New Article</h1>
        <p className="text-gray-600 dark:text-gray-400">Create a new article with Arabic and English content</p>
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
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">AR</span>
                Arabic Content
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Title (Arabic)</label>
                <input type="text" required value={title} onChange={(e) => setTitle(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" dir="rtl" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Excerpt (Arabic) <span className="text-gray-400 text-xs">(website - HTML)</span></label>
                <SimpleTextEditor content={excerpt} onChange={setExcerpt} language="ar" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Mobile Excerpt (Arabic) <span className="text-gray-400 text-xs">(plain text, shown in app)</span></label>
                <textarea value={excerptMobile} onChange={(e) => setExcerptMobile(e.target.value)} dir="rtl" className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} placeholder="Mobile-specific excerpt..." />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Content (Arabic)</label>
                <SimpleTextEditor content={content} onChange={setContent} language="ar" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Featured Image (Arabic)</label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputRef} onChange={(e) => handleFileChange(e, false)} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isUploading} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    {isUploading ? 'Uploading...' : 'Upload'}
                  </button>
                  <input type="text" value={featuredImageUrl} onChange={(e) => setFeaturedImageUrl(e.target.value)} placeholder="Or enter URL" className="flex-1 p-2 border rounded-md dark:bg-gray-700" />
                </div>
                {featuredImageUrl && <Image src={featuredImageUrl} alt="Preview" width={160} height={160} className="mt-2 h-40 w-auto object-cover rounded" />}
              </div>
            </div>
          </div>
          
          {/* English Content */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm">EN</span>
                English Content
              </h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Title (English)</label>
                <input type="text" required value={titleEn} onChange={(e) => setTitleEn(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Excerpt (English) <span className="text-gray-400 text-xs">(website - HTML)</span></label>
                <SimpleTextEditor content={excerptEn} onChange={setExcerptEn} language="en" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Mobile Excerpt (English) <span className="text-gray-400 text-xs">(plain text, shown in app)</span></label>
                <textarea value={excerptMobileEn} onChange={(e) => setExcerptMobileEn(e.target.value)} className="w-full p-3 border rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white" rows={3} placeholder="Mobile-specific excerpt..." />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Content (English)</label>
                <SimpleTextEditor content={contentEn} onChange={setContentEn} language="en" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Featured Image (English)</label>
                <div className="flex items-center gap-3">
                  <input type="file" ref={fileInputEnRef} onChange={(e) => handleFileChange(e, true)} accept="image/*" className="hidden" />
                  <button type="button" onClick={() => fileInputEnRef.current?.click()} disabled={isUploadingEn} className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600">
                    {isUploadingEn ? 'Uploading...' : 'Upload'}
                  </button>
                  <input type="text" value={featuredImageUrlEn} onChange={(e) => setFeaturedImageUrlEn(e.target.value)} placeholder="Or enter URL" className="flex-1 p-2 border rounded-md dark:bg-gray-700" />
                </div>
                {featuredImageUrlEn && <Image src={featuredImageUrlEn} alt="Preview" width={160} height={160} className="mt-2 h-40 w-auto object-cover rounded" />}
              </div>
            </div>
          </div>
        </div>
        
        {/* Common Fields */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Article Settings</h2>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Slug (URL)</label>
            <div className="flex gap-2">
              <input type="text" required value={slug} onChange={(e) => setSlug(e.target.value)} className="flex-1 p-3 border rounded-md dark:bg-gray-700" />
              <button type="button" onClick={generateSlug} className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600">Generate</button>
            </div>
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Season</label>
            <Select value={selectedSeason} onChange={setSelectedSeason} options={seasonOptions} styles={selectStyles} placeholder="Select a season" isClearable />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium mb-2">Episode</label>
            <Select value={selectedEpisode} onChange={setSelectedEpisode} options={episodeOptions} styles={selectStyles} placeholder="Select an episode" isClearable />
          </div>
        </div>
        
        <div className="flex justify-end">
          <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2">
            {isSubmitting ? 'Creating...' : 'Create Article'}
          </button>
        </div>
      </form>
    </div>
  );
}