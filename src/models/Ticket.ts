// src/models/Ticket.ts
import mongoose, { Schema, model, Document } from 'mongoose';

// تعريف واجهة للمرفقات
export interface IAttachment {
  name: string;
  size: number;
  type: string;
  url?: string;
  isImage: boolean;
}

// تعريف واجهة للرسالة
export interface IMessage extends Document {
  content: string;
  contentEn?: string;
  sender: 'user' | 'admin';
  attachments: IAttachment[];
  createdAt: Date;
}

// تعريف واجهة للتذكرة
export interface ITicket extends Document {
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImageUrl?: string;
  category: 'technical' | 'account' | 'billing' | 'content' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'waiting_for_user' | 'resolved' | 'closed';
  subject: string;
  subjectEn?: string;
  description: string;
  descriptionEn?: string;
  attachments: IAttachment[];
  messages: IMessage[];
  assignedTo?: string;
  resolution?: string;
  resolutionEn?: string;
  createdAt: Date;
  updatedAt: Date;
  resolvedAt?: Date;
}

// تعريف مخطط للرسائل الموجودة داخل التذكرة
const MessageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true,
  },
  contentEn: {
    type: String,
    trim: true,
  },
  sender: {
    type: String,
    required: true,
    enum: ['user', 'admin'],
  },
  // ✅ هذا هو التعريف الصحيح لمرفقات الرسالة
  attachments: [{
    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
    url: { type: String },
    isImage: { type: Boolean, required: true },
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
}, { _id: false });

// تعريف مخطط التذكرة الرئيسي
const TicketSchema = new mongoose.Schema({
  ticketNumber: {
    type: String,
    required: true,
    unique: true,
  },
  userId: {
    type: String,
    required: true,
  },
  userName: {
    type: String,
    required: true,
    trim: true,
  },
  userEmail: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  userImageUrl: {
    type: String,
  },
  category: {
    type: String,
    required: true,
    enum: ['technical', 'account', 'billing', 'content', 'other'],
  },
  priority: {
    type: String,
    required: true,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    required: true,
    enum: ['open', 'in_progress', 'waiting_for_user', 'resolved', 'closed'],
    default: 'open',
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  subjectEn: {
    type: String,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  descriptionEn: {
    type: String,
    trim: true,
  },
  // ✅ وهذا هو التعريف الصحيح لمرفقات التذكرة
  attachments: [{
    name: { type: String, required: true },
    size: { type: Number, required: true },
    type: { type: String, required: true },
    url: { type: String },
    isImage: { type: Boolean, required: true },
  }],
  messages: [MessageSchema],
  assignedTo: {
    type: String,
    default: null,
  },
  resolution: {
    type: String,
    default: null,
  },
  resolutionEn: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
  resolvedAt: {
    type: Date,
    default: null,
  },
});

// تحديث تاريخ التعديل قبل الحفظ
TicketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.status === 'resolved' && !this.resolvedAt) {
    this.resolvedAt = new Date();
  }
  next();
});

// إضافة فهارس لتحسين الأداء
TicketSchema.index({ ticketNumber: 1 });
TicketSchema.index({ userId: 1 });
TicketSchema.index({ status: 1 });
TicketSchema.index({ category: 1 });
TicketSchema.index({ priority: 1 });
TicketSchema.index({ createdAt: -1 });

export default mongoose.models.Ticket || mongoose.model<ITicket>('Ticket', TicketSchema);