// src/app/api/user/verify-secondary-email/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import mongoose from "mongoose"

// تعريف واجهة للجلسة
interface Session {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  };
}

// تعريف نوع للبريد الإلكتروني الثانوي
interface SecondaryEmail {
  email: string;
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
  createdAt: Date;
}

export async function POST(request: NextRequest) {
  try {
    // استخدام تعليق ESLint وتحويل مزدوج لتجنب مشاكل TypeScript
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as unknown as any) as Session
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { email, verificationCode } = await request.json()

    if (!email || !verificationCode) {
      return NextResponse.json(
        { error: "Email and verification code are required" },
        { status: 400 }
      )
    }

    await clientPromise;
    
    // استخدام المجموعة مباشرة للتحديث
    const db = mongoose.connection.db;
    
    // التأكد من أن db ليس undefined
    if (!db) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      )
    }
    
    const usersCollection = db.collection('users');
    
    // التحقق من وجود المستخدم
    const user = await usersCollection.findOne({ _id: new mongoose.Types.ObjectId(session.user.id) });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // التحقق من أن مصفوفة secondaryEmails موجودة
    if (!user.secondaryEmails) {
      user.secondaryEmails = [];
    }

    // البحث عن البريد الإلكتروني الثانوي - استخدام نوع محدد
    const secondaryEmailIndex = user.secondaryEmails.findIndex(
      (e: SecondaryEmail) => e.email === email
    );

    if (secondaryEmailIndex === -1) {
      return NextResponse.json(
        { error: "Secondary email not found" },
        { status: 404 }
      )
    }

    const secondaryEmail = user.secondaryEmails[secondaryEmailIndex];

    // التحقق من أن كود التحقق صحيح
    if (
      secondaryEmail.verificationCode !== verificationCode ||
      new Date(secondaryEmail.verificationCodeExpiry) < new Date()
    ) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      )
    }

    // تحديث البريد الإلكتروني الثانوي ليتم التحقق
    const updateField = `secondaryEmails.${secondaryEmailIndex}.isVerified`;
    const unsetVerificationCode = `secondaryEmails.${secondaryEmailIndex}.verificationCode`;
    const unsetVerificationCodeExpiry = `secondaryEmails.${secondaryEmailIndex}.verificationCodeExpiry`;

    await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(session.user.id) },
      { 
        $set: { 
          [updateField]: true,
          [unsetVerificationCode]: 1,
          [unsetVerificationCodeExpiry]: 1
        }
      }
    );

    return NextResponse.json(
      { message: "Secondary email verified successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Verify secondary email error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}