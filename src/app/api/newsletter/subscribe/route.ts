import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { welcomeEmail, sendEmail } from '@/lib/newsletter/email';
import { createUnsubscribeToken, buildUnsubscribeUrl } from '@/lib/newsletter/unsubscribe';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    let { name } = body;
    const { email, language, tags } = body;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ success: false, error: 'InvalidEmail' }, { status: 400 });
    }
    if (!name) {
      const session = await getServerSession(authOptions);
      if (session?.user?.name) name = session.user.name;
    }

    const existing = await prisma.newsletterSubscriber.findUnique({ where: { email } });
    if (existing) {
      if (existing.status === 'ACTIVE') {
        return NextResponse.json({ success: true, message: 'AlreadySubscribed' });
      }
      await prisma.newsletterSubscriber.update({
        where: { email },
        data: { status: 'ACTIVE', name: name || existing.name, language: language || existing.language, unsubscribedAt: null, tags: tags || existing.tags },
      });
      const token = await createUnsubscribeToken(email);
      const prefsUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/newsletter/preferences?email=${encodeURIComponent(email)}&token=${token}`;
      await sendEmail(email, name ? `مرحباً بك مجدداً ${name}` : 'مرحباً بك مجدداً', welcomeEmail(name, prefsUrl, language !== 'en'));
      return NextResponse.json({ success: true, message: 'Resubscribed' });
    }

    await prisma.newsletterSubscriber.create({
      data: { email, name, language: language || 'ar', tags: tags || undefined },
    });

    const token = await createUnsubscribeToken(email);
    const prefsUrl = `${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/newsletter/preferences?email=${encodeURIComponent(email)}&token=${token}`;
    await sendEmail(email, name ? `مرحباً بك ${name} في نشرتنا البريدية` : 'مرحباً بك في نشرتنا البريدية', welcomeEmail(name, prefsUrl, language !== 'en'));

    return NextResponse.json({ success: true, message: 'Subscribed' });
  } catch (error) {
    console.error('Newsletter subscribe error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
