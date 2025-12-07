'use client';

import { useState, useRef, FormEvent, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, RefreshCw, Link as LinkIcon, Image as ImageIcon, Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Palette, Highlighter } from 'lucide-react';
import Select, { StylesConfig } from 'react-select';

// Simple Text Editor Component
function SimpleTextEditor({ 
  content, 
  onChange, 
  placeholder = '', 
  language = 'ar' 
}: { 
  content: string; 
  onChange: (content: string) => void; 
  placeholder?: string; 
  language?: 'ar' | 'en'; 
}) {
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

  const wrapWith = useCallback((tag: string) => {
    insertText(`<${tag}>`, `</${tag}>`);
  }, [insertText]);

  return (
    <div className="border rounded-lg overflow-hidden dark:border-gray-700">
      {/* Toolbar */}
      <div className="border-b bg-gray-50 p-2 flex flex-wrap gap-1 dark:bg-gray-800 dark:border-gray-700">
        <button
          type="button"
          onClick={() => wrapWith('strong')}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          title={language === 'ar' ? 'عريض' : 'Bold'}
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => wrapWith('em')}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          title={language === 'ar' ? 'مائل' : 'Italic'}
        >
          <Italic size={16} />
        </button>
        
        <div className="w-px bg-gray-300 mx-1 dark:bg-gray-600" />
        
        <button
          type="button"
          onClick={() => wrapWith('h1')}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          title={language === 'ar' ? 'عنوان 1' : 'Heading 1'}
        >
          <Heading1 size={16} />
        </button>
        <button
          type="button"
          onClick={() => wrapWith('h2')}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          title={language === 'ar' ? 'عنوان 2' : 'Heading 2'}
        >
          <Heading2 size={16} />
        </button>
        <button
          type="button"
          onClick={() => wrapWith('h3')}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          title={language === 'ar' ? 'عنوان 3' : 'Heading 3'}
        >
          <Heading3 size={16} />
        </button>
        
        <div className="w-px bg-gray-300 mx-1 dark:bg-gray-600" />
        
        <button
          type="button"
          onClick={() => wrapWith('ul')}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          title={language === 'ar' ? 'قائمة نقطية' : 'Bullet List'}
        >
          <List size={16} />
        </button>
        <button
          type="button"
          onClick={() => wrapWith('ol')}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          title={language === 'ar' ? 'قائمة مرقمة' : 'Ordered List'}
        >
          <ListOrdered size={16} />
        </button>
        <button
          type="button"
          onClick={() => wrapWith('blockquote')}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          title={language === 'ar' ? 'اقتباس' : 'Quote'}
        >
          <Quote size={16} />
        </button>
        
        <div className="w-px bg-gray-300 mx-1 dark:bg-gray-600" />
        
        <button
          type="button"
          onClick={() => setShowLinkDialog(true)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          title={language === 'ar' ? 'رابط' : 'Link'}
        >
          <LinkIcon size={16} />
        </button>
        <button
          type="button"
          onClick={() => setShowImageDialog(true)}
          className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
          title={language === 'ar' ? 'صورة' : 'Image'}
        >
          <ImageIcon size={16} />
        </button>
        
        <div className="w-px bg-gray-300 mx-1 dark:bg-gray-600" />
        
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={textColor}
            onChange={(e) => setTextColor(e.target.value)}
            className="w-6 h-6 border-0"
            title={language === 'ar' ? 'لون النص' : 'Text Color'}
          />
          <button
            type="button"
            onClick={() => insertText(`<span style="color: ${textColor}">`, '</span>')}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
            title={language === 'ar' ? 'تطبيق اللون' : 'Apply Color'}
          >
            <Palette size={16} />
          </button>
        </div>
        
        <div className="flex items-center gap-1">
          <input
            type="color"
            value={highlightColor}
            onChange={(e) => setHighlightColor(e.target.value)}
            className="w-6 h-6 border-0"
            title={language === 'ar' ? 'لون التمييز' : 'Highlight Color'}
          />
          <button
            type="button"
            onClick={() => insertText(`<span style="background-color: ${highlightColor}">`, '</span>')}
            className="p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-300"
            title={language === 'ar' ? 'تمييز' : 'Highlight'}
          >
            <Highlighter size={16} />
          </button>
        </div>
      </div>
      
      {/* Editor Content */}
      <div className="p-4 dark:bg-gray-800">
        <textarea
          ref={textareaRef}
          value={content}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full min-h-[200px] p-3 border border-gray-300 rounded-md resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          style={{ direction: language === 'ar' ? 'rtl' : 'ltr' }}
        />
      </div>
      
      {/* Character Count */}
      <div className="border-t bg-gray-50 p-2 text-xs text-gray-500 text-right dark:bg-gray-800 dark:border-gray-700 dark:text-gray-400">
        {content.length} {language === 'ar' ? 'حرف' : 'characters'}
      </div>
      
      {/* Image Dialog */}
      {showImageDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-96 dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-4 dark:text-white">
              {language === 'ar' ? 'إضافة صورة' : 'Add Image'}
            </h3>
            <input
              type="text"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder={language === 'ar' ? 'رابط الصورة' : 'Image URL'}
              className="w-full p-2 border border-gray-300 rounded mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowImageDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={insertImage}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {language === 'ar' ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Link Dialog */}
      {showLinkDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded-lg w-96 dark:bg-gray-800">
            <h3 className="text-lg font-medium mb-4 dark:text-white">
              {language === 'ar' ? 'إضافة رابط' : 'Add Link'}
            </h3>
            <input
              type="text"
              value={linkUrl}
              onChange={(e) => setLinkUrl(e.target.value)}
              placeholder={language === 'ar' ? 'رابط URL' : 'URL'}
              className="w-full p-2 border border-gray-300 rounded mb-4 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
              dir={language === 'ar' ? 'rtl' : 'ltr'}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowLinkDialog(false)}
                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100 dark:border-gray-600 dark:hover:bg-gray-700 dark:text-white"
              >
                {language === 'ar' ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={insertLink}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
              >
                {language === 'ar' ? 'إضافة' : 'Add'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

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
  const [episodes, setEpisodes] = useState<{ _id: string; title: string; titleEn: string }[]>([]);
  const [articles, setArticles] = useState<{ _id: string; title: string; titleEn: string }[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingEn, setIsUploadingEn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputEnRef = useRef<HTMLInputElement>(null);

  // Function to fetch all necessary data
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      console.log('Fetching fresh data...');
      
      // جلب الحلقات
      const episodesResponse = await fetch('/api/episodes');
      if (!episodesResponse.ok) {
        throw new Error(`Failed to fetch episodes: ${episodesResponse.statusText}`);
      }
      const episodesData = await episodesResponse.json();
      
      // جلب المقالات
      const articlesResponse = await fetch('/api/articles');
      if (!articlesResponse.ok) {
        throw new Error(`Failed to fetch articles: ${articlesResponse.statusText}`);
      }
      const articlesData = await articlesResponse.json();

      setEpisodes(episodesData.episodes || []);
      setArticles(articlesData.articles || []);
      
      console.log('Episodes fetched:', episodesData.episodes);
      console.log('Articles fetched:', articlesData.articles);

    } catch (error) {
      console.error('Error fetching data:', error);
      setError(error instanceof Error ? error.message : 'Failed to load data');
      setMessage({ type: 'error', text: 'Failed to load data. Please refresh page.' });
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch data on component mount
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Generate slug from title when title changes
  const generateSlug = useCallback(() => {
    if (titleEn || title) {
      const titleToUse = titleEn || title;
      const generatedSlug = titleToUse
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  }, [titleEn, title]);

  const handleImageUpload = useCallback(async (file: File, isEnglish: boolean = false) => {
    if (isEnglish) {
      setIsUploadingEn(true);
    } else {
      setIsUploading(true);
    }

    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        if (isEnglish) {
          setImageUrlEn(data.url);
        } else {
          setImageUrl(data.url);
        }
        return data.url;
      } else {
        throw new Error('Failed to upload image');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      setMessage({ type: 'error', text: 'Failed to upload image' });
      return null;
    } finally {
      if (isEnglish) {
        setIsUploadingEn(false);
      } else {
        setIsUploading(false);
      }
    }
  }, []);

  const handleFileChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>, isEnglish: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageUpload(file, isEnglish);
    }
  }, [handleImageUpload]);

  const handleSubmit = useCallback(async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const playlistData = {
      title,
      titleEn,
      slug,
      description,
      descriptionEn,
      imageUrl,
      imageUrlEn,
      episodes: selectedEpisodes,
      articles: selectedArticles,
    };

    try {
      const response = await fetch('/api/playlists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(playlistData),
      });
      
      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Playlist created successfully!' });
        setTimeout(() => {
          router.push('/admin/playlists');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create playlist' });
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      setMessage({ type: 'error', text: 'An error occurred while creating playlist' });
    } finally {
      setIsSubmitting(false);
    }
  }, [title, titleEn, slug, description, descriptionEn, imageUrl, imageUrlEn, selectedEpisodes, selectedArticles, router]);

  // Prepare options for react-select
  const episodeOptions = episodes.map(episode => ({
    value: episode._id,
    label: `${episode.title} / ${episode.titleEn}`,
  }));

  const articleOptions = articles.map(article => ({
    value: article._id,
    label: `${article.title} / ${article.titleEn}`,
  }));

  // Custom styles for react-select with dark mode support
  const selectStyles: StylesConfig<{ value: string; label: string }, true> = {
    control: (base) => ({
      ...base,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
      borderColor: document.documentElement.classList.contains('dark') ? '#4B5563' : '#D1D5DB',
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827',
      '&:hover': {
        borderColor: document.documentElement.classList.contains('dark') ? '#6B7280' : '#9CA3AF',
      },
    }),
    menu: (base) => ({
      ...base,
      backgroundColor: document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff',
      borderColor: document.documentElement.classList.contains('dark') ? '#4B5563' : '#D1D5DB',
    }),
    option: (base, { isFocused }) => ({
      ...base,
      backgroundColor: isFocused 
        ? (document.documentElement.classList.contains('dark') ? '#4B5563' : '#F3F4F6')
        : (document.documentElement.classList.contains('dark') ? '#374151' : '#ffffff'),
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827',
      '&:active': {
        backgroundColor: document.documentElement.classList.contains('dark') ? '#6B7280' : '#E5E7EB',
      },
    }),
    singleValue: (base) => ({
      ...base,
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827',
    }),
    input: (base) => ({
      ...base,
      color: document.documentElement.classList.contains('dark') ? '#ffffff' : '#111827',
    }),
    placeholder: (base) => ({
      ...base,
      color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280',
    }),
    noOptionsMessage: (base) => ({
      ...base,
      color: document.documentElement.classList.contains('dark') ? '#9CA3AF' : '#6B7280',
    }),
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Added large empty space at top of page */}
      <div className="h-16"></div>
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New Playlist</h1>
        <p className="text-gray-600 dark:text-gray-400">Create a new playlist with Arabic and English content</p>
      </div>
      
      {message && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
          {message.text}
        </div>
      )}

      {/* Refresh Button */}
      <div className="mb-6 flex justify-end">
        <button
          type="button"
          onClick={fetchData}
          disabled={isLoading}
          className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 disabled:bg-gray-400 flex items-center gap-2"
        >
          <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          {isLoading ? 'Refreshing...' : 'Refresh Data'}
        </button>
      </div>
      
      {/* Display error if any */}
      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100 rounded-md">
          Error: {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Arabic Content */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <span className="w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-sm">AR</span>
                Arabic Content
              </h2>
              
              {/* Arabic Title */}
              <div className="mb-4">
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (Arabic)
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  dir="rtl"
                />
              </div>
              
              {/* Arabic Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (Arabic)
                </label>
                <SimpleTextEditor
                  content={description}
                  onChange={setDescription}
                  placeholder="Write a brief description in Arabic..."
                  language="ar"
                />
              </div>
              
              {/* Image (Arabic) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image (Arabic)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={(e) => handleFileChange(e, false)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={isUploading}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center gap-2"
                    >
                      <Upload size={16} className={isUploading ? 'animate-pulse' : ''} />
                      {isUploading ? 'Uploading...' : 'Upload Image'}
                    </button>
                    <span className="text-gray-500 text-sm dark:text-gray-400">or</span>
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-gray-500 dark:text-gray-400" />
                      <input
                        type="text"
                        value={imageUrl}
                        onChange={(e) => setImageUrl(e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        dir="ltr"
                      />
                    </div>
                  </div>
                  {imageUrl && (
                    <div className="mt-2">
                      <Image 
                        src={imageUrl} 
                        alt="Image" 
                        width={160} 
                        height={160} 
                        className="h-40 w-auto object-cover rounded" 
                      />
                    </div>
                  )}
                </div>
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
              
              {/* English Title */}
              <div className="mb-4">
                <label htmlFor="titleEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Title (English)
                </label>
                <input
                  type="text"
                  id="titleEn"
                  name="titleEn"
                  required
                  value={titleEn}
                  onChange={(e) => setTitleEn(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              {/* English Description */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Description (English)
                </label>
                <SimpleTextEditor
                  content={descriptionEn}
                  onChange={setDescriptionEn}
                  placeholder="Write a brief description in English..."
                  language="en"
                />
              </div>
              
              {/* Image (English) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Image (English)
                </label>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <input
                      type="file"
                      ref={fileInputEnRef}
                      onChange={(e) => handleFileChange(e, true)}
                      accept="image/*"
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputEnRef.current?.click()}
                      disabled={isUploadingEn}
                      className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 disabled:bg-blue-300 flex items-center gap-2"
                    >
                      <Upload size={16} className={isUploadingEn ? 'animate-pulse' : ''} />
                      {isUploadingEn ? 'Uploading...' : 'Upload Image'}
                    </button>
                    <span className="text-gray-500 text-sm dark:text-gray-400">or</span>
                    <div className="flex items-center gap-2">
                      <LinkIcon size={16} className="text-gray-500 dark:text-gray-400" />
                      <input
                        type="text"
                        value={imageUrlEn}
                        onChange={(e) => setImageUrlEn(e.target.value)}
                        placeholder="Enter image URL"
                        className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                      />
                    </div>
                  </div>
                  {imageUrlEn && (
                    <div className="mt-2">
                      <Image 
                        src={imageUrlEn} 
                        alt="Image" 
                        width={160} 
                        height={160} 
                        className="h-40 w-auto object-cover rounded" 
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Common Fields */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Playlist Settings</h2>
          
          {/* Slug */}
          <div className="mb-6">
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Slug (URL)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                id="slug"
                name="slug"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                className="flex-1 p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                placeholder="url-friendly-name"
              />
              <button
                type="button"
                onClick={generateSlug}
                className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
              >
                Generate
              </button>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              This will be used in URL. It&apos;s automatically generated from title.
            </p>
          </div>
          
          {/* Episodes Selection */}
          <div className="mb-6">
            <label htmlFor="episodes" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Episodes
            </label>
            <Select
              id="episodes"
              value={episodeOptions.filter(option => selectedEpisodes.includes(option.value))}
              onChange={(selectedOptions) => {
                setSelectedEpisodes(selectedOptions ? selectedOptions.map(option => option.value) : []);
              }}
              options={episodeOptions}
              styles={selectStyles}
              className="w-full"
              classNamePrefix="select"
              placeholder={isLoading ? 'Loading episodes...' : 'Select episodes'}
              isDisabled={isLoading}
              isMulti
              isClearable
            />
            {episodes.length === 0 && !isLoading && (
              <p className="text-sm text-red-500 mt-1">No episodes available. Please create an episode first.</p>
            )}
          </div>
          
          {/* Articles Selection */}
          <div className="mb-6">
            <label htmlFor="articles" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Articles
            </label>
            <Select
              id="articles"
              value={articleOptions.filter(option => selectedArticles.includes(option.value))}
              onChange={(selectedOptions) => {
                setSelectedArticles(selectedOptions ? selectedOptions.map(option => option.value) : []);
              }}
              options={articleOptions}
              styles={selectStyles}
              className="w-full"
              classNamePrefix="select"
              placeholder={isLoading ? 'Loading articles...' : 'Select articles'}
              isDisabled={isLoading}
              isMulti
              isClearable
            />
            {articles.length === 0 && !isLoading && (
              <p className="text-sm text-red-500 mt-1">No articles available. Please create an article first.</p>
            )}
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                Creating...
              </>
            ) : (
              'Create Playlist'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}