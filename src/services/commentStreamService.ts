import { ReadableStreamDefaultController } from 'stream/web';

// تخزين العملاء المتصلين
const clients = new Map<string, ReadableStreamDefaultController[]>();

export function addClient(contentId: string, controller: ReadableStreamDefaultController) {
  if (!clients.has(contentId)) {
    clients.set(contentId, []);
  }
  clients.get(contentId)!.push(controller);
  console.log(`Client added for ${contentId}. Total: ${clients.get(contentId)!.length}`);
}

export function removeClient(contentId: string, controller: ReadableStreamDefaultController) {
  const contentClients = clients.get(contentId);
  if (contentClients) {
    const index = contentClients.indexOf(controller);
    if (index > -1) {
      contentClients.splice(index, 1);
    }
    if (contentClients.length === 0) {
      clients.delete(contentId);
    }
  }
}

export function broadcastNewComment(contentId: string) {
  const contentClients = clients.get(contentId);
  if (!contentClients || contentClients.length === 0) return;

  console.log(`Broadcasting update to ${contentClients.length} clients for content ${contentId}`);
  
  const message = `data: ${JSON.stringify({ type: 'update' })}\n\n`;
  const encoder = new TextEncoder();

  // نستخدم forEach مع try-catch لضمان عدم توقف العملية إذا فشل عميل واحد
  contentClients.forEach(controller => {
    try {
      controller.enqueue(encoder.encode(message));
    } catch (err) {
      console.error("Failed to send message to client", err);
      removeClient(contentId, controller);
    }
  });
}