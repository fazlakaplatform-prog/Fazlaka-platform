// واجهة لتمثيل نية المستخدم
export interface UserIntent {
  intent: string; // النية الرئيسية (مثل: البحث عن حلقة، الاستفسار عن مقال، إلخ)
  entities: string[]; // الكيانات المذكورة (مثل: أسماء، مواضيع، إلخ)
  sentiment: 'positive' | 'negative' | 'neutral'; // المشاعر المحتملة
  urgency: 'low' | 'medium' | 'high'; // مستوى الإلحاح
  category: 'general' | 'specific' | 'comparison' | 'recommendation'; // فئة السؤال
}

// تعريف واجهة لنتائج البحث
interface SearchResult {
  itemType: string;
  title?: string;
  name?: string;
  question?: string;
  [key: string]: unknown;
}

// قائمة الكلمات المفتاحية لكل نية
const intentKeywords = {
  episode: ['حلقة', 'حلقات', 'برنامج', 'فيديو', 'حوار'],
  article: ['مقال', 'مقالات', 'كتابة', 'نص', 'تدوينة'],
  season: ['موسم', 'مواسم', 'فصل', 'برنامج'],
  playlist: ['قائمة تشغيل', 'تشغيل', 'قائمة', 'تجمع'],
  team: ['فريق', 'مطور', 'عضو', 'صانع محتوى', 'مقدم'],
  faq: ['سؤال', 'استفسار', 'سؤال شائع', 'مساعدة'],
  privacy: ['خصوصية', 'بيانات', 'معلومات', 'جمع', 'استخدام', 'privacy', 'data', 'information'],
  terms: ['شروط', 'أحكام', 'استخدام', 'خدمة', 'terms', 'conditions', 'usage', 'service'],
  legal: ['قانوني', 'حقوق', 'مسؤولية', 'legal', 'rights', 'responsibility'],
  search: ['ابحث', 'بحث', 'أريد أن أعرف', 'هل يوجد'],
  comparison: ['مقارنة', 'فرق', 'أفضل', 'قارن'],
  recommendation: ['اقترح', 'توصية', 'ماذا أشاهد', 'ماذا أقرأ'],
  greeting: ['مرحبا', 'أهلا', 'السلام عليكم', 'مساء الخير', 'صباح الخير'],
  help: ['مساعدة', 'ساعدني', 'كيف', 'طريقة'],
  feedback: ['رأي', 'شكوى', 'اقتراح', 'ملاحظة'],
};

// قائمة الكلمات المفتاحية للمشاعر
const sentimentKeywords = {
  positive: ['رائع', 'ممتاز', 'جميل', 'أحب', 'مذهل', 'رائع', 'مفيد'],
  negative: ['سيء', 'سئمت', 'مشكلة', 'صعب', 'معقد', 'لا يعمل'],
};

// قائمة الكلمات المفتاحية للإلحاح
const urgencyKeywords = {
  high: ['عاجل', 'سريع', 'فورا', 'الآن', 'بسرعة'],
  medium: ['قريبا', 'في القريب العاجل', 'في أقرب وقت'],
};

// تحليل نية المستخدم من نصه
export async function analyzeUserIntent(userMessage: string): Promise<UserIntent> {
  const normalizedMessage = userMessage.toLowerCase();
  
  // تحديد النية الرئيسية
  let intent = 'general';
  let maxScore = 0;
  
  for (const [intentName, keywords] of Object.entries(intentKeywords)) {
    let score = 0;
    for (const keyword of keywords) {
      if (normalizedMessage.includes(keyword)) {
        score += 1;
      }
    }
    
    if (score > maxScore) {
      maxScore = score;
      intent = intentName;
    }
  }
  
  // استخراج الكيانات (أسماء، مواضيع، إلخ)
  const entities = await extractEntities(normalizedMessage);
  
  // إضافة كيانات خاصة بالشروط والأحكام
  if (intent === 'privacy' || intent === 'terms' || intent === 'legal') {
    entities.push(intent);
  }
  
  // تحليل المشاعر
  let sentiment: 'positive' | 'negative' | 'neutral' = 'neutral';
  let positiveScore = 0;
  let negativeScore = 0;
  
  for (const [sentimentType, keywords] of Object.entries(sentimentKeywords)) {
    for (const keyword of keywords) {
      if (normalizedMessage.includes(keyword)) {
        if (sentimentType === 'positive') {
          positiveScore += 1;
        } else if (sentimentType === 'negative') {
          negativeScore += 1;
        }
      }
    }
  }
  
  if (positiveScore > negativeScore) {
    sentiment = 'positive';
  } else if (negativeScore > positiveScore) {
    sentiment = 'negative';
  }
  
  // تحديد مستوى الإلحاح
  let urgency: 'low' | 'medium' | 'high' = 'low';
  
  for (const [urgencyLevel, keywords] of Object.entries(urgencyKeywords)) {
    for (const keyword of keywords) {
      if (normalizedMessage.includes(keyword)) {
        urgency = urgencyLevel as 'low' | 'medium' | 'high';
        break;
      }
    }
    if (urgency !== 'low') break;
  }
  
  // تحديد فئة السؤال
  let category: 'general' | 'specific' | 'comparison' | 'recommendation' = 'general';
  
  if (intent === 'comparison') {
    category = 'comparison';
  } else if (intent === 'recommendation') {
    category = 'recommendation';
  } else if (entities.length > 0 || maxScore > 1) {
    category = 'specific';
  }
  
  return {
    intent,
    entities,
    sentiment,
    urgency,
    category,
  };
}

