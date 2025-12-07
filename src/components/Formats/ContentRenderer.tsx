import React, { useEffect, useRef, useState } from 'react';
import { useLanguage } from '@/components/Language/LanguageProvider';

export default function ContentRenderer({ htmlContent }: { htmlContent: string }) {
  const { language, isRTL } = useLanguage();
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [containerHeight, setContainerHeight] = useState('600px');

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleMessage = (event: MessageEvent) => {
      if (event.source !== iframeRef.current?.contentWindow) {
        return;
      }
      
      if (event.data.type === 'resize') {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          const newHeight = event.data.height;
          console.log('Applying final height:', newHeight);
          setContainerHeight(`${newHeight}px`);
        }, 100); // انتظار قصير جداً
      }
    };

    window.addEventListener('message', handleMessage);

    return () => {
      window.removeEventListener('message', handleMessage);
      clearTimeout(timeoutId);
    };
  }, []);

  const getModifiedHtmlContent = () => {
    // Ensure htmlContent is a string
    const content = typeof htmlContent === 'string' ? htmlContent : String(htmlContent || '');
    
    // هذا هو السكربت المتقدم والموثوق الذي سيتم حقنه في الـ iframe
    const resizeScript = `
      <script>
        (function() {
          // إزالة أي هوامش افتراضية من html و body
          document.documentElement.style.margin = '0';
          document.documentElement.style.padding = '0';
          document.documentElement.style.border = '0';
          document.body.style.margin = '0';
          document.body.style.padding = '0';
          document.body.style.border = '0';
          document.body.style.overflow = 'hidden'; // إخفاء شريط التمرير الداخلي

          const sendHeightToParent = () => {
            const height = Math.max(
              document.documentElement.scrollHeight, 
              document.documentElement.offsetHeight,
              document.body.scrollHeight, 
              document.body.offsetHeight
            );
            window.parent.postMessage({
              type: 'resize',
              height: height
            }, '*');
          };

          // --- استخدام MutationObserver للكشف عن التغييرات بشكل موثوق ---
          const observer = new MutationObserver((mutations) => {
            let shouldResize = false;
            mutations.forEach((mutation) => {
              // إذا تمت إضافة عناصر جديدة أو تغيير في السمات
              if (mutation.type === 'childList' || mutation.type === 'attributes') {
                shouldResize = true;
              }
            });
            if (shouldResize) {
              // استخدم setTimeout لضمان أن الـ DOM قد تم تحديثه بالكامل
              setTimeout(sendHeightToParent, 50);
            }
          });

          // بدء مراقبة التغييرات في الـ body
          observer.observe(document.body, {
            childList: true,       // مراقبة إضافة/إزالة العناصر الفرعية
            subtree: true,        // مراقبة جميع الأحفاد
            attributes: true,      // مراقبة تغيير السمات
            characterData: true, // مراقبة تغييرات النص
          });

          // --- إرسال الارتفاع في أوقات مختلفة لضمان الدقة ---
          const sendInitialHeight = () => {
            sendHeightToParent();
            setTimeout(sendHeightToParent, 100); // بعد تحميل DOM الأساسي
            setTimeout(sendHeightToParent, 300); // بعد تحميل الصور
            setTimeout(sendHeightToParent, 1000); // بعد تحميل الخطوط والسكربتات
          };

          // بدأ العملية عند تحميل الصفحة
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', sendInitialHeight);
          } else {
            sendInitialHeight();
          }
          
          // إرسال الارتفاع عند تغيير حجم نافذة المتصفح (حالة نادرة)
          window.addEventListener('resize', sendHeightToParent);

        })();
      <\/script>
    `;

    // حقن السكربت قبل وسم الإغلاق </body>
    const closingBodyTag = '</body>';
    const insertionPoint = content.lastIndexOf(closingBodyTag);
    
    if (insertionPoint === -1) {
      return content + resizeScript;
    }
    
    return content.slice(0, insertionPoint) + resizeScript + content.slice(insertionPoint);
  };

  const finalHtmlContent = getModifiedHtmlContent();

  return (
    <div 
      className="w-full" 
      style={{ 
        height: containerHeight,
        overflow: 'hidden' // هذا مهم جداً لمنع أي شريط تمرير خارجي
      }}
    >
      <iframe
        ref={iframeRef}
        srcDoc={finalHtmlContent}
        style={{ 
          height: '100%', // الـ iframe يملأ الحاوية الخارجية بالكامل
          width: '100%', 
          border: 'none',
          display: 'block',
          margin: 0,
          padding: 0
        }}
        title="Article Content"
        dir={isRTL ? 'rtl' : 'ltr'}
        lang={language}
      />
    </div>
  );
}