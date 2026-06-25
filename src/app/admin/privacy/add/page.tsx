'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaTimes } from 'react-icons/fa';

// ✅ تم تحديث sectionType إلى UPPER_SNAKE_CASE
interface PrivacyContent {
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
}

export default function AddPrivacyPage() {
  const router = useRouter();
  const [formData, setFormData] = useState<Partial<PrivacyContent>>({
    sectionType: 'MAIN_POLICY', // ✅ القيمة الافتراضية بالتنسيق الجديد
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

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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
      const response = await fetch('/api/privacy', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'فشل إضافة المحتوى');
      }

      setSuccess('تم إضافة المحتوى بنجاح!');
      
      // إعادة تعيين النموذج
      setFormData({
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
      
      // إعادة التوجيه بعد ثانيتين
      setTimeout(() => {
        router.push('/admin/privacy');
      }, 2000);

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'حدث خطأ غير متوقع';
      setError(errorMessage);
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="h-8 mb-6"></div>
      
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            إضافة محتوى جديد لسياسة الخصوصية
          </h1>
          <p className="mt-3 text-xl text-gray-500 dark:text-gray-400">
            املأ النموذج أدناه لإضافة محتوى جديد إلى قسم سياسة الخصوصية.
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
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">خطأ!</strong>
                <span className="block sm:inline"> {error}</span>
              </div>
            )}

            {success && (
              <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded relative" role="alert">
                <strong className="font-bold">نجاح!</strong>
                <span className="block sm:inline"> {success}</span>
              </div>
            )}

            <div className="flex justify-end space-x-4 space-x-reverse">
              <button
                type="button"
                onClick={() => router.back()}
                className="inline-flex items-center px-6 py-3 border border-gray-300 dark:border-gray-600 shadow-sm text-sm font-medium rounded-md text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FaTimes className="ml-2" />
                إلغاء
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {isLoading ? (
                  'جاري الحفظ...'
                ) : (
                  <>
                    <FaSave className="ml-2" />
                    حفظ المحتوى
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
