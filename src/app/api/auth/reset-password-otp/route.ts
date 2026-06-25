// File: src/app/api/auth/reset-password-with-otp/route.ts

import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, newPassword } = await request.json()

    if (!email || !newPassword) {
      console.log("Missing email or password")
      return NextResponse.json(
        { error: "Email and new password are required" },
        { status: 400 }
      )
    }

    // Validate password strength
    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

    // Validate password complexity
    const hasUpperCase = /[A-Z]/.test(newPassword)
    const hasLowerCase = /[a-z]/.test(newPassword)
    const hasNumbers = /\d/.test(newPassword)
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword)

    if (!hasUpperCase || !hasLowerCase || !hasNumbers || !hasSpecialChar) {
      return NextResponse.json(
        { error: "Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character" },
        { status: 400 }
      )
    }

    console.log("Resetting password with OTP for:", email)

    // البحث عن المستخدم باستخدام Prisma - أولاً بالبريد الأساسي
    let user = await prisma.user.findUnique({
      where: { 
        email: email,
        otpVerified: true // التحقق من أن OTP قد تم التحقق منه
      }
    });
    
    // إذا لم يتم العثور على المستخدم بالبريد الأساسي، ابحث في البريد الثانوي
    if (!user) {
      console.log("User not found with primary email, searching secondary emails...")
      user = await prisma.user.findFirst({
        where: {
          secondaryEmails: {
            some: {
              email: email,
              isVerified: true
            }
          },
          otpVerified: true // التحقق من أن OTP قد تم التحقق منه
        }
      });
      
      if (user) {
        console.log("Found user via secondary email for password reset:", email, "Primary email:", user.email);
      }
    }

    if (!user) {
      console.log("User not found or OTP not verified for:", email)
      return NextResponse.json(
        { error: "User not found or OTP not verified. Please verify your OTP first." },
        { status: 400 }
      )
    }

    // Check if new password is same as current password
    if (user.password) {
      const isSamePassword = await bcrypt.compare(newPassword, user.password);
      if (isSamePassword) {
        console.log("New password is same as current password")
        return NextResponse.json(
          { error: "New password cannot be same as the current password" },
          { status: 400 }
        )
      }
    }

    // Hash new password with secure salt rounds
    const hashedPassword = await bcrypt.hash(newPassword, 12)

    console.log("Updating password for user:", user.id)

    // Update password and clean up OTP fields using Prisma
    // In Prisma, to unset optional fields, we set them to null
    // Prisma will handle the updatedAt field automatically
    const updateResult = await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        otpVerified: null, // Set to null to clear the field
        otpCode: null,     // Set to null to clear the field
        otpExpiry: null,   // Set to null to clear the field
        otpPurpose: null,   // Set to null to clear the field
      },
    });

    if (!updateResult) {
      console.log("Failed to update user password")
      return NextResponse.json(
        { error: "Failed to update password" },
        { status: 500 }
      )
    }

    console.log("Password reset successfully for:", email)

    return NextResponse.json(
      { 
        message: "Password reset successfully",
        primaryEmail: user.email !== email ? user.email : null
      },
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