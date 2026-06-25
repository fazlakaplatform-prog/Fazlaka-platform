import { useEffect, useState, useRef } from 'react';
import { pusherClient } from '@/lib/pusher';

interface Attachment {
  url: string;
  isImage?: boolean;
  name?: string;
}

interface Message {
  id: string;
  content: string;
  sender: string;
  createdAt: string;
  attachments: Attachment[];
}

export function useRealtimeChat(ticketId: string, initialMessages: Message[]) {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  
  // نستخدم Ref لتخزين معرّف التذكرة السابق لتجنب حلقة التحديث اللانهائية
  const prevTicketIdRef = useRef<string | null>(null);

  useEffect(() => {
    // نحدث الرسائل الأولية فقط إذا تم فتح تذكرة جديدة (تغير الـ ID)
    if (ticketId !== prevTicketIdRef.current) {
      setMessages(initialMessages);
      prevTicketIdRef.current = ticketId;
    }
  }, [ticketId, initialMessages]);

  useEffect(() => {
    if (!ticketId || !pusherClient) return;

    const channel = pusherClient.subscribe(`private-ticket-${ticketId}`);

    channel.bind('new-message', (newMessage: Message) => {
      setMessages((prev) => {
        // منع التكرار
        const exists = prev.some((msg) => msg.id === newMessage.id);
        if (exists) return prev;
        return [...prev, newMessage];
      });
    });

    return () => {
      channel.unbind_all();
      channel.unsubscribe();
    };
  }, [ticketId]);

  return { messages };
}