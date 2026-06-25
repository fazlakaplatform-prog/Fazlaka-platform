import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    // جلب جميع الروابط للتصدير
    const socialLinks = await prisma.socialLink.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    return NextResponse.json({ socialLinks });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export social links' },
      { status: 500 }
    );
  }
}