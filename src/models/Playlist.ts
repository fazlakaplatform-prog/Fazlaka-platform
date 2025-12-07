import mongoose, { Schema, Document } from 'mongoose';

export interface IPlaylist extends Document {
  title: string;
  titleEn: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  imageUrlEn?: string;
  episodes?: string[]; // Array of Episode IDs
  articles?: string[]; // Array of Article IDs
  createdAt: Date;
  updatedAt: Date;
}

const PlaylistSchema: Schema = new Schema({
  title: { type: String, required: true },
  titleEn: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  descriptionEn: { type: String },
  imageUrl: { type: String },
  imageUrlEn: { type: String },
  episodes: [{ type: Schema.Types.ObjectId, ref: 'Episode' }],
  articles: [{ type: Schema.Types.ObjectId, ref: 'Article' }],
}, {
  timestamps: true
});

// Create slug from title before saving
PlaylistSchema.pre('save', function(this: IPlaylist, next) {
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

export default mongoose.models.Playlist || mongoose.model<IPlaylist>('Playlist', PlaylistSchema);