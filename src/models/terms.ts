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

// تعريف واجهة للأصول الرقمية (مثل الصور)
interface ImageAsset {
  _type: string;
  _id: string;
  url: string;
  assetId?: string;
  extension?: string;
  mimeType?: string;
  size?: number;
  originalFilename?: string;
  metadata?: {
    dimensions?: {
      width: number;
      height: number;
      aspectRatio: number;
    };
    lqip?: string;
    blurHash?: string;
    hasAlpha?: boolean;
    isOpaque?: boolean;
  };
}

export interface TermsContent {
  _id?: ObjectId;
  sectionType: 'mainTerms' | 'legalTerm' | 'rightsResponsibility' | 'additionalPolicy' | 'siteSettings';
  title?: string;
  titleEn?: string;
  content?: PortableTextBlock[]; // Portable Text content
  contentEn?: PortableTextBlock[]; // Portable Text content
  term?: string;
  termEn?: string;
  definition?: string;
  definitionEn?: string;
  icon?: string;
  rightsType?: 'userRights' | 'userResponsibilities' | 'companyRights';
  items?: { item: string; itemEn?: string }[];
  color?: string;
  borderColor?: string;
  description?: string;
  descriptionEn?: string;
  linkText?: string;
  linkTextEn?: string;
  linkUrl?: string;
  siteTitle?: string;
  siteTitleEn?: string;
  siteDescription?: string;
  siteDescriptionEn?: string;
  logo?: ImageAsset; // Image asset
  logoEn?: ImageAsset; // Image asset
  footerText?: string;
  footerTextEn?: string;
  lastUpdated?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export type TermsDocument = WithId<TermsContent>;