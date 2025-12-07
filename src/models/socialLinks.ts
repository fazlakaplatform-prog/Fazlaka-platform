import { ObjectId, WithId } from 'mongodb';

export interface SocialLink {
  _id?: ObjectId;
  platform: string;
  url: string;
  isActive: boolean;
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export type SocialLinkDocument = WithId<SocialLink>;