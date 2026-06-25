// File: src/lib/realtimeNotifications.ts

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

  public connect(userId: string): void {
    if (this.eventSource) this.disconnect();
    this.userId = userId;
    this.reconnectAttempts = 0;
    this.establishConnection();
  }

  private establishConnection(): void {
    if (!this.userId) return;
    const url = `/api/notifications/stream?userId=${this.userId}`; // Note: userId is handled by session in API, but kept for consistency if needed
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
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        setTimeout(() => this.establishConnection(), this.reconnectInterval);
      }
    };
  }

  public disconnect(): void {
    if (this.eventSource) {
      this.eventSource.close();
      this.eventSource = null;
    }
  }

  public on(eventType: string, callback: (data: unknown) => void): void {
    if (!this.listeners[eventType]) this.listeners[eventType] = [];
    this.listeners[eventType].push(callback);
  }

  public off(eventType: string, callback: (data: unknown) => void): void {
    if (!this.listeners[eventType]) return;
    const index = this.listeners[eventType].indexOf(callback);
    if (index > -1) this.listeners[eventType].splice(index, 1);
  }

  private emit(eventType: string, data: unknown): void {
    if (!this.listeners[eventType]) return;
    this.listeners[eventType].forEach(callback => callback(data));
  }
}

export default RealtimeNotifications;