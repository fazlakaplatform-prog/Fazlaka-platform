// تعريف واجهة لرسالة SSE
interface SSEMessage {
  type: string;
  data: Record<string, unknown>; // تم استبدال any بـ Record<string, unknown>
}

// تخزين الاتصالات النشطة لكل مستخدم (للإشعارات الخاصة)
const activeConnections = new Map<string, ReadableStreamDefaultController>();

// تخزين الاتصالات العامة (للبث العام)
let generalClients: ReadableStreamDefaultController[] = [];

/**
 * إضافة اتصال جديد للمستخدم (للإشعارات الخاصة)
 */
export function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  activeConnections.set(userId, controller);
}

/**
 * إزالة اتصال المستخدم
 */
export function removeConnection(userId: string) {
  activeConnections.delete(userId);
}

/**
 * إرسال إشعار لمستخدم معين
 */
export function sendNotificationToUser(userId: string, notification: Record<string, unknown>): boolean {
  const controller = activeConnections.get(userId);
  if (controller) {
    const encoder = new TextEncoder();
    const message: SSEMessage = { type: 'notification', data: notification };
    const data = `data: ${JSON.stringify(message)}\n\n`;
    try {
      controller.enqueue(encoder.encode(data));
      return true;
    } catch (error) {
      console.error('Failed to send notification to user:', userId, error);
      removeConnection(userId);
    }
  }
  return false;
}

/**
 * بث إشعار لجميع المستخدمين المتصلين
 */
export function broadcastNotification(notification: Record<string, unknown>): number {
  const encoder = new TextEncoder();
  const message: SSEMessage = { type: 'notification', data: notification };
  const data = `data: ${JSON.stringify(message)}\n\n`;
  
  let sentCount = 0;
  
  // إرسال للمتصلين الخاصين
  activeConnections.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(data));
      sentCount++;
    } catch (error) {
      console.error('Error broadcasting to a client:', error);
    }
  });
  
  // إرسال للمتصلين العامين
  generalClients.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(data));
      sentCount++;
    } catch (error) {
      console.error('Error broadcasting to a general client:', error);
    }
  });
  
  return sentCount;
}

// --- دوال البث العام (General Stream) ---

export function addGeneralClient(controller: ReadableStreamDefaultController) {
  generalClients.push(controller);
  console.log(`New general client connected. Total: ${generalClients.length}`);
}

export function removeGeneralClient(controller: ReadableStreamDefaultController) {
  generalClients = generalClients.filter(c => c !== controller);
  console.log(`General client removed. Total: ${generalClients.length}`);
}

export function sendToAllGeneralClients(data: Record<string, unknown>) {
  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  
  generalClients.forEach(client => {
    try {
      if (client.desiredSize !== null && client.desiredSize > 0) {
        client.enqueue(encoder.encode(message));
      }
    } catch (_error) { // تمت إضافة الشرطة السفلية لتجنب التحذير
      removeGeneralClient(client);
    }
  });
}