// استخراج الكيانات من النص
async function extractEntities(text: string): Promise<string[]> {
  // في تطبيق حقيقي، قد تستخدم هنا خدمة NLP مثل spaCy أو NLTK
  // للتبسيط، سنستخدم استخراجاً بسيطاً يعتمد على الكلمات الرئيسية
  
  const entities: string[] = [];
  
  // استخراج أسماء المواضيع الشائعة
  const topicKeywords = [
    'برمجة', 'ذكاء اصطناعي', 'تعلم الآلة', 'تطوير', 'تصميم', 
    'تسويق', 'أعمال', 'ريادة', 'علوم', 'تكنولوجيا',
    'فن', 'ثقافة', 'تاريخ', 'جغرافيا', 'سياسة', 'اقتصاد',
    'خصوصية', 'بيانات', 'شروط', 'أحكام', 'قانوني', 'حقوق'
  ];
  
  for (const keyword of topicKeywords) {
    if (text.includes(keyword)) {
      entities.push(keyword);
    }
  }
  
  return entities;
}

// استخراج الكلمات المفتاحية من النص
export async function extractKeywords(text: string): Promise<string[]> {
  // في تطبيق حقيقي، قد تستخدم هنا خدمة NLP لاستخراج الكلمات المفتاحية
  // للتبسيط، سنستخدم استخراجاً بسيطاً يعتمد على إزالة كلمات التوقف
  
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

// توليد اقتراحات للأسئلة التالية
export async function generateSuggestions(
  currentMessage: string, 
  searchResults: SearchResult[], 
  userIntent: UserIntent
): Promise<string[]> {
  const suggestions: string[] = [];
  
  // بناءً على نية المستخدم
  switch (userIntent.intent) {
    case 'episode':
      suggestions.push('ما هي أحدث الحلقات المتاحة؟');
      suggestions.push('هل هناك حلقات عن مواضيع متقدمة؟');
      break;
    case 'article':
      suggestions.push('ما هي أحدث المقالات المتاحة؟');
      suggestions.push('هل هناك مقالات للمبتدئين؟');
      break;
    case 'season':
      suggestions.push('ما هي المواسم المتاحة؟');
      suggestions.push('كم عدد الحلقات في كل موسم؟');
      break;
    case 'playlist':
      suggestions.push('ما هي قوائم التشغيل المتاحة؟');
      suggestions.push('هل هناك قوائم تشغيل للمبتدئين؟');
      break;
    case 'team':
      suggestions.push('من هم أعضاء الفريق؟');
      suggestions.push('كيف يمكنني التواصل مع الفريق؟');
      break;
    case 'faq':
      suggestions.push('ما هي الأسئلة الشائعة؟');
      suggestions.push('كيف يمكنني الحصول على المساعدة؟');
      break;
    case 'privacy':
      suggestions.push('ما هي سياسة الخصوصية في المنصة؟');
      suggestions.push('كيف يتم حماية بياناتي الشخصية؟');
      break;
    case 'terms':
      suggestions.push('ما هي شروط استخدام المنصة؟');
      suggestions.push('ما هي حقوقي ومسؤولياتي كمستخدم؟');
      break;
    case 'legal':
      suggestions.push('ما هي الجوانب القانونية لاستخدام المنصة؟');
      suggestions.push('كيف تتعامل المنصة مع الحقوق القانونية؟');
      break;
    case 'search':
      suggestions.push('كيف يمكنني البحث عن محتوى معين؟');
      suggestions.push('ما هي الفئات المتاحة؟');
      break;
    case 'comparison':
      suggestions.push('ما هي الفروقات بين المواسم المختلفة؟');
      suggestions.push('ما هو المحتوى الأنسب للمبتدئين؟');
      break;
    case 'recommendation':
      suggestions.push('ماذا تقترح أن أشاهد أولاً؟');
      suggestions.push('ما هو المحتوى الأكثر شعبية؟');
      break;
    default:
      suggestions.push('ما هو المحتوى المتاح في المنصة؟');
      suggestions.push('كيف يمكنني البدء؟');
  }
  
  // بناءً على نتائج البحث
  if (searchResults.length > 0) {
    const topResult = searchResults[0];
    
    switch (topResult.itemType) {
      case 'episode':
        suggestions.push(`أخبرني المزيد عن حلقة: ${topResult.title}`);
        suggestions.push(`هل هناك حلقات مشابهة لـ: ${topResult.title}؟`);
        break;
      case 'article':
        suggestions.push(`أخبرني المزيد عن مقال: ${topResult.title}`);
        suggestions.push(`هل هناك مقالات مشابهة لـ: ${topResult.title}؟`);
        break;
      case 'season':
        suggestions.push(`ما هي الحلقات في موسم: ${topResult.title}؟`);
        suggestions.push(`ما هو المحتوى في موسم: ${topResult.title}؟`);
        break;
      case 'playlist':
        suggestions.push(`ما هو المحتوى في قائمة التشغيل: ${topResult.title}؟`);
        suggestions.push(`هل هناك قوائم تشغيل مشابهة لـ: ${topResult.title}؟`);
        break;
      case 'team':
        suggestions.push(`أخبرني المزيد عن: ${topResult.name}`);
        suggestions.push(`كيف يمكنني التواصل مع: ${topResult.name}؟`);
        break;
      case 'faq':
        suggestions.push(`هل هناك إجابات لأسئلة مشابهة لـ: ${topResult.question}؟`);
        break;
      case 'privacy':
        suggestions.push(`ما هي تفاصيل سياسة الخصوصية: ${topResult.title}؟`);
        break;
      case 'terms':
        suggestions.push(`ما هي تفاصيل الشروط والأحكام: ${topResult.title}؟`);
        break;
    }
  }
  
  // إزالة التكرارات وإرجاع أفضل 3 اقتراحات
  return [...new Set(suggestions)].slice(0, 3);
}