import { prisma } from '@/lib/prisma';
import crypto from 'crypto';

export function generateUnsubscribeToken(email: string): string {
  return crypto.createHash('sha256').update(`${email}_${Date.now()}_${crypto.randomBytes(16).toString('hex')}`).digest('hex');
}

export async function createUnsubscribeToken(email: string): Promise<string> {
  const token = generateUnsubscribeToken(email);
  await prisma.newsletterUnsubscribeToken.create({
    data: {
      email,
      token,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });
  return token;
}

export async function unsubscribeByToken(token: string): Promise<boolean> {
  const record = await prisma.newsletterUnsubscribeToken.findUnique({ where: { token } });
  if (!record || record.expiresAt < new Date()) return false;
  await prisma.newsletterSubscriber.updateMany({
    where: { email: record.email, status: 'ACTIVE' },
    data: { status: 'UNSUBSCRIBED', unsubscribedAt: new Date() },
  });
  await prisma.newsletterUnsubscribeToken.delete({ where: { id: record.id } });
  return true;
}

export function buildUnsubscribeUrl(email: string, token: string): string {
  const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';
  return `${baseUrl}/api/newsletter/unsubscribe?token=${token}&email=${encodeURIComponent(email)}`;
}
