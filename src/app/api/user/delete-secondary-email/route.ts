// src/app/api/user/delete-secondary-email/route.ts
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

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
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

    console.log("User secondary emails:", user.secondaryEmails);
    console.log("Looking for email to delete:", email);

    // البحث عن البريد الإلكتروني الثانوي - استخدام نوع محدد
    const secondaryEmailIndex = user.secondaryEmails.findIndex(
      (e: SecondaryEmail) => e.email === email
    );

    console.log("Secondary email index:", secondaryEmailIndex);

    if (secondaryEmailIndex === -1) {
      return NextResponse.json(
        { error: "Secondary email not found" },
        { status: 404 }
      )
    }

    // حذف البريد الإلكتروني الثانوي
    user.secondaryEmails.splice(secondaryEmailIndex, 1);

    // تحديث المستخدم
    await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(session.user.id) },
      { 
        $set: { 
          secondaryEmails: user.secondaryEmails,
          updatedAt: new Date()
        }
      }
    );

    return NextResponse.json(
      { message: "Secondary email deleted successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Delete secondary email error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}