// File: src/app/api/auth/reset-password/route.ts

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { token, password } = await request.json()

    if (!token || !password) {
      return NextResponse.json(
        { error: "Token and new password are required" },
        { status: 400 }
      )
    }

    console.log("Resetting password with token:", token.substring(0, 10) + "...")

    // البحث عن مستخدم لديه رمز إعادة تعيين صالح ولم ينتهِ صلاحيته
    // في Prisma، نستخدم `gt` (greater than) للمقارنة مع التاريخ
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // تحقق من أن تاريخ الانتهاء أكبر من الوقت الحالي
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    // تشفير كلمة المرور الجديدة
    const hashedPassword = await bcrypt.hash(password, 10)

    // تحديث كلمة المرور وإزالة التوكن
    // في Prisma، لمسح حقل، نضعه على `null`
    // ملاحظة: Prisma سيقوم بتحديث `updatedAt` تلقائيًا بفضل `@updatedAt` في المخطط
    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetToken: null, // مسح رمز إعادة التعيين لمنع إعادة استخدامه
        resetTokenExpiry: null, // مسح تاريخ انتهاء الصلاحية
      },
    });

    console.log("Password reset successfully for:", user.email)

    return NextResponse.json(
      { message: "Password reset successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Password reset error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}