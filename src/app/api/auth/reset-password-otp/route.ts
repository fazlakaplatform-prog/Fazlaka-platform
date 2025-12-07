// src/app/api/auth/reset-password-with-otp.ts
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

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

    await clientPromise;
    
    // البحث عن المستخدم باستخدام البريد الأساسي
    let user = await User.findOne({ 
      email: email,
      otpVerified: true
    });
    
    // إذا لم يتم العثور على المستخدم بالبريد الأساسي، ابحث في البريد الثانوي
    if (!user) {
      console.log("User not found with primary email, searching secondary emails...")
      user = await User.findOne({ 
        "secondaryEmails.email": email,
        "secondaryEmails.isVerified": true
      });
      
      if (user) {
        console.log("Found user via secondary email for password reset:", email, "Primary email:", user.email);
        
        // التحقق من أن OTP قد تم التحقق منه
        if (!user.otpVerified) {
          console.log("OTP not verified for user:", user._id)
          return NextResponse.json(
            { error: "OTP not verified. Please verify your OTP first." },
            { status: 400 }
          )
        }
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

    console.log("Updating password for user:", user._id)

    // Update password and clean up OTP fields
    const updateResult = await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      otpVerified: undefined,
      otpCode: undefined,
      otpExpiry: undefined,
      otpPurpose: undefined,
      updatedAt: new Date(),
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