// src/services/recommendations.ts

import { connectDB } from '@/lib/mongodb';
import User from '@/models/User';
import Article from '@/models/Article';
import Episode from '@/models/Episode';
import Season from '@/models/Season';
import Playlist from '@/models/Playlist';
import { performSemanticSearch } from './semanticSearch';

// واجهة للتوصية
export interface Recommendation {
  type: 'article' | 'episode' | 'season' | 'playlist';
  id: string;
  title: string;
  description?: string;
  score: number;
  reason: string;
}

// تعريف واجهة لنتائج البحث
interface SearchResult {
  type: string;
  data: {
    _id?: string;
    id?: string;
    title?: string;
    name?: string;
    description?: string;
    excerpt?: string;
    [key: string]: unknown;
  };
  score?: number;
  relevance?: string;
}

// تعريف واجهة لعناصر المحتوى الشائع
interface PopularContentItem {
  type: 'article' | 'episode' | 'season' | 'playlist';
  data: {
    _id?: unknown; // تغيير من string إلى unknown لمطابقة MongoDB
    id?: string;
    title?: string;
    name?: string;
    description?: string;
    excerpt?: string;
    publishedAt?: Date | string;
    createdAt?: Date | string;
    [key: string]: unknown;
  };
}

// الحصول على توصيات مخصصة للمستخدم
export async function getPersonalizedRecommendations(
  userId: string, 
  keywords: string[] = []
): Promise<Recommendation[]> {
  try {
    await connectDB();
    
    // جلب بيانات المستخدم
    const user = await User.findById(userId);
    if (!user) {
      return [];
    }
    
    // تحليل اهتمامات المستخدم بناءً على سجل التفاعل (إذا كان متوفراً)
    const userInterests = await analyzeUserInterests(userId);
    
    // الحصول على المحتوى الشائع
    const popularContent = await getPopularContent();
    
    // الحصول على المحتوى المتعلق بالكلمات المفتاحية
    let keywordContent: SearchResult[] = [];
    if (keywords.length > 0) {
      const keywordQuery = keywords.join(' ');
      keywordContent = await performSemanticSearch(keywordQuery, 'ar');
    }
    
    // دمج النتائج وتحديد الأولويات
    const recommendations: Recommendation[] = [];
    
    // إضافة المحتوى بناءً على اهتمامات المستخدم
    for (const interest of userInterests) {
      const relatedContent = await performSemanticSearch(interest, 'ar');
      for (const content of relatedContent.slice(0, 2)) {
        recommendations.push({
          type: content.type as Recommendation['type'],
          id: content.data._id || content.data.id || '',
          title: content.data.title || content.data.name || '',
          description: content.data.description || content.data.excerpt,
          score: 0.8,
          reason: `بناءً على اهتمامك بـ: ${interest}`
        });
      }
    }
    
    // إضافة المحتوى المتعلق بالكلمات المفتاحية
    for (const content of keywordContent.slice(0, 2)) {
      recommendations.push({
        type: content.type as Recommendation['type'],
        id: content.data._id || content.data.id || '',
        title: content.data.title || content.data.name || '',
        description: content.data.description || content.data.excerpt,
        score: 0.7,
        reason: 'بناءً على بحثك الحالي'
      });
    }
    
    // إضافة المحتوى الشائع
    for (const content of popularContent.slice(0, 2)) {
      // تحويل _id من unknown إلى string بأمان
      const id = content.data._id ? String(content.data._id) : content.data.id || '';
      
      recommendations.push({
        type: content.type,
        id: id,
        title: (content.data.title as string) || (content.data.name as string) || '',
        description: (content.data.description as string) || (content.data.excerpt as string),
        score: 0.6,
        reason: 'محتوى شائع بين المستخدمين'
      });
    }
    
    // إزالة التكرارات وترتيب النتائج
    const uniqueRecommendations = removeDuplicates(recommendations);
    return uniqueRecommendations.sort((a, b) => b.score - a.score).slice(0, 5);
    
  } catch (error) {
    console.error('Error getting personalized recommendations:', error);
    return [];
  }
}

