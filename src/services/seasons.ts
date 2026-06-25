// src/services/seasons.ts
import { prisma } from '@/lib/prisma';

// دالة محلية لتوليد الـ Slug
function generateLocalSlug(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

interface CreateSeasonData {
  title: string;
  titleEn?: string;
  slug?: string;
  description?: string;
  descriptionEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  episodes?: string[];
  articles?: string[];
  publishedAt?: string | Date;
}

interface UpdateSeasonData {
  title?: string;
  titleEn?: string;
  slug?: string;
  description?: string;
  descriptionEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  episodes?: string[];
  articles?: string[];
  publishedAt?: string | Date;
}

// تعريف واجهة لبيانات تحديث Prisma
interface PrismaSeasonUpdateData {
  title?: string;
  titleEn?: string;
  description?: string;
  descriptionEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  publishedAt?: Date;
  slug?: string;
  episodes?: { set: { id: string }[] };
  articles?: { set: { id: string }[] };
}

export async function getSeasons(_language: string = 'ar') {
  try {
    const seasons = await prisma.season.findMany({
      include: {
        episodes: { select: { id: true, title: true, titleEn: true, slug: true } },
        articles: { select: { id: true, title: true, titleEn: true, slug: true } },
        _count: { select: { episodes: true, articles: true } }
      },
      orderBy: { createdAt: 'desc' }
    });
    return seasons;
  } catch (error) {
    console.error('Error fetching seasons:', error);
    throw error;
  }
}

export async function getSeasonBySlug(slug: string, _language: string = 'ar') {
  try {
    const season = await prisma.season.findUnique({
      where: { slug },
      include: { episodes: true, articles: true }
    });
    return season;
  } catch (error) {
    console.error('Error fetching season:', error);
    throw error;
  }
}

export async function createSeason(data: CreateSeasonData) {
  try {
    const { episodes, articles, publishedAt, title, titleEn, slug: inputSlug, description, descriptionEn, thumbnailUrl, thumbnailUrlEn } = data;
    const publishedAtDate = publishedAt ? new Date(publishedAt) : new Date();
    
    // التعامل مع titleEn: إذا كان مطلوبًا في Prisma، نستخدم title كبديل إذا لم يتوفر titleEn
    const finalTitleEn = titleEn || title;
    const slug = inputSlug || generateLocalSlug(finalTitleEn);

    const newSeason = await prisma.season.create({
      data: {
        title,
        titleEn: finalTitleEn,
        slug,
        description,
        descriptionEn,
        thumbnailUrl,
        thumbnailUrlEn,
        publishedAt: publishedAtDate,
        ...(episodes && episodes.length > 0 && {
          episodes: { connect: episodes.map(id => ({ id })) }
        }),
        ...(articles && articles.length > 0 && {
          articles: { connect: articles.map(id => ({ id })) }
        })
      },
      include: { episodes: true, articles: true }
    });
    
    return newSeason;
  } catch (error) {
    console.error('Error creating season in Prisma:', error);
    throw error;
  }
}

export async function updateSeason(slug: string, data: UpdateSeasonData) {
  try {
    const { episodes, articles, publishedAt, title, titleEn, description, descriptionEn, thumbnailUrl, thumbnailUrlEn, slug: newSlug } = data;
    
    const updateData: PrismaSeasonUpdateData = {};
    
    if (title !== undefined) updateData.title = title;
    // إذا كان titleEn مطلوبًا في Prisma، يجب التأكد من عدم تعيينه لـ undefined إذا لم يرد في التحديث
    // ولكن بما أن التحديث جزئي، عادة ما يكون الحقل اختياري في UpdateInput
    if (titleEn !== undefined) updateData.titleEn = titleEn;
    if (description !== undefined) updateData.description = description;
    if (descriptionEn !== undefined) updateData.descriptionEn = descriptionEn;
    if (thumbnailUrl !== undefined) updateData.thumbnailUrl = thumbnailUrl;
    if (thumbnailUrlEn !== undefined) updateData.thumbnailUrlEn = thumbnailUrlEn;
    if (newSlug !== undefined) updateData.slug = newSlug;
    
    if (publishedAt) updateData.publishedAt = new Date(publishedAt);
    
    // تحديث الـ slug إذا تغير العنوان ولم يتم تمرير slug جديد
    if (!newSlug && (titleEn || title)) {
       updateData.slug = generateLocalSlug(titleEn || title || '');
    }

    if (episodes !== undefined) updateData.episodes = { set: episodes.map(id => ({ id })) };
    if (articles !== undefined) updateData.articles = { set: articles.map(id => ({ id })) };

    const updatedSeason = await prisma.season.update({
      where: { slug },
      data: updateData,
      include: { episodes: true, articles: true }
    });
    
    return updatedSeason;
  } catch (error) {
    console.error('Error updating season:', error);
    throw error;
  }
}

export async function deleteSeason(slug: string) {
  try {
    await prisma.season.update({
      where: { slug },
      data: { episodes: { set: [] }, articles: { set: [] } }
    });

    const deletedSeason = await prisma.season.delete({ where: { slug } });
    return deletedSeason;
  } catch (error) {
    console.error('Error deleting season:', error);
    throw error;
  }
}