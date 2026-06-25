// src/types/article.ts
import { Article as PrismaArticle } from '@prisma/client';

// نستخدم النوع المولد من Prisma كأساس لضمان التوافق مع قاعدة البيانات
// Prisma يستخدم null للحقول الاختيارية، بينما قد تكون الواجهات القديمة تستخدم undefined
export type Article = PrismaArticle;