import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');
    if (!email) return NextResponse.json({ success: false, error: 'EmailRequired' }, { status: 400 });
    const sub = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (!sub) return NextResponse.json({ success: false, error: 'NotFound' }, { status: 404 });
    return NextResponse.json({
      success: true,
      data: {
        email: sub.email,
        name: sub.name,
        language: sub.language,
        status: sub.status,
        tags: typeof sub.tags === 'string' ? JSON.parse(sub.tags) : sub.tags,
        subscribedAt: sub.subscribedAt,
      },
    });
  } catch (error) {
    console.error('Preferences GET error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { email, name, language, tags } = await request.json();
    if (!email) return NextResponse.json({ success: false, error: 'EmailRequired' }, { status: 400 });
    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (language !== undefined) data.language = language;
    if (tags !== undefined) data.tags = JSON.stringify(tags);
    const updated = await prisma.newsletterSubscriber.update({ where: { email }, data });
    return NextResponse.json({
      success: true,
      data: { email: updated.email, name: updated.name, language: updated.language, tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags) : updated.tags },
    });
  } catch (error) {
    console.error('Preferences PUT error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
