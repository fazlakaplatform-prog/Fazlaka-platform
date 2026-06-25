// File: src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: "Verification token is required" },
        { status: 400 }
      )
    }

    console.log("Verifying email with token:", token.substring(0, 10) + "...")

    // الخطوة 1: البحث عن المستخدم باستخدام التوكن في البريد الأساسي
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gt: new Date() // تحقق من أن التوكن لم ينتهِ صلاحيته
        }
      }
    });

    if (user) {
      // تم العثور على التوكن في البريد الأساسي، قم بتفعيل الحساب
      console.log("Email verification successful for primary email of user:", user.id)

      await prisma.user.update({
        where: { id: user.id },
        data: {
          isActive: true,
          // إذا الحقل emailVerified من نوع DateTime في schema.prisma:
          emailVerified: new Date(),
          // لو كان String بدل DateTime استخدم: emailVerified: new Date().toISOString(),
          // مسح التوكن لمنع إعادة استخدامه
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });

      return NextResponse.json(
        { message: "Email verified successfully" },
        { status: 200 }
      )
    }

    // الخطوة 2: إذا لم يتم العثور عليه، ابحث في جدول البريد الإلكتروني الثانوي
    const secondaryEmail = await prisma.secondaryEmail.findFirst({
      where: {
        verificationToken: token,
        verificationTokenExpiry: {
          gt: new Date() // تحقق من أن التوكن لم ينتهِ صلاحيته
        }
      }
    });

    if (secondaryEmail) {
      // تم العثور على التوكن في بريد إلكتروني ثانوي، قم بتفعيله
      console.log("Email verification successful for secondary email:", secondaryEmail.email)

      await prisma.secondaryEmail.update({
        where: { id: secondaryEmail.id },
        data: {
          isVerified: true,
          // مسح التوكن لمنع إعادة استخدامه
          verificationToken: null,
          verificationTokenExpiry: null,
        },
      });

      return NextResponse.json(
        { message: "Secondary email verified successfully" },
        { status: 200 }
      )
    }

    // الخطوة 3: إذا لم يتم العثور على التوكن في أي مكان، تحقق مما إذا كان منتهي الصلاحية
    // للبريد الأساسي
    const expiredPrimaryUser = await prisma.user.findFirst({
      where: { verificationToken: token }
    });

    if (expiredPrimaryUser) {
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // للبريد الثانوي
    const expiredSecondaryEmail = await prisma.secondaryEmail.findFirst({
      where: { verificationToken: token }
    });

    if (expiredSecondaryEmail) {
      return NextResponse.json(
        { error: "Verification token has expired. Please request a new one." },
        { status: 400 }
      )
    }

    // الخطوة 4: إذا لم يتم العثور على التوكن على الإطلاق، فهو غير صالح
    console.log("User not found with token:", token.substring(0, 10) + "...")
    return NextResponse.json(
      { error: "Invalid verification token" },
      { status: 400 }
    )

  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
