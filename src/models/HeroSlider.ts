// src/models/HeroSlider.ts

import mongoose, { Schema, Document } from 'mongoose';

export interface IHeroSlider extends Document {
  title: string;
  titleEn: string;
  description: string;
  descriptionEn: string;
  mediaType: 'image' | 'video';
  image?: string;
  imageEn?: string;
  videoUrl?: string;
  videoUrlEn?: string;
  link?: {
    text?: string; // جعلها اختيارية
    textEn?: string; // جعلها اختيارية
    url?: string; // جعلها اختيارية
  };
  orderRank?: number;
}

const HeroSliderSchema: Schema = new Schema({
  title: { type: String, required: true, trim: true },
  titleEn: { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },
  descriptionEn: { type: String, required: true, trim: true },
  mediaType: { type: String, enum: ['image', 'video'], required: true, default: 'image' },
  image: { type: String, trim: true },
  imageEn: { type: String, trim: true },
  videoUrl: { type: String, trim: true },
  videoUrlEn: { type: String, trim: true },
  link: {
    text: { type: String, trim: true, required: false }, // <-- التغيير هنا
    textEn: { type: String, trim: true, required: false }, // <-- التغيير هنا
    url: { type: String, trim: true, required: false } // <-- التغيير الرئيسي هنا
  },
  orderRank: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.models.HeroSlider || mongoose.model<IHeroSlider>('HeroSlider', HeroSliderSchema);