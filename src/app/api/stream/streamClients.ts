// File: src/app/api/stream/streamClients.ts

import { getDatabase, ObjectId } from '@/lib/mongodb'; // <-- قمنا باستيراد ObjectId هنا

// تعريف واجهة لوصف شكل حدث التغيير القادم من MongoDB
interface MongoChangeStreamEvent {
  operationType: string;
  documentKey: {
    _id: ObjectId | string; // <-- استخدمنا نوعًا أكثر تحديدًا هنا
  };
}

// تخزين العملاء المتصلين في مصفوفة مشتركة
let clients: ReadableStreamDefaultController[] = [];

/**
 * دالة لإرسال رسالة لجميع العملاء المتصلين.
 * @param data البيانات التي سيتم إرسالها.
 */
export function sendToAllClients(data: Record<string, unknown>) {
  if (clients.length === 0) {
    return; // لا توجد عملاء لإرسال الرسالة لهم
  }

  const message = `data: ${JSON.stringify(data)}\n\n`;
  const clientsCopy = [...clients];
  clientsCopy.forEach(client => {
    try {
      if (client.desiredSize !== null && client.desiredSize > 0) {
        client.enqueue(new TextEncoder().encode(message));
      }
    } catch (error: unknown) {
      console.error('Error sending message to a client, connection might be closed:', error);
      removeClient(client);
    }
  });
}

export function addClient(controller: ReadableStreamDefaultController) {
  clients.push(controller);
  console.log(`New client connected. Total clients: ${clients.length}`);
}

export function removeClient(controller: ReadableStreamDefaultController) {
  clients = clients.filter(client => client !== controller);
  console.log(`Client removed. Total clients: ${clients.length}`);
}

// استخدام متغير عام للتأكد من أن الإعداد يتم مرة واحدة فقط
declare global {
  var changeStreamsInitialized: boolean | undefined;
}

async function initializeChangeStreams() {
  // إذا تم الإعداد من قبل، لا تفعل شيئًا
  if (global.changeStreamsInitialized) {
    console.log('Change streams already initialized. Skipping setup.');
    return;
  }

  try {
    console.log('Setting up MongoDB change streams for the first time...');
    const db = await getDatabase();
    
    const collections = [
      'herosliders', 'socialLinks', 'articles', 'seasons', 'episodes', 
      'playlists', 'teams', 'faqs', 'privacyContent', 'termsContent',
      'users', 'settings', 'messages', 'favorites'
    ];

    collections.forEach(collectionName => {
      const changeStream = db.collection(collectionName).watch();
      
      changeStream.on('change', (change: unknown) => {
        console.log(`Change detected in ${collectionName}:`, (change as MongoChangeStreamEvent).operationType);
        
        sendToAllClients({
          type: 'change', 
          operation: (change as MongoChangeStreamEvent).operationType,
          collection: collectionName,
          documentKey: (change as MongoChangeStreamEvent).documentKey?._id 
        });
      });
      
      console.log(`Change stream is now active for ${collectionName}`);
    });
    
    console.log('All change streams have been successfully set up.');
    
    // تعيين العلامة إلى true بعد الإعداد الناجح
    global.changeStreamsInitialized = true;
    
  } catch (error) {
    console.error('Error setting up change stream:', error);
  }
}

// استدعاء الدالة مرة واحدة عند تحميل الملف
initializeChangeStreams();