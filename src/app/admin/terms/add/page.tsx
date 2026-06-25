'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { FaSave, FaTimes } from 'react-icons/fa';

export default function AddTermsPage() {
  const router = useRouter();
  
  // الحالة الأولية للنموذج
  // ملاحظة: lastUpdated يمكن تهيئته بـ ISO string أو تاريخ يوم فقط، سنقوم بتحويله عند الإرسال
  const [formData, setFormData] = useState({
    sectionType: 'mainTerms',
    title: '',
    titleEn: '',
    content: '',
    contentEn: '',
    term: '',
    termEn: '',
    definition: '',
    definitionEn: '',
    icon: '',
    rightsType: 'USER_RIGHTS', 
    items: [{ item: '', itemEn: '' }],
    color: 'bg-blue-50',
    borderColor: 'border-blue-100',
    description: '',
    descriptionEn: '',
    linkText: '',
    linkTextEn: '',
    linkUrl: '',
    siteTitle: '',
    siteTitleEn: '',
    siteDescription: '',
    siteDescriptionEn: '',
    footerText: '',
    footerTextEn: '',
    lastUpdated: new Date().toISOString(), // تنسيق ISO كامل للتهيئة
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // معالجة التغيير في الحقول العادية
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // معالجة تغيير نوع القسم
  const handleSectionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { value } = e.target;
    setFormData(prev => ({
      ...prev,
      sectionType: value,
      title: '', titleEn: '', content: '', contentEn: '',
      term: '', termEn: '', definition: '', definitionEn: '',
      description: '', descriptionEn: '', linkText: '', linkTextEn: '', linkUrl: '',
      siteTitle: '', siteTitleEn: '', siteDescription: '', siteDescriptionEn: '',
      footerText: '', footerTextEn: '',
      items: [{ item: '', itemEn: '' }],
    }));
  };

  const handleItemChange = (index: number, field: 'item' | 'itemEn', value: string) => {
    const updatedItems = [...formData.items];
    updatedItems[index][field] = value;
    setFormData(prev => ({ ...prev, items: updatedItems }));
  };

  const addItem = () => {
    setFormData(prev => ({ 
      ...prev, 
      items: [...prev.items, { item: '', itemEn: '' }] 
    }));
  };

  const removeItem = (index: number) => {
    if (formData.items.length > 1) {
      const updatedItems = formData.items.filter((_, i) => i !== index);
      setFormData(prev => ({ ...prev, items: updatedItems }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // تحضير البيانات للإرسال
      // 1. تحويل التاريخ إلى صيغة ISO كاملة لإصلاح خطأ Prisma
      // 2. تصفية العناصر الفارغة لتجنب إنشاء صفوف غير ضرورية
      const payload = {
        ...formData,
        lastUpdated: new Date(formData.lastUpdated).toISOString(),
        items: formData.items.filter(i => i.item.trim() !== '')
      };

      const response = await fetch('/api/terms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || 'فشل إضافة المحتوى');
      }

      setSuccess('تم إضافة المحتوى بنجاح!');
      
      setTimeout(() => {
        router.push('/admin/terms');
      }, 2000);

    } catch (err: unknown) {
      const error = err instanceof Error ? err : new Error('حدث خطأ غير معروف');
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // تحديد الحقول بناءً على نوع القسم
  const renderSectionFields = () => {
    switch (formData.sectionType) {
      case 'mainTerms':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  العنوان (عربي)
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="titleEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  العنوان (إنجليزي)
                </label>
                <input
                  type="text"
                  name="titleEn"
                  id="titleEn"
                  required
                  value={formData.titleEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="content" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  المحتوى (عربي) - HTML/Text
                </label>
                <textarea
                  name="content"
                  id="content"
                  required
                  rows={8}
                  value={formData.content}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                ></textarea>
              </div>

              <div>
                <label htmlFor="contentEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  المحتوى (إنجليزي) - HTML/Text
                </label>
                <textarea
                  name="contentEn"
                  id="contentEn"
                  required
                  rows={8}
                  value={formData.contentEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white font-mono text-sm"
                ></textarea>
              </div>
            </div>

            <div>
              <label htmlFor="lastUpdated" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                تاريخ آخر تحديث
              </label>
              <input
                type="date"
                name="lastUpdated"
                id="lastUpdated"
                required
                value={formData.lastUpdated.split('T')[0]} // عرض التاريخ فقط في الحقل
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </>
        );

      case 'legalTerm':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="term" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  المصطلح (عربي)
                </label>
                <input
                  type="text"
                  name="term"
                  id="term"
                  required
                  value={formData.term}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="termEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  المصطلح (إنجليزي)
                </label>
                <input
                  type="text"
                  name="termEn"
                  id="termEn"
                  required
                  value={formData.termEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="definition" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  التعريف (عربي)
                </label>
                <textarea
                  name="definition"
                  id="definition"
                  required
                  rows={5}
                  value={formData.definition}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label htmlFor="definitionEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  التعريف (إنجليزي)
                </label>
                <textarea
                  name="definitionEn"
                  id="definitionEn"
                  required
                  rows={5}
                  value={formData.definitionEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
            </div>

            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                الأيقونة (Emoji)
              </label>
              <input
                type="text"
                name="icon"
                id="icon"
                required
                placeholder="مثال: 📝"
                value={formData.icon}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </>
        );

      case 'rightsResponsibility':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  العنوان (عربي)
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="titleEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  العنوان (إنجليزي)
                </label>
                <input
                  type="text"
                  name="titleEn"
                  id="titleEn"
                  required
                  value={formData.titleEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label htmlFor="rightsType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  نوع الحقوق/المسؤوليات
                </label>
                <select
                  name="rightsType"
                  id="rightsType"
                  required
                  value={formData.rightsType}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="USER_RIGHTS">حقوق المستخدم</option>
                  <option value="USER_RESPONSIBILITIES">مسؤوليات المستخدم</option>
                  <option value="COMPANY_RIGHTS">حقوق الشركة</option>
                </select>
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                  <option value="bg-green-50">أخضر</option>
                  <option value="bg-yellow-50">أصفر</option>
                  <option value="bg-blue-50">أزرق</option>
                </select>
              </div>

              <div>
                <label htmlFor="borderColor" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  لون الحدود
                </label>
                <select
                  name="borderColor"
                  id="borderColor"
                  required
                  value={formData.borderColor}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                >
                  <option value="border-green-200">أخضر</option>
                  <option value="border-yellow-200">أصفر</option>
                  <option value="border-blue-200">أزرق</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                الأيقونة (Emoji)
              </label>
              <input
                type="text"
                name="icon"
                id="icon"
                required
                placeholder="مثال: ⚖️"
                value={formData.icon}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
                العناصر
              </label>
              {formData.items.map((item, index) => (
                <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <input
                      type="text"
                      value={item.item}
                      onChange={(e) => handleItemChange(index, 'item', e.target.value)}
                      placeholder="العنصر (عربي)"
                      className="block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div className="flex">
                    <input
                      type="text"
                      value={item.itemEn}
                      onChange={(e) => handleItemChange(index, 'itemEn', e.target.value)}
                      placeholder="العنصر (إنجليزي)"
                      className="block flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                    />
                    {formData.items.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="ml-2 px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>
                </div>
              ))}
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                إضافة عنصر جديد
              </button>
            </div>
          </>
        );

      case 'additionalPolicy':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  العنوان (عربي)
                </label>
                <input
                  type="text"
                  name="title"
                  id="title"
                  required
                  value={formData.title}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="titleEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  العنوان (إنجليزي)
                </label>
                <input
                  type="text"
                  name="titleEn"
                  id="titleEn"
                  required
                  value={formData.titleEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                <label htmlFor="descriptionEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
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
                <label htmlFor="linkText" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  نص الرابط (عربي)
                </label>
                <input
                  type="text"
                  name="linkText"
                  id="linkText"
                  required
                  value={formData.linkText}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="linkTextEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  نص الرابط (إنجليزي)
                </label>
                <input
                  type="text"
                  name="linkTextEn"
                  id="linkTextEn"
                  required
                  value={formData.linkTextEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  رابط السياسة
                </label>
                <input
                  type="url"
                  name="linkUrl"
                  id="linkUrl"
                  required
                  value={formData.linkUrl}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label htmlFor="icon" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                الأيقونة (Emoji)
              </label>
              <input
                type="text"
                name="icon"
                id="icon"
                required
                placeholder="مثال: 📋"
                value={formData.icon}
                onChange={handleChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              />
            </div>
          </>
        );

      case 'siteSettings':
        return (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="siteTitle" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  عنوان الموقع (عربي)
                </label>
                <input
                  type="text"
                  name="siteTitle"
                  id="siteTitle"
                  required
                  value={formData.siteTitle}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="siteTitleEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  عنوان الموقع (إنجليزي)
                </label>
                <input
                  type="text"
                  name="siteTitleEn"
                  id="siteTitleEn"
                  required
                  value={formData.siteTitleEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  وصف الموقع (عربي)
                </label>
                <textarea
                  name="siteDescription"
                  id="siteDescription"
                  required
                  rows={5}
                  value={formData.siteDescription}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label htmlFor="siteDescriptionEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  وصف الموقع (إنجليزي)
                </label>
                <textarea
                  name="siteDescriptionEn"
                  id="siteDescriptionEn"
                  required
                  rows={5}
                  value={formData.siteDescriptionEn}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                ></textarea>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="footerText" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  نص التذييل (عربي)
                </label>
                <input
                  type="text"
                  name="footerText"
                  id="footerText"
                  required
                  value={formData.footerText}
                  onChange={handleChange}
                  className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
                />
              </div>

              <div>
                <label htmlFor="footerTextEn" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  نص التذييل (إنجليزي)
                </label>
                <input
                  type="text"
                  name="footerTextEn"
                  id="footerTextEn"
                  required
                  value={formData.footerTextEn}
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
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-extrabold text-gray-900 dark:text-white">
            إضافة محتوى جديد للشروط والأحكام
          </h1>
          <p className="mt-3 text-xl text-gray-500 dark:text-gray-400">
            املأ النموذج أدناه لإضافة محتوى جديد إلى قسم الشروط والأحكام.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-800 shadow-xl rounded-lg p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="sectionType" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                نوع القسم
              </label>
              <select
                name="sectionType"
                id="sectionType"
                required
                value={formData.sectionType}
                onChange={handleSectionChange}
                className="mt-1 block w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 dark:bg-gray-700 dark:text-white"
              >
                <option value="mainTerms">الشروط والأحكام الرئيسية</option>
                <option value="legalTerm">مصطلح قانوني</option>
                <option value="rightsResponsibility">الحقوق والمسؤوليات</option>
                <option value="additionalPolicy">سياسة إضافية</option>
                <option value="siteSettings">إعدادات الموقع</option>
              </select>
            </div>

            {renderSectionFields()}

            {/* عرض الرسائل */}
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

            {/* أزرار الإرسال */}
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