import { fetchChatbotKnowledge, Article, Episode } from '@/services/chatbotData';
import { performSemanticSearch, SemanticSearchResult } from '@/services/semanticSearch';

// تعريف واجهة أساسية لعناصر المحتوى
interface BaseContentItem {
  _id?: string;
  title?: string;
  name?: string;
  publishedAt?: Date | string;
  createdAt?: Date | string;
}

// تعريف نوع لبيانات النتائج ذات الصلة
type RelevantResultData = 
  | BaseContentItem 
  | BaseContentItem[] 
  | SemanticSearchResult['data'];

// تعريف واجهة موسعة لـ ChatbotKnowledge لدعم الخصائص المحتملة
interface ExtendedChatbotKnowledge {
  team?: BaseContentItem[];
  episodes?: Episode[];
  articles?: Article[];
  seasons?: BaseContentItem[];
  playlists?: BaseContentItem[];
  faqs?: BaseContentItem[];
  privacyContent?: BaseContentItem[];
  privacy?: BaseContentItem[];
  privacyPolicy?: BaseContentItem[];
  termsContent?: BaseContentItem[];
  terms?: BaseContentItem[];
  termsAndConditions?: BaseContentItem[];
}

const normalizeText = (text: string): string => {
  return text.toLowerCase().trim().replace(/[^\u0600-\u06FF\s]/g, '');
};

