// src/app/api/admin/users/[id]/emails/[emailId]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// PUT - لجعل البريد الإلكتروني الثانوي أساسيًا
export async function PUT(
  request: NextRequest,
  { params }: { 
    params: Promise<{ id: string; emailId: string }> 
  }
) {
  try {
    const { id, emailId } = await params;

    // جلب المستخدم مع جميع رسائله الثانوية للتحقق من الملكية
    const user = await prisma.user.findUnique({
      where: { id },
      include: { secondaryEmails: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    // التأكد من أن البريد الإلكتروني الثانوي ينتمي لهذا المستخدم
    const emailToMakePrimary = user.secondaryEmails?.find(e => e.id === emailId);

    if (!emailToMakePrimary) {
      return NextResponse.json(
        { error: "Secondary email not found or does not belong to this user" },
        { status: 404 }
      );
    }

    // استخدام Prisma transaction لضمان تنفيذ جميع العمليات أو لا شيء منها
    await prisma.$transaction(async (tx) => {
      // 1. إضافة البريد الأساسي الحالي كبريد ثانوي
      if (user.email) {
        await tx.secondaryEmail.create({
          data: {
            userId: user.id,
            email: user.email,
            isVerified: !!user.emailVerified,
          },
        });
      }

      // 2. حذف البريد الإلكتروني الثانوي الذي سيتم ترقيته
      await tx.secondaryEmail.delete({
        where: { id: emailId },
      });

      // 3. تحديث البريد الإلكتروني الأساسي للمستخدم
      await tx.user.update({
        where: { id: user.id },
        data: {
          email: emailToMakePrimary.email,
          emailVerified: emailToMakePrimary.isVerified ? new Date() : null,
        },
      });
    });

    return NextResponse.json({
      message: "Email made primary successfully",
      newPrimaryEmail: emailToMakePrimary.email
    });
  } catch (error) {
    console.error("Error making email primary:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// DELETE - لحذف بريد إلكتروني ثانوي
export async function DELETE(
  request: NextRequest,
  { params }: { 
    params: Promise<{ id: string; emailId: string }> 
  }
) {
  try {
    const { id, emailId } = await params;

    // التحقق من وجود البريد الإلكتروني الثانوي وملكيته للمستخدم
    const secondaryEmail = await prisma.secondaryEmail.findUnique({
      where: { id: emailId },
    });

    if (!secondaryEmail || secondaryEmail.userId !== id) {
      return NextResponse.json(
        { error: "Email not found or does not belong to this user" },
        { status: 404 }
      );
    }

    // حذف البريد الإلكتروني الثانوي
    await prisma.secondaryEmail.delete({
      where: { id: emailId },
    });

    return NextResponse.json({
      message: "Email deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting email:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}