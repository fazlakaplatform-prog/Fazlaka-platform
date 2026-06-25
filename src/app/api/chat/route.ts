import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI, GenerateContentStreamResult } from '@google/generative-ai';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma'; // تم التعديل: استخدام Named Import
import { Prisma } from '@prisma/client';
import { fetchUserData } from '@/services/userService';
import { fetchChatbotKnowledge, ChatbotKnowledge } from '@/services/chatbotData';

export const runtime = 'nodejs';

// تعريف واجهات للبيانات
interface ChatMessage {
  role: string;
  content: string;
  timestamp?: Date;
  language?: string;
}

interface UserContext {
  userId?: string;
  userLanguage?: string;
}

interface ChatRequestBody {
  messages: ChatMessage[];
  hasGreeted: boolean;
  userContext?: UserContext;
  chatId?: string;
}

interface ModelInfo {
  name: string;
  supportedMethods?: string[];
}

interface ModelsResponse {
  models: ModelInfo[];
}

// تعريف واجهة للمحتوى القانوني
interface LegalContent {
  id: string;
  title: string;
  titleEn?: string;
  content: string;
  contentEn?: string;
  [key: string]: unknown;
}

// استخدام ChatbotKnowledge من chatbotData بدلاً من تعريف KnowledgeBase جديد
type KnowledgeBase = Omit<ChatbotKnowledge, 'platformInfo'> & {
  privacyContent?: LegalContent[];
  termsContent?: LegalContent[];
};

