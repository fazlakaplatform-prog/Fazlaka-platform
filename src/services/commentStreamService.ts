// src/services/commentStreamService.ts

import { ReadableStreamDefaultController } from 'stream/web';

// تخزين العملاء المتصلين حسب المحتوى (contentId)
// الهيكل: { "articleId123": [controller1, controller2], "episodeId456": [controller3] }
const clients = new Map<string, ReadableStreamDefaultController[]>();

/**
 * إضافة عميل جديد إلى قائمة العملاء المتصلين لمحتوى معين.
 * @param contentId معرف المحتوى (المقال أو الحلقة)
 * @param controller وحدة التحكم الخاصة بالعميل
 */
export function addClient(contentId: string, controller: ReadableStreamDefaultController) {
  if (!clients.has(contentId)) {
    clients.set(contentId, []);
  }
  clients.get(contentId)!.push(controller);
  console.log(`Client connected to ${contentId}. Total clients for this content: ${clients.get(contentId)!.length}`);
}

/**
 * إزالة عميل من قائمة العملاء.
 * @param contentId معرف المحتوى
 * @param controller وحدة التحكم الخاصة بالعميل
 */
export function removeClient(contentId: string, controller: ReadableStreamDefaultController) {
  const contentClients = clients.get(contentId);
  if (contentClients) {
    const index = contentClients.indexOf(controller);
    if (index > -1) {
      contentClients.splice(index, 1);
      console.log(`Client disconnected from ${contentId}. Remaining clients: ${contentClients.length}`);
    }
    // إذا لم يعد هناك عملاء لهذا المحتوى، احذف المفتاح من الخريطة
    if (contentClients.length === 0) {
      clients.delete(contentId);
    }
  }
}

/**
 * إرسال إشعار لجميع العملاء المتصلين بمحتوى معين.
 * @param contentId معرف المحتوى
 * @param data البيانات المطلوب إرسالها
 */
export function sendToClients(contentId: string, data: Record<string, unknown>) {
  const contentClients = clients.get(contentId);
  if (!contentClients || contentClients.length === 0) {
    return;
  }

  const message = `data: ${JSON.stringify(data)}\n\n`;
  const encoder = new TextEncoder();
  const clientsToRemove: ReadableStreamDefaultController[] = [];

  contentClients.forEach(controller => {
    try {
      // تحقق مما إذا كان الاتصال لا يزال مفتوحًا
      if (controller.desiredSize !== null) {
        controller.enqueue(encoder.encode(message));
      }
    } catch (error) {
      console.error('Error sending message to a client, connection might be closed:', error);
      // أضف العميل إلى قائمة الإزالة لاحقًا
      clientsToRemove.push(controller);
    }
  });

  // إزالة العملاء الذين انقطع اتصالهم
  clientsToRemove.forEach(controller => {
    removeClient(contentId, controller);
  });
}

/**
 * دالة مساعدة لإرسال إشعار بوجود تحديث على التعليقات.
 * يتم استدعاؤها من API routes.
 * @param contentId معرف المحتوى
 * @param contentType نوع المحتوى ('article' أو 'episode')
 * @param action نوع الإجراء ('create', 'delete')
 */
export function sendCommentUpdateNotification(contentId: string, contentType: string, action: string) {
  console.log(`Sending '${action}' notification for ${contentType}Id: ${contentId}`);
  sendToClients(contentId, {
    type: 'update',
    action: action,
    contentType: contentType,
    contentId: contentId,
  });
}