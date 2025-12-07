// تعريف واجهة للإشعار
interface NotificationData {
  _id: string;
  userId: string;
  title: string;
  titleEn?: string;
  message: string;
  messageEn?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  relatedId?: string;
  relatedType?: 'article' | 'episode' | 'season' | 'playlist' | 'team' | 'faq' | 'privacy' | 'terms' | 'general';
  actionUrl?: string;
  createdAt: string;
  updatedAt: string;
}

// تعريف واجهة لرسالة SSE
interface SSEMessage {
  type: string;
  data: NotificationData | { message: string };
}

// تخزين الاتصالات النشطة لكل مستخدم
const activeConnections = new Map<string, ReadableStreamDefaultController>();

/**
 * إضافة اتصال جديد للمستخدم
 */
export function addConnection(userId: string, controller: ReadableStreamDefaultController) {
  activeConnections.set(userId, controller);
}

/**
 * إزالة اتصال المستخدم عند انقطاعه
 */
export function removeConnection(userId: string) {
  activeConnections.delete(userId);
}

/**
 * إرسال إشعار لمستخدم معين
 */
export function sendNotificationToUser(userId: string, notification: NotificationData): boolean {
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
      // إذا فشل الإرسال، من الأفضل إزالة الاتصال
      removeConnection(userId);
    }
  }
  return false;
}

/**
 * بث إشعار لجميع المستخدمين المتصلين
 */
export function broadcastNotification(notification: NotificationData): number {
  const encoder = new TextEncoder();
  const message: SSEMessage = { type: 'notification', data: notification };
  const data = `data: ${JSON.stringify(message)}\n\n`;
  
  let sentCount = 0;
  // نستخدم copy للتجاوز في حال تم تعديل الـ map أثناء التكرار
  const controllers = Array.from(activeConnections.values());
  controllers.forEach((controller) => {
    try {
      controller.enqueue(encoder.encode(data));
      sentCount++;
    } catch (error) {
      console.error('Error broadcasting notification to a client:', error);
    }
  });
  
  return sentCount;
}