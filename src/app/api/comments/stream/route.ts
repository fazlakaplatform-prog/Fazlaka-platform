// app/api/comments/stream/route.ts

import { NextRequest } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Comment from '@/models/Comment';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get('contentId');
  const type = searchParams.get('type');

  if (!contentId || !type) {
    return new Response('Missing required parameters', { status: 400 });
  }

  // إعداد استجابة SSE
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // دالة لإرسال البيانات عبر SSE
      const sendEvent = (data: object) => {
        const formattedData = `data: ${JSON.stringify(data)}\n\n`;
        controller.enqueue(encoder.encode(formattedData));
      };

      let lastKnownTimestamp: Date | null = null;

      // دالة للتحقق من وجود تعليقات جديدة
      const checkForNewComments = async () => {
        try {
          await connectDB();
          
          // تم تصحيح النوع هنا من `any` إلى `Record<string, string>`
          // هذا يضمن أن كائن الاستعلام يحتوي على مفاتيح وقيم نصية فقط
          const query: Record<string, string> = { [type]: contentId };
          const latestComment = await Comment.findOne(query).sort({ createdAt: -1 });

          if (latestComment) {
            // إذا كان هذا هو التحقق الأول، قم بتخزين الطابع الزمني
            if (!lastKnownTimestamp) {
              lastKnownTimestamp = latestComment.createdAt;
              return;
            }

            // إذا كان هناك تعليق جديد بالفعل
            if (latestComment.createdAt > lastKnownTimestamp) {
              lastKnownTimestamp = latestComment.createdAt;
              sendEvent({ type: 'update' });
            }
          }
        } catch (error) {
          console.error('Error checking for new comments:', error);
          // إرسال خطأ للعميل قد يكون مفيدًا للتصحيح
          sendEvent({ type: 'error', message: 'Failed to check for updates' });
        }
      };

      // إجراء فحص أولي
      await checkForNewComments();
      sendEvent({ type: 'connected', message: 'SSE connection established' });

      // إعداد فاصل زمني للتحقق من التحديثات (كل 3 ثوانٍ)
      const intervalId = setInterval(checkForNewComments, 3000);

      // تنظيف الفاصل الزمني عند إغلاق الاتصال
      request.signal.addEventListener('abort', () => {
        clearInterval(intervalId);
        controller.close();
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