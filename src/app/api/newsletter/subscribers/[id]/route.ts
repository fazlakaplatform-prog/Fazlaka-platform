import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const sub = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!sub) return NextResponse.json({ success: false, error: 'NotFound' }, { status: 404 });
    return NextResponse.json({ success: true, data: { ...sub, tags: typeof sub.tags === 'string' ? JSON.parse(sub.tags) : sub.tags } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await request.json();
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'NotFound' }, { status: 404 });
    const data: Record<string, unknown> = {};
    if (body.name !== undefined) data.name = body.name;
    if (body.language !== undefined) data.language = body.language;
    if (body.status !== undefined) data.status = body.status;
    if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);
    if (body.source !== undefined) data.source = body.source;
    const updated = await prisma.newsletterSubscriber.update({ where: { id }, data });
    return NextResponse.json({ success: true, data: { ...updated, tags: typeof updated.tags === 'string' ? JSON.parse(updated.tags) : updated.tags } });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const existing = await prisma.newsletterSubscriber.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ success: false, error: 'NotFound' }, { status: 404 });
    await prisma.newsletterSubscriber.delete({ where: { id } });
    return NextResponse.json({ success: true, message: 'Deleted' });
  } catch (error) {
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
