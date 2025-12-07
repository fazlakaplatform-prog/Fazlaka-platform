import mongoose, { Schema, Document } from 'mongoose';

export interface IComment extends Document {
  content: string;
  userId?: string;
  email?: string;
  name?: string;
  userFirstName?: string;
  userLastName?: string;
  userImageUrl?: string;
  createdAt?: Date;
  updatedAt?: Date;
  parentComment?: mongoose.Types.ObjectId;
  article?: mongoose.Types.ObjectId;
  episode?: mongoose.Types.ObjectId;
}

const CommentSchema: Schema = new Schema({
  content: { type: String, required: true },
  userId: { type: String },
  email: { type: String },
  name: { type: String },
  userFirstName: { type: String },
  userLastName: { type: String },
  userImageUrl: { type: String },
  parentComment: { type: Schema.Types.ObjectId, ref: 'Comment' },
  article: { type: Schema.Types.ObjectId, ref: 'Article' },
  episode: { type: Schema.Types.ObjectId, ref: 'Episode' },
}, {
  timestamps: true
});

// إضافة فهارس لتحسين أداء الاستعلامات
CommentSchema.index({ article: 1, createdAt: -1 });
CommentSchema.index({ episode: 1, createdAt: -1 });
CommentSchema.index({ parentComment: 1 });

export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema);