// File: src/app/api/user/by-email/route.ts

import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    await clientPromise;
    
    // البحث عن المستخدم باستخدام البريد الأساسي
    let user = await User.findOne({ email }).select('-password -verificationToken -resetToken -magicToken -otpCode -emailChangeCode');
    
    // إذا لم يتم العثور على المستخدم بالبريد الأساسي، ابحث في البريد الثانوي
    if (!user) {
      user = await User.findOne({ 
        "secondaryEmails.email": email,
        "secondaryEmails.isVerified": true 
      }).select('-password -verificationToken -resetToken -magicToken -otpCode -emailChangeCode');
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}