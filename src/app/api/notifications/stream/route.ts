import { NextRequest } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { addConnection, removeConnection } from '@/services/sseService';

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  
  if (!session?.user?.id) {
    return new Response('Unauthorized', { status: 401 });
  }

  const userId = session.user.id;
  const encoder = new TextEncoder();
  
  const stream = new ReadableStream({
    start(controller) {
      addConnection(userId, controller);
      
      const connectMessage = { 
        type: 'connected', 
        data: { message: 'Connected to notification stream' }
      };
      controller.enqueue(encoder.encode(`data: ${JSON.stringify(connectMessage)}\n\n`));
      
      request.signal.addEventListener('abort', () => {
        removeConnection(userId);
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