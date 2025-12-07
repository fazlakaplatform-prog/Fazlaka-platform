// src/app/api/stream/route.ts

import { getDatabase } from '@/lib/mongodb';
import { getClients, setClients, sendToAllClients } from './streamClients'; // الاستيراد من الملف المركزي

// إعداد SSE headers
const sseHeaders = {
  'Content-Type': 'text/event-stream',
  'Cache-Control': 'no-cache',
  'Connection': 'keep-alive',
  'Access-Control-Allow-Origin': '*', // تأكد من أن هذا مناسب للإنتاج
  'Access-Control-Allow-Headers': 'Cache-Control',
};

// تعريف واجهة لتيار المراقبة في MongoDB
interface MongoStream {
  close: () => void;
  on: (event: string, listener: (change: unknown) => void) => void;
}

/**
 * دالة لإزالة العميل من القائمة عند إغلاق الاتصال.
 * @param controller وحدة التحكم الخاصة بالعميل الذي تم إغلاقه.
 */
function removeClient(controller: ReadableStreamDefaultController) {
  const clients = getClients();
  const updatedClients = clients.filter(client => client !== controller);
  setClients(updatedClients);
  console.log(`Client removed. Total clients: ${updatedClients.length}`);
}

export async function GET() {
  let controller: ReadableStreamDefaultController;
  const changeStreams: MongoStream[] = [];
  
  const stream = new ReadableStream({
    start(c) {
      controller = c;
      
      // إضافة العميل الجديد إلى القائمة المشتركة
      const currentClients = getClients();
      setClients([...currentClients, controller]);
      console.log(`New client connected. Total clients: ${currentClients.length + 1}`);
      
      // إرسال رسالة ترحيب للعميل الجديد فقط
      try {
        controller.enqueue(new TextEncoder().encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
      } catch (error) {
        console.error("Error sending welcome message:", error);
      }
      
      // إعداد مراقب التغييرات في قاعدة البيانات
      setupChangeStreams(changeStreams);
    },
    cancel() {
      // إزالة العميل عند إغلاق الاتصال
      if (controller) {
        removeClient(controller);
      }
      
      // إغلاق جميع تيارات المراقبة المرتبطة بهذا الاتصال
      changeStreams.forEach(stream => {
        try {
          stream.close();
        } catch (error) {
          console.error('Error closing change stream:', error);
        }
      });
    }
  });

  return new Response(stream, { headers: sseHeaders });
}

/**
 * إعداد تيارات المراقبة (Change Streams) لمجموعات MongoDB المختلفة.
 * @param changeStreams مصفوفة لتخزين تيارات المراقبة لإغلاقها لاحقًا.
 */
async function setupChangeStreams(changeStreams: MongoStream[]) {
  try {
    console.log('Setting up MongoDB change streams...');
    const db = await getDatabase();
    
    const collections = [
      'herosliders', 'socialLinks', 'articles', 'seasons', 'episodes', 
      'playlists', 'teams', 'faqs', 'privacyContent', 'termsContent',
      'users', 'settings', 'messages', 'favorites'
    ];

    collections.forEach(collectionName => {
      const changeStream = db.collection(collectionName).watch() as MongoStream;
      changeStreams.push(changeStream);
      
      changeStream.on('change', (change: unknown) => {
        console.log(`Change detected in ${collectionName}:`, (change as { operationType: string }).operationType);
        
        // إرسال إشعار لجميع العملاء المتصلين باستخدام الدالة المركزية
        sendToAllClients({
          type: 'change', 
          operation: (change as { operationType: string }).operationType,
          collection: collectionName
        });
      });
      
      console.log(`Change stream setup complete for ${collectionName}`);
    });
    
    console.log('All change streams setup complete');
    
  } catch (error) {
    console.error('Error setting up change stream:', error);
  }
}