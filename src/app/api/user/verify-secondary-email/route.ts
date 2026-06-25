// src/app/api/user/verify-secondary-email/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// تعريف واجهة للجلسة
interface Session {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // استخدام تعليق ESLint وتحويل مزدوج لتجنب مشاكل TypeScript
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as unknown as any) as Session
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { email, verificationCode } = await request.json()

    if (!email || !verificationCode) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      )
    }
    
    // البحث عن البريد الإلكتروني الثانوي المحدد للمستخدم الحالي
    // هذا أكثر أمانًا وكفاءة من البحث في مصفوفة
    const secondaryEmail = await prisma.secondaryEmail.findFirst({
      where: {
        email: email,
        userId: session.user.id, // التأكد من أن البريد ينتمي للمستخدم الحالي
      },
    });

    if (!secondaryEmail) {
      return NextResponse.json(
        { error: "Secondary email not found" },
        { status: 404 }
      )
    }

    // التحقق من أن كود التحقق صحيح ولم ينتهِ صلاحيته
    if (
      secondaryEmail.verificationCode !== verificationCode ||
      (secondaryEmail.verificationCodeExpiry && new Date(secondaryEmail.verificationCodeExpiry) < new Date())
    ) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      )
    }

    // تحديث سجل البريد الإلكتروني الثانوي مباشرة
    // هذا أبسط وأكثر أمانًا من تعديل مصفوفة داخل مستند المستخدم
    await prisma.secondaryEmail.update({
      where: {
        id: secondaryEmail.id, // استخدام المعرف الفريد للسجل
      },
      data: {
        isVerified: true,
        // تنظيف الحقول التي لم تعد هناك حاجة إليها
        verificationCode: null,
        verificationCodeExpiry: null,
      },
    });

    return NextResponse.json(
      { message: "Secondary email verified successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Verify secondary email error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}