// src/app/api/user/make-primary/route.ts
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
    
    // البحث عن المستخدم للحصول على بياناته الحالية
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

    // البحث عن البريد الإلكتروني الثانوي الذي سيتم ترقيته
    const secondaryEmailToPromote = user.secondaryEmails.find(
      (e: SecondaryEmail) => e.email === email
    );

    if (!secondaryEmailToPromote) {
      return NextResponse.json(
        { error: "Secondary email not found" },
        { status: 404 }
      )
    }

    // التحقق من أن البريد الإلكتروني الثانوي موثق
    if (!secondaryEmailToPromote.isVerified) {
      return NextResponse.json(
        { error: "Please verify secondary email first" },
        { status: 400 }
      )
    }

    // --- بداية المنطق الجديد والمصحح ---
    
    // 1. حفظ البريدين
    const oldPrimaryEmail = user.email;
    const newPrimaryEmail = secondaryEmailToPromote.email;

    // 2. بناء قائمة البريد الإلكتروني الثانوي الجديدة
    //    - إزالة البريد الذي سيتم ترقيته من القائمة
    const newSecondaryEmails = user.secondaryEmails.filter(
      (e: SecondaryEmail) => e.email !== newPrimaryEmail
    );

    //    - إضافة البريد الأساسي القديم إلى القائمة (إذا لم يكن موجودًا بالفعل)
    // --- تم التصحيح هنا: إضافة النوع (e: SecondaryEmail) ---
    const isOldPrimaryAlreadySecondary = newSecondaryEmails.some((e: SecondaryEmail) => e.email === oldPrimaryEmail);
    if (!isOldPrimaryAlreadySecondary) {
      newSecondaryEmails.push({
        email: oldPrimaryEmail,
        isVerified: true, // البريد الأساسي القديم كان موثقًا بالتأكيد
        createdAt: new Date()
      });
    }

    // 3. تنفيذ عملية التحديث الشاملة في قاعدة البيانات
    await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(session.user.id) },
      { 
        $set: { 
          email: newPrimaryEmail, // تعيين البريد الأساسي الجديد
          secondaryEmails: newSecondaryEmails, // تحديث قائمة البريد الإلكتروني الثانوي
          updatedAt: new Date()
        }
      }
    );

    // --- نهاية المنطق الجديد ---

    return NextResponse.json(
      { 
        message: "Primary email updated successfully.",
        newEmail: newPrimaryEmail,
        previousEmail: oldPrimaryEmail
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Make primary email error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}