'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaTimes } from 'react-icons/fa';

// ✅ تم تحديث _id إلى id و sectionType إلى UPPER_SNAKE_CASE
interface PrivacyContent {
  id: string;
  sectionType: 'MAIN_POLICY' | 'USER_RIGHT' | 'DATA_TYPE' | 'SECURITY_MEASURE';
  title: string;
  titleEn: string;
  content?: string;
  contentEn?: string;
  description?: string;
  descriptionEn?: string;
  icon?: string;
  color?: string;
  textColor?: string;
  lastUpdated?: string;
  createdAt: string;
  updatedAt: string;
}

export default function EditPrivacyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [fetchLoading, setFetchLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<PrivacyContent>>({
    sectionType: 'MAIN_POLICY',
    title: '',
    titleEn: '',
    content: '',
    contentEn: '',
    description: '',
    descriptionEn: '',
    icon: '',
    color: 'bg-blue-50',
    textColor: 'text-blue-800',
    lastUpdated: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    if (!id) return;
    
    const fetchPrivacyContent = async () => {
      try {
        setFetchLoading(true);
        setError(null);
        
        const response = await fetch(`/api/privacy/${id}`);
        const result = await response.json();
        
        if (!response.ok || !result.success) {
          setError(result.error || 'Failed to fetch privacy content');
          return;
        }
        
        const data = result.data;
        
        // ✅ تحويل sectionType القديم إلى الجديد إذا لزم الأمر
        let sectionType = data.sectionType || 'MAIN_POLICY';
        switch (data.sectionType) {
          case 'mainPolicy':
            sectionType = 'MAIN_POLICY';
            break;
          case 'userRight':
            sectionType = 'USER_RIGHT';
            break;
          case 'dataType':
            sectionType = 'DATA_TYPE';
            break;
          case 'securityMeasure':
            sectionType = 'SECURITY_MEASURE';
            break;
        }
        
        setFormData({
          sectionType: sectionType as PrivacyContent['sectionType'],
          title: data.title || '',
          titleEn: data.titleEn || '',
          content: data.content || '',
          contentEn: data.contentEn || '',
          description: data.description || '',
          descriptionEn: data.descriptionEn || '',
          icon: data.icon || '',
          color: data.color || 'bg-blue-50',
          textColor: data.textColor || 'text-blue-800',
          lastUpdated: data.lastUpdated || new Date().toISOString().split('T')[0],
        });
      } catch (error) {
        console.error('Error fetching privacy content:', error);
        setError('Error fetching privacy content');
      } finally {
        setFetchLoading(false);
      }
    };

    fetchPrivacyContent();
  }, [id]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/privacy/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || 'Failed to update privacy content');
        return;
      }

      setSuccess('تم تحديث المحتوى بنجاح!');
      
      setTimeout(() => {
        router.push('/admin/privacy');
      }, 1500);
    } catch (error) {
      console.error('Error updating privacy content:', error);
      setError('فشل في تحديث المحتوى');
    } finally {
      setIsLoading(false);
    }
  };

  // تحديد الحقول التي يجب عرضها بناءً على نوع القسم
  const renderSectionFields = () => {
    switch (formData.sectionType) {
      case 'MAIN_POLICY':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  العنوان (عربي)
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="titleEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  العنوان (إنجليزي)
                </label>
                <input
                  type="text"
                  id="titleEn"
                  name="titleEn"
                  required
                  value={formData.titleEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  المحتوى (عربي)
                </label>
                <textarea
                  name="content"
                  id="content"
                  required
                  rows={8}
                  value={formData.content}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label htmlFor="contentEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  المحتوى (إنجليزي)
                </label>
                <textarea
                  name="contentEn"
                  id="contentEn"
                  required
                  rows={8}
                  value={formData.contentEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
            </div>

            <div>
              <label htmlFor="lastUpdated" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                تاريخ آخر تحديث
              </label>
              <input
                type="date"
                name="lastUpdated"
                id="lastUpdated"
                required
                value={formData.lastUpdated}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </>
        );

      case 'USER_RIGHT':
      case 'SECURITY_MEASURE':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  العنوان (عربي)
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="titleEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  العنوان (إنجليزي)
                </label>
                <input
                  type="text"
                  id="titleEn"
                  name="titleEn"
                  required
                  value={formData.titleEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الوصف (عربي)
                </label>
                <textarea
                  name="description"
                  id="description"
                  required
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label htmlFor="descriptionEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الوصف (إنجليزي)
                </label>
                <textarea
                  name="descriptionEn"
                  id="descriptionEn"
                  required
                  rows={5}
                  value={formData.descriptionEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
            </div>

            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                الأيقونة (Emoji)
              </label>
              <input
                type="text"
                name="icon"
                id="icon"
                required
                placeholder="مثال: 👤"
                value={formData.icon}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </>
        );

      case 'DATA_TYPE':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  العنوان (عربي)
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="titleEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  العنوان (إنجليزي)
                </label>
                <input
                  type="text"
                  id="titleEn"
                  name="titleEn"
                  required
                  value={formData.titleEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الوصف (عربي)
                </label>
                <textarea
                  name="description"
                  id="description"
                  required
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label htmlFor="descriptionEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الوصف (إنجليزي)
                </label>
                <textarea
                  name="descriptionEn"
                  id="descriptionEn"
                  required
                  rows={5}
                  value={formData.descriptionEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  لون الخلفية
                </label>
                <select
                  name="color"
                  id="color"
                  required
                  value={formData.color}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="bg-blue-100">أزرق</option>
                  <option value="bg-green-100">أخضر</option>
                  <option value="bg-purple-100">بنفسجي</option>
                  <option value="bg-yellow-100">أصفر</option>
                </select>
              </div>

              <div>
                <label htmlFor="textColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  لون النص
                </label>
                <select
                  name="textColor"
                  id="textColor"
                  required
                  value={formData.textColor}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="text-blue-800">أزرق</option>
                  <option value="text-green-800">أخضر</option>
                  <option value="text-purple-800">بنفسجي</option>
                  <option value="text-yellow-800">أصفر</option>
                </select>
              </div>

              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  الأيقونة (Emoji)
                </label>
                <input
                  type="text"
                  name="icon"
                  id="icon"
                  required
                  placeholder="مثال: 📊"
                  value={formData.icon}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </>
        );

      default:
        return null;
    }
  };

  if (fetchLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="h-8 mb-6"></div>
      
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            تعديل محتوى سياسة الخصوصية
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            قم بتعديل معلومات محتوى سياسة الخصوصية
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="sectionType" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                نوع القسم
              </label>
              <select
                id="sectionType"
                name="sectionType"
                required
                value={formData.sectionType}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                {/* ✅ تم تحديث القيم */}
                <option value="MAIN_POLICY">سياسة الخصوصية الرئيسية</option>
                <option value="USER_RIGHT">حقوق المستخدم</option>
                <option value="DATA_TYPE">أنواع البيانات</option>
                <option value="SECURITY_MEASURE">إجراءات أمنية</option>
              </select>
            </div>

            {renderSectionFields()}

            {error && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-center">
                <p className="text-red-600 dark:text-red-400">{error}</p>
              </div>
            )}

            {success && (
              <div className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800 rounded-xl p-4 text-center">
                <p className="text-green-600 dark:text-green-400">{success}</p>
              </div>
            )}

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaTimes className="ml-2" />
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                    جاري التحديث...
                  </>
                ) : (
                  <>
                    <FaSave className="ml-2" />
                    حفظ التغييرات
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
