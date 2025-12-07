import mongoose, { Schema, Document } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  bio: string;
  bioEn: string;
  imageUrl: string;
  imageUrlEn: string;
  slug: string;
  socialMedia: { platform: string; url: string }[];
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

const SocialMediaSchema = new mongoose.Schema({
  platform: { type: String, required: true },
  url: { type: String, required: true }
});

const TeamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  nameEn: { type: String, required: true },
  role: { type: String },
  roleEn: { type: String },
  bio: { type: String },
  bioEn: { type: String },
  imageUrl: { type: String },
  imageUrlEn: { type: String },
  slug: { type: String, required: true, unique: true },
  socialMedia: [SocialMediaSchema],
  order: { type: Number, default: 0 },
}, {
  timestamps: true
});

// Create slug from name before saving
TeamMemberSchema.pre('save', function(next) {
  if (!this.slug) {
    const nameToUse = this.nameEn || this.name;
    this.slug = nameToUse
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

const Team = mongoose.models.Team || mongoose.model<ITeam>('Team', TeamMemberSchema);

export default Team;