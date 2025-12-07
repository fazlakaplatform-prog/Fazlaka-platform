import { ObjectId, WithId } from 'mongodb';

export interface FAQ {
  _id?: ObjectId;
  question: string;
  questionEn?: string;
  answer: string;
  answerEn?: string;
  category: string;
  categoryEn?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export type FAQDocument = WithId<FAQ>;