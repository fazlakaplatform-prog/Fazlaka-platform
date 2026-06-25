import { NextRequest, NextResponse } from 'next/server';
import { getSocialLinks, createSocialLink } from '@/services/socialLinks';

// جلب جميع الروابط الاجتماعية
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    // يمكن تمرير teamId في الاستعلام إذا أردت التصفية مستقبلاً
    const teamId = searchParams.get('teamId') || undefined;
    
    const socialLinks = await getSocialLinks(teamId);
    
    return NextResponse.json({ 
      success: true, 
      data: socialLinks
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
    
    const newSocialLink = await createSocialLink({
      platform: body.platform,
      url: body.url,
      isActive: body.isActive !== undefined ? body.isActive : true,
      order: body.order || 0,
      teamId: body.teamId // اختياري، تتم معالجته في ملف الخدمات
    });
    
    // إرسال إشعارات (اختياري)
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'تحديث في وسائل التواصل',
        'Social Media Update',
        `تمت إضافة وسيلة تواصل جديدة: ${newSocialLink.platform}`,
        `A new social media platform has been added: ${newSocialLink.platform}`,
        newSocialLink.id,
        'general',
        '/contact'
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({
      success: true,
      data: newSocialLink
    });
  } catch (error) {
    console.error('Error creating social link:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create social link' },
      { status: 500 }
    );
  }
}