// src/app/api/admin/users/[id]/emails/route.ts
import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import clientPromise from "@/lib/mongodb";
import crypto from "crypto";

// تعريف واجهات (interfaces) لتحسين الأمان وتجنب استخدام any
interface SecondaryEmail {
  _id: string;
  email: string;
  isVerified: boolean;
  verificationCode?: string;
  verificationCodeExpiry?: Date;
}

interface User {
  _id: ObjectId;
  email?: string;
  secondaryEmails?: SecondaryEmail[];
  updatedAt?: Date;
}

// POST - لإضافة بريد إلكتروني جديد
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> } // <-- التعديل الأساسي هنا
) {
  try {
    // انتظر حتى يتم حل Promise لـ params
    const { id } = await params;

    // قراءة جسم الطلب
    const body = await request.json();
    const email: string | undefined = body?.email;

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email is required" }, { status: 400 });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const client = await clientPromise;
    const db = client.db();

    // جلب المستخدم
    const user = await db.collection<User>("users").findOne({ _id: new ObjectId(id) });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // التأكد أن البريد غير مستخدم من قبل (كبريد أساسي أو ثانوي) في أي حساب آخر
    const emailRegex = new RegExp(`^${normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}$`, "i");
    const existingEmail = await db.collection("users").findOne({
      $or: [{ email: { $regex: emailRegex } }, { "secondaryEmails.email": { $regex: emailRegex } }],
    });

    if (existingEmail) {
      return NextResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    // التأكد أن نفس البريد لم يضاف سابقاً للمستخدم الحالي
    const secondaryEmails: SecondaryEmail[] = user.secondaryEmails || [];
    const existsInCurrent = secondaryEmails.some((e) => e.email.toLowerCase() === normalizedEmail);
    if (existsInCurrent) {
      return NextResponse.json({ error: "Email already added" }, { status: 400 });
    }

    // إنشاء كود تحقق وصلاحية 24 ساعة
    const verificationCode = crypto.randomInt(100000, 999999).toString();
    const verificationCodeExpiry = new Date();
    verificationCodeExpiry.setHours(verificationCodeExpiry.getHours() + 24);

    const newEmail: SecondaryEmail = {
      _id: new ObjectId().toString(),
      email: normalizedEmail,
      isVerified: false,
      verificationCode,
      verificationCodeExpiry,
    };

    // تحديث المستخدم: نستخدم $set مع مصفوفة محدثة لتجنب تعارضات typing مع $push
    const updatedSecondaryEmails = [...secondaryEmails, newEmail];

    await db.collection<User>("users").updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          secondaryEmails: updatedSecondaryEmails,
          updatedAt: new Date(),
        },
      }
    );

    // هنا يمكنك إضافة منطق إرسال البريد الإلكتروني الذي يحتوي كود التحقق

    return NextResponse.json({
      message: "Email added successfully",
      email: newEmail,
    });
  } catch (error) {
    console.error("Error adding email:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}