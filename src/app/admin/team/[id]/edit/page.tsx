'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Upload, Link as LinkIcon, Image as ImageIcon, Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Palette, Highlighter } from 'lucide-react';
import Image from 'next/image';

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

export default function EditTeamMemberPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [imageUrl, setImageUrl] = useState('');
  const [imageUrlEn, setImageUrlEn] = useState('');
  const [name, setName] = useState('');
  const [nameEn, setNameEn] = useState('');
  const [role, setRole] = useState('');
  const [roleEn, setRoleEn] = useState('');
  const [bio, setBio] = useState('');
  const [bioEn, setBioEn] = useState('');
  const [slug, setSlug] = useState('');
  const [order, setOrder] = useState(0);
  const [socialMedia, setSocialMedia] = useState<{ platform: string; url: string }[]>([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingEn, setIsUploadingEn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const fileInputEnRef = useRef<HTMLInputElement>(null);

  // Fetch team member data on component mount
  useEffect(() => {
    const fetchTeamMember = async () => {
      try {
        const response = await fetch(`/api/team/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch team member');
        }
        const data = await response.json();
        const teamMember = data.teamMember;
        
        setName(teamMember.name || '');
        setNameEn(teamMember.nameEn || '');
        setRole(teamMember.role || '');
        setRoleEn(teamMember.roleEn || '');
        setBio(teamMember.bio || '');
        setBioEn(teamMember.bioEn || '');
        setImageUrl(teamMember.imageUrl || '');
        setImageUrlEn(teamMember.imageUrlEn || '');
        setSlug(teamMember.slug || '');
        setOrder(teamMember.order || 0);
        setSocialMedia(teamMember.socialMedia || []);
      } catch (error) {
        console.error('Error fetching team member:', error);
        setMessage({ type: 'error', text: 'Failed to load team member' });
      } finally {
        setIsFetching(false);
      }
    };

    fetchTeamMember();
  }, [id]);

  // Generate slug from name when name changes
  const generateSlug = () => {
    if (nameEn || name) {
      const nameToUse = nameEn || name;
      const generatedSlug = nameToUse
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
      setSlug(generatedSlug);
    }
  };

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
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>, isEnglish: boolean = false) => {
    const file = e.target.files?.[0];
    if (file) {
      await handleImageUpload(file, isEnglish);
    }
  };

  const handleSocialMediaChange = (index: number, field: 'platform' | 'url', value: string) => {
    const updatedSocialMedia = [...socialMedia];
    updatedSocialMedia[index][field] = value;
    setSocialMedia(updatedSocialMedia);
  };

  const addSocialMediaLink = () => {
    setSocialMedia([...socialMedia, { platform: '', url: '' }]);
  };

  const removeSocialMediaLink = (index: number) => {
    setSocialMedia(socialMedia.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const teamMemberData = {
      name,
      nameEn,
      role,
      roleEn,
      bio,
      bioEn,
      imageUrl,
      imageUrlEn,
      slug,
      order,
      socialMedia,
    };

    try {
      const response = await fetch(`/api/team/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(teamMemberData),
      });
      
      const result = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Team member updated successfully!' });
        setTimeout(() => {
          router.push('/admin/team');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update team member' });
      }
    } catch (error) {
      console.error('Error updating team member:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating team member' });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isFetching) {
    return (
      <div className="max-w-6xl mx-auto p-6 flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Added large empty space at top of page */}
      <div className="h-16"></div>
      
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Edit Team Member</h1>
        <p className="text-gray-600 dark:text-gray-400">Update team member with Arabic and English content</p>
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
              
              {/* Arabic Name */}
              <div className="mb-4">
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name (Arabic)
                </label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  dir="rtl"
                />
              </div>
              
              {/* Arabic Role */}
              <div className="mb-4">
                <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role (Arabic)
                </label>
                <input
                  type="text"
                  id="role"
                  name="role"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  dir="rtl"
                />
              </div>
              
              {/* Arabic Bio */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio (Arabic)
                </label>
                <SimpleTextEditor
                  content={bio}
                  onChange={setBio}
                  placeholder="Write a brief bio in Arabic..."
                  language="ar"
                />
              </div>
              
              {/* Image (Arabic) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Image (Arabic)
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
                        alt="Profile" 
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
              
              {/* English Name */}
              <div className="mb-4">
                <label htmlFor="nameEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Name (English)
                </label>
                <input
                  type="text"
                  id="nameEn"
                  name="nameEn"
                  required
                  value={nameEn}
                  onChange={(e) => setNameEn(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              {/* English Role */}
              <div className="mb-4">
                <label htmlFor="roleEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Role (English)
                </label>
                <input
                  type="text"
                  id="roleEn"
                  name="roleEn"
                  value={roleEn}
                  onChange={(e) => setRoleEn(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              {/* English Bio */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Bio (English)
                </label>
                <SimpleTextEditor
                  content={bioEn}
                  onChange={setBioEn}
                  placeholder="Write a brief bio in English..."
                  language="en"
                />
              </div>
              
              {/* Image (English) */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Profile Image (English)
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
                        alt="Profile" 
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
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Team Member Settings</h2>
          
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
              This will be used in URL. It&apos;s automatically generated from name.
            </p>
          </div>
          
          {/* Order */}
          <div className="mb-6">
            <label htmlFor="order" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Display Order
            </label>
            <input
              type="number"
              id="order"
              name="order"
              value={order}
              onChange={(e) => setOrder(parseInt(e.target.value))}
              className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            />
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Lower numbers will appear first in team listing.
            </p>
          </div>
          
          {/* Social Media Links */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Social Media Links
              </label>
              <button
                type="button"
                onClick={addSocialMediaLink}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                Add Link
              </button>
            </div>
            
            {socialMedia.length > 0 ? (
              <div className="space-y-3">
                {socialMedia.map((link, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <select
                      value={link.platform}
                      onChange={(e) => handleSocialMediaChange(index, 'platform', e.target.value)}
                      className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    >
                      <option value="">Select Platform</option>
                      <option value="facebook">Facebook</option>
                      <option value="twitter">Twitter</option>
                      <option value="instagram">Instagram</option>
                      <option value="linkedin">LinkedIn</option>
                      <option value="youtube">YouTube</option>
                      <option value="tiktok">TikTok</option>
                    </select>
                    
                    <input
                      type="url"
                      value={link.url}
                      onChange={(e) => handleSocialMediaChange(index, 'url', e.target.value)}
                      placeholder="URL"
                      className="flex-1 p-2 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                    />
                    
                    <button
                      type="button"
                      onClick={() => removeSocialMediaLink(index)}
                      className="p-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 dark:text-gray-400">No social media links added yet.</p>
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
                Updating...
              </>
            ) : (
              'Update Team Member'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}