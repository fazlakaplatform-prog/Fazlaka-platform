// File: src/lib/mongodb.ts

import { MongoClient, Db } from 'mongodb';
import mongoose from 'mongoose';

// التحقق من وجود متغير البيئة
if (!process.env.MONGODB_URI) {
  throw new Error('Invalid/Missing environment variable: "MONGODB_URI"');
}

const uri = process.env.MONGODB_URI;
const options = {};

// ===============================================
// === القسم الأول: الاتصال باستخدام Mongoose ===
// ===============================================

// تعريف واجهة للتخزين المؤقت للاتصال
interface CachedMongoose {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

// استخدام متغير عام للحفاظ على الاتصال عبر عمليات إعادة التحميل في بيئة التطوير
declare global {
  var mongoose: CachedMongoose | undefined;
}

const cached: CachedMongoose = global.mongoose || {
  conn: null,
  promise: null,
};

if (!global.mongoose) {
  global.mongoose = cached;
}

// دالة للاتصال بـ Mongoose
export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: false,
    };
    cached.promise = mongoose.connect(uri, opts);
  }

  try {
    cached.conn = await cached.promise;
    console.log('Connected to MongoDB successfully');
    
    // استيراد النماذج الأساسية أولاً
    await import('@/models/User');
    await import('@/models/Season');
    
    // استيراد Article بشكل صريح وتأكد من تسجيله
    try {
      const Article = await import('@/models/Article');
      if (!mongoose.models.Article) {
        console.error('Article model not registered after import');
      }
    } catch (error) {
      console.error('Failed to import Article model:', error);
    }
    
    // الآن استيراد Episode بعد التأكد من Article
    await import('@/models/Episode');
    await import('@/models/Playlist');
    await import('@/models/Contact');
    await import('@/models/Notification');
    await import('@/models/ChatHistory');
    
    console.log('All models imported successfully');
  } catch (e) {
    cached.promise = null;
    console.error('Failed to connect to MongoDB:', e);
    throw e;
  }

  return cached.conn;
}

// ==========================================================
// === القسم الثاني: الاتصال باستخدام MongoDB Native Driver ===
// ==========================================================

let client: MongoClient;
let clientPromise: Promise<MongoClient>;
let database: Db;

if (process.env.NODE_ENV === 'development') {
  const globalWithMongo = global as typeof globalThis & {
    _mongoClientPromise?: Promise<MongoClient>;
  };

  if (!globalWithMongo._mongoClientPromise) {
    client = new MongoClient(uri, options);
    globalWithMongo._mongoClientPromise = client.connect();
  }
  clientPromise = globalWithMongo._mongoClientPromise;
} else {
  client = new MongoClient(uri, options);
  clientPromise = client.connect();
}

// دالة للحصول على قاعدة البيانات
export async function getDatabase(): Promise<Db> {
  if (!database) {
    const client = await clientPromise;
    database = client.db(process.env.MONGODB_DB || 'fazlaka');
  }
  return database;
}

// تصدير الوعد الخاص بالعميل للاستخدام المباشر إذا لزم الأمر
export default clientPromise;