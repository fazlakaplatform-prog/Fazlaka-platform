import mongoose, { Schema, Document } from 'mongoose';

export interface ISeason extends Document {
  title: string;
  titleEn: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  episodes?: string[]; // Array of Episode IDs
  articles?: string[]; // Array of Article IDs
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const SeasonSchema: Schema = new Schema({
  title: { type: String, required: true },
  titleEn: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  descriptionEn: { type: String },
  thumbnailUrl: { type: String },
  thumbnailUrlEn: { type: String },
  episodes: [{ type: Schema.Types.ObjectId, ref: 'Episode' }],
  articles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
  publishedAt: { type: Date },
}, {
  timestamps: true
});

// Create slug from title before saving
SeasonSchema.pre('save', function(this: ISeason, next) {
  // Always generate slug if it's not present
  if (!this.slug) {
    const titleToUse = this.titleEn || this.title;
    this.slug = titleToUse
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

export default mongoose.models.Season || mongoose.model<ISeason>('Season', SeasonSchema);