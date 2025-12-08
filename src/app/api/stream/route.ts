// File: src/app/api/stream/route.ts

import { addClient, removeClient } from './streamClients';

// إعداد SSE headers
const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*', // تأكد من أن هذا مناسب للإنتاج
  'Access-Control-Allow-Headers': 'Cache-Control',
};

export async function GET() {
  let controller: ReadableStreamDefaultController;
  
  const stream = new ReadableStream({
    start(c) {
      controller = c;
      
      // إضافة العميل الجديد إلى القائمة المشتركة باستخدام الدالة المخصصة
      addClient(controller);
      
      // إرسال رسالة ترحيب للعميل الجديد فقط
      try {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
      } catch (error) {
        console.error("Error sending welcome message:", error);
        // إذا فشل الإرسال، قم بإزالة العميل على الفور
        removeClient(controller);
      }
    },
    cancel() {
      // إزالة العميل عند إغلاق الاتصال باستخدام الدالة المخصصة
      if (controller) {
        removeClient(controller);
      }
    }
  });

  return new Response(stream, { headers: sseHeaders });
}