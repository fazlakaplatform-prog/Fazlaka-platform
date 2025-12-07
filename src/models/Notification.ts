import mongoose, { Schema, Document } from 'mongoose';

export interface INotification extends Document {
  userId: string;
  title: string;
  titleEn?: string;
  message: string;
  messageEn?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  relatedId?: string; // ID of related content (article, episode, etc.)
  relatedType?: 'article' | 'episode' | 'season' | 'playlist' | 'team' | 'faq' | 'privacy' | 'terms' | 'general';
  actionUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema: Schema = new Schema({
  userId: { type: String, required: true, index: true },
  title: { type: String, required: true },
  titleEn: { type: String },
  message: { type: String, required: true },
  messageEn: { type: String },
  type: { type: String, enum: ['info', 'success', 'warning', 'error'], default: 'info' },
  isRead: { type: Boolean, default: false, index: true },
  relatedId: { type: String },
  relatedType: { type: String, enum: ['article', 'episode', 'season', 'playlist', 'team', 'faq', 'privacy', 'terms', 'general'] },
  actionUrl: { type: String },
}, {
  timestamps: true // يضيف حقول createdAt و updatedAt تلقائياً
});

// Index for efficient queries
NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model<INotification>('Notification', NotificationSchema);