import { connectDB } from '@/lib/mongodb';
import Article from '@/models/Article';
import Episode from '@/models/Episode';
import Season from '@/models/Season';
import Playlist from '@/models/Playlist';
import mongoose from 'mongoose';
import { analyzeUserIntent, UserIntent } from './intentAnalysis';

// تعريف واجهة لبيانات المحتوى
interface ContentData {
  _id?: string;
  id?: string;
  title?: string;
  name?: string;
  description?: string;
  excerpt?: string;
  bio?: string;
  question?: string;
  answer?: string;
  content?: string;
  contentEn?: string;
  itemType?: string;
  views?: number;
  likes?: number;
  [key: string]: unknown;
}

// واجهة لتمثيل نتيجة البحث الدلالي
export interface SemanticSearchResult {
  type: 'article' | 'episode' | 'season' | 'playlist' | 'team' | 'faq' | 'privacy' | 'terms';
  data: ContentData;
  score: number; // درجة التشابه المعنوي
  relevance: string; // وصف للصلة
  highlightedTitle?: string; // عنوان مع التمييز
  highlightedDescription?: string; // وصف مع التمييز
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
  // التحقق من التخزين المؤقت أولاً
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
      console.error('Failed to generate embedding from Jina AI');
      throw new Error('Embedding generation failed');
    }

    const data = await response.json();
    const embedding = data.data[0].embedding;
    
    // تخزين النتيجة في التخزين المؤقت
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
  
  // تعديل الدرجة بناءً على نوع المحتوى والنية
  if (userIntent && userIntent.intent) {
    const intentType = userIntent.intent.toLowerCase();
    
    // إذا كانت النية تتوافق مع نوع المحتوى، زد الدرجة
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
  
  // تعديل الدرجة بناءً على تطابق الكلمات المفتاحية
  if (keywords && keywords.length > 0) {
    const itemText = `${itemData.title || itemData.name} ${itemData.description || itemData.excerpt || itemData.bio || itemData.question || itemData.answer}`.toLowerCase();
    
    const keywordMatches = keywords.filter(keyword => 
      itemText.includes(keyword.toLowerCase())
    ).length;
    
    if (keywordMatches > 0) {
      score += (keywordMatches * 0.1);
      relevance = keywordMatches > 2 ? "صلة قوية جداً" : "صلة قوية";
    }
  }
  
  // تعديل إضافي بناءً على شعبية المحتوى (إذا كانت متوفرة)
  if (itemData.views || itemData.likes) {
    const popularityScore = Math.min((itemData.views || itemData.likes || 0) / 1000, 0.2);
    score += popularityScore;
  }
  
  // تحديد وصف الصلة بناءً على الدرجة النهائية
  if (score >= 0.8) {
    relevance = "صلة قوية جداً";
  } else if (score >= 0.6) {
    relevance = "صلة قوية";
  } else if (score >= 0.4) {
    relevance = "صلة متوسطة";
  } else {
    relevance = "صلة ضعيفة";
  }
  
  return { score, relevance };
}

