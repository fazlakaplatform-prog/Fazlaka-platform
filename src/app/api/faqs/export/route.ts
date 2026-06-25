import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const faqs = await prisma.fAQ.findMany({
      orderBy: { createdAt: 'desc' }
    });
    
    return NextResponse.json({ faqs });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export FAQs' },
      { status: 500 }
    );
  }
}