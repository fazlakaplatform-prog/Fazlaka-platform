'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

interface AIAssistantSearchProps {
  query: string;
  language: string;
}

// تعريف واجهة للنصوص
interface Texts {
  ar: {
    title: string;
    subtitle: string;
    description: string;
    askButton: string;
    examples: {
      title: string;
      questions: string[];
    };
  };
  en: {
    title: string;
    subtitle: string;
    description: string;
    askButton: string;
    examples: {
      title: string;
      questions: string[];
    };
  };
}

export default function AIAssistantSearch({ 
  query, 
  language 
}: AIAssistantSearchProps) {
  const router = useRouter();
  const [isExpanded, setIsExpanded] = useState(false);

  const handleAskAI = () => {
    // إنشاء رابط للمحادثة مع الاستعلام
    const chatUrl = `/chat?q=${encodeURIComponent(query)}`;
    router.push(chatUrl);
  };

  // تعريف كائن النصوص بشكل صريح
  const texts: Texts = {
    ar: {
      title: 'لم تجد ما تبحث عنه؟',
      subtitle: 'اسأل مساعد فذلكه الذكي',
      description: 'يمكن للمساعد الذكي مساعدتك في العثور على ما تبحث عنه أو الإجابة على أسئلتك مباشرة',
      askButton: 'اسأل الذكاء الاصطناعي',
      examples: {
        title: 'أمثلة على الأسئلة:',
        questions: [
          'ما هي أحدث الحلول عن الذكاء الاصطناعي؟',
          'اشرح لي مفهوم البرمجة بلغة بسيطة',
          'ما هي أفضل المقالات للمبتدئين في تطوير الويب؟'
        ]
      }
    },
    en: {
      title: "Didn't find what you're looking for?",
      subtitle: 'Ask Fazlaka AI Assistant',
      description: 'The AI assistant can help you find what you are looking for or answer your questions directly',
      askButton: 'Ask AI Assistant',
      examples: {
        title: 'Example questions:',
        questions: [
          'What are latest episodes about artificial intelligence?',
          'Explain the concept of programming in simple terms',
          'What are the best articles for beginners in web development?'
        ]
      }
    }
  };

  const t = texts[language as keyof Texts];

  return (
    <div className="bg-gradient-to-r from-amber-50 to-emerald-50 dark:from-gray-800 dark:to-gray-900 rounded-lg p-6 border border-amber-100 dark:border-gray-700 my-8">
      <div className="flex items-start space-x-4">
        <div className="flex-shrink-0">
          <div className="w-12 h-12 rounded-full overflow-hidden bg-white dark:bg-gray-800 p-1 shadow-md">
            <Image
              src={language === 'en' ? '/ai_e.png' : '/ai_a.png'}
              alt="Fazlaka AI Assistant"
              width={40}
              height={40}
              className="object-cover rounded-full"
            />
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">
            {t.title}
          </h3>
          <h4 className="text-xl font-semibold text-amber-600 dark:text-amber-400 mb-2">
            {t.subtitle}
          </h4>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            {t.description}
          </p>
          
          <button
            onClick={handleAskAI}
            className="bg-amber-500 hover:bg-amber-600 dark:bg-amber-600 dark:hover:bg-amber-700 text-white px-6 py-2 rounded-lg transition-colors flex items-center"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8.7s8.3.134 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
            {t.askButton}
          </button>
          
          <div className="mt-4">
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="text-amber-600 dark:text-amber-400 text-sm hover:underline flex items-center"
            >
              {isExpanded ? (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  {language === 'ar' ? 'إخفاء الأمثلة' : 'Hide examples'}
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10 10.586l3.293 3.293a1 1 0 111.414 1.414l4 4a1 1 0 011.414 0l4-4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  {language === 'ar' ? 'عرض الأمثلة' : 'Show examples'}
                </>
              )}
            </button>
            
            {isExpanded && (
              <div className="mt-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600">
                <h5 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  {t.examples.title}
                </h5>
                <ul className="space-y-2">
                  {t.examples.questions.map((question, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-400 flex items-start">
                      <span className="text-amber-500 mr-2">•</span>
                      {question}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}