// دالة للبحث في الشروط والأحكام وسياسة الخصوصية
async function searchPrivacyTerms(
  query: string, 
  language: string = 'ar', 
  options: {
    limit?: number;
    offset?: number;
  } = {}
): Promise<SemanticSearchResult[]> {
  try {
    // التأكد من اتصال قاعدة البيانات
    await connectDB();
    
    // التحقق من وجود اتصال قاعدة البيانات
    if (!mongoose.connection.db) {
      console.error('Database connection not established');
      return [];
    }
    
    const db = mongoose.connection.db;
    const { limit = 10, offset = 0 } = options;
    
    // تحليل نية المستخدم لتحديد نوع البحث
    const intent = await analyzeUserIntent(query);
    const isPrivacyQuery = intent.entities.some(entity => 
      entity.includes('خصوصية') || entity.includes('privacy')
    );
    const isTermsQuery = intent.entities.some(entity => 
      entity.includes('شروط') || entity.includes('أحكام') || 
      entity.includes('terms') || entity.includes('conditions')
    );
    
    let privacyResults: Array<Record<string, unknown>> = [];
    let termsResults: Array<Record<string, unknown>> = [];
    
    // البحث في سياسة الخصوصية
    if (!isTermsQuery || isPrivacyQuery) {
      privacyResults = await db.collection('privacyContent')
        .find({
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { titleEn: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } },
            { contentEn: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { descriptionEn: { $regex: query, $options: 'i' } }
          ]
        })
        .limit(Math.floor(limit / 2))
        .skip(offset)
        .toArray();
    }
    
    // البحث في الشروط والأحكام
    if (!isPrivacyQuery || isTermsQuery) {
      termsResults = await db.collection('termsContent')
        .find({
          $or: [
            { title: { $regex: query, $options: 'i' } },
            { titleEn: { $regex: query, $options: 'i' } },
            { content: { $regex: query, $options: 'i' } },
            { contentEn: { $regex: query, $options: 'i' } },
            { description: { $regex: query, $options: 'i' } },
            { descriptionEn: { $regex: query, $options: 'i' } },
            { term: { $regex: query, $options: 'i' } },
            { termEn: { $regex: query, $options: 'i' } },
            { definition: { $regex: query, $options: 'i' } },
            { definitionEn: { $regex: query, $options: 'i' } }
          ]
        })
        .limit(Math.floor(limit / 2))
        .skip(offset)
        .toArray();
    }
    
    // تحويل النتائج إلى صيغة SemanticSearchResult مع حساب درجة الصلة
    const privacySemanticResults = privacyResults.map(item => {
      const title = language === 'ar' ? (item.title as string) : (item.titleEn as string);
      const content = language === 'ar' ? (item.content as string) : (item.contentEn as string);
      
      let score = 0.7; // درجة أساسية
      
      // زيادة الدرجة إذا تطابق العنوان بالكامل
      if (title && typeof title === 'string' && title.toLowerCase() === query.toLowerCase()) {
        score += 0.3;
      }
      
      // زيادة الدرجة إذا كان الاستعلام موجودًا في المحتوى
      if (content && typeof content === 'string' && content.toLowerCase().includes(query.toLowerCase())) {
        score += 0.2;
      }
      
      // تحويل _id إلى string بأمان
      const id = item._id && typeof item._id === 'object' && 'toString' in item._id 
        ? (item._id as { toString(): string }).toString() 
        : '';
      
      return {
        type: 'privacy' as const,
        data: {
          ...item,
          id,
          localizedTitle: title,
          localizedContent: content
        },
        score,
        relevance: score >= 0.9 ? 'صلة قوية جداً' : score >= 0.7 ? 'صلة قوية' : 'صلة متوسطة'
      };
    });
    
    const termsSemanticResults = termsResults.map(item => {
      const title = language === 'ar' ? (item.title as string) : (item.titleEn as string);
      const content = language === 'ar' ? (item.content as string) : (item.contentEn as string);
      
      let score = 0.7; // درجة أساسية
      
      // زيادة الدرجة إذا تطابق العنوان بالكامل
      if (title && typeof title === 'string' && title.toLowerCase() === query.toLowerCase()) {
        score += 0.3;
      }
      
      // زيادة الدرجة إذا كان الاستعلام موجودًا في المحتوى
      if (content && typeof content === 'string' && content.toLowerCase().includes(query.toLowerCase())) {
        score += 0.2;
      }
      
      // تحويل _id إلى string بأمان
      const id = item._id && typeof item._id === 'object' && 'toString' in item._id 
        ? (item._id as { toString(): string }).toString() 
        : '';
      
      return {
        type: 'terms' as const,
        data: {
          ...item,
          id,
          localizedTitle: title,
          localizedContent: content
        },
        score,
        relevance: score >= 0.9 ? 'صلة قوية جداً' : score >= 0.7 ? 'صلة قوية' : 'صلة متوسطة'
      };
    });
    
    // دمج النتائج وترتيبها حسب الدرجة
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
  language: string = 'ar', 
  userIntent?: UserIntent,
  options: SearchOptions = {}
): Promise<SemanticSearchResult[]> {
  console.log("🧠 Starting an enhanced deep semantic search...");
  const startTime = Date.now();

  try {
    // 1. تحليل نية المستخدم إذا لم تكن متوفرة
    const intent = userIntent || await analyzeUserIntent(userQuery);
    
    // 2. إنشاء تمثيل رياضي لسؤال المستخدم
    const queryEmbedding = await generateEmbedding(userQuery);

    // 3. جلب البيانات باستخدام Mongoose مع الفلاتر
    await connectDB();
    
    const { limit = 50, offset = 0, filters = {} } = options;
    
    const query: Record<string, unknown> = {};
    
    // تطبيق فلاتر التاريخ
    if (filters.dateRange && filters.dateRange !== 'all') {
      const now = new Date();
      let cutoffDate: Date;
      
      switch (filters.dateRange) {
        case 'week':
          cutoffDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          cutoffDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case 'year':
          cutoffDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
          break;
        default:
          cutoffDate = new Date(0);
      }
      
      query.$or = [
        { publishedAt: { $gte: cutoffDate } },
        { createdAt: { $gte: cutoffDate } }
      ];
    }
    
    const [articles, episodes, seasons, playlists] = await Promise.all([
      filters.type && filters.type !== 'article' ? [] : Article.find(query).limit(limit).skip(offset).lean(),
      filters.type && filters.type !== 'episode' ? [] : Episode.find(query).limit(limit).skip(offset).lean(),
      filters.type && filters.type !== 'season' ? [] : Season.find(query).limit(limit).skip(offset).lean(),
      filters.type && filters.type !== 'playlist' ? [] : Playlist.find(query).limit(limit).skip(offset).lean()
    ]);
    
    // جلب بيانات الفريق والأسئلة الشائعة باستخدام connection.db
    // التحقق من وجود اتصال قاعدة البيانات
    if (!mongoose.connection.db) {
      console.error('Database connection not established');
      return [];
    }
    
    const db = mongoose.connection.db;
    const [teamMembers, faqs] = await Promise.all([
      filters.type && filters.type !== 'team' ? [] : db.collection('teams').find(query).limit(limit).skip(offset).toArray(),
      filters.type && filters.type !== 'faq' ? [] : db.collection('faqs').find(query).limit(limit).skip(offset).toArray()
    ]);

    // جلب بيانات الشروط والأحكام وسياسة الخصوصية
    let privacyTermsResults: SemanticSearchResult[] = [];
    if (!filters.type || filters.type === 'all' || filters.type === 'privacy' || filters.type === 'terms') {
      privacyTermsResults = await searchPrivacyTerms(userQuery, language, { limit, offset });
      
      // تصفية النتائج حسب النوع إذا تم تحديده
      if (filters.type && filters.type !== 'all') {
        privacyTermsResults = privacyTermsResults.filter(result => result.type === filters.type);
      }
    }

    const results: SemanticSearchResult[] = [];

    // 4. البحث في كل نوع من البيانات
    const allItems = [
      ...articles.map(item => ({ ...item, itemType: 'article' as const })),
      ...episodes.map(item => ({ ...item, itemType: 'episode' as const })),
      ...seasons.map(item => ({ ...item, itemType: 'season' as const })),
      ...playlists.map(item => ({ ...item, itemType: 'playlist' as const })),
      ...teamMembers.map(item => ({ ...item, itemType: 'team' as const })),
      ...faqs.map(item => ({ ...item, itemType: 'faq' as const })),
    ];

    // استخراج الكلمات المفتاحية من نية المستخدم
    const keywords = intent.entities || [];

    // معالجة متوازية للعناصر لتحسين الأداء
    const batchSize = 10;
    for (let i = 0; i < allItems.length; i += batchSize) {
      const batch = allItems.slice(i, i + batchSize);
      
      await Promise.all(batch.map(async (item) => {
        try {
          // دمج النصوص لإنشاء تمثيل رياضي شامل
          // استخدام عامل التحقق من النوع للوصول إلى الخصائص بأمان
          const title = 'title' in item ? String(item.title || '') : ('name' in item ? String(item.name || '') : '');
          const description = 'description' in item ? String(item.description || '') : 
                            ('excerpt' in item ? String(item.excerpt || '') : 
                            ('bio' in item ? String(item.bio || '') : 
                            ('question' in item ? String(item.question || '') : 
                            ('answer' in item ? String(item.answer || '') : ''))));
          
          const textToEmbed = `${title} ${description}`;
          const itemEmbedding = await generateEmbedding(textToEmbed);
          
          // حساب درجة التشابه
          const similarity = cosineSimilarity(queryEmbedding, itemEmbedding);
          
          // تحويل _id إلى string إذا كان ObjectId
          const id = item._id && typeof item._id === 'object' && 'toString' in item._id 
            ? (item._id as { toString(): string }).toString() 
            : String(item._id || '');
          
          // إنشاء نسخة من العنصر مع _id كـ string
          const itemWithStringId = {
            ...item,
            _id: id
          };
          
          // حساب درجة الصلة المعدلة
          const { score, relevance } = calculateRelevanceScore(
            similarity, 
            item.itemType, 
            intent, 
            keywords,
            itemWithStringId
          );
          
          if (score > 0.3) {
            results.push({
              type: item.itemType,
              data: itemWithStringId,
              score,
              relevance,
              highlightedTitle: highlightKeywords(title, keywords),
              highlightedDescription: highlightKeywords(description, keywords)
            });
          }
        } catch (error) {
          console.error(`Error processing item ${item._id}:`, error);
        }
      }));
    }

    // إضافة نتائج الشروط والأحكام وسياسة الخصوصية
    results.push(...privacyTermsResults);

    // 5. ترتيب النتائج وتطبيق الحد الأقصى للنتائج
    const sortedResults = results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
    const searchTime = Date.now() - startTime;
    console.log(`✅ Enhanced semantic search completed in ${searchTime}ms with ${sortedResults.length} results`);
    
    return sortedResults;

  } catch (error) {
    console.error("❌ Error during enhanced semantic search:", error);
    // في حالة الفشل، يمكن العودة إلى البحث النصي البسيط
    return performTextualSearch(userQuery, options);
  }
}

