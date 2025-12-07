import mongoose, { Schema, Document } from 'mongoose';

export interface IFavorite extends Document {
  userId: string;
  episode?: mongoose.Types.ObjectId;
  article?: mongoose.Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

const FavoriteSchema: Schema = new Schema({
  userId: { type: String, required: true },
  episode: { type: Schema.Types.ObjectId, ref: 'Episode' },
  article: { type: Schema.Types.ObjectId, ref: 'Article' },
}, {
  timestamps: true
});

// التحقق من أن المستخدم يجب أن يختار حلقة أو مقالة، وليس كليهما أو لا شيء منهما
FavoriteSchema.pre('save', function(next) {
  if (!this.episode && !this.article) {
    return next(new Error('يجب اختيار حلقة أو مقالة على الأقل'));
  }
  if (this.episode && this.article) {
    return next(new Error('لا يمكن اختيار حلقة ومقالة معاً'));
  }
  next();
});

export default mongoose.models.Favorite || mongoose.model<IFavorite>('Favorite', FavoriteSchema);