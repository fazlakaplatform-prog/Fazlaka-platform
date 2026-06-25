import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { encode } from 'next-auth/jwt';

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();
    if (!idToken) {
      return NextResponse.json({ success: false, error: 'MissingIdToken' }, { status: 400 });
    }

    const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
    if (!verifyRes.ok) {
      return NextResponse.json({ success: false, error: 'InvalidToken' }, { status: 401 });
    }

    const payload = await verifyRes.json();
    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (payload.aud !== clientId) {
      return NextResponse.json({ success: false, error: 'InvalidAudience' }, { status: 401 });
    }

    const googleId = payload.sub;
    const email = payload.email;
    const name = payload.name || email?.split('@')[0] || 'Google User';
    const image = payload.picture;

    if (!email) {
      return NextResponse.json({ success: false, error: 'EmailRequired' }, { status: 400 });
    }

    let user = await prisma.user.findUnique({ where: { email } });

    if (user) {
      if (!user.googleId) {
        await prisma.user.update({
          where: { id: user.id },
          data: { googleId, image: image || user.image },
        });
      }
    } else {
      user = await prisma.user.create({
        data: {
          name,
          email,
          image,
          googleId,
          password: '',
          isActive: true,
          emailVerified: new Date(),
        },
      });
    }

    const existingAccount = await prisma.account.findFirst({
      where: { providerAccountId: googleId, provider: 'google' },
    });

    if (!existingAccount) {
      await prisma.account.create({
        data: {
          userId: user.id,
          type: 'oauth',
          provider: 'google',
          providerAccountId: googleId,
          access_token: idToken,
          token_type: 'bearer',
        },
      });
    }

    const sessionToken = await encode({
      token: {
        id: user.id,
        name: user.name,
        email: user.email,
        picture: user.image,
        role: user.role,
        sub: user.id,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 30 * 24 * 60 * 60,
      },
      secret: process.env.NEXTAUTH_SECRET!,
    });

    return NextResponse.json({
      success: true,
      sessionToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Google signin error:', error);
    return NextResponse.json({ success: false, error: 'InternalError' }, { status: 500 });
  }
}