// البحث النصي البديل في حالة فشل البحث الدلالي
async function performTextualSearch(
  userQuery: string, 
  options: SearchOptions = {}
): Promise<SemanticSearchResult[]> {
  try {
    await connectDB();
    const { limit = 50, filters = {} } = options;
    
    const queryRegex = new RegExp(userQuery, 'i');
    
    const [articles, episodes, seasons, playlists] = await Promise.all([
      filters.type && filters.type !== 'article' ? [] : Article.find({
        $or: [
          { title: queryRegex },
          { excerpt: queryRegex },
          { content: queryRegex }
        ]
      }).limit(limit).lean(),
      filters.type && filters.type !== 'episode' ? [] : Episode.find({
        $or: [
          { title: queryRegex },
          { description: queryRegex },
          { content: queryRegex }
        ]
      }).limit(limit).lean(),
      filters.type && filters.type !== 'season' ? [] : Season.find({
        $or: [
          { title: queryRegex },
          { description: queryRegex }
        ]
      }).limit(limit).lean(),
      filters.type && filters.type !== 'playlist' ? [] : Playlist.find({
        $or: [
          { title: queryRegex },
          { description: queryRegex }
        ]
      }).limit(limit).lean()
    ]);
    
    // التحقق من وجود اتصال قاعدة البيانات
    if (!mongoose.connection.db) {
      console.error('Database connection not established');
      return [];
    }
    
    const db = mongoose.connection.db;
    const [teamMembers, faqs] = await Promise.all([
      filters.type && filters.type !== 'team' ? [] : db.collection('teams').find({
        $or: [
          { name: queryRegex },
          { bio: queryRegex }
        ]
      }).limit(limit).toArray(),
      filters.type && filters.type !== 'faq' ? [] : db.collection('faqs').find({
        $or: [
          { question: queryRegex },
          { answer: queryRegex }
        ]
      }).limit(limit).toArray()
    ]);

    // البحث في الشروط والأحكام وسياسة الخصوصية
    let privacyTermsResults: SemanticSearchResult[] = [];
    if (!filters.type || filters.type === 'all' || filters.type === 'privacy' || filters.type === 'terms') {
      privacyTermsResults = await searchPrivacyTerms(userQuery, 'ar', { limit });
      
      // تصفية النتائج حسب النوع إذا تم تحديده
      if (filters.type && filters.type !== 'all') {
        privacyTermsResults = privacyTermsResults.filter(result => result.type === filters.type);
      }
    }

    const results: SemanticSearchResult[] = [];
    
    const allItems = [
      ...articles.map(item => ({ ...item, itemType: 'article' as const })),
      ...episodes.map(item => ({ ...item, itemType: 'episode' as const })),
      ...seasons.map(item => ({ ...item, itemType: 'season' as const })),
      ...playlists.map(item => ({ ...item, itemType: 'playlist' as const })),
      ...teamMembers.map(item => ({ ...item, itemType: 'team' as const })),
      ...faqs.map(item => ({ ...item, itemType: 'faq' as const })),
    ];

    for (const item of allItems) {
      // تحويل _id إلى string إذا كان ObjectId
      const id = item._id && typeof item._id === 'object' && 'toString' in item._id 
        ? (item._id as { toString(): string }).toString() 
        : String(item._id || '');
      
      // إنشاء نسخة من العنصر مع _id كـ string
      const itemWithStringId = {
        ...item,
        _id: id
      };
      
      results.push({
        type: item.itemType,
        data: itemWithStringId,
        score: 0.5, // درجة افتراضية للبحث النصي
        relevance: "صلة متوسطة"
      });
    }

    // إضافة نتائج الشروط والأحكام وسياسة الخصوصية
    results.push(...privacyTermsResults);

    return results.slice(0, limit);
  } catch (error) {
    console.error("❌ Error during textual search:", error);
    return [];
  }
}

