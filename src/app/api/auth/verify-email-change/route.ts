// File: src/app/api/auth/verify-email-change/route.ts

import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: NextRequest) {
  try {
    const { currentEmail, newEmail, verificationCode } = await request.json()

    if (!currentEmail || !newEmail || !verificationCode) {
      return NextResponse.json(
        { error: "Current email, new email, and verification code are required" },
        { status: 400 }
      )
    }

    console.log("Verifying email change from:", currentEmail, "to:", newEmail)

    await clientPromise;
    const user = await User.findOne({ 
      email: currentEmail,
      emailChangeCode: verificationCode,
      newEmail: newEmail,
      emailChangeCodeExpiry: { $gt: new Date() }
    });

    if (!user) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      )
    }

    console.log("Email change verification successful")

    // Save the current primary email to the secondary list
    const secondaryEmails = user.secondaryEmails || [];
    secondaryEmails.push({
      email: currentEmail,
      isVerified: true,
      createdAt: new Date()
    });

    // Update the user's email and remove verification fields
    await User.findByIdAndUpdate(user._id, {
      email: newEmail,
      secondaryEmails: secondaryEmails,
      emailChangeCode: undefined,
      emailChangeCodeExpiry: undefined,
      newEmail: undefined,
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { 
        message: "Email changed successfully. Your session has been updated.",
        newEmail: newEmail
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Email change verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}