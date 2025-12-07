"use client";
import React, { useState, useEffect } from 'react';
import Image, { ImageProps } from 'next/image';

// تم تحسين الواجهة لترث من ImageProps مع إضافة الخاصية المخصصة
// قمنا بإزالة 'onError' لأننا نتعامل معها داخل هذا المكون
interface ImageWithFallbackProps extends Omit<ImageProps, 'onError'> {
  fallbackSrc?: string;
}

export default function ImageWithFallback({ 
  src, 
  alt, 
  fallbackSrc = "/placeholder.png",
  ...props 
}: ImageWithFallbackProps) {
  const [imgSrc, setImgSrc] = useState(src);
  const [key, setKey] = useState(0); // لإجبار إعادة تحميل الصورة

  useEffect(() => {
    // عند تغير src، قم بتحديث الحالة وأجبر إعادة التحميل
    setImgSrc(src);
    setKey(prev => prev + 1); // تغيير المفتاح لإجبار إعادة التحميل
  }, [src]);

  const handleError = () => {
    // فقط استبدل بالصورة البديلة إذا لم تكن هي الصورة البديلة بالفعل
    if (imgSrc !== fallbackSrc) {
      setImgSrc(fallbackSrc);
      setKey(prev => prev + 1); // تغيير المفتاح لإجبار إعادة التحميل
    }
  };

  // --- بداية التعديل الجديد ---
  // إنشاء كائن للخصائص التي سنمررها لمكون Image
  const imageProps = { ...props };

  // التحقق مما إذا كانت خصائص العرض والارتفاع أو الخاصية fill مفقودة
  if (!imageProps.width && !imageProps.height && !imageProps.fill) {
    console.error(
      `خطأ: مكون ImageWithFallback المصدر "${src}" يفتقد إلى خصائص "width" و "height" المطلوبة. ` +
      `تم تطبيق حجم افتراضي 100x100، وهذا قد يسبب مشاكل في التخطيط. ` +
      `يرجى توفير خصائص "width" و "height" بشكل صريح أو استخدام خاصية "fill".`
    );
    // تطبيق قيم افتراضية لمنع الخطأ
    imageProps.width = 100;
    imageProps.height = 100;
  }
  // --- نهاية التعديل الجديد ---

  return (
    <Image
      key={key} // استخدام المفتاح لإجبار إعادة التحميل
      src={imgSrc}
      alt={alt}
      onError={handleError}
      unoptimized={true} // من الأفضل إبقاؤها افتراضيًا للصور الخارجية
      {...imageProps} // تمرير الخصائص المعدلة
    />
  );
}