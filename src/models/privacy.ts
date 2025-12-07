import { ObjectId, WithId } from 'mongodb';

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

export interface PrivacyContent {
  _id?: ObjectId;
  sectionType: 'mainPolicy' | 'userRight' | 'dataType' | 'securityMeasure';
  title?: string;
  titleEn?: string;
  content?: PortableTextBlock[]; // Portable Text content
  contentEn?: PortableTextBlock[]; // Portable Text content
  description?: string;
  descriptionEn?: string;
  icon?: string;
  color?: string;
  textColor?: string;
  lastUpdated?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type PrivacyDocument = WithId<PrivacyContent>;