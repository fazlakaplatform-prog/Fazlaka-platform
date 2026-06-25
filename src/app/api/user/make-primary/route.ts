// src/app/api/user/make-primary/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// تعريف واجهة للجلسة
interface Session {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  };
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

    // تم الإصلاح: تخزين المعرف في متغير ثابت لضمان توفره داخل الـ Transaction
    const userId = session.user.id;

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    // البحث عن المستخدم مع رسائله الإلكترونية الثانوية
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { secondaryEmails: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // البحث عن البريد الإلكتروني الثانوي الذي سيتم ترقيته
    const secondaryEmailToPromote = user.secondaryEmails.find(e => e.email === email);

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

    // حفظ البريدين قبل بدء المعاملة
    const oldPrimaryEmail = user.email;
    const newPrimaryEmail = secondaryEmailToPromote.email;

    // استخدام معاملة (Transaction) لضمان سلامة البيانات
    // هذا يضمن أن جميع العمليات تنجح معًا أو تفشل معًا
    await prisma.$transaction(async (tx) => {
      // 1. تحديث البريد الإلكتروني الأساسي للمستخدم
      await tx.user.update({
        where: { id: userId }, // استخدام المتغير الثابت userId
        data: { email: newPrimaryEmail },
      });

      // 2. حذف البريد الإلكتروني الثانوي الذي تم ترقيته
      await tx.secondaryEmail.delete({
        where: { id: secondaryEmailToPromote.id },
      });

      // 3. إضافة البريد الأساسي القديم كبريد إلكتروني ثانوي جديد (إذا لم يكن موجودًا بالفعل)
      const isOldPrimaryAlreadySecondary = user.secondaryEmails.some(e => e.email === oldPrimaryEmail);
      if (!isOldPrimaryAlreadySecondary) {
        await tx.secondaryEmail.create({
          data: {
            email: oldPrimaryEmail,
            userId: userId, // استخدام المتغير الثابت userId
            isVerified: true, // البريد الأساسي القديم كان موثقًا بالتأكيد
          },
        });
      }
    });

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