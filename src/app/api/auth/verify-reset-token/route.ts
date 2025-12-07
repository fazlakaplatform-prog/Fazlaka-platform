// File: src/app/api/auth/verify-reset-token/route.ts

import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: NextRequest) {
  try {
    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: "Token is required" },
        { status: 400 }
      )
    }

    await clientPromise;
    const user = await User.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
    }).select('-password -verificationToken -resetToken -magicToken -otpCode -emailChangeCode');

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 400 }
      )
    }

    return NextResponse.json({
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email, // إرجاع الإيميل الأساسي دائمًا
        image: user.image,
        // إضافة الإيميلات الثانوية إذا كانت موجودة
        secondaryEmails: user.secondaryEmails || []
      }
    })
  } catch (error) {
    console.error("Error verifying reset token:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}