// البحث الشامل مع كل الميزات
export async function performComprehensiveSearch(
  userQuery: string, 
  language: string = 'ar',
  options: SearchOptions = {}
): Promise<ComprehensiveSearchResult> {
  const startTime = Date.now();
  
  try {
    // 1. البحث الدلالي الرئيسي
    const semanticResults = await performSemanticSearch(userQuery, language, undefined, options);
    
    // 2. الحصول على اقتراحات البحث
    const suggestions = await getSearchSuggestions(userQuery, language);
    
    // 3. الحصول على عمليات البحث الشائعة
    const trendingSearches = await getTrendingSearches(language);
    
    // 4. الحصول على محتوى ذي صلة
    const relatedContent = await getRelatedContent(userQuery, language);
    
    const searchTime = Date.now() - startTime;
    
    return {
      semanticResults,
      suggestions,
      trendingSearches,
      relatedContent,
      totalCount: semanticResults.length,
      searchTime
    };
  } catch (error) {
    console.error("❌ Error during comprehensive search:", error);
    return {
      semanticResults: [],
      suggestions: [],
      trendingSearches: [],
      relatedContent: [],
      totalCount: 0,
      searchTime: Date.now() - startTime
    };
  }
}

// دالة للحصول على اقتراحات البحث
export async function getSearchSuggestions(
  query: string, 
  language: string = 'ar',
  limit: number = 10
): Promise<SearchSuggestion[]> {
  try {
    await connectDB();
    
    const queryRegex = new RegExp(query, 'i');
    
    const [articles, episodes, seasons, playlists] = await Promise.all([
      Article.find({ title: queryRegex }).select('title slug').limit(5).lean(),
      Episode.find({ title: queryRegex }).select('title slug').limit(5).lean(),
      Season.find({ title: queryRegex }).select('title slug').limit(5).lean(),
      Playlist.find({ title: queryRegex }).select('title slug').limit(5).lean()
    ]);
    
    // التحقق من وجود اتصال قاعدة البيانات
    if (!mongoose.connection.db) {
      console.error('Database connection not established');
      return [];
    }
    
    const db = mongoose.connection.db;
    const [teamMembers, faqs] = await Promise.all([
      db.collection('teams').find({ name: queryRegex }).project({ name: 1, slug: 1 }).limit(5).toArray(),
      db.collection('faqs').find({ question: queryRegex }).project({ question: 1, _id: 1 }).limit(5).toArray()
    ]);
    
    // البحث في الشروط والأحكام وسياسة الخصوصية
    const [privacyResults, termsResults] = await Promise.all([
      db.collection('privacyContent').find({ 
        $or: [
          { title: queryRegex },
          { titleEn: queryRegex }
        ]
      }).project({ title: 1, titleEn: 1, _id: 1 }).limit(5).toArray(),
      db.collection('termsContent').find({ 
        $or: [
          { title: queryRegex },
          { titleEn: queryRegex }
        ]
      }).project({ title: 1, titleEn: 1, _id: 1 }).limit(5).toArray()
    ]);

    const suggestions: SearchSuggestion[] = [];
    
    // إضافة اقتراحات من كل نوع
    articles.forEach(article => {
      suggestions.push({
        text: String(article.title || ''),
        type: 'article',
        popularity: Math.random() // في تطبيق حقيقي، استخدم بيانات المشاهدات
      });
    });
    
    episodes.forEach(episode => {
      suggestions.push({
        text: String(episode.title || ''),
        type: 'episode',
        popularity: Math.random()
      });
    });
    
    seasons.forEach(season => {
      suggestions.push({
        text: String(season.title || ''),
        type: 'season',
        popularity: Math.random()
      });
    });
    
    playlists.forEach(playlist => {
      suggestions.push({
        text: String(playlist.title || ''),
        type: 'playlist',
        popularity: Math.random()
      });
    });
    
    teamMembers.forEach(member => {
      suggestions.push({
        text: String(member.name || ''),
        type: 'team',
        popularity: Math.random()
      });
    });
    
    faqs.forEach(faq => {
      suggestions.push({
        text: String(faq.question || ''),
        type: 'faq',
        popularity: Math.random()
      });
    });
    
    // إضافة اقتراحات من الشروط والأحكام وسياسة الخصوصية
    privacyResults.forEach(item => {
      suggestions.push({
        text: language === 'ar' ? String(item.title || '') : String(item.titleEn || ''),
        type: 'privacy',
        popularity: Math.random()
      });
    });
    
    termsResults.forEach(item => {
      suggestions.push({
        text: language === 'ar' ? String(item.title || '') : String(item.titleEn || ''),
        type: 'terms',
        popularity: Math.random()
      });
    });
    
    // ترتيب الاقتراحات بالشعبية والحد
    return suggestions
      .sort((a, b) => b.popularity - a.popularity)
      .slice(0, limit);
  } catch (error) {
    console.error('Error getting search suggestions:', error);
    return [];
  }
}

