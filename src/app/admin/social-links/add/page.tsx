'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaSave, FaTimes, FaShare, FaYoutube, FaInstagram, 
  FaFacebookF, FaTiktok, FaLinkedin, FaSnapchat, FaPinterest, 
  FaReddit, FaWhatsapp, FaTelegram, FaGithub, FaBehance, 
  FaDribbble, FaMobileAlt, FaDesktop, FaApple, FaGooglePlay, 
  FaDownload 
} from 'react-icons/fa';

// أيقونة X مخصصة
const XIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

// أيقونة Threads مخصصة
const ThreadsIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" width="24" height="24">
    <path d="M12.186 24h-.007c-3.581-.024-6.346-2.609-6.38-6.019v-.73C2.078 16.242 0 13.75 0 10.792 0 7.642 2.437 5.016 5.531 4.72c.3-2.694 2.825-4.718 5.698-4.718.746 0 1.463.14 2.124.398l.093.037c.727.292 1.361.732 1.858 1.277l.068.075c.511-.25 1.088-.383 1.68-.383 1.043 0 2.024.485 2.663 1.331l.048.064c.387.514.591 1.13.591 1.774v11.534c0 3.438-2.765 6.023-6.346 6.047h-.072zM5.698 6.231c-2.051 0-3.72 1.67-3.72 3.72 0 2.051 1.669 3.72 3.72 3.72h.366v4.31c.024 2.404 1.983 4.363 4.387 4.387h.07c2.404-.024 4.363-1.983 4.387 4.387V4.514c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366h-1.488v-.366c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366h-1.488v-.366c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366h-1.488v-.366c0-.317-.098-.618-.282-.874l-.048-.064c-.321-.426-.832-.68-1.371-.68-.55 0-1.066.259-1.388.695l-.048.064c-.214.284-.332.635-.332 1.001v.366H5.698z"/>
  </svg>
);

// قائمة المنصات المتاحة
const availablePlatforms = [
  { value: 'youtube', label: 'YouTube', icon: FaYoutube },
  { value: 'instagram', label: 'Instagram', icon: FaInstagram },
  { value: 'facebook', label: 'Facebook', icon: FaFacebookF },
  { value: 'tiktok', label: 'TikTok', icon: FaTiktok },
  { value: 'x', label: 'X (Twitter)', icon: XIcon },
  { value: 'linkedin', label: 'LinkedIn', icon: FaLinkedin },
  { value: 'threads', label: 'Threads', icon: ThreadsIcon },
  { value: 'snapchat', label: 'Snapchat', icon: FaSnapchat },
  { value: 'pinterest', label: 'Pinterest', icon: FaPinterest },
  { value: 'reddit', label: 'Reddit', icon: FaReddit },
  { value: 'whatsapp', label: 'WhatsApp', icon: FaWhatsapp },
  { value: 'telegram', label: 'Telegram', icon: FaTelegram },
  { value: 'github', label: 'GitHub', icon: FaGithub },
  { value: 'behance', label: 'Behance', icon: FaBehance },
  { value: 'dribbble', label: 'Dribbble', icon: FaDribbble },
  { value: 'mobile_app', label: 'Mobile App', icon: FaMobileAlt },
  { value: 'desktop_app', label: 'Desktop App', icon: FaDesktop },
  { value: 'app_store', label: 'App Store', icon: FaApple },
  { value: 'google_play', label: 'Google Play', icon: FaGooglePlay },
  { value: 'download_link', label: 'Download Link', icon: FaDownload },
  { value: 'website', label: 'Website', icon: FaShare },
  { value: 'other', label: 'Other', icon: FaShare }
];

const AddSocialLinkPage = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    platform: '',
    url: '',
    isActive: true,
    order: 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isRTL, setIsRTL] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    
    // التحقق من تفضيل اللغة المحفوظ في localStorage
    const savedLanguage = localStorage.getItem('language');
    let detectedLanguage = 'ar'; // default to Arabic
    
    if (savedLanguage !== null) {
      detectedLanguage = savedLanguage;
    } else {
      const browserLang = navigator.language || (navigator as unknown as { userLanguage: string }).userLanguage || '';
      detectedLanguage = browserLang.includes('ar') ? 'ar' : 'en';
    }
    
    setIsRTL(detectedLanguage === 'ar');
    
    // تطبيق اتجاه الصفحة بناءً على اللغة
    document.documentElement.dir = detectedLanguage === 'ar' ? 'rtl' : 'ltr';
    document.documentElement.lang = detectedLanguage;
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch('/api/social-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to create social link');
        return;
      }

      setSuccess('تم تسجيل الرابط بنجاح');
      setFormData({ platform: '', url: '', isActive: true, order: 0 });
      
      setTimeout(() => {
        router.push('/admin/social-links');
      }, 1500);
    } catch (error) {
      console.error('Error creating social link:', error);
      setError('فشل في إضافة الرابط');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ 
      ...prev, 
      [name]: type === 'checkbox' ? checked : value 
    }));
  };

  const handleSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  if (!mounted) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4">
      {/* مسافة فارغة في الأعلى */}
      <div className="h-8 mb-6"></div>
      
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            {isRTL ? 'إضافة رابط اجتماعي جديد' : 'Add New Social Link'}
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            {isRTL ? 'أضف روابط جديد إلى قائمة التواصل الاجتماعي' : 'Add a new social link to your contact list'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="platform" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'المنصة' : 'Platform'}
                </label>
                <select
                  id="platform"
                  name="platform"
                  value={formData.platform}
                  onChange={handleSelectChange}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                >
                  <option value="">{isRTL ? 'اختر منصة...' : 'Select a platform...'}</option>
                  {availablePlatforms.map((platform) => (
                    <option key={platform.value} value={platform.value}>
                      {platform.label}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="url" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الرابط' : 'URL'}
                </label>
                <input
                  type="url"
                  id="url"
                  name="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder={isRTL ? 'https://example.com/...' : 'https://example.com/...'}
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  required
                />
              </div>

              <div>
                <label htmlFor="order" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {isRTL ? 'الترتيب' : 'Display Order'}
                </label>
                <input
                  type="number"
                  id="order"
                  name="order"
                  value={formData.order}
                  onChange={handleInputChange}
                  min="0"
                  className="w-full px-4 py-3 border-2 border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                />
              </div>

              <div className="flex items-center pt-6">
                <input
                  type="checkbox"
                  id="isActive"
                  name="isActive"
                  checked={formData.isActive}
                  onChange={handleInputChange}
                  className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                  {isRTL ? 'نشط' : 'Active'}
                </label>
              </div>
            </div>
          </div>

          {/* عرض الرسائل */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
              <p className="text-red-600 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* عرض رسالة النجاح */}
          {success && (
            <div className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
              <p className="text-green-600 dark:text-green-400">{success}</p>
            </div>
          )}

          <div className="flex justify-center gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-full transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white mr-3"></div>
                  <span className="text-white">{isRTL ? 'جاري الإضافة...' : 'Adding...'}</span>
                </>
              ) : (
                <>
                  <FaSave className="mr-2" />
                  <span>{isRTL ? 'حفظ' : 'Save'}</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => router.back()}
              className="flex items-center justify-center bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-medium py-3 px-6 rounded-full transition-all duration-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <FaTimes className={`mr-2 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              <span>{isRTL ? 'إلغاء' : 'Cancel'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddSocialLinkPage;