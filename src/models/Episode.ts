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

export interface IEpisode extends Document {
  title: string;
  titleEn: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  content?: PortableTextBlock[]; // PortableText content
  contentEn?: PortableTextBlock[]; // PortableText content
  videoUrl?: string;
  videoUrlEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  season?: string; // Reference to Season ID
  articles?: string[]; // Array of Article IDs
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const EpisodeSchema: Schema = new Schema({
  title: { type: String, required: true },
  titleEn: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  descriptionEn: { type: String },
  content: { type: Schema.Types.Mixed },
  contentEn: { type: Schema.Types.Mixed },
  videoUrl: { type: String },
  videoUrlEn: { type: String },
  thumbnailUrl: { type: String },
  thumbnailUrlEn: { type: String },
  season: { type: Schema.Types.ObjectId, ref: 'Season' },
  articles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
  publishedAt: { type: Date },
}, {
  timestamps: true
});

// Create slug from title before saving
EpisodeSchema.pre('save', function(this: IEpisode, next) {
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

export default mongoose.models.Episode || mongoose.model<IEpisode>('Episode', EpisodeSchema);