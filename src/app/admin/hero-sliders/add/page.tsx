'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Upload, Link as LinkIcon, Image as ImageIcon, Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Palette, Highlighter } from 'lucide-react';

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

  const insertText = (before: string, after: string = '') => {
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
  };

  const insertImage = () => {
    if (imageUrl) {
      const imageHtml = `<img src="${imageUrl}" alt="Image" style="max-width: 100%; height: auto; border-radius: 0.25rem; margin: 0.5rem 0;" />`;
      insertText(imageHtml);
      setImageUrl('');
      setShowImageDialog(false);
    }
  };

  const insertLink = () => {
    if (linkUrl) {
      const linkHtml = `<a href="${linkUrl}" target="_blank" rel="noopener noreferrer" style="color: #3b82f6; text-decoration: underline;">${linkUrl}</a>`;
      insertText(linkHtml);
      setLinkUrl('');
      setShowLinkDialog(false);
    }
  };

  const wrapWith = (tag: string) => {
    insertText(`<${tag}>`, `</${tag}>`);
  };

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

export default function AddHeroSliderPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [featuredImageUrlEn, setFeaturedImageUrlEn] = useState('');
  const [title, setTitle] = useState('');
  const [titleEn, setTitleEn] = useState('');
  const [description, setDescription] = useState('');
  const [descriptionEn, setDescriptionEn] = useState('');
  const [mediaType, setMediaType] = useState<'image' | 'video'>('image');
  const [videoUrl, setVideoUrl] = useState('');
  const [videoUrlEn, setVideoUrlEn] = useState('');
  const [linkText, setLinkText] = useState('');
  const [linkTextEn, setLinkTextEn] = useState('');
  const [linkUrl, setLinkUrl] = useState('');
  const [orderRank, setOrderRank] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingEn, setIsUploadingEn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputEnRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (file: File, isEnglish: boolean = false) => {
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
          setFeaturedImageUrlEn(data.url);
        } else {
          setFeaturedImageUrl(data.url);
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
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEnglish: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageUpload(file, isEnglish);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const heroSliderData = {
      title,
      titleEn,
      description,
      descriptionEn,
      mediaType,
      image: mediaType === 'image' ? featuredImageUrl : undefined,
      imageEn: mediaType === 'image' ? featuredImageUrlEn : undefined,
      videoUrl: mediaType === 'video' ? videoUrl : undefined,
      videoUrlEn: mediaType === 'video' ? videoUrlEn : undefined,
      link: (linkText || linkTextEn || linkUrl) ? {
        text: linkText,
        textEn: linkTextEn,
        url: linkUrl
      } : undefined,
      orderRank
    };

    try {
      const response = await fetch('/api/hero-sliders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(heroSliderData),
      });
      
      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Hero slider created successfully!' });
        setTimeout(() => {
          router.push('/admin/hero-sliders');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to create hero slider' });
      }
    } catch (error) {
      console.error('Error creating hero slider:', error);
      setMessage({ type: 'error', text: 'An error occurred while creating hero slider' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Added large empty space at top of page */}
      <div className="h-16"></div>
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Add New Hero Slider</h1>
        <p className="text-gray-600 dark:text-gray-400">Create a new hero slider with Arabic and English content</p>
      </div>
      
      {message && (
        <div className={`p-4 mb-6 rounded-md ${message.type === 'success' ? 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100' : 'bg-red-100 text-red-800 dark:bg-red-800 dark:text-red-100'}`}>
          {message.text}
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
                  placeholder="Write description in Arabic..."
                  language="ar"
                />
              </div>
              
              {/* Media Type */}
              <div className="mb-4">
                <label htmlFor="mediaType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Media Type
                </label>
                <select
                  id="mediaType"
                  name="mediaType"
                  value={mediaType}
                  onChange={(e) => setMediaType(e.target.value as 'image' | 'video')}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                >
                  <option value="image">Image</option>
                  <option value="video">Video</option>
                </select>
              </div>
              
              {/* Arabic Media */}
              {mediaType === 'image' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Featured Image (Arabic)
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
                          value={featuredImageUrl}
                          onChange={(e) => setFeaturedImageUrl(e.target.value)}
                          placeholder="Enter image URL"
                          className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                          dir="ltr"
                        />
                      </div>
                    </div>
                    {featuredImageUrl && (
                      <div className="mt-2">
                        <Image 
                          src={featuredImageUrl} 
                          alt="Featured" 
                          width={320}
                          height={160}
                          className="h-40 w-auto object-cover rounded" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label htmlFor="videoUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video URL (Arabic)
                  </label>
                  <input
                    type="url"
                    id="videoUrl"
                    name="videoUrl"
                    value={videoUrl}
                    onChange={(e) => setVideoUrl(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    dir="ltr"
                  />
                </div>
              )}
              
              {/* Arabic Link */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link (Arabic)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={linkText}
                    onChange={(e) => setLinkText(e.target.value)}
                    placeholder="Link text (Arabic)"
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    dir="rtl"
                  />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Link URL"
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                    dir="ltr"
                  />
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
                  placeholder="Write description in English..."
                  language="en"
                />
              </div>
              
              {/* English Media */}
              {mediaType === 'image' ? (
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Featured Image (English)
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
                          value={featuredImageUrlEn}
                          onChange={(e) => setFeaturedImageUrlEn(e.target.value)}
                          placeholder="Enter image URL"
                          className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                        />
                      </div>
                    </div>
                    {featuredImageUrlEn && (
                      <div className="mt-2">
                        <Image 
                          src={featuredImageUrlEn} 
                          alt="Featured" 
                          width={320}
                          height={160}
                          className="h-40 w-auto object-cover rounded" 
                        />
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="mb-4">
                  <label htmlFor="videoUrlEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Video URL (English)
                  </label>
                  <input
                    type="url"
                    id="videoUrlEn"
                    name="videoUrlEn"
                    value={videoUrlEn}
                    onChange={(e) => setVideoUrlEn(e.target.value)}
                    className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  />
                </div>
              )}
              
              {/* English Link */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Link (English)
                </label>
                <div className="space-y-2">
                  <input
                    type="text"
                    value={linkTextEn}
                    onChange={(e) => setLinkTextEn(e.target.value)}
                    placeholder="Link text (English)"
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                  <input
                    type="url"
                    value={linkUrl}
                    onChange={(e) => setLinkUrl(e.target.value)}
                    placeholder="Link URL"
                    className="w-full p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Common Fields */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-lg shadow-md">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Slider Settings</h2>
          
          {/* Order Rank */}
          <div className="mb-6">
            <label htmlFor="orderRank" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Order
            </label>
            <input
              type="number"
              id="orderRank"
              name="orderRank"
              value={orderRank}
              onChange={(e) => setOrderRank(parseInt(e.target.value) || 0)}
              min="0"
              className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Lower numbers will appear first.
            </p>
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
              'Create Hero Slider'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}