// File: src/app/api/social-links/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { getDatabase } from '@/lib/mongodb';
// <-- تم حذف ObjectId من هنا لأنه غير مستخدم -->

// جلب جميع الروابط الاجتماعية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    
    const db = await getDatabase();
    let query = {};
    
    // إذا تم طلب الروابط النشطة فقط
    if (activeOnly) {
      query = { isActive: true };
    }
    
    const socialLinks = await db.collection('socialLinks')
      .find(query)
      .sort({ order: 1, createdAt: -1 })
      .toArray();
    
    return NextResponse.json({ 
      success: true, 
      data: socialLinks.map(link => ({
        ...link,
        id: link._id.toString()
      }))
    });
  } catch (error) {
    console.error('Error fetching social links:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch social links' },
      { status: 500 }
    );
  }
}

// إنشاء رابط اجتماعي جديد
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // التحقق من الحقول المطلوبة
    if (!body.platform || !body.url) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: platform and url' },
        { status: 400 }
      );
    }
    
    const db = await getDatabase();
    const newSocialLink = {
      ...body,
      isActive: body.isActive !== undefined ? body.isActive : true,
      order: body.order || 0,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('socialLinks').insertOne(newSocialLink);
    
    // إرسال إشعارات لجميع المستخدمين عند إضافة رابط اجتماعي جديد
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'تحديث في وسائل التواصل',
        'Social Media Update',
        `تمت إضافة وسيلة تواصل جديدة: ${newSocialLink.platform}`,
        `A new social media platform has been added: ${newSocialLink.platform}`,
        result.insertedId.toString(),
        'general', // استخدام نوع عام
        '/contact' // رابط صفحة التواصل التي من المفترض أن تعرض الروابط
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: {
        ...newSocialLink,
        id: result.insertedId.toString()
      }
    });
  } catch (error) {
    console.error('Error creating social link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create social link' },
      { status: 500 }
    );
  }
}