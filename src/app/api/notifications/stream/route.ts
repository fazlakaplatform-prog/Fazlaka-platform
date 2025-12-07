import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { addConnection, removeConnection } from '@/services/sseService'; // استيراد من ملف الخدمة

// تعريف واجهة لرسالة SSE
interface SSEMessage {
  type: string;
  data: { message: string };
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  
  // إنشاء stream للإشعارات
  const stream = new ReadableStream({
    start(controller) {
      // إضافة الاتصال الجديد باستخدام دالة الخدمة
      addConnection(userId, controller);
      
      // إرسال رسالة تأكيد الاتصال
      const connectMessage: SSEMessage = { 
        type: 'connected', 
        data: { message: 'Connected to notification stream' }
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectMessage)}\n\n`));
      
      // تنظيف الاتصال عند إغلاق المتصفح أو انقطاعه
      request.signal.addEventListener('abort', () => {
        removeConnection(userId); // إزالة الاتصال باستخدام دالة الخدمة
        controller.close();
      });
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}