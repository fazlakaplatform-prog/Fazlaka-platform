import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    const email = searchParams.get('email');

    if (token) {
      const record = await prisma.newsletterUnsubscribeToken.findUnique({ where: { token } });
      if (!record || record.expiresAt < new Date()) {
        return NextResponse.redirect(new URL('/newsletter/unsubscribe?expired=true', request.url));
      }
      await prisma.newsletterSubscriber.updateMany({
        where: { email: record.email, status: 'ACTIVE' },
        data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
      });
      await prisma.newsletterUnsubscribeToken.delete({ where: { id: record.id } });
      return NextResponse.redirect(new URL('/newsletter/unsubscribe?success=true', request.url));
    }

    if (email) {
      await prisma.newsletterSubscriber.updateMany({
        where: { email, status: 'ACTIVE' },
        data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
      });
      return NextResponse.redirect(new URL('/newsletter/unsubscribe?success=true', request.url));
    }

    return NextResponse.redirect(new URL('/newsletter/unsubscribe?error=true', request.url));
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.redirect(new URL('/newsletter/unsubscribe?error=true', request.url));
  }
}

export async function POST(request: NextRequest) {
  try {
    const { email, token } = await request.json();
    if (token) {
      const record = await prisma.newsletterUnsubscribeToken.findUnique({ where: { token } });
      if (!record || record.expiresAt < new Date()) {
        return NextResponse.json({ success: false, error: 'InvalidOrExpiredToken' }, { status: 400 });
      }
      await prisma.newsletterSubscriber.updateMany({
        where: { email: record.email, status: 'ACTIVE' },
        data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
      });
      await prisma.newsletterUnsubscribeToken.delete({ where: { id: record.id } });
      return NextResponse.json({ success: true, message: 'Unsubscribed' });
    }
    if (email) {
      const sub = await prisma.newsletterSubscriber.findUnique({ where: { email } });
      if (!sub) return NextResponse.json({ success: false, error: 'NotFound' }, { status: 404 });
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
      });
      return NextResponse.json({ success: true, message: 'Unsubscribed' });
    }
    return NextResponse.json({ success: false, error: 'EmailOrTokenRequired' }, { status: 400 });
  } catch (error) {
    console.error('Unsubscribe error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
