// File: src/app/api/auth/verify-email-change/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { currentEmail, newEmail, verificationCode } = await request.json()

    if (!currentEmail || !newEmail || !verificationCode) {
      return NextResponse.json(
        { error: "Current email, new email, and verification code are required" },
        { status: 400 }
      )
    }

    console.log("Verifying email change from:", currentEmail, "to:", newEmail)

    // البحث عن المستخدم باستخدام Prisma
    const user = await prisma.user.findFirst({
      where: {
        email: currentEmail,
        emailChangeCode: verificationCode,
        newEmail: newEmail,
        emailChangeCodeExpiry: {
          gt: new Date() // تحقق من أن كود التحقق لم ينتهِ صلاحيته
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      )
    }

    console.log("Email change verification successful for user:", user.id)

    // استخدام معاملة (Transaction) لضمان سلامة البيانات
    // هذا يضمن أن تحديث البريد الإلكتروني وإضافة البريد القديم كثانوي يحدثان معًا أو لا يحدثان على الإطلاق
    await prisma.$transaction(async (tx) => {
      // 1. تحديث البريد الإلكتروني الأساسي للمستخدم ومسح حقول التحقق
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: newEmail,
          // مسح الحقول التي لم تعد هناك حاجة إليها
          emailChangeCode: null,
          emailChangeCodeExpiry: null,
          newEmail: null,
        },
      });

      // 2. إضافة البريد الإلكتروني القديم إلى قائمة البريد الإلكتروني الثانوي
      // نستخدم `create` لأن هذا نهج أنظف وأكثر أمانًا من تعديل المصفوفات
      await tx.secondaryEmail.create({
        data: {
          email: currentEmail,
          userId: user.id, // ربطه بالمستخدم الصحيح
          isVerified: true, // البريد الأساسي القديم كان موثقًا بالتأكيد
        },
      });
    });

    return NextResponse.json(
      { 
        message: "Email changed successfully. Your session has been updated.",
        newEmail: newEmail
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Email change verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}