// File: src/app/api/auth/verify-reset-token/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    // البحث عن مستخدم لديه رمز إعادة تعيين صالح ولم ينتهِ صلاحيته
    // في Prisma، نستخدم `gt` (greater than) للمقارنة مع التاريخ
    const user = await prisma.user.findFirst({
      where: {
        resetToken: token,
        resetTokenExpiry: {
          gt: new Date() // تحقق من أن تاريخ الانتهاء أكبر من الوقت الحالي
        }
      },
      // استخدام `select` لجلب الحقول المطلوبة فقط وتجاهل الحقول الحساسة تلقائيًا
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        // تضمين رسائل البريد الإلكتروني الثانوية مع تحديد الحقول المطلوبة منها
        secondaryEmails: {
          select: {
            id: true,
            email: true,
            isVerified: true,
            createdAt: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    // إرجاع بيانات المستخدم مباشرة، حيث أن كائن `user` من Prisma لديه بالفعل الشكل المطلوب
    return NextResponse.json({ user })
  } catch (error) {
    console.error("Error verifying reset token:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}