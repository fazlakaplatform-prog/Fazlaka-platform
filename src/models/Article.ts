import mongoose, { Schema, Document } from 'mongoose';

// تعريف واجهة لمحتوى PortableText
interface PortableTextBlock {
  _type: string;
  _key?: string;
  style?: string;
  markDefs?: Array<{
    _type: string;
    _key: string;
    [key: string]: unknown;
  }>;
  children: Array<{
    _type: string;
    text: string;
    marks?: string[];
  }>;
}

export interface IArticle extends Document {
  title: string;
  titleEn: string;
  slug: string;
  excerpt?: string;
  excerptEn?: string;
  content?: PortableTextBlock[]; // PortableText content
  contentEn?: PortableTextBlock[]; // PortableText content
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  season?: string; // Reference to Season ID
  episode?: string; // Reference to Episode ID
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ArticleSchema: Schema = new Schema({
  title: { type: String, required: true },
  titleEn: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  excerpt: { type: String },
  excerptEn: { type: String },
  content: { type: Schema.Types.Mixed },
  contentEn: { type: Schema.Types.Mixed },
  featuredImageUrl: { type: String },
  featuredImageUrlEn: { type: String },
  season: { type: Schema.Types.ObjectId, ref: 'Season' },
  episode: { type: Schema.Types.ObjectId, ref: 'Episode' },
  publishedAt: { type: Date },
}, {
  timestamps: true
});

// Create slug from title before saving
ArticleSchema.pre('save', function(this: IArticle, next) {
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

export default mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);