import { prisma } from '@/lib/prisma';
import { performSemanticSearch } from './semanticSearch';

// تعريف واجهة مشتركة للبيانات لتجنب استخدام any
interface ContentData {
  id: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  excerpt?: string | null;
  publishedAt?: Date | string | null;
  createdAt?: Date | string | null;
}

export interface Recommendation {
  type: 'article' | 'episode' | 'season' | 'playlist';
  id: string;
  title: string;
  description?: string | null;
  score: number;
  reason: string;
}

export async function getPersonalizedRecommendations(
  userId: string,
  keywords: string[] = []
): Promise<Recommendation[]> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    const userInterests = await analyzeUserInterests(userId);
    const popularContent = await getPopularContent();

    // تم تعديل النوع هنا ليكون محدداً بدلاً من any[]
    let keywordContent: { type: string; data: ContentData }[] = [];
    if (keywords.length > 0) {
      const searchResults = await performSemanticSearch(keywords.join(' '), 'ar');
      keywordContent = searchResults as { type: string; data: ContentData }[];
    }

    const recommendations: Recommendation[] = [];

    for (const interest of userInterests) {
      const relatedContent = await performSemanticSearch(interest, 'ar');
      for (const content of relatedContent.slice(0, 2)) {
        recommendations.push({
          type: content.type as Recommendation['type'],
          id: content.data.id || '',
          title: content.data.title || content.data.name || '',
          description: content.data.description || content.data.excerpt,
          score: 0.8,
          reason: `بناءً على اهتمامك بـ: ${interest}`
        });
      }
    }

    for (const content of keywordContent.slice(0, 2)) {
      recommendations.push({
        type: content.type as Recommendation['type'],
        id: content.data.id || '',
        title: content.data.title || content.data.name || '',
        description: content.data.description || content.data.excerpt,
        score: 0.7,
        reason: 'بناءً على بحثك الحالي'
      });
    }

    for (const content of popularContent.slice(0, 2)) {
      recommendations.push({
        type: content.type,
        id: content.data.id || '',
        title: content.data.title || content.data.name || '',
        description: content.data.description || content.data.excerpt,
        score: 0.6,
        reason: 'محتوى شائع بين المستخدمين'
      });
    }

    const uniqueRecommendations = removeDuplicates(recommendations);
    return uniqueRecommendations.sort((a, b) => b.score - a.score).slice(0, 5);

  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return [];
  }
}

async function analyzeUserInterests(userId: string): Promise<string[]> {
  try {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) return [];

    const interests: string[] = [];
    // تحليل الاهتمامات بناءً على الـ bio أو الحقول المتاحة في الـ schema
    if (user.bio) {
      const bioKeywords = extractKeywordsFromText(user.bio);
      interests.push(...bioKeywords);
    }

    if (interests.length === 0) {
      interests.push('تكنولوجيا', 'برمجة', 'ذكاء اصطناعي');
    }

    return interests.slice(0, 5);
  } catch (error) {
    console.error('Error analyzing user interests:', error);
    return [];
  }
}

interface PopularContentItem {
  type: 'article' | 'episode' | 'season' | 'playlist';
  data: ContentData; // تم استخدام ContentData هنا بدلاً من any
}

async function getPopularContent(): Promise<PopularContentItem[]> {
  try {
    // استخدام Prisma مع orderBy
    const articles = await prisma.article.findMany({ orderBy: { publishedAt: 'desc' }, take: 3 });
    const episodes = await prisma.episode.findMany({ orderBy: { publishedAt: 'desc' }, take: 3 });
    const seasons = await prisma.season.findMany({ orderBy: { publishedAt: 'desc' }, take: 2 });
    const playlists = await prisma.playlist.findMany({ orderBy: { createdAt: 'desc' }, take: 2 });

    const allContent: PopularContentItem[] = [
      ...articles.map(item => ({ type: 'article' as const, data: item as ContentData })),
      ...episodes.map(item => ({ type: 'episode' as const, data: item as ContentData })),
      ...seasons.map(item => ({ type: 'season' as const, data: item as ContentData })),
      ...playlists.map(item => ({ type: 'playlist' as const, data: item as ContentData })),
    ];

    return allContent.sort((a, b) => {
      const dateA = new Date(a.data.publishedAt || a.data.createdAt || 0);
      const dateB = new Date(b.data.publishedAt || b.data.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  } catch (error) {
    console.error('Error getting popular content:', error);
    return [];
  }
}

function extractKeywordsFromText(text: string): string[] {
  const stopWords = ['من', 'في', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'التي', 'الذي'];
  const words = text.split(/\s+/);
  return words.filter(word => word.length > 2 && !stopWords.includes(word)).slice(0, 10);
}

function removeDuplicates(recommendations: Recommendation[]): Recommendation[] {
  const seen = new Set();
  return recommendations.filter(rec => {
    const key = `${rec.type}-${rec.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}