'use client';

import { useState, useRef, FormEvent, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { Link as LinkIcon, Image as ImageIcon, Bold, Italic, List, ListOrdered, Quote, Heading1, Heading2, Heading3, Palette, Highlighter } from 'lucide-react';

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

export default function EditFAQPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [question, setQuestion] = useState('');
  const [questionEn, setQuestionEn] = useState('');
  const [answer, setAnswer] = useState('');
  const [answerEn, setAnswerEn] = useState('');
  const [category, setCategory] = useState('');
  const [categoryEn, setCategoryEn] = useState('');
  const [isFetching, setIsFetching] = useState(true);

  // Fetch FAQ data on component mount
  useEffect(() => {
    const fetchFAQ = async () => {
      try {
        const response = await fetch(`/api/faqs/${id}`);
        if (!response.ok) {
          throw new Error('Failed to fetch FAQ');
        }
        const result = await response.json();
        
        if (result.success) {
          const faq = result.data;
          setQuestion(faq.question || '');
          setQuestionEn(faq.questionEn || '');
          setAnswer(faq.answer || '');
          setAnswerEn(faq.answerEn || '');
          setCategory(faq.category || '');
          setCategoryEn(faq.categoryEn || '');
        } else {
          throw new Error(result.error || 'Failed to load FAQ');
        }
      } catch (error) {
        console.error('Error fetching FAQ:', error);
        setMessage({ type: 'error', text: 'Failed to load FAQ' });
      } finally {
        setIsFetching(false);
      }
    };

    fetchFAQ();
  }, [id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage(null);

    const faqData = {
      question,
      questionEn,
      answer,
      answerEn,
      category,
      categoryEn,
    };

    try {
      const response = await fetch(`/api/faqs/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(faqData),
      });
      
      const result = await response.json();

      if (response.ok && result.success) {
        setMessage({ type: 'success', text: 'FAQ updated successfully!' });
        setTimeout(() => {
          router.push('/admin/faqs');
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.error || 'Failed to update FAQ' });
      }
    } catch (error) {
      console.error('Error updating FAQ:', error);
      setMessage({ type: 'error', text: 'An error occurred while updating FAQ' });
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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Edit FAQ</h1>
        <p className="text-gray-600 dark:text-gray-400">Update FAQ with Arabic and English content</p>
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
              
              {/* Arabic Question */}
              <div className="mb-4">
                <label htmlFor="question" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question (Arabic)
                </label>
                <input
                  type="text"
                  id="question"
                  name="question"
                  required
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  dir="rtl"
                />
              </div>
              
              {/* Arabic Answer */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Answer (Arabic)
                </label>
                <SimpleTextEditor
                  content={answer}
                  onChange={setAnswer}
                  placeholder="Write the answer in Arabic..."
                  language="ar"
                />
              </div>
              
              {/* Arabic Category */}
              <div className="mb-4">
                <label htmlFor="category" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category (Arabic)
                </label>
                <input
                  type="text"
                  id="category"
                  name="category"
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  dir="rtl"
                  placeholder="e.g., تقني، عام، فواتير"
                />
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
              
              {/* English Question */}
              <div className="mb-4">
                <label htmlFor="questionEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Question (English)
                </label>
                <input
                  type="text"
                  id="questionEn"
                  name="questionEn"
                  required
                  value={questionEn}
                  onChange={(e) => setQuestionEn(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              {/* English Answer */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Answer (English)
                </label>
                <SimpleTextEditor
                  content={answerEn}
                  onChange={setAnswerEn}
                  placeholder="Write the answer in English..."
                  language="en"
                />
              </div>
              
              {/* English Category */}
              <div className="mb-4">
                <label htmlFor="categoryEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Category (English)
                </label>
                <input
                  type="text"
                  id="categoryEn"
                  name="categoryEn"
                  required
                  value={categoryEn}
                  onChange={(e) => setCategoryEn(e.target.value)}
                  className="w-full p-3 border border-gray-300 rounded-md dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="e.g., Technical, General, Billing"
                />
              </div>
            </div>
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
              'Update FAQ'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}