export async function findRelevantInfo(userMessage: string, language: string = 'ar') {
  console.log("🔍 Starting a comprehensive, multi-intent search...");

  try {
    const knowledgeBase = await fetchChatbotKnowledge(language) as ExtendedChatbotKnowledge;
    const normalizedUserMessage = normalizeText(userMessage);
    console.log("🔑 Normalized User Message:", normalizedUserMessage);

    const relevantResults: { type: string; data: RelevantResultData; query: string; relevance: string }[] = [];

    // --- البحث عن أعضاء الفريق ---
    if (normalizedUserMessage.includes('فريق') || normalizedUserMessage.includes('مطور') || normalizedUserMessage.includes('اعضاء')) {
      console.log("🎯 Detected a team-related question.");
      if (knowledgeBase.team && knowledgeBase.team.length > 0) {
        relevantResults.push({ 
          type: 'team_list', 
          data: knowledgeBase.team, 
          query: 'من هم أعضاء الفريق؟',
          relevance: 'صلة مباشرة'
        });
      }
    }

    // --- البحث عن الحلقات (الأحدث أو الكل) ---
    if (normalizedUserMessage.includes('حلقه') || normalizedUserMessage.includes('حلقات')) {
      if (normalizedUserMessage.includes('احدث') || normalizedUserMessage.includes('اخير') || normalizedUserMessage.includes('جديد')) {
        console.log("🎯 Detected a 'latest/newest episode' question.");
        if (knowledgeBase.episodes && knowledgeBase.episodes.length > 0) {
          const sortedEpisodes = knowledgeBase.episodes.sort((a: Episode, b: Episode) => {
            const dateA = new Date(a.publishedAt || a.createdAt || 0);
            const dateB = new Date(b.publishedAt || b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          relevantResults.push({ 
            type: 'latest_episode', 
            data: sortedEpisodes[0], 
            query: 'ما هي أحدث حلقة؟',
            relevance: 'صلة مباشرة'
          });
        }
      } else {
        console.log("🎯 Detected an 'all episodes' question.");
        if (knowledgeBase.episodes && knowledgeBase.episodes.length > 0) {
          relevantResults.push({ 
            type: 'episode_list', 
            data: knowledgeBase.episodes, 
            query: 'ما هي الحلقات المتاحة؟',
            relevance: 'صلة مباشرة'
          });
        }
      }
    }

    // --- البحث عن المقالات (الأحدث أو الكل) ---
    if (normalizedUserMessage.includes('مقال') || normalizedUserMessage.includes('مقالات')) {
      if (normalizedUserMessage.includes('احدث') || normalizedUserMessage.includes('اخير') || normalizedUserMessage.includes('جديد')) {
        console.log("🎯 Detected a 'latest/newest article' question.");
        if (knowledgeBase.articles && knowledgeBase.articles.length > 0) {
          const sortedArticles = knowledgeBase.articles.sort((a: Article, b: Article) => {
            const dateA = new Date(a.publishedAt || a.createdAt || 0);
            const dateB = new Date(b.publishedAt || b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          relevantResults.push({ 
            type: 'latest_article', 
            data: sortedArticles[0], 
            query: 'ما هو أحدث مقال؟',
            relevance: 'صلة مباشرة'
          });
        }
      } else {
        console.log("🎯 Detected an 'all articles' question.");
        if (knowledgeBase.articles && knowledgeBase.articles.length > 0) {
          relevantResults.push({ 
            type: 'article_list', 
            data: knowledgeBase.articles, 
            query: 'ما هي المقالات المتاحة؟',
            relevance: 'صلة مباشرة'
          });
        }
      }
    }
    
    // --- البحث عن المواسم (الأحدث أو الكل) ---
    if (normalizedUserMessage.includes('موسم') || normalizedUserMessage.includes('مواسم')) {
      if (normalizedUserMessage.includes('احدث') || normalizedUserMessage.includes('اخير') || normalizedUserMessage.includes('جديد')) {
        console.log("🎯 Detected a 'latest/newest season' question.");
        if (knowledgeBase.seasons && knowledgeBase.seasons.length > 0) {
          const sortedSeasons = knowledgeBase.seasons.sort((a: BaseContentItem, b: BaseContentItem) => {
            const dateA = new Date(a.publishedAt || a.createdAt || 0);
            const dateB = new Date(b.publishedAt || b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          relevantResults.push({ 
            type: 'latest_season', 
            data: sortedSeasons[0], 
            query: 'ما هو أحدث موسم؟',
            relevance: 'صلة مباشرة'
          });
        }
      } else {
        console.log("🎯 Detected an 'all seasons' question.");
        if (knowledgeBase.seasons && knowledgeBase.seasons.length > 0) {
          relevantResults.push({ 
            type: 'season_list', 
            data: knowledgeBase.seasons, 
            query: 'ما هي المواسم المتاحة؟',
            relevance: 'صلة مباشرة'
          });
        }
      }
    }

    // --- البحث عن قوائم التشغيل (الأحدث أو الكل) ---
    if (normalizedUserMessage.includes('قائم') && normalizedUserMessage.includes('تشغيل')) {
      console.log("🎯 Detected a playlist-related question.");
      if (normalizedUserMessage.includes('احدث') || normalizedUserMessage.includes('اخير') || normalizedUserMessage.includes('جديد')) {
        console.log("🎯 Detected a 'latest/newest playlist' question.");
        if (knowledgeBase.playlists && knowledgeBase.playlists.length > 0) {
          const sortedPlaylists = knowledgeBase.playlists.sort((a: BaseContentItem, b: BaseContentItem) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB.getTime() - dateA.getTime();
          });
          relevantResults.push({ 
            type: 'latest_playlist', 
            data: sortedPlaylists[0], 
            query: 'ما هي أحدث قائمة تشغيل؟',
            relevance: 'صلة مباشرة'
          });
        }
      } else {
        console.log("🎯 Detected an 'all playlists' question.");
        if (knowledgeBase.playlists && knowledgeBase.playlists.length > 0) {
          relevantResults.push({ 
            type: 'playlist_list', 
            data: knowledgeBase.playlists, 
            query: 'ما هي قوائم التشغيل المتاحة؟',
            relevance: 'صلة مباشرة'
          });
        }
      }
    }

    // --- البحث عن الأسئلة الشائعة ---
    if (normalizedUserMessage.includes('سؤال') || normalizedUserMessage.includes('استفسار') || normalizedUserMessage.includes('سؤال سائع')) {
      console.log("🎯 Detected a FAQ-related question.");
      if (knowledgeBase.faqs && knowledgeBase.faqs.length > 0) {
        relevantResults.push({ 
          type: 'faq_list', 
          data: knowledgeBase.faqs, 
          query: 'ما هي الأسئلة الشائعة؟',
          relevance: 'صلة مباشرة'
        });
      }
    }

    // --- البحث عن سياسة الخصوصية ---
    if (normalizedUserMessage.includes('خصوصية') || normalizedUserMessage.includes('بيانات') || normalizedUserMessage.includes('privacy')) {
      console.log("🎯 Detected a privacy-related question.");
      // Check for different possible property names
      const privacyData = knowledgeBase.privacyContent || knowledgeBase.privacy || knowledgeBase.privacyPolicy;
      if (privacyData && Array.isArray(privacyData) && privacyData.length > 0) {
        relevantResults.push({ 
          type: 'privacy_list', 
          data: privacyData, 
          query: 'ما هي سياسة الخصوصية؟',
          relevance: 'صلة مباشرة'
        });
      }
    }

    // --- البحث عن الشروط والأحكام ---
    if (normalizedUserMessage.includes('شروط') || normalizedUserMessage.includes('أحكام') || normalizedUserMessage.includes('terms')) {
      console.log("🎯 Detected a terms-related question.");
      // Check for different possible property names
      const termsData = knowledgeBase.termsContent || knowledgeBase.terms || knowledgeBase.termsAndConditions;
      if (termsData && Array.isArray(termsData) && termsData.length > 0) {
        relevantResults.push({ 
          type: 'terms_list', 
          data: termsData, 
          query: 'ما هي الشروط والأحكام؟',
          relevance: 'صلة مباشرة'
        });
      }
    }
    
    // --- بحث عام في المقالات والحلقات إذا لم يتم العثور على نية محددة ---
    if (relevantResults.length === 0) {
      console.log("🔎 Performing a general search in articles and episodes...");
      
      // البحث عن تطابق مباشر في العناوين
      knowledgeBase.articles?.forEach((article: Article) => {
        if (normalizeText(article.title).includes(normalizedUserMessage)) {
          relevantResults.push({ 
            type: 'article', 
            data: article, 
            query: userMessage,
            relevance: 'صلة قوية'
          });
        }
      });
      
      knowledgeBase.episodes?.forEach((episode: Episode) => {
        if (normalizeText(episode.title).includes(normalizedUserMessage)) {
          relevantResults.push({ 
            type: 'episode', 
            data: episode, 
            query: userMessage,
            relevance: 'صلة قوية'
          });
        }
      });
      
      // إذا لم يتم العثور على تطابق مباشر، استخدم البحث الدلالي
      if (relevantResults.length === 0) {
        console.log("🧠 No direct matches found, using semantic search...");
        try {
          const semanticResults = await performSemanticSearch(userMessage, language);
          
          semanticResults.forEach(result => {
            relevantResults.push({
              type: result.type,
              data: result.data,
              query: userMessage,
              relevance: result.relevance
            });
          });
        } catch (error) {
          console.error("Error in semantic search:", error);
        }
      }
    }

    console.log("✅ Found comprehensive relevant info:", relevantResults);
    return relevantResults;

  } catch (error) {
    console.error("❌ CRITICAL ERROR in findRelevantInfo:", error);
    return [];
  }
}