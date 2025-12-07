// src/models/ChatHistory.ts
import mongoose, { Schema, Document } from 'mongoose';

interface IChatHistory extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  messages: Array<{
    role: string;
    content: string;
    language?: string;
    timestamp?: Date;
  }>;
  shareId?: string;
  isPublic?: boolean;
  sharedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ChatHistorySchema: Schema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true
  },
  messages: [{
    role: {
      type: String,
      required: true
    },
    content: {
      type: String,
      required: true
    },
    language: String,
    timestamp: Date
  }],
  shareId: {
    type: String,
    sparse: true, // مهم: يسمح بقيم null و unique في نفس الوقت
    unique: true  // تم تعريف الفهرس هنا مباشرة
  },
  isPublic: {
    type: Boolean,
    default: false
  },
  sharedAt: Date
}, {
  timestamps: true
});

// === ملاحظة هامة ===
// لا تقم بإضافة سطر مثل هذا أدناه، فهو يسبب الفهرس المكرر
// ChatHistorySchema.index({ shareId: 1 }); // <== هذا السطر يجب ألا يكون موجوداً أبداً

const ChatHistory = mongoose.models.ChatHistory || mongoose.model<IChatHistory>('ChatHistory', ChatHistorySchema);

export default ChatHistory;