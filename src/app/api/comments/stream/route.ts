import { NextRequest } from 'next/server';
import { addClient, removeClient } from '@/services/commentStreamService';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get('contentId');

  if (!contentId) {
    return new Response('Missing contentId', { status: 400 });
  }

  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      // إرسال رسالة ترحيب للتأكد من أن الاتصال مفتوح
      const connectMsg = `data: ${JSON.stringify({ type: 'connected' })}\n\n`;
      controller.enqueue(encoder.encode(connectMsg));

      // تسجيل العميل
      addClient(contentId, controller);

      // الحفاظ على الاتصال حياً (Keep-alive)
      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(': keep-alive\n\n'));
        } catch (e) {
          clearInterval(keepAlive);
          removeClient(contentId, controller);
        }
      }, 30000);

      // تنظيف عند إغلاق الاتصال
      request.signal.addEventListener('abort', () => {
        clearInterval(keepAlive);
        removeClient(contentId, controller);
      });
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}