// تحليل اهتمامات المستخدم بناءً على سجل التفاعل
async function analyzeUserInterests(userId: string): Promise<string[]> {
  // في تطبيق حقيقي، ستقوم بتحليل سجل تفاعل المستخدم مع المحتوى
  // للتبسيط، سنستخدم اهتمامات افتراضية بناءً على بيانات المستخدم
  
  try {
    await connectDB();
    const user = await User.findById(userId);
    
    if (!user) {
      return [];
    }
    
    // تحليل الاهتمامات بناءً على معلومات المستخدم
    const interests: string[] = [];
    
    // إذا كان المستخدم قد حدد اهتماماته في ملفه الشخصي
    if (user.interests && Array.isArray(user.interests)) {
      interests.push(...user.interests);
    }
    
    // تحليل الاهتمامات بناءً على الوصف أو الموقع
    if (user.bio) {
      const bioKeywords = extractKeywordsFromText(user.bio);
      interests.push(...bioKeywords);
    }
    
    // في تطبيق حقيقي، ستقوم بتحليل سجل المشاهدة والقراءة
    // هنا سنضيف اهتمامات افتراضية للمثال
    if (interests.length === 0) {
      interests.push('تكنولوجيا', 'برمجة', 'ذكاء اصطناعي');
    }
    
    return interests.slice(0, 5); // الحد الأقصى 5 اهتمامات
    
  } catch (error) {
    console.error('Error analyzing user interests:', error);
    return [];
  }
}

// الحصول على المحتوى الشائع
async function getPopularContent(): Promise<PopularContentItem[]> {
  try {
    // في تطبيق حقيقي، ستقوم بتحليل شعبية المحتوى بناءً على المشاهدات والتفاعلات
    // للتبسيط، سنحصل على المحتوى الأحدث
    
    await connectDB();
    
    const articles = await Article.find({}).sort({ publishedAt: -1 }).limit(3).lean();
    const episodes = await Episode.find({}).sort({ publishedAt: -1 }).limit(3).lean();
    const seasons = await Season.find({}).sort({ publishedAt: -1 }).limit(2).lean();
    const playlists = await Playlist.find({}).sort({ createdAt: -1 }).limit(2).lean();
    
    // دمج المحتوى وتحديد الأولويات بناءً على التاريخ
    // استخدام تحويل النوع بشكل صحيح بدلاً من any
    const allContent: PopularContentItem[] = [
      ...articles.map(item => ({ 
        type: 'article' as const, 
        data: item as PopularContentItem['data']
      })),
      ...episodes.map(item => ({ 
        type: 'episode' as const, 
        data: item as PopularContentItem['data']
      })),
      ...seasons.map(item => ({ 
        type: 'season' as const, 
        data: item as PopularContentItem['data']
      })),
      ...playlists.map(item => ({ 
        type: 'playlist' as const, 
        data: item as PopularContentItem['data']
      })),
    ];
    
    // ترتيب المحتوى بناءً على التاريخ (الأحدث أولاً)
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

// استخراج الكلمات المفتاحية من النص
function extractKeywordsFromText(text: string): string[] {
  // قائمة كلمات التوقف الشائعة في العربية
  const stopWords = [
    'من', 'في', 'على', 'إلى', 'عن', 'مع', 'هذا', 'هذه', 'هذا', 'هذه',
    'التي', 'الذي', 'الذين', 'اللذان', 'اللتان', 'اللواتي', 'ما', 'ماذا',
    'متى', 'أين', 'كيف', 'لماذا', 'هل', 'قد', 'سوف', 'س', 'لن', 'لما',
    'ليس', 'ليست', 'ليسوا', 'كنت', 'كان', 'كانت', 'كانوا', 'أنا', 'أنت',
    'أنتِ', 'أنتم', 'أنتن', 'هو', 'هي', 'هم', 'هن', 'نحن', 'هنا', 'هناك',
    'حول', 'حتى', 'بعد', 'قبل', 'أمام', 'خلف', 'فوق', 'تحت', 'ب', 'بـ',
    'ك', 'كـ', 'ل', 'لـ', 'و', 'ف', 'ثم', 'أو', 'أم', 'لكن', 'لكنما', 'إلا',
    'إذن', 'حيث', 'إذا', 'إن', 'أن', 'الآن', 'وقت', 'يوم', 'شهر', 'سنة'
  ];
  
  // تقسيم النص إلى كلمات
  const words = text.split(/\s+/);
  
  // تصفية كلمات التوقف وإرجاع الكلمات المتبقية
  const keywords = words
    .filter(word => word.length > 2 && !stopWords.includes(word))
    .slice(0, 10); // الحد الأقصى 10 كلمات مفتاحية
  
  return keywords;
}

// إزالة التكرارات من قائمة التوصيات
function removeDuplicates(recommendations: Recommendation[]): Recommendation[] {
  const seen = new Set();
  return recommendations.filter(rec => {
    const key = `${rec.type}-${rec.id}`;
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}