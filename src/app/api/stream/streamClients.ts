// File: src/app/api/stream/streamClients.ts

// تم إزالة استيراد mongodb لأننا نستخدم Prisma مع Neon (PostgreSQL)

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
      // التحقق مما إذا كان الاتصال لا يزال مفتوحاً وقابلاً للكتابة
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

// ملاحظة هامة:
// تمت إزالة كود MongoDB Change Streams (initializeChangeStreams) لأنه يعتمد على MongoDB.
// في PostgreSQL مع Prisma، لا توجد ميزة Watch مدمجة مماثلة.
// لتفعيل التحديثات الفورية (Real-time) عند تغيير البيانات، لديك خياران:
// 1. الطريقة البسيطة: استدعاء دالة `sendToAllClients` يدوياً في ملفات API التي تعدل البيانات (مثل بعد حفظ مقال جديد).
// 2. الطريقة المتقدمة: استخدام ميزة LISTEN/NOTIFY الخاصة بـ PostgreSQL (تحتاج إعداداً إضافياً).