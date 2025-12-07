/**
 * مكتبة مخصصة للتعامل مع الإشعارات الفورية
 */

import { NotificationWithLocalized } from '@/services/notifications';

export class RealtimeNotifications {
  private static instance: RealtimeNotifications;
  private eventSource: EventSource | null = null;
  private listeners: { [key: string]: ((data: unknown) => void)[] } = {};
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private userId: string | null = null;

  private constructor() {}

  public static getInstance(): RealtimeNotifications {
    if (!RealtimeNotifications.instance) {
      RealtimeNotifications.instance = new RealtimeNotifications();
    }
    return RealtimeNotifications.instance;
  }

  /**
   * بدء الاتصال بخدمة الإشعارات الفورية
   */
  public connect(userId: string): void {
    if (this.eventSource) {
      this.disconnect();
    }

    this.userId = userId;
    this.reconnectAttempts = 0;
    this.establishConnection();
  }

  /**
   * إنشاء اتصال EventSource
   */
  private establishConnection(): void {
    if (!this.userId) return;

    const url = `/api/notifications/stream?userId=${this.userId}`;
    this.eventSource = new EventSource(url);

    this.eventSource.onopen = () => {
      console.log('Connected to notification stream');
      this.reconnectAttempts = 0;
    };

    this.eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.emit(data.type, data.data);
      } catch (error) {
        console.error('Error parsing SSE message:', error);
      }
    };

    this.eventSource.onerror = () => {
      console.error('Error in notification stream');
      
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => {
          this.establishConnection();
        }, this.reconnectInterval);
      }
    };
  }

  /**
   * قطع الاتصال بخدمة الإشعارات
   */
  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  /**
   * إضافة مستمع لحدث معين
   */
  public on(eventType: string, callback: (data: unknown) => void): void {
    if (!this.listeners[eventType]) {
      this.listeners[eventType] = [];
    }
    this.listeners[eventType].push(callback);
  }

  /**
   * إزالة مستمع لحدث معين
   */
  public off(eventType: string, callback: (data: unknown) => void): void {
    if (!this.listeners[eventType]) return;
    
    const index = this.listeners[eventType].indexOf(callback);
    if (index > -1) {
      this.listeners[eventType].splice(index, 1);
    }
  }

  /**
   * إطلاق حدث معين
   */
  private emit(eventType: string, data: unknown): void {
    if (!this.listeners[eventType]) return;
    
    this.listeners[eventType].forEach(callback => {
      callback(data);
    });
  }

  /**
   * إرسال إشعار فوري لمستخدم معين (للاستخدام من الخادم)
   */
  public static async sendToUser(userId: string, notification: NotificationWithLocalized): Promise<boolean> {
    try {
      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId,
          notification
        }),
      });

      return response.ok;
    } catch (error) {
      console.error('Error sending notification to user:', error);
      return false;
    }
  }

  /**
   * إرسال إشعار فوري لجميع المستخدمين (للاستخدام من الخادم)
   */
  public static async broadcast(notification: NotificationWithLocalized): Promise<number> {
    try {
      const response = await fetch('/api/notifications/broadcast', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          notification
        }),
      });

      if (response.ok) {
        const data = await response.json();
        return data.sentCount || 0;
      }

      return 0;
    } catch (error) {
      console.error('Error broadcasting notification:', error);
      return 0;
    }
  }
}

export default RealtimeNotifications;