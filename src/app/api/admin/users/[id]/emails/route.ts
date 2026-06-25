// src/app/api/admin/users/[id]/emails/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import crypto from "crypto";

const prisma = new PrismaClient();

// POST - لإضافة بريد إلكتروني جديد
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // قراءة جسم الطلب
    const body = await request.json();
    const email: string | undefined = body?.email;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // جلب المستخدم
    const user = await prisma.user.findUnique({
      where: { id },
      include: { secondaryEmails: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // التأكد أن البريد غير مستخدم من قبل (كبريد أساسي أو ثانوي) في أي حساب آخر
    const primaryEmailUser = await prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const secondaryEmailUser = await prisma.secondaryEmail.findUnique({
      where: { email: normalizedEmail },
    });

    if (primaryEmailUser || secondaryEmailUser) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // التأكد أن نفس البريد لم يضاف سابقاً للمستخدم الحالي
    const existsInCurrent = user.secondaryEmails?.some(
      (e) => e.email.toLowerCase() === normalizedEmail
    );
    if (existsInCurrent) {
      return NextResponse.json({ error: "Email already added" }, { status: 400 });
    }

    // إنشاء كود تحقق وصلاحية 24 ساعة
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 24);

    // إنشاء بريد إلكتروني ثانوي جديد
    const newEmail = await prisma.secondaryEmail.create({
      data: {
        userId: id,
        email: normalizedEmail,
        isVerified: false,
        verificationCode,
        verificationCodeExpiry,
      },
    });

    return NextResponse.json({
      message: "Email added successfully",
      email: newEmail,
    });
  } catch (error) {
    console.error("Error adding email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}