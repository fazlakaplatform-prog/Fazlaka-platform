import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

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

    await clientPromise;
    const user = await User.findOne({ 
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() }
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
    await User.findByIdAndUpdate(user._id, {
      password: hashedPassword,
      resetToken: undefined,
      resetTokenExpiry: undefined,
      updatedAt: new Date(),
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