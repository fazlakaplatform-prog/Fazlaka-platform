// src/app/api/user/me/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // استخدام Prisma بدلاً من MongoDB
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        secondaryEmails: true, // تضمين رسائل البريد الإلكتروني الثانوية
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // إزالة الحقول الحساسة
    const { 
      password, 
      verificationToken, 
      resetToken, 
      magicToken, 
      otpCode, 
      emailChangeCode,
      // إزالة الحقول الحساسة من رسائل البريد الإلكتروني الثانوية
      secondaryEmails,
      ...userWithoutSensitiveFields 
    } = user;

    // تصفية رسائل البريد الإلكتروني الثانوية لإزالة الحقول الحساسة
    const filteredSecondaryEmails = secondaryEmails.map(email => ({
      id: email.id,
      email: email.email,
      isVerified: email.isVerified,
      createdAt: email.createdAt,
    }));

    // حساب isVerified بناءً على وجود verificationToken
    const isVerified = !user.verificationToken;

    // تم الإصلاح: إزالة `id: user.id` لأنه موجود بالفعل في `userWithoutSensitiveFields`
    return NextResponse.json({
      isVerified,
      secondaryEmails: filteredSecondaryEmails,
      ...userWithoutSensitiveFields,
    });
  } catch (error) {
    console.error("Error fetching user profile:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}