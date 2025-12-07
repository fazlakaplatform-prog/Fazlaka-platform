// src/app/api/stream/streamClients.ts

// تخزين العملاء المتصلين في مصفوفة مشتركة
let clients: ReadableStreamDefaultController[] = [];

/**
 * دالة لإرسال رسالة لجميع العملاء المتصلين.
 * @param data البيانات التي سيتم إرسالها.
 */
export function sendToAllClients(data: Record<string, unknown>) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  // نسخة من المصفوفة لتجنب المشاكل أثناء التكرار إذا تم تعديلها
  const clientsCopy = [...clients]; 
  clientsCopy.forEach(client => {
    try {
      // التحقق من أن الاتصال لا يزال مفتوحًا قبل الإرسال
      if (client.desiredSize !== null) {
        client.enqueue(new TextEncoder().encode(message));
      }
    } catch (error: unknown) {
      console.error('Error sending message to a client, connection might be closed:', error);
    }
  });
}

/**
 * دالة للحصول على قائمة العملاء الحاليين.
 */
export function getClients() {
  return clients;
}

/**
 * دالة لتعيين قائمة العملاء (تُستخدم عند إضافة أو إزالة عميل).
 * @param clientList القائمة الجديدة للعملاء.
 */
export function setClients(clientList: ReadableStreamDefaultController[]) {
  clients = clientList;
}