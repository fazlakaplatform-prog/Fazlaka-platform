import React, { useEffect, useRef, useState, useCallback } from 'react';

function wrapFragment(html: string): string {
  return `<!DOCTYPE html><html dir="auto"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body>${html}</body></html>`;
}

function isFullPage(html: string): boolean {
  return /<html[\s>]/i.test(html) || /<!DOCTYPE/i.test(html);
}

// ───FIX: استبدال 100vh بقيمة ثابتة لمنع حلقة التكبير اللامتناهية───
// داخل iframe بـ auto-resize، 100vh = ارتفاع الـ iframe نفسه.
// لما الـ iframe يكبر → 100vh تكبر → المحتوى يكبر → الـ iframe يكبر... للأبد.
function fixViewportUnits(html: string): string {
  return html.replace(
    /((?:min-)?height:\s*)100(?:sv|lv|dv|s|l|d)?vh\b/gi,
    (_m, prefix: string) => prefix + '600px'
  );
}

export default function ContentRenderer({ htmlContent }: { htmlContent: string }) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [height, setHeight] = useState(600);

  const raw = typeof htmlContent === 'string' ? htmlContent : String(htmlContent || '');
  const fullDoc = isFullPage(raw) ? raw : wrapFragment(raw);
  // ───FIX: معالجة 100vh قبل الحقن───
  const doc = fixViewportUnits(fullDoc);

  const handleResize = useCallback((h: number) => {
    setHeight((prev) => {
      const next = Math.max(h, 400);
      if (Math.abs(prev - next) < 4) return prev;
      return next;
    });
  }, []);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    let pending: number | null = null;

    const handler = (e: MessageEvent) => {
      if (e.source !== iframe.contentWindow) return;
      if (e.data?.type === 'ch') {
        if (pending) cancelAnimationFrame(pending);
        pending = requestAnimationFrame(() => {
          handleResize(e.data.h);
          pending = null;
        });
      }
    };

    window.addEventListener('message', handler);

    // ───FIX: قياس محسّن مع توقيتات متعددة───
    const inject = `<script>
(function(){
  var send = function(h){ parent.postMessage({type:'ch',h:h},'*'); };
  function measure(){
    var b = document.body, d = document.documentElement;
    // خُذ الأكبر من body و documentElement لضمان دقة القياس
    return Math.max(b ? b.scrollHeight : 0, d ? d.scrollHeight : 0);
  }
  var sendMeasure = function(){ send(measure()); };

  // ResizeObserver للقطف على أي تغير في layout
  if (typeof ResizeObserver !== 'undefined') {
    var ro = new ResizeObserver(sendMeasure);
    if (document.body) ro.observe(document.body);
    if (document.documentElement) ro.observe(document.documentElement);
  }

  // قياس فوري
  sendMeasure();

  // قياسات متعددة بعد load للتعامل مع:
  // - تحميل الفونتس (Google Fonts)
  // - تحميل الصور (Picsum)
  // - الـ loader اللي بيفضل 1.7s
  // - انتقالالات CSS بعد is-in
  window.addEventListener('load', function(){
    [0, 100, 300, 700, 1500, 2500].forEach(function(t){
      setTimeout(sendMeasure, t);
    });
  });

  // التعامل مع تحميل الفونتس
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(sendMeasure);
  }
})();
<\/script>`;

    // ───FIX: استخدام regex case-insensitive لـ </body>───
    const src = /<\/body>/i.test(doc)
      ? doc.replace(/<\/body>/i, inject + '</body>')
      : doc + inject;

    iframe.srcdoc = src;

    return () => {
      window.removeEventListener('message', handler);
      if (pending) cancelAnimationFrame(pending);
    };
  }, [doc, handleResize]);

  return (
    <div style={{ position: 'relative', width: '100%', minHeight: 400 }}>
      <iframe
        ref={iframeRef}
        style={{ width: '100%', height: Math.max(height, 400), border: 'none', display: 'block' }}
        title="content"
        sandbox="allow-scripts allow-same-origin"
      />
    </div>
  );
}