// src/services/chatbotData.ts

import { connectDB } from '@/lib/mongodb';
import Article from '@/models/Article';
import Episode from '@/models/Episode';
import Season from '@/models/Season';
import Playlist from '@/models/Playlist';
import mongoose from 'mongoose';

// تعريف واجهة لمحتوى PortableText
export interface PortableTextBlock {
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

export interface FAQ {
  _id?: string;
  question: string;
  questionEn?: string;
  answer: string;
  answerEn?: string;
  category: string;
  categoryEn?: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TeamMember {
  _id?: string;
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  bio: string;
  bioEn: string;
  imageUrl: string;
  imageUrlEn: string;
  slug: string;
  socialMedia?: { platform: string; url: string }[];
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Article {
  _id?: string;
  title: string;
  titleEn?: string;
  slug: string;
  excerpt?: string;
  excerptEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  season?: string;
  episode?: string;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Episode {
  _id?: string;
  title: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  videoUrl?: string;
  videoUrlEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  season?: string;
  articles?: string[];
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Season {
  _id?: string;
  title: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  episodes?: string[];
  articles?: string[];
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface Playlist {
  _id?: string;
  title: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  imageUrlEn?: string;
  episodes?: string[];
  articles?: string[];
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface ChatbotKnowledge {
  articles: Article[];
  episodes: Episode[];
  seasons: Season[];
  playlists: Playlist[];
  team: TeamMember[];
  faqs: FAQ[];
  platformInfo: {
    name: string;
    description: string;
    mission: string;
    vision: string;
    foundedYear?: number;
    totalContent: number;
  };
}

// تعريف أنواع للبيانات المسترجعة من MongoDB
interface RawArticle {
  _id: mongoose.Types.ObjectId;
  title: string;
  titleEn?: string;
  slug: string;
  excerpt?: string;
  excerptEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  featuredImageUrl?: string;
  featuredImageUrlEn?: string;
  season?: string;
  episode?: string;
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v: number;
}

interface RawEpisode {
  _id: mongoose.Types.ObjectId;
  title: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  content?: PortableTextBlock[];
  contentEn?: PortableTextBlock[];
  videoUrl?: string;
  videoUrlEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  season?: string;
  articles?: string[];
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v: number;
}

interface RawSeason {
  _id: mongoose.Types.ObjectId;
  title: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  thumbnailUrl?: string;
  thumbnailUrlEn?: string;
  episodes?: string[];
  articles?: string[];
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v: number;
}

interface RawPlaylist {
  _id: mongoose.Types.ObjectId;
  title: string;
  titleEn?: string;
  slug: string;
  description?: string;
  descriptionEn?: string;
  imageUrl?: string;
  imageUrlEn?: string;
  episodes?: string[];
  articles?: string[];
  publishedAt?: Date;
  createdAt?: Date;
  updatedAt?: Date;
  __v: number;
}

interface RawTeamMember {
  _id: mongoose.Types.ObjectId;
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  bio: string;
  bioEn: string;
  imageUrl: string;
  imageUrlEn: string;
  slug: string;
  socialMedia?: { platform: string; url: string }[];
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
  __v: number;
}

interface RawFAQ {
  _id: mongoose.Types.ObjectId;
  question: string;
  questionEn?: string;
  answer: string;
  answerEn?: string;
  category: string;
  categoryEn?: string;
  createdAt?: Date;
  updatedAt?: Date;
  __v: number;
}

export async function fetchChatbotKnowledge(language: string = 'ar'): Promise<ChatbotKnowledge> {
  try {
    await connectDB();
    
    // جلب البيانات من الموديلز مباشرة
    const articlesData = await Article.find({}).limit(20).lean() as RawArticle[];
    const episodesData = await Episode.find({}).limit(20).lean() as RawEpisode[];
    const seasonsData = await Season.find({}).limit(20).lean() as RawSeason[];
    const playlistsData = await Playlist.find({}).limit(20).lean() as RawPlaylist[];
    
    // جلب بيانات الفريق والأسئلة الشائعة باستخدام connection.db
    // التحقق من أن اتصال قاعدة البيانات قد تم إعداده
    if (!mongoose.connection.db) {
      throw new Error('Database connection not established');
    }
    
    const db = mongoose.connection.db;
    const teamMembersData = await db.collection('teams').find({}).limit(20).toArray() as RawTeamMember[];
    const faqsData = await db.collection('faqs').find({}).limit(20).toArray() as RawFAQ[];
    
    // تحويل البيانات إلى التنسيق المناسب
    const articles: Article[] = articlesData.map(article => ({
      ...article,
      _id: article._id?.toString()
    }));
    
    const episodes: Episode[] = episodesData.map(episode => ({
      ...episode,
      _id: episode._id?.toString()
    }));
    
    const seasons: Season[] = seasonsData.map(season => ({
      ...season,
      _id: season._id?.toString()
    }));
    
    const playlists: Playlist[] = playlistsData.map(playlist => ({
      ...playlist,
      _id: playlist._id?.toString()
    }));
    
    const team: TeamMember[] = teamMembersData.map(member => ({
      ...member,
      _id: member._id?.toString()
    }));
    
    const faqs: FAQ[] = faqsData.map(faq => ({
      ...faq,
      _id: faq._id?.toString()
    }));
    
    // معلومات المنصة
    const totalContent = articles.length + episodes.length + seasons.length + playlists.length;
    
    return {
      articles,
      episodes,
      seasons,
      playlists,
      team,
      faqs,
      platformInfo: {
        name: "فذلكه",
        description: "منصة عربية متخصصة في نشر المعرفة والثقافة من خلال محتوى متنوع ومميز",
        mission: "نشر المعرفة وبناء وعي جمعي من خلال محتوى عالي الجودة يثري الفكر العربي",
        vision: "أن نكون المنصة الرائدة في نشر المعرفة والثقافة في العالم العربي",
        foundedYear: 2024,
        totalContent
      }
    };
  } catch (error) {
    console.error('Error fetching chatbot knowledge:', error);
    return {
      articles: [],
      episodes: [],
      seasons: [],
      playlists: [],
      team: [],
      faqs: [],
      platformInfo: {
        name: "فذلكه",
        description: "منصة عربية متخصصة",
        mission: "نشر المعرفة",
        vision: "الريادة في نشر المعرفة",
        totalContent: 0
      }
    };
  }
}

// تعريف نوع للنتائج الممكنة
export type SearchResult = Article | Episode | Season | Playlist | TeamMember | FAQ;

// دالة للبحث عن محتوى محدد
export async function searchContent(query: string, type?: string, language: string = 'ar'): Promise<SearchResult[]> {
  try {
    const knowledgeBase = await fetchChatbotKnowledge(language);
    let results: SearchResult[] = [];
    
    if (!type || type === 'article') {
      results = results.concat(
        knowledgeBase.articles.filter(article => 
          article.title.toLowerCase().includes(query.toLowerCase()) ||
          (article.excerpt && article.excerpt.toLowerCase().includes(query.toLowerCase()))
        )
      );
    }
    
    if (!type || type === 'episode') {
      results = results.concat(
        knowledgeBase.episodes.filter(episode => 
          episode.title.toLowerCase().includes(query.toLowerCase()) ||
          (episode.description && episode.description.toLowerCase().includes(query.toLowerCase()))
        )
      );
    }
    
    if (!type || type === 'season') {
      results = results.concat(
        knowledgeBase.seasons.filter(season => 
          season.title.toLowerCase().includes(query.toLowerCase()) ||
          (season.description && season.description.toLowerCase().includes(query.toLowerCase()))
        )
      );
    }
    
    if (!type || type === 'playlist') {
      results = results.concat(
        knowledgeBase.playlists.filter(playlist => 
          playlist.title.toLowerCase().includes(query.toLowerCase()) ||
          (playlist.description && playlist.description.toLowerCase().includes(query.toLowerCase()))
        )
      );
    }
    
    if (!type || type === 'team') {
      results = results.concat(
        knowledgeBase.team.filter(member => 
          member.name.toLowerCase().includes(query.toLowerCase()) ||
          member.role.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
    
    if (!type || type === 'faq') {
      results = results.concat(
        knowledgeBase.faqs.filter(faq => 
          faq.question.toLowerCase().includes(query.toLowerCase()) ||
          faq.answer.toLowerCase().includes(query.toLowerCase())
        )
      );
    }
    
    return results;
  } catch (error) {
    console.error('Error searching content:', error);
    return [];
  }
}