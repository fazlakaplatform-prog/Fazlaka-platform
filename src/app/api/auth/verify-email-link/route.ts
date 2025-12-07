// src/app/api/auth/verify-email-link/route.ts
import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

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

    await clientPromise;
    
    // التأكد من اتصال mongoose
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    let user = null;
    let isValid = false;

    if (type === "primary") {
      // التحقق من التوكن للبريد الأساسي
      user = await User.findOne({
        email: email,
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() }
      });

      if (user) {
        isValid = true;
        // تحديث حالة التحقق للبريد الأساسي
        await User.findByIdAndUpdate(user._id, {
          emailVerified: true,
          verificationToken: undefined,
          verificationTokenExpiry: undefined,
          updatedAt: new Date(),
        });
        console.log("Primary email verified successfully for:", email)
      }
    } else if (type === "secondary") {
      // التحقق من التوكن للبريد الثانوي
      user = await User.findOne({
        "secondaryEmails.email": email,
        "secondaryEmails.verificationToken": token,
        "secondaryEmails.verificationTokenExpiry": { $gt: new Date() }
      });

      if (user) {
        isValid = true;
        // تحديث حالة التحقق للبريد الثانوي
        await User.updateOne(
          { 
            _id: user._id,
            "secondaryEmails.email": email
          },
          { 
            $set: { 
              "secondaryEmails.$.isVerified": true,
              "secondaryEmails.$.verificationToken": undefined,
              "secondaryEmails.$.verificationTokenExpiry": undefined
            },
            updatedAt: new Date()
          }
        );
        console.log("Secondary email verified successfully for:", email)
      }
    }

    if (!isValid) {
      console.log(`Invalid or expired verification link for ${type} email:`, email)
      return NextResponse.redirect(new URL('/auth/error?error=invalid-or-expired-link', request.url))
    }

    // إعادة التوجيه إلى صفحة النجاح
    return NextResponse.redirect(new URL(`/auth/verification-success?type=${type}&email=${encodeURIComponent(email)}`, request.url))
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

    await clientPromise;
    
    // التأكد من اتصال mongoose
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    let user = null;
    let isValid = false;

    if (type === "primary") {
      // التحقق من التوكن للبريد الأساسي
      user = await User.findOne({
        email: email,
        verificationToken: token,
        verificationTokenExpiry: { $gt: new Date() }
      });

      if (user) {
        isValid = true;
        // تحديث حالة التحقق للبريد الأساسي
        await User.findByIdAndUpdate(user._id, {
          emailVerified: true,
          verificationToken: undefined,
          verificationTokenExpiry: undefined,
          updatedAt: new Date(),
        });
        console.log("Primary email verified successfully for:", email)
      }
    } else if (type === "secondary") {
      // التحقق من التوكن للبريد الثانوي
      user = await User.findOne({
        "secondaryEmails.email": email,
        "secondaryEmails.verificationToken": token,
        "secondaryEmails.verificationTokenExpiry": { $gt: new Date() }
      });

      if (user) {
        isValid = true;
        // تحديث حالة التحقق للبريد الثانوي
        await User.updateOne(
          { 
            _id: user._id,
            "secondaryEmails.email": email
          },
          { 
            $set: { 
              "secondaryEmails.$.isVerified": true,
              "secondaryEmails.$.verificationToken": undefined,
              "secondaryEmails.$.verificationTokenExpiry": undefined
            },
            updatedAt: new Date()
          }
        );
        console.log("Secondary email verified successfully for:", email)
      }
    }

    if (!isValid) {
      return NextResponse.json(
        { error: "Invalid or expired verification link" },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { 
        message: `${type === "primary" ? "Primary" : "Secondary"} email verified successfully`,
        email: email
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error verifying email link:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}