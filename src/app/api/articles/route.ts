import { NextRequest, NextResponse } from 'next/server';
import { fetchArticles, createArticle } from '@/services/articles';

/**
 * GET /api/articles
 * Fetches all articles, optionally filtered by language
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    const articles = await fetchArticles(language);
    
    return NextResponse.json({ articles });
  } catch (error) {
    console.error('Error in articles API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/articles
 * Creates a new article and sends notifications to all users
 */
export async function POST(request: NextRequest) {
  try {
    const articleData = await request.json();
    
    // التحقق من صحة البيانات
    if (!articleData || typeof articleData !== 'object') {
      return NextResponse.json(
        { error: 'بيانات المقال غير صالحة' },
        { status: 400 }
      );
    }
    
    const newArticle = await createArticle(articleData);
    
    if (!newArticle) {
      return NextResponse.json(
        { error: 'فشل في إنشاء المقال' },
        { status: 400 }
      );
    }
    
    // إرسال الإشعارات بشكل غير متزامن بدون حجب الاستجابة
    if (newArticle) {
      sendNotificationsAsync(newArticle);
    }
    
    return NextResponse.json({ article: newArticle }, { status: 201 });
  } catch (error) {
    console.error('Error in articles API:', error);
    return NextResponse.json(
      { error: 'فشل في إنشاء المقال' },
      { status: 500 }
    );
  }
}

/**
 * Sends notifications asynchronously without blocking the main response
 */
async function sendNotificationsAsync(article: {
  _id: unknown;
  title: string;
  titleEn?: string;
  slug: string;
}) {
  try {
    // تم تحويل _id إلى سلسلة نصية بأمان
    const idString = article._id?.toString() || 'unknown';
    
    // استيراد دالة البث من الملف الصحيح
    const { broadcastNotification } = await import('@/services/sseService');
    
    // استيراد دالة الإشعارات
    const { notifyAllUsers } = await import('@/services/notifications');
    
    // إنشاء الإشعار في قاعدة البيانات أولاً
    await notifyAllUsers(
      'مقال جديد',
      'New Article',
      `تم إضافة مقال جديد: ${article.title}`,
      `A new article has been added: ${article.titleEn || article.title}`,
      idString,
      'article',
      `/articles/${article.slug}`
    );
    
    // إرسال الإشعار فوراً عبر SSE
    // إنشاء معرف فريد للإشعار
    const notificationId = new Date().getTime().toString();
    
    broadcastNotification({
      _id: notificationId, // إضافة المعرف المطلوب
      type: 'info',
      title: 'مقال جديد',
      titleEn: 'New Article',
      message: `تم إضافة مقال جديد: ${article.title}`,
      messageEn: `A new article has been added: ${article.titleEn || article.title}`,
      relatedId: idString,
      relatedType: 'article',
      actionUrl: `/articles/${article.slug}`,
      isRead: false,
      createdAt: new Date().toISOString(),
      userId: '', // سيتم تعيينه لكل مستخدم
      updatedAt: new Date().toISOString()
    });
  } catch (notifyError) {
    // تسجيل الخطأ ولكن لا تتركه يؤثر على الاستجابة الرئيسية
    console.error('Error sending notifications:', notifyError);
  }
}