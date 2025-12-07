// src/app/api/auth/verify-email/route.ts
import { NextRequest, NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

// Define an interface for the structure of a secondary email object
// to avoid using 'any' and improve type safety.
interface SecondaryEmail {
  address: string;
  isVerified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
}

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

    await clientPromise;
    
    // البحث عن المستخدم باستخدام التوكن في البريد الأساسي
    let user = await User.findOne({ 
      verificationToken: token,
      verificationTokenExpiry: { $gt: new Date() }
    });

    // إذا لم يتم العثور على المستخدم، ابحث في البريد الثانوي
    if (!user) {
      user = await User.findOne({ 
        "secondaryEmails.verificationToken": token,
        "secondaryEmails.verificationTokenExpiry": { $gt: new Date() }
      });
      
      if (user) {
        // ابحث عن البريد الإلكتروني الثانوي الذي يحتوي على التوكن
        const secondaryEmailIndex = user.secondaryEmails.findIndex(
          (email: SecondaryEmail) => email.verificationToken === token
        );
        
        if (secondaryEmailIndex !== -1) {
          // تحديث حالة التحقق للبريد الإلكتروني الثانوي
          await User.findByIdAndUpdate(user._id, {
            [`secondaryEmails.${secondaryEmailIndex}.isVerified`]: true,
            [`secondaryEmails.${secondaryEmailIndex}.verificationToken`]: undefined,
            [`secondaryEmails.${secondaryEmailIndex}.verificationTokenExpiry`]: undefined,
            updatedAt: new Date(),
          });
          
          return NextResponse.json(
            { message: "Secondary email verified successfully" },
            { status: 200 }
          )
        }
      }
    }

    if (!user) {
      console.log("User not found with token:", token.substring(0, 10) + "...")
      
      // محاولة البحث عن المستخدم بالرمز بغض النظر عن انتهاء الصلاحية
      const userWithExpiredToken = await User.findOne({ verificationToken: token });
      
      if (userWithExpiredToken) {
        return NextResponse.json(
          { error: "Verification token has expired. Please request a new one." },
          { status: 400 }
        )
      }
      
      return NextResponse.json(
        { error: "Invalid verification token" },
        { status: 400 }
      )
    }

    console.log("Email verification successful for user:", user._id)

    // تحديث المستخدم لتفعيل الحساب وإزالة رمز التحقق
    await User.findByIdAndUpdate(user._id, {
      isActive: true,
      emailVerified: true,
      verificationToken: undefined,
      verificationTokenExpiry: undefined,
      updatedAt: new Date(),
    });

    return NextResponse.json(
      { message: "Email verified successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Email verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}