export async function POST(req: NextRequest) {
  try {
    console.log("🚀 Received a request to enhanced Gemini AI assistant.");

    const body = await req.json() as ChatRequestBody;
    const { messages, hasGreeted, userContext, chatId } = body;

    if (!messages || !Array.isArray(messages)) {
      return new NextResponse(JSON.stringify({ error: 'Invalid request body: messages missing or malformed' }), { status: 400 });
    }

    // Get session for authentication
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.id) {
      return new NextResponse(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });    
    }

    // --- API KEY CHECK ---
    const apiKey = process.env.GOOGLE_AI_API_KEY;
    if (!apiKey) {
      console.error("❌ Google AI API Key is not configured in .env.local");
      return new NextResponse(JSON.stringify({ error: 'Google AI API Key is not configured.' }), { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // استخدم النموذج المفضل من متغيرات البيئة أو النماذج الافتراضي
    const desiredModelName = process.env.GOOGLE_AI_MODEL || 'gemini-2.5-flash';

    // تحديد لغة المستخدم مع سجل للتحقق
    const userLanguage = userContext?.userLanguage || 'ar';
    console.log(`User language detected: ${userLanguage}`);

    // تعليمات النظام بناءً على لغة المستخدم
    const systemInstructions: Record<string, string> = {
      ar: `أنت مساعد ذكاء اصطناعي متكامل في منصة "فذلكه"، وأنت جزء لا يتجزأ من المنصة نفسها. شخصيتك ودودة، ذكية، ومحبة للمساعدة. مهمتك هي الإجابة على أسئلة المستخدمين وتقديم المساعدة باستخدام معرفتك الشاملة بمنصة فذلكه.

قواعد تفاعلك:
1. أنت جزء من فريق فذلكه، تحدث بلسان المنصة ("نحن"، "فريقنا"، "محتوانا")
2. لا تقل أبداً "بناءً على السياق" أو "بناءً على المعلومات المتاحة" - أنت تعرف كل شيء عن المنصة
3. استخدم معرفتك المباشرة عن المنصة للإجابة
4. تحدث بطلاقة ودودة وكأنك عضو حقيقي في فريق فذلكه
5. كن موجزاً ومفيداً في إجاباتك
6. في نهاية كل رد، وقّع باسم "فريق فذلكه"
7. قدم اقتراحات للأسئلة التالية التي قد تهم المستخدم
8. لا تكرر الترحيب أبداً في الرسائل المتتالية
9. كن مبدعاً وقدم معلومات قيمة للمعرفة

مهم جداً: يجب أن تتحدث باللغة العربية دائماً في إجاباتك.`,

      en: `You are an AI assistant integrated into "Fazlaka" platform, and you are an integral part of platform itself. Your personality is friendly, intelligent, and helpful. Your mission is to answer users' questions and provide assistance using your comprehensive knowledge of Fazlaka platform.

Your interaction rules:
1. You are part of Fazlaka team, speak in platform's voice ("we", "our team", "our content")
2. Never say "based on context" or "based on available information" - you know everything about platform
3. Use your direct knowledge of platform to answer
4. Speak fluently and friendly as if you are a real member of Fazlaka team
5. Be concise and helpful in your answers
6. At the end of each response, sign as "Fazlaka Team"
7. Provide suggestions for next questions that might interest user
8. Never repeat greetings in consecutive messages
9. Be creative and provide valuable information for knowledge

Very important: You must always speak in English in your responses.`
    };

    const systemInstruction = systemInstructions[userLanguage] || systemInstructions.ar;
    console.log(`Using system instruction for language: ${userLanguage}`);

    // إنشاء نموذج مع التعليمات
    let model;
    try {
      model = genAI.getGenerativeModel({
        model: desiredModelName,
        systemInstruction
      });
    } catch (e) {
      console.warn('Could not getGenerativeModel with desiredModelName:', desiredModelName, e);
      model = genAI.getGenerativeModel({ model: desiredModelName, systemInstruction });
    }

    const lastUserMessage = messages[messages.length - 1]?.content || '';
    console.log(`Last user message: "${lastUserMessage}"`);

    // --- جلب بيانات المستخدم إذا كان متوفراً ---
    let userData = null;
    if (userContext?.userId) {
      try {
        userData = await fetchUserData(userContext.userId);
        console.log("👤 User data loaded:", userData);
      } catch (userErr) {
        console.warn('Failed to fetch user data:', userErr);
      }
    }

    // --- جلب البيانات من قاعدة البيانات ---
    let allKnowledge: KnowledgeBase = {
      articles: [],
      episodes: [],
      seasons: [],
      playlists: [],
      team: [],
      faqs: []
    };

    try {
      const knowledgeBase = await fetchChatbotKnowledge(userLanguage);
      
      // تخزين كل المعرفة
      allKnowledge = {
        articles: knowledgeBase.articles,
        episodes: knowledgeBase.episodes,
        seasons: knowledgeBase.seasons,
        playlists: knowledgeBase.playlists,
        team: knowledgeBase.team,
        faqs: knowledgeBase.faqs
      };
      
      console.log("✅ Knowledge base loaded:", knowledgeBase);
      
    } catch (searchErr) {
      console.warn('Failed to fetch data from database:', searchErr);
    }

    // --- جلب بيانات الشروط والأحكام وسياسة الخصوصية ---
    try {
      // استخدام Prisma بدلاً من mongoose
      const [privacyContent, termsContent] = await Promise.all([
        prisma.privacy.findMany({ take: 10 }),
        prisma.terms.findMany({ take: 10 })
      ]);

      // تحويل البيانات إلى التنسيق المناسب
      const formattedPrivacyContent: LegalContent[] = privacyContent.map(item => {
        const title = userLanguage === 'ar' ? item.title : (item.titleEn || item.title);
        // استخدام النص مباشرة أو تحويل JSON إذا لزم الأمر
        const content = userLanguage === 'ar' 
            ? (typeof item.description === 'string' ? item.description : JSON.stringify(item.description)) 
            : (typeof item.descriptionEn === 'string' ? item.descriptionEn : JSON.stringify(item.descriptionEn));
        
        return {
          id: item.id,
          title: title || '',
          titleEn: item.titleEn || undefined,
          content: content,
          contentEn: item.descriptionEn || undefined,
        };
      });

      const formattedTermsContent: LegalContent[] = termsContent.map(item => {
        const title = userLanguage === 'ar' ? item.title : (item.titleEn || item.title);
        const content = userLanguage === 'ar' 
            ? (typeof item.description === 'string' ? item.description : JSON.stringify(item.description)) 
            : (typeof item.descriptionEn === 'string' ? item.descriptionEn : JSON.stringify(item.descriptionEn));
        
        return {
          id: item.id,
          title: title || '',
          titleEn: item.titleEn || undefined,
          content: content,
          contentEn: item.descriptionEn || undefined,
        };
      });

      // إضافة هذه المعلومات إلى allKnowledge
      allKnowledge.privacyContent = formattedPrivacyContent;
      allKnowledge.termsContent = formattedTermsContent;
      
      console.log("✅ Privacy and Terms content loaded");
    } catch (legalErr) {
      console.warn('Failed to fetch privacy and terms content:', legalErr);
    }

    // --- بناء الموجه الكامل بناءً على لغة المستخدم ---
    let fullPrompt = "";
    
    // الترحيب فقط في الرسالة الأولى
    if (!hasGreeted) {
      if (userLanguage === 'ar') {
        if (userData && userData.name) {
          fullPrompt = `أهلاً بك يا ${userData.name}! أنا مساعدك الذكي في منصة "فذلكه". أنا هنا لمساعدتك في كل ما تحتاجه.\n\n`;
        } else {
          fullPrompt = `أهلاً بك في منصة "فذلكه"! أنا مساعدك الذكي هنا لمساعدتك.\n\n`;
        }
      } else {
        if (userData && userData.name) {
          fullPrompt = `Welcome ${userData.name}! I am your smart assistant on the "Fazlaka" platform. I am here to help you with everything you need.\n\n`;
        } else {
          fullPrompt = `Welcome to the "Fazlaka" platform! I am your smart assistant here to help you.\n\n`;
        }
      }
    }
    
    // إضافة معلومات المنصة كمعرفة مدمجة بناءً على اللغة
    if (userLanguage === 'ar') {
      fullPrompt += `أنا جزء من فريق فذلكه وهذه معرفتي بالمنصة:\n\n`;
      fullPrompt += `--- معلومات منصة فذلكة ---\n`;
      fullPrompt += `اسم المنصة: فذلكه\n`;
      fullPrompt += `الوصف: منصة عربية متخصصة في نشر المعرفة والثقافة من خلال محتوى متنوع ومميز\n`;
      fullPrompt += `مهمتنا: نشر المعرفة وبناء وعى جمعي من خلال محتوى عالي الجودة يثري الفكر العربي\n`;
      fullPrompt += `رؤيتنا: أن نكون المنصة الرائدة في نشر المعرفة والثقافة في العالم العربي\n`;
      
      if (allKnowledge.articles && allKnowledge.articles.length > 0) {
        fullPrompt += `عدد المقالات: ${allKnowledge.articles.length}\n`;
        fullPrompt += `أحدث مقال: ${allKnowledge.articles[0]?.title || 'غير متوفر'}\n`;
      }
      
      if (allKnowledge.episodes && allKnowledge.episodes.length > 0) {
        fullPrompt += `عدد الحلقات: ${allKnowledge.episodes.length}\n`;
        fullPrompt += `أحدث حلقة: ${allKnowledge.episodes[0]?.title || 'غير متوفر'}\n`;
      }
      
      if (allKnowledge.seasons && allKnowledge.seasons.length > 0) {
        fullPrompt += `عدد المواسم: ${allKnowledge.seasons.length}\n`;
        fullPrompt += `أحدث موسم: ${allKnowledge.seasons[0]?.title || 'غير متوفر'}\n`;
      }
      
      if (allKnowledge.team && allKnowledge.team.length > 0) {
        fullPrompt += `عدد أعضاء الفريق: ${allKnowledge.team.length}\n`;
        fullPrompt += `الفريق يتضمن: ${allKnowledge.team.slice(0, 3).map(t => t.name).join(', ')}${allKnowledge.team.length > 3 ? ' وغيرهم الكثيرين' : ''}\n`;
      }
      
      fullPrompt += `--- نهاية معلومات المنصة ---\n\n`;
      
      // إضافة معلومات الشروط والأحكام وسياسة الخصوصية
      fullPrompt += `--- سياسة الخصوصية والشروط والأحكام ---\n`;
      
      if (allKnowledge.privacyContent && allKnowledge.privacyContent.length > 0) {
        fullPrompt += `عدد أقسام سياسة الخصوصية: ${allKnowledge.privacyContent.length}\n`;
        fullPrompt += `أقسام سياسة الخصوصية: ${allKnowledge.privacyContent.map((item: LegalContent) => item.title).join(', ')}\n`;
      }
      
      if (allKnowledge.termsContent && allKnowledge.termsContent.length > 0) {
        fullPrompt += `عدد أقسام الشروط والأحكام: ${allKnowledge.termsContent.length}\n`;
        fullPrompt += `أقسام الشروط والأحكام: ${allKnowledge.termsContent.map((item: LegalContent) => item.title).join(', ')}\n`;
      }
      
      fullPrompt += `--- نهاية معلومات سياسة الخصوصية والشروط والأحكام ---\n\n`;
      
      // إضافة معلومات المستخدم
      if (userData) {
        fullPrompt += `معلومات المستخدم الحالي: ${userData.name || 'ضيف'}\n`;
        if (userData.bio) {
          fullPrompt += `نبذة: ${userData.bio}\n`;
        }
        fullPrompt += `\n`;
      }
      
      fullPrompt += `الآن، أجب على سؤال المستخدم: "${lastUserMessage}"`;
      
      // إضافة طلب لتقديم اقتراحات
      fullPrompt += `\n\nبعد إجابتك، قدم 2-3 اقتراحات للأسئلة التي قد تهم المستخدم. استخدم التنسيق التالي:\n\n**قد تهمك أيضاً:**\n1. [السؤال المقترح الأول]\n2. [السؤال المقترح الثاني]\n3. [السؤال المقترح الثالث]`;
    } else {
      fullPrompt += `I am part of Fazlaka team and this is my knowledge of platform:\n\n`;
      fullPrompt += `--- Fazlaka Platform Information ---\n`;
      fullPrompt += `Platform Name: Fazlaka\n`;
      fullPrompt += `Description: An Arabic platform specialized in spreading knowledge and culture through diverse and distinctive content\n`;
      fullPrompt += `Our Mission: Spreading knowledge and building collective awareness through high-quality content that enriches Arab thought\n`;
      fullPrompt += `Our Vision: To be leading platform in spreading knowledge and culture in Arab world\n`;
      
      if (allKnowledge.articles && allKnowledge.articles.length > 0) {
        fullPrompt += `Number of Articles: ${allKnowledge.articles.length}\n`;
        fullPrompt += `Latest Article: ${allKnowledge.articles[0]?.title || 'Not available'}\n`;
      }
      
      if (allKnowledge.episodes && allKnowledge.episodes.length > 0) {
        fullPrompt += `Number of Episodes: ${allKnowledge.episodes.length}\n`;
        fullPrompt += `Latest Episode: ${allKnowledge.episodes[0]?.title || 'Not available'}\n`;
      }
      
      if (allKnowledge.seasons && allKnowledge.seasons.length > 0) {
        fullPrompt += `Number of Season: ${allKnowledge.seasons.length}\n`;
        fullPrompt += `Latest Season: ${allKnowledge.seasons[0]?.title || 'Not available'}\n`;
      }
      
      if (allKnowledge.team && allKnowledge.team.length > 0) {
        fullPrompt += `Number of Team Members: ${allKnowledge.team.length}\n`;
        fullPrompt += `The team includes: ${allKnowledge.team.slice(0, 3).map(t => t.name).join(', ')}${allKnowledge.team.length > 3 ? ' and many others' : ''}\n`;
      }
      
      fullPrompt += `--- End of Platform Information ---\n\n`;
      
      // Add privacy and terms information
      fullPrompt += `--- Privacy Policy and Terms & Conditions ---\n`;
      
      if (allKnowledge.privacyContent && allKnowledge.privacyContent.length > 0) {
        fullPrompt += `Number of Privacy Policy sections: ${allKnowledge.privacyContent.length}\n`;
        fullPrompt += `Privacy Policy sections: ${allKnowledge.privacyContent.map((item: LegalContent) => item.titleEn || item.title).join(', ')}\n`;
      }
      
      if (allKnowledge.termsContent && allKnowledge.termsContent.length > 0) {
        fullPrompt += `Number of Terms & Conditions sections: ${allKnowledge.termsContent.length}\n`;
        fullPrompt += `Terms & Conditions sections: ${allKnowledge.termsContent.map((item: LegalContent) => item.titleEn || item.title).join(', ')}\n`;
      }
      
      fullPrompt += `--- End of Privacy Policy and Terms & Conditions ---\n\n`;
      
      // Add user information
      if (userData) {
        fullPrompt += `Current User Information: ${userData.name || 'Guest'}\n`;
        if (userData.bio) {
          fullPrompt += `Bio: ${userData.bio}\n`;
        }
        fullPrompt += `\n`;
      }
      
      fullPrompt += `Now, answer user's question: "${lastUserMessage}"`;
      
      // Add request to provide suggestions
      fullPrompt += `\n\nAfter your answer, provide 2-3 suggestions for questions that might interest user. Use following format:\n\n**You might also be interested in:**\n1. [First suggested question]\n2. [Second suggested question]\n3. [Third suggested question]`;
    }

    console.log("📤 Sending enhanced prompt to Gemini...");

    // محاولة إنشاء تدفق الإجابة
    let result: GenerateContentStreamResult | null = null;
    try {
      result = await model.generateContentStream(fullPrompt);
    } catch (genErr: unknown) {
      console.error('❌ GenerateContentStream failed with error:', genErr);

      // محاولة اكتشاف نماذج متاحة تدعم generateContent
      try {
        const anyGen = genAI as { listModels?: () => Promise<ModelsResponse> };
        if (typeof anyGen.listModels === 'function') {
          const modelsResp = await anyGen.listModels();
          const models = modelsResp?.models || [];
          // محاولة اختيار نموذج يبدو أنه Gemini و/أو يدعم generateContent
          const pick = models.find((m: ModelInfo) => (
            (m.name && /gemini|text|chat/i.test(m.name)) &&
            (m.supportedMethods?.includes?.('generateContent') || true)
          )) || models[0];

          if (pick && pick.name) {
            console.log('🔁 Retrying with discovered model:', pick.name);
            model = genAI.getGenerativeModel({ model: pick.name, systemInstruction });
            result = await model.generateContentStream(fullPrompt);
          }
        }
      } catch (fallbackErr) {
        console.error('Fallback attempt to listModels / retry failed:', fallbackErr);
      }
    }

    if (!result) {
      return new NextResponse(JSON.stringify({ error: 'Model generation failed. Check server logs for details.' }), { status: 500 });
    }

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          let fullResponse = '';
          
          for await (const chunk of result!.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
              controller.enqueue(encoder.encode(chunkText));
              fullResponse += chunkText;
            }
          }
          
          // Save's complete conversation to the database
          if (chatId) {
            try {
              // تحديث المحادثة باستخدام Prisma
              const existingChat = await prisma.chatHistory.findUnique({
                where: { id: chatId }
              });
              
              if (existingChat) {
                // existingChat.messages is stored as Prisma.JsonValue (could be string, object, or array).
                // Safely normalize to ChatMessage[] at runtime, with fallbacks.
                let existingMessages: ChatMessage[] = [];
                try {
                  const raw = existingChat.messages as unknown;

                  if (Array.isArray(raw)) {
                    existingMessages = raw as unknown as ChatMessage[];
                  } else if (typeof raw === 'string') {
                    existingMessages = JSON.parse(raw) as ChatMessage[];
                  } else if (raw && typeof raw === 'object') {
                    // If the stored value is an object that represents an array-like structure
                    existingMessages = (raw as unknown as ChatMessage[]) ?? [];
                  } else {
                    existingMessages = [];
                  }
                } catch (parseErr) {
                  console.warn('Failed to parse existing chat messages, initializing as empty array.', parseErr);
                  existingMessages = [];
                }

                const updatedMessages: ChatMessage[] = [
                  ...existingMessages,
                  {
                    role: 'assistant',
                    content: fullResponse,
                    timestamp: new Date(),
                    language: userLanguage
                  }
                ];
                
                await prisma.chatHistory.update({
                  where: { id: chatId },
                  data: {
                    // Cast to Prisma.InputJsonValue to satisfy Prisma's type for JSON fields
                    messages: updatedMessages as unknown as Prisma.InputJsonValue,
                    updatedAt: new Date()
                  }
                });
                
                console.log("💾 Chat history saved successfully");
              }
            } catch (saveError) {
              console.error("❌ Failed to save chat history:", saveError);
            }
          }
        } catch (streamError) {
          console.error("Stream processing error:", streamError);
          controller.error(streamError);
        } finally {
          controller.close();
        }
      }
    });

    return new NextResponse(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8"
      }
    });

  } catch (error: unknown) {
    console.error('❌ Internal Server Error:', error);
    return new NextResponse(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'An unexpected error occurred.' 
    }), { status: 500 });
  }
}
