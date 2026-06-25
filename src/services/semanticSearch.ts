import { prisma } from '@/lib/prisma';
import { analyzeUserIntent, UserIntent } from './intentAnalysis';

// تعريف واجهة لبيانات المحتوى
interface ContentData {
  id?: string;
  title?: string | null;
  name?: string | null;
  description?: string | null;
  excerpt?: string | null;
  bio?: string | null;
  question?: string | null;
  answer?: string | null;
  content?: unknown;
  contentEn?: unknown;
  itemType?: string;
  views?: number;
  likes?: number;
  [key: string]: unknown;
}

// واجهات محددة لنتائج البحث في الخصوصية والشروط لتجنب استخدام any
interface PrivacyItem {
  id: string;
  title?: string | null;
  titleEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
}

interface TermsItem {
  id: string;
  title?: string | null;
  titleEn?: string | null;
  term?: string | null;
  termEn?: string | null;
  definition?: string | null;
  definitionEn?: string | null;
}

// واجهة لتمثيل نتيجة البحث الدلالي
export interface SemanticSearchResult {
  type: 'article' | 'episode' | 'season' | 'playlist' | 'team' | 'faq' | 'privacy' | 'terms';
  data: ContentData;
  score: number;
  relevance: string;
  highlightedTitle?: string;
  highlightedDescription?: string;
}

// واجهة لاقتراحات البحث
export interface SearchSuggestion {
  text: string;
  type: string;
  popularity: number;
}

// واجهة لنتائج البحث الشامل
export interface ComprehensiveSearchResult {
  semanticResults: SemanticSearchResult[];
  suggestions: SearchSuggestion[];
  trendingSearches: string[];
  relatedContent: SemanticSearchResult[];
  totalCount: number;
  searchTime: number;
}

// تعريف واجهة لخيارات البحث
interface SearchOptions {
  limit?: number;
  offset?: number;
  filters?: {
    type?: string;
    dateRange?: string;
  };
}

// تخزين مؤقت للـ embeddings
const embeddingCache = new Map<string, number[]>();

// دالة لإنشاء تمثيل رياضي (Embedding) للنص
async function generateEmbedding(text: string): Promise<number[]> {
  if (embeddingCache.has(text)) {
    return embeddingCache.get(text)!;
  }

  try {
    const response = await fetch('https://api.jina.ai/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.JINA_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'jina-embeddings-v3',
        input: text,
      }),
    });

    if (!response.ok) {
      throw new Error('Embedding generation failed');
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;
    embeddingCache.set(text, embedding);
    return embedding;
  } catch (error) {
    console.error('Error generating embedding:', error);
    throw error;
  }
}

// حساب التشابه بين متجهين (Cosine Similarity)
function cosineSimilarity(vecA: number[], vecB: number[]): number {
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  
  const denominator = Math.sqrt(normA) * Math.sqrt(normB);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

// تمييز الكلمات المفتاحية في النص
function highlightKeywords(text: string, keywords: string[]): string {
  if (!keywords.length) return text;
  let highlightedText = text;
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${keyword})`, 'gi');
    highlightedText = highlightedText.replace(regex, '<mark>$1</mark>');
  });
  return highlightedText;
}

// حساب درجة الصلة بناءً على نوع المحتوى والنية
function calculateRelevanceScore(
  similarity: number, 
  contentType: string, 
  userIntent: UserIntent | undefined,
  keywords: string[],
  itemData: ContentData
): { score: number; relevance: string } {
  let score = similarity;
  let relevance = "ذو صلة";
  
  if (userIntent && userIntent.intent) {
    const intentType = userIntent.intent.toLowerCase();
    if (
      (intentType.includes('حلقة') && contentType === 'episode') ||
      (intentType.includes('مقال') && contentType === 'article') ||
      (intentType.includes('موسم') && contentType === 'season') ||
      (intentType.includes('قائمة تشغيل') && contentType === 'playlist') ||
      (intentType.includes('فريق') && contentType === 'team') ||
      (intentType.includes('سؤال') && contentType === 'faq') ||
      (intentType.includes('خصوصية') && contentType === 'privacy') ||
      (intentType.includes('شروط') && contentType === 'terms')
    ) {
      score += 0.2;
      relevance = "صلة قوية";
    }
  }
  
  if (keywords && keywords.length > 0) {
    const title = itemData.title || itemData.name || '';
    const desc = itemData.description || itemData.excerpt || itemData.bio || itemData.question || itemData.answer || '';
    const itemText = `${title} ${desc}`.toLowerCase();
    const keywordMatches = keywords.filter(keyword => itemText.includes(keyword.toLowerCase())).length;
    if (keywordMatches > 0) {
      score += (keywordMatches * 0.1);
      relevance = keywordMatches > 2 ? "صلة قوية جداً" : "صلة قوية";
    }
  }
  
  if (score >= 0.8) relevance = "صلة قوية جداً";
  else if (score >= 0.6) relevance = "صلة قوية";
  else if (score >= 0.4) relevance = "صلة متوسطة";
  else relevance = "صلة ضعيفة";
  
  return { score, relevance };
}

// دالة للبحث في الشروط والأحكام وسياسة الخصوصية
async function searchPrivacyTerms(
  query: string, 
  _language: string = 'ar', // تم تعديل الاسم لتجنب التحذير
  options: { limit?: number; offset?: number } = {}
): Promise<SemanticSearchResult[]> {
  try {
    const { limit = 10, offset = 0 } = options;
    
    const intent = await analyzeUserIntent(query);
    const isPrivacyQuery = intent.entities.some(entity => entity.includes('خصوصية') || entity.includes('privacy'));
    const isTermsQuery = intent.entities.some(entity => entity.includes('شروط') || entity.includes('أحكام') || entity.includes('terms'));

    // استخدام الواجهات المحددة بدلاً من unknown أو any
    let privacyResults: PrivacyItem[] = [];
    let termsResults: TermsItem[] = [];

    // Prisma query for Privacy
    if (!isTermsQuery || isPrivacyQuery) {
      const rawPrivacy = await prisma.privacy.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { titleEn: { contains: query, mode: 'insensitive' } },
            { description: { contains: query, mode: 'insensitive' } },
            { descriptionEn: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: Math.floor(limit / 2),
        skip: offset,
      });
      privacyResults = rawPrivacy as PrivacyItem[];
    }

    // Prisma query for Terms
    if (!isPrivacyQuery || isTermsQuery) {
      const rawTerms = await prisma.terms.findMany({
        where: {
          OR: [
            { title: { contains: query, mode: 'insensitive' } },
            { titleEn: { contains: query, mode: 'insensitive' } },
            { term: { contains: query, mode: 'insensitive' } },
            { termEn: { contains: query, mode: 'insensitive' } },
            { definition: { contains: query, mode: 'insensitive' } },
            { definitionEn: { contains: query, mode: 'insensitive' } }
          ]
        },
        take: Math.floor(limit / 2),
        skip: offset,
      });
      termsResults = rawTerms as TermsItem[];
    }

    const privacySemanticResults = privacyResults.map(item => {
      const title = _language === 'ar' ? item.title : item.titleEn;
      const content = _language === 'ar' ? item.description : item.descriptionEn;
      let score = 0.7;
      if (title && title.toLowerCase() === query.toLowerCase()) score += 0.3;
      if (content && content.toLowerCase().includes(query.toLowerCase())) score += 0.2;
      return {
        type: 'privacy' as const,
        data: { ...item, localizedTitle: title, localizedContent: content },
        score,
        relevance: score >= 0.9 ? 'صلة قوية جداً' : score >= 0.7 ? 'صلة قوية' : 'صلة متوسطة'
      };
    });

    const termsSemanticResults = termsResults.map(item => {
      const title = _language === 'ar' ? item.title : item.titleEn;
      const content = _language === 'ar' ? item.definition : item.definitionEn;
      let score = 0.7;
      if (title && title.toLowerCase() === query.toLowerCase()) score += 0.3;
      if (content && content.toLowerCase().includes(query.toLowerCase())) score += 0.2;
      return {
        type: 'terms' as const,
        data: { ...item, localizedTitle: title, localizedContent: content },
        score,
        relevance: score >= 0.9 ? 'صلة قوية جداً' : score >= 0.7 ? 'صلة قوية' : 'صلة متوسطة'
      };
    });

    return [...privacySemanticResults, ...termsSemanticResults]
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Error searching privacy and terms:', error);
    return [];
  }
}

// الدالة الرئيسية للبحث الدلالي المحسّن
export async function performSemanticSearch(
  userQuery: string, 
  _language: string = 'ar', // تم تعديل الاسم لتجنب التحذير
  userIntent?: UserIntent,
  options: SearchOptions = {}
): Promise<SemanticSearchResult[]> {
  console.log("🧠 Starting an enhanced deep semantic search (PostgreSQL)...");
  const startTime = Date.now();

  try {
    const intent = userIntent || await analyzeUserIntent(userQuery);
    const queryEmbedding = await generateEmbedding(userQuery);
    const { limit = 50, offset = 0, filters = {} } = options;

    // بناء شرط التاريخ لـ Prisma - تم تحديد النوع بدلاً من any
    let dateFilter: { gte?: Date } = {};
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      switch (filters.dateRange) {
        case 'week': cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); break;
        case 'month': cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); break;
        case 'year': cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000); break;
        default: cutoffDate = new Date(0);
      }
      // Prisma expects specific date comparison
      dateFilter = { gte: cutoffDate };
    }

    // جلب البيانات باستخدام Prisma
    const [articles, episodes, seasons, playlists, teamMembers, faqs] = await Promise.all([
      filters.type && filters.type !== 'article' ? [] : prisma.article.findMany({
        where: { OR: [{ publishedAt: dateFilter }, { createdAt: dateFilter }] },
        take: limit, skip: offset
      }),
      filters.type && filters.type !== 'episode' ? [] : prisma.episode.findMany({
        where: { OR: [{ publishedAt: dateFilter }, { createdAt: dateFilter }] },
        take: limit, skip: offset
      }),
      filters.type && filters.type !== 'season' ? [] : prisma.season.findMany({
        where: { OR: [{ publishedAt: dateFilter }, { createdAt: dateFilter }] },
        take: limit, skip: offset
      }),
      filters.type && filters.type !== 'playlist' ? [] : prisma.playlist.findMany({
        where: { createdAt: dateFilter },
        take: limit, skip: offset
      }),
      filters.type && filters.type !== 'team' ? [] : prisma.team.findMany({
        take: limit, skip: offset
      }),
      filters.type && filters.type !== 'faq' ? [] : prisma.fAQ.findMany({
        take: limit, skip: offset
      })
    ]);

    let privacyTermsResults: SemanticSearchResult[] = [];
    if (!filters.type || filters.type === 'all' || filters.type === 'privacy' || filters.type === 'terms') {
      privacyTermsResults = await searchPrivacyTerms(userQuery, _language, { limit, offset });
      if (filters.type && filters.type !== 'all') {
        privacyTermsResults = privacyTermsResults.filter(result => result.type === filters.type);
      }
    }

    const results: SemanticSearchResult[] = [];
    
    // تحديد نوع المصفوفة بشكل صريح لتجنب استخدام any
    const allItems: Array<{ itemType: string } & ContentData> = [
      ...articles.map(item => ({ ...item, itemType: 'article' as const })),
      ...episodes.map(item => ({ ...item, itemType: 'episode' as const })),
      ...seasons.map(item => ({ ...item, itemType: 'season' as const })),
      ...playlists.map(item => ({ ...item, itemType: 'playlist' as const })),
      ...teamMembers.map(item => ({ ...item, itemType: 'team' as const })),
      ...faqs.map(item => ({ ...item, itemType: 'faq' as const })),
    ];

    const keywords = intent.entities || [];

    // معالجة العناصر
    const batchSize = 10;
    for (let i = 0; i < allItems.length; i += batchSize) {
      const batch = allItems.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (item) => {
        try {
          const title = item.title || item.name || '';
          const description = item.description || item.excerpt || item.bio || item.question || item.answer || '';
          const textToEmbed = `${title} ${description}`;
          const itemEmbedding = await generateEmbedding(textToEmbed);
          const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);
          
          // تم حذف المتغير id غير المستخدم
          
          const { score, relevance } = calculateRelevanceScore(
            similarity, item.itemType, intent, keywords, item as ContentData
          );
          
          if (score > 0.3) {
            results.push({
              type: item.itemType as SemanticSearchResult['type'],
              data: item as ContentData,
              score,
              relevance,
              highlightedTitle: highlightKeywords(title, keywords),
              highlightedDescription: highlightKeywords(description, keywords)
            });
          }
        } catch (error) {
          console.error(`Error processing item ${item.id}:`, error);
        }
      }));
    }

    results.push(...privacyTermsResults);

    const sortedResults = results.sort((a, b) => b.score - a.score).slice(0, limit);
    
    console.log(`✅ Search completed in ${Date.now() - startTime}ms`);
    return sortedResults;

  } catch (error) {
    console.error("❌ Error during semantic search:", error);
    return performTextualSearch(userQuery, options);
  }
}

// البحث النصي البديل
async function performTextualSearch(
  userQuery: string, 
  options: SearchOptions = {}
): Promise<SemanticSearchResult[]> {
  try {
    const { limit = 50, filters = {} } = options;
    
    // استخدام Prisma contains للبحث النصي في Postgres
    const searchCondition = {
      OR: [
        { title: { contains: userQuery, mode: 'insensitive' as const } },
        { description: { contains: userQuery, mode: 'insensitive' as const } },
        // يمكن إضافة المزيد من الحقول هنا
      ]
    };

    const [articles, episodes, seasons, playlists, teamMembers, faqs] = await Promise.all([
      filters.type && filters.type !== 'article' ? [] : prisma.article.findMany({ where: searchCondition, take: limit }),
      filters.type && filters.type !== 'episode' ? [] : prisma.episode.findMany({ where: searchCondition, take: limit }),
      filters.type && filters.type !== 'season' ? [] : prisma.season.findMany({ where: searchCondition, take: limit }),
      filters.type && filters.type !== 'playlist' ? [] : prisma.playlist.findMany({ where: searchCondition, take: limit }),
      filters.type && filters.type !== 'team' ? [] : prisma.team.findMany({ 
        where: { OR: [
            { name: { contains: userQuery, mode: 'insensitive' } },
            { bio: { contains: userQuery, mode: 'insensitive' } }
          ]}, 
        take: limit 
      }),
      filters.type && filters.type !== 'faq' ? [] : prisma.fAQ.findMany({ 
        where: { OR: [
            { question: { contains: userQuery, mode: 'insensitive' } },
            { answer: { contains: userQuery, mode: 'insensitive' } }
          ]}, 
        take: limit 
      })
    ]);

    let privacyTermsResults: SemanticSearchResult[] = [];
    if (!filters.type || filters.type === 'all' || filters.type === 'privacy' || filters.type === 'terms') {
      privacyTermsResults = await searchPrivacyTerms(userQuery, 'ar', { limit });
    }

    const results: SemanticSearchResult[] = [];
    const allItems: Array<{ itemType: string } & ContentData> = [
      ...articles.map(item => ({ ...item, itemType: 'article' as const })),
      ...episodes.map(item => ({ ...item, itemType: 'episode' as const })),
      ...seasons.map(item => ({ ...item, itemType: 'season' as const })),
      ...playlists.map(item => ({ ...item, itemType: 'playlist' as const })),
      ...teamMembers.map(item => ({ ...item, itemType: 'team' as const })),
      ...faqs.map(item => ({ ...item, itemType: 'faq' as const })),
    ];

    for (const item of allItems) {
      results.push({
        type: item.itemType as SemanticSearchResult['type'],
        data: item as ContentData,
        score: 0.5,
        relevance: "صلة متوسطة"
      });
    }
    
    results.push(...privacyTermsResults);
    return results.slice(0, limit);
  } catch (error) {
    console.error("❌ Error during textual search:", error);
    return [];
  }
}

// ... (Rest of the functions: performComprehensiveSearch, getSearchSuggestions, etc. remain mostly the same but using Prisma queries)

export async function performComprehensiveSearch(
  userQuery: string, 
  _language: string = 'ar', // تم تعديل الاسم لتجنب التحذير
  options: SearchOptions = {}
): Promise<ComprehensiveSearchResult> {
  const startTime = Date.now();
  try {
    const semanticResults = await performSemanticSearch(userQuery, _language, undefined, options);
    const suggestions = await getSearchSuggestions(userQuery, _language);
    const trendingSearches = await getTrendingSearches(_language);
    const relatedContent = await getRelatedContent(userQuery, _language);
    
    return {
      semanticResults, suggestions, trendingSearches, relatedContent,
      totalCount: semanticResults.length,
      searchTime: Date.now() - startTime
    };
  } catch (error) {
    console.error("❌ Error during comprehensive search:", error);
    return {
      semanticResults: [], suggestions: [], trendingSearches: [], relatedContent: [],
      totalCount: 0, searchTime: Date.now() - startTime
    };
  }
}

export async function getSearchSuggestions(
  query: string, 
  _language: string = 'ar', // تم تعديل الاسم لتجنب التحذير
  limit: number = 10
): Promise<SearchSuggestion[]> {
  try {
    const condition = { contains: query, mode: 'insensitive' as const };
    
    const [articles, episodes, seasons, playlists, teamMembers, faqs, privacyResults, termsResults] = await Promise.all([
      prisma.article.findMany({ where: { title: condition }, select: { title: true, slug: true }, take: 5 }),
      prisma.episode.findMany({ where: { title: condition }, select: { title: true, slug: true }, take: 5 }),
      prisma.season.findMany({ where: { title: condition }, select: { title: true, slug: true }, take: 5 }),
      prisma.playlist.findMany({ where: { title: condition }, select: { title: true, slug: true }, take: 5 }),
      prisma.team.findMany({ where: { name: condition }, select: { name: true, slug: true }, take: 5 }),
      prisma.fAQ.findMany({ where: { question: condition }, select: { question: true }, take: 5 }),
      prisma.privacy.findMany({ where: { OR: [{ title: condition }, { titleEn: condition }] }, select: { title: true, titleEn: true }, take: 5 }),
      prisma.terms.findMany({ where: { OR: [{ title: condition }, { titleEn: condition }] }, select: { title: true, titleEn: true }, take: 5 }),
    ]);

    const suggestions: SearchSuggestion[] = [];
    
    articles.forEach(item => { if(item.title) suggestions.push({ text: item.title, type: 'article', popularity: Math.random() }); });
    episodes.forEach(item => { if(item.title) suggestions.push({ text: item.title, type: 'episode', popularity: Math.random() }); });
    seasons.forEach(item => { if(item.title) suggestions.push({ text: item.title, type: 'season', popularity: Math.random() }); });
    playlists.forEach(item => { if(item.title) suggestions.push({ text: item.title, type: 'playlist', popularity: Math.random() }); });
    teamMembers.forEach(item => { if(item.name) suggestions.push({ text: item.name, type: 'team', popularity: Math.random() }); });
    faqs.forEach(item => { if(item.question) suggestions.push({ text: item.question, type: 'faq', popularity: Math.random() }); });
    privacyResults.forEach(item => { suggestions.push({ text: _language === 'ar' ? (item.title || '') : (item.titleEn || ''), type: 'privacy', popularity: Math.random() }); });
    termsResults.forEach(item => { suggestions.push({ text: _language === 'ar' ? (item.title || '') : (item.titleEn || ''), type: 'terms', popularity: Math.random() }); });

    return suggestions.sort((a, b) => b.popularity - a.popularity).slice(0, limit);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}

export async function getTrendingSearches(_language: string = 'ar', limit: number = 10): Promise<string[]> { // تم تعديل الاسم لتجنب التحذير
  const trending = _language === 'ar' 
    ? ['ذكاء اصطناعي', 'تطوير الويب', 'البرمجة للمبتدئين', 'تصميم الواجهات', 'سياسة الخصوصية', 'شروط الاستخدام']
    : ['AI', 'Web Dev', 'Programming', 'UI Design', 'Privacy Policy', 'Terms'];
  return trending.slice(0, limit);
}

export async function getRelatedContent(query: string, _language: string = 'ar', limit: number = 5): Promise<SemanticSearchResult[]> { // تم تعديل الاسم لتجنب التحذير
  return performSemanticSearch(query, _language, undefined, { limit, offset: 5 });
}

export async function findSimilarContent(
  contentId: string, 
  contentType: string, 
  limit: number = 5
): Promise<SemanticSearchResult[]> {
  try {
    let originalContent: ContentData | null = null; // استبدال any بـ ContentData | null

    // استخدام Prisma findUnique مع Type Casting
    switch (contentType) {
      case 'article': originalContent = await prisma.article.findUnique({ where: { id: contentId } }) as ContentData | null; break;
      case 'episode': originalContent = await prisma.episode.findUnique({ where: { id: contentId } }) as ContentData | null; break;
      case 'season': originalContent = await prisma.season.findUnique({ where: { id: contentId } }) as ContentData | null; break;
      case 'playlist': originalContent = await prisma.playlist.findUnique({ where: { id: contentId } }) as ContentData | null; break;
      default: throw new Error(`Unsupported content type: ${contentType}`);
    }
    
    if (!originalContent) throw new Error(`Content not found: ${contentId}`);
    
    const title = originalContent.title || '';
    const description = originalContent.description || originalContent.excerpt || '';
    const textToEmbed = `${title} ${description}`;
    const contentEmbedding = await generateEmbedding(textToEmbed);
    
    // جلب محتوى آخر (استبعاد المحتوى الحالي)
    const excludeFilter = { id: { not: contentId } };
    const [articles, episodes, seasons, playlists] = await Promise.all([
      prisma.article.findMany({ where: excludeFilter, take: 20 }),
      prisma.episode.findMany({ where: excludeFilter, take: 20 }),
      prisma.season.findMany({ where: excludeFilter, take: 20 }),
      prisma.playlist.findMany({ where: excludeFilter, take: 20 })
    ]);
    
    const allItems: Array<{ itemType: string } & ContentData> = [
      ...articles.map(item => ({ ...item, itemType: 'article' as const })),
      ...episodes.map(item => ({ ...item, itemType: 'episode' as const })),
      ...seasons.map(item => ({ ...item, itemType: 'season' as const })),
      ...playlists.map(item => ({ ...item, itemType: 'playlist' as const })),
    ];
    
    const results: SemanticSearchResult[] = [];
    
    for (const item of allItems) {
      const itemTitle = item.title || '';
      const itemDesc = item.description || item.excerpt || '';
      const itemText = `${itemTitle} ${itemDesc}`;
      const itemEmbedding = await generateEmbedding(itemText);
      const similarity = cosineSimilarity(contentEmbedding, itemEmbedding);
      
      if (similarity > 0.4) {
        results.push({
          type: item.itemType as SemanticSearchResult['type'],
          data: item as ContentData,
          score: similarity,
          relevance: similarity > 0.7 ? "مشابه جداً" : "مشابه",
        });
      }
    }
    
    return results.sort((a, b) => b.score - a.score).slice(0, limit);
  } catch (error) {
    console.error("❌ Error finding similar content:", error);
    return [];
  }
}

export function clearEmbeddingCache(): void {
  embeddingCache.clear();
}

export { generateEmbedding, cosineSimilarity, highlightKeywords, calculateRelevanceScore };