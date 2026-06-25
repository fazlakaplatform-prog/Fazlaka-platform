import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client'; // تمت إضافة الاستيراد

export async function POST(request: NextRequest) {
  try {
    const { socialLinks } = await request.json();
    
    if (!socialLinks || !Array.isArray(socialLinks) || socialLinks.length === 0) {
      return NextResponse.json(
        { error: 'No social links provided' },
        { status: 400 }
      );
    }
    
    let imported = 0;
    const errors: string[] = [];
    // تم إصلاح الخطأ: استخدام نوع Prisma الصحيح بدلاً من any
    const dataToInsert: Prisma.SocialLinkCreateManyInput[] = [];
    
    for (const linkData of socialLinks) {
      // Skip if no platform or url
      if (!linkData.platform || !linkData.url) {
        errors.push(`Skipping social link with missing platform or url`);
        continue;
      }
      
      // تجهيز البيانات
      dataToInsert.push({
        platform: linkData.platform,
        url: linkData.url,
        isActive: linkData.isActive !== undefined ? linkData.isActive : true,
        order: linkData.order || 0,
        teamId: linkData.teamId || null, // معاملة teamId بشكل آمن
        createdAt: linkData.createdAt ? new Date(linkData.createdAt) : new Date(),
        updatedAt: new Date()
      });
    }

    // استخدام createMany لإدراج دفعة واحدة (أسرع)
    if (dataToInsert.length > 0) {
      const result = await prisma.socialLink.createMany({
        data: dataToInsert,
        skipDuplicates: true 
      });
      imported = result.count;
    }
    
    return NextResponse.json({ 
      success: true,
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Failed to import social links' },
      { status: 500 }
    );
  }
}