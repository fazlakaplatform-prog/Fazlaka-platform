// src/types/faq.ts
import { FAQ as PrismaFAQ } from '@prisma/client';

// نقوم بتوسيع النوع الأصلي بإضافة الحقول المترجمة
export interface FAQ extends PrismaFAQ {
  localizedQuestion?: string;
  localizedAnswer?: string;
  localizedCategory?: string;
}