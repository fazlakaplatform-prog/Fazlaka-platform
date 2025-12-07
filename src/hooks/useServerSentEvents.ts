"use client";

import { useEffect, useState, useRef } from 'react';
import { useSession } from 'next-auth/react';

interface EventSourceOptions {
  onMessage?: (event: MessageEvent) => void;
  onError?: (event: Event) => void;
  onOpen?: (event: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useServerSentEvents(url: string, options: EventSourceOptions = {}) {
  const { data: session } = useSession();
  const [readyState, setReadyState] = useState<number>(0); // 0: CONNECTING, 1: OPEN, 2: CLOSED
  const [lastEventId, setLastEventId] = useState<string | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const reconnectAttempts = useRef(0);
  const {
    onMessage,
    onError,
    onOpen,
    reconnectInterval = 3000,
    maxReconnectAttempts = 5
  } = options;

  useEffect(() => {
    if (!session?.user?.id) return;

    const connect = () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }

      // إضافة معرف المستخدم إلى URL
      const eventUrl = `${url}?userId=${session.user.id}`;
      eventSourceRef.current = new EventSource(eventUrl);

      eventSourceRef.current.onopen = (event) => {
        setReadyState(1);
        reconnectAttempts.current = 0;
        if (onOpen) onOpen(event);
      };

      eventSourceRef.current.onmessage = (event) => {
        const eventData = event as MessageEvent & { lastEventId?: string };
        setLastEventId(eventData.lastEventId || null);
        if (onMessage) onMessage(event);
      };

      eventSourceRef.current.onerror = (event) => {
        setReadyState(2);
        if (onError) onError(event);
        
        // محاولة إعادة الاتصال
        if (reconnectAttempts.current < maxReconnectAttempts) {
          reconnectAttempts.current++;
          setTimeout(connect, reconnectInterval);
        }
      };
    };

    connect();

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
        eventSourceRef.current = null;
      }
    };
  }, [session?.user?.id, url, onMessage, onError, onOpen, reconnectInterval, maxReconnectAttempts]);

  return {
    readyState,
    lastEventId,
    eventSource: eventSourceRef.current
  };
}