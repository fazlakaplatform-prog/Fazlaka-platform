// File: src/app/api/auth/verify-email-link/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const type = searchParams.get('type') || 'primary'
    const email = searchParams.get('email')

    if (!token || !email) {
      console.log("Missing token or email in verification link request")
      return NextResponse.redirect(new URL('/auth/error?error=missing-params', request.url))
    }

    console.log(`Processing verification link for ${type} email:`, email, "Token:", token.substring(0, 10) + "...")

    if (type === "primary") {
      // التحقق من التوكن للبريد الأساسي
      const user = await prisma.user.findFirst({
        where: {
          email: email,
          verificationToken: token,
          verificationTokenExpiry: {
            gt: new Date() // تحقق من أن التوكن لم ينتهِ صلاحيته
          }
        }
      });

      if (user) {
        // تحديث حالة التحقق للبريد الأساسي
        await prisma.user.update({
          where: { id: user.id },
          data: {
            // many projects use DateTime for emailVerified — نحط تاريخ التحقق
            emailVerified: new Date(),
            // مسح التوكن لمنع إعادة استخدامه
            verificationToken: null,
            verificationTokenExpiry: null,
          },
        });
        console.log("Primary email verified successfully for:", email)
        
        // إعادة التوجيه إلى صفحة النجاح
        return NextResponse.redirect(new URL(`/auth/verification-success?type=${type}&email=${encodeURIComponent(email)}`, request.url))
      }
    } else if (type === "secondary") {
      // التحقق من التوكن للبريد الثانوي
      const secondaryEmail = await prisma.secondaryEmail.findFirst({
        where: {
          email: email,
          verificationToken: token,
          verificationTokenExpiry: {
            gt: new Date() // تحقق من أن التوكن لم ينتهِ صلاحيته
          }
        }
      });

      if (secondaryEmail) {
        // تحديث حالة التحقق للبريد الثانوي مباشرة
        await prisma.secondaryEmail.update({
          where: { id: secondaryEmail.id },
          data: {
            isVerified: true,
            // مسح التوكن لمنع إعادة استخدامه
            verificationToken: null,
            verificationTokenExpiry: null,
          },
        });
        console.log("Secondary email verified successfully for:", email)

        // إعادة التوجيه إلى صفحة النجاح
        return NextResponse.redirect(new URL(`/auth/verification-success?type=${type}&email=${encodeURIComponent(email)}`, request.url))
      }
    }

    // إذا لم يتم العثور على مستخدم أو بريد إلكتروني ثانوي صالح
    console.log(`Invalid or expired verification link for ${type} email:`, email)
    return NextResponse.redirect(new URL('/auth/error?error=invalid-or-expired-link', request.url))
  } catch (error) {
    console.error("Error verifying email link:", error)
    return NextResponse.redirect(new URL('/auth/error?error=server-error', request.url))
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, type = "primary", email } = await request.json()

    if (!token || !email) {
      return NextResponse.json(
        { error: "Token and email are required" },
        { status: 400 }
      )
    }

    console.log(`Processing verification link for ${type} email:`, email, "Token:", token.substring(0, 10) + "...")

    if (type === "primary") {
      // التحقق من التوكن للبريد الأساسي
      const user = await prisma.user.findFirst({
        where: {
          email: email,
          verificationToken: token,
          verificationTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (user) {
        // تحديث حالة التحقق للبريد الأساسي
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: new Date(),
            verificationToken: null,
            verificationTokenExpiry: null,
          },
        });
        console.log("Primary email verified successfully for:", email)

        return NextResponse.json(
          { 
            message: "Primary email verified successfully",
            email: email
          },
          { status: 200 }
        )
      }
    } else if (type === "secondary") {
      // التحقق من التوكن للبريد الثانوي
      const secondaryEmail = await prisma.secondaryEmail.findFirst({
        where: {
          email: email,
          verificationToken: token,
          verificationTokenExpiry: {
            gt: new Date()
          }
        }
      });

      if (secondaryEmail) {
        // تحديث حالة التحقق للبريد الثانوي مباشرة
        await prisma.secondaryEmail.update({
          where: { id: secondaryEmail.id },
          data: {
            isVerified: true,
            verificationToken: null,
            verificationTokenExpiry: null,
          },
        });
        console.log("Secondary email verified successfully for:", email)

        return NextResponse.json(
          { 
            message: "Secondary email verified successfully",
            email: email
          },
          { status: 200 }
        )
      }
    }

    // إذا لم يتم العثور على مستخدم أو بريد إلكتروني ثانوي صالح
    return NextResponse.json(
      { error: "Invalid or expired verification link" },
      { status: 400 }
    )
  } catch (error) {
    console.error("Error verifying email link:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
