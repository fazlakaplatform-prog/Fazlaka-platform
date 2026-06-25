// app/api/terms/export/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST() {
  try {
    const terms = await prisma.terms.findMany({
      include: {
        items: true
      },
      orderBy: [
        { sectionType: 'asc' },
        { title: 'asc' }
      ]
    });
    
    return NextResponse.json({ success: true, terms });
  } catch (error) {
    console.error('Error in export API:', error);
    return NextResponse.json(
      { error: 'Failed to export terms' },
      { status: 500 }
    );
  }
}