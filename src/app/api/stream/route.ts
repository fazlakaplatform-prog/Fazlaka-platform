import { addGeneralClient, removeGeneralClient } from '@/services/sseService';

export async function GET() {
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      addGeneralClient(controller);
      controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`));
    },
    cancel() {
      // Note: we need the controller instance to remove it properly, 
      // but in this simple structure, the sseService handles removal on error usually.
      // For proper cleanup on client disconnect, passing controller to remove is needed.
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