// دالة للحصول على عمليات البحث الشائعة
export async function getTrendingSearches(
  language: string = 'ar',
  limit: number = 10
): Promise<string[]> {
  try {
    // في تطبيق حقيقي، يمكنك تحليل سجل البحث لتحديد الكلمات الشائعة
    // للتبسيط، سنرجع قائمة ثابتة بناءً على اللغة
    
    const trendingSearches = language === 'ar' 
      ? [
          'ذكاء اصطناعي',
          'تطوير الويب',
          'البرمجة للمبتدئين',
          'تصميم الواجهات',
          'قواعد البيانات',
          'الأمن السيبراني',
          'تطبيقات الموبايل',
          'التعلم الآلي',
          'تحليل البيانات',
          'التسويق الرقمي',
          'سياسة الخصوصية',
          'شروط الاستخدام'
        ]
      : [
          'Artificial Intelligence',
          'Web Development',
          'Programming for Beginners',
          'UI Design',
          'Databases',
          'Cybersecurity',
          'Mobile Apps',
          'Machine Learning',
          'Data Analysis',
          'Digital Marketing',
          'Privacy Policy',
          'Terms of Use'
        ];
    
    return trendingSearches.slice(0, limit);
  } catch (error) {
    console.error('Error getting trending searches:', error);
    return [];
  }
}

// دالة للحصول على محتوى ذي صلة
export async function getRelatedContent(
  query: string,
  language: string = 'ar',
  limit: number = 5
): Promise<SemanticSearchResult[]> {
  try {
    // استخدام البحث الدلالي مع حد أقل للحصول على محتوى ذي صلة
    const relatedResults = await performSemanticSearch(query, language, undefined, {
      limit,
      offset: 5 // تخطي النتائج الرئيسية
    });
    
    return relatedResults;
  } catch (error) {
    console.error('Error getting related content:', error);
    return [];
  }
}

// دالة للبحث عن محتوى مشابه لمحتوى معين
export async function findSimilarContent(
  contentId: string, 
  contentType: string, 
  limit: number = 5
): Promise<SemanticSearchResult[]> {
  try {
    await connectDB();
    
    let originalContent;
    
    switch (contentType) {
      case 'article':
        originalContent = await Article.findById(contentId).lean();
        break;
      case 'episode':
        originalContent = await Episode.findById(contentId).lean();
        break;
      case 'season':
        originalContent = await Season.findById(contentId).lean();
        break;
      case 'playlist':
        originalContent = await Playlist.findById(contentId).lean();
        break;
      default:
        throw new Error(`Unsupported content type: ${contentType}`);
    }
    
    if (!originalContent) {
      throw new Error(`Content not found: ${contentId}`);
    }
    
    // إنشاء تمثيل رياضي للمحتوى الأصلي
    const title = 'title' in originalContent ? String(originalContent.title || '') : '';
    const description = 'description' in originalContent ? String(originalContent.description || '') : 
                        ('excerpt' in originalContent ? String(originalContent.excerpt || '') : '');
    const textToEmbed = `${title} ${description}`;
    const contentEmbedding = await generateEmbedding(textToEmbed);
    
    // جلب المحتوى الآخر
    const [articles, episodes, seasons, playlists] = await Promise.all([
      Article.find({ _id: { $ne: contentId } }).limit(20).lean(),
      Episode.find({ _id: { $ne: contentId } }).limit(20).lean(),
      Season.find({ _id: { $ne: contentId } }).limit(20).lean(),
      Playlist.find({ _id: { $ne: contentId } }).limit(20).lean()
    ]);
    
    const allItems = [
      ...articles.map(item => ({ ...item, itemType: 'article' as const })),
      ...episodes.map(item => ({ ...item, itemType: 'episode' as const })),
      ...seasons.map(item => ({ ...item, itemType: 'season' as const })),
      ...playlists.map(item => ({ ...item, itemType: 'playlist' as const })),
    ];
    
    const results: SemanticSearchResult[] = [];
    
    for (const item of allItems) {
      const itemTitle = 'title' in item ? String(item.title || '') : '';
      const itemDescription = 'description' in item ? String(item.description || '') : 
                          ('excerpt' in item ? String(item.excerpt || '') : '');
      const itemText = `${itemTitle} ${itemDescription}`;
      const itemEmbedding = await generateEmbedding(itemText);
      
      const similarity = cosineSimilarity(contentEmbedding, itemEmbedding);
      
      // تحويل _id إلى string إذا كان ObjectId
      const id = item._id && typeof item._id === 'object' && 'toString' in item._id 
        ? (item._id as { toString(): string }).toString() 
        : String(item._id || '');
      
      // إنشاء نسخة من العنصر مع _id كـ string
      const itemWithStringId = {
        ...item,
        _id: id
      };
      
      if (similarity > 0.4) {
        results.push({
          type: item.itemType,
          data: itemWithStringId,
          score: similarity,
          relevance: similarity > 0.7 ? "مشابه جداً" : similarity > 0.5 ? "مشابه" : "ذو صلة",
        });
      }
    }
    
    // ترتيب النتائج وإرجاع أفضل النتائج
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
    
  } catch (error) {
    console.error("❌ Error finding similar content:", error);
    return [];
  }
}

// دالة لمسح التخزين المؤقت للـ embeddings
export function clearEmbeddingCache(): void {
  embeddingCache.clear();
  console.log('Embedding cache cleared');
}

// دالة للحصول على حجم التخزين المؤقت
export function getEmbeddingCacheSize(): number {
  return embeddingCache.size;
}

// تصدير الدوال المساعدة
export {
  generateEmbedding,
  cosineSimilarity,
  highlightKeywords,
  calculateRelevanceScore
};