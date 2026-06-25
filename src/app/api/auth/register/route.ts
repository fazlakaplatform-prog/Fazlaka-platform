// File: src/app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, emailVerified = false } = await request.json()

    // التحقق من صحة البيانات المدخلة
    if (!name || !email || !password) {
      return NextResponse.json(
        { error: "جميع الحقول مطلوبة" },
        { status: 400 }
      )
    }

    // التحقق من قوة كلمة المرور
    if (password.length < 8) {
      return NextResponse.json(
        { error: "كلمة المرور يجب أن تكون 8 أحرف على الأقل" },
        { status: 400 }
      )
    }

    console.log("محاولة تسجيل مستخدم جديد:", email)

    // التحقق مما إذا كان المستخدم موجوداً بالفعل
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { 
            secondaryEmails: {
              some: { email: email } 
            }
          }
        ]
      }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل بالفعل" },
        { status: 400 }
      )
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12)

    // --- التعديلات الهامة ---
    
    // 1. تحويل قيمة emailVerified من Boolean إلى Date أو Null
    const isVerified = Boolean(emailVerified);
    const verifiedDate = isVerified ? new Date() : null;

    // 2. تحديد قيمة isActive بناءً على حالة التحقق
    const isActive = isVerified;

    // 3. تصحيح الدور ليتطابق مع Enum في الـ Schema
    const role = "USER"; 

    // إنشاء مستخدم جديد
    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        emailVerified: verifiedDate, // استخدام القيمة المحولة
        isActive: isActive,           // استخدام القيمة المحولة
        role: role,                   // استخدام الدور الصحيح "USER"
        banned: false,
      },
    });

    console.log("تم إنشاء المستخدم بنجاح:", newUser.id)

    return NextResponse.json(
      { 
        message: "تم إنشاء الحساب بنجاح",
        user: {
          id: newUser.id,
          name: newUser.name,
          email: newUser.email,
          emailVerified: newUser.emailVerified,
          isActive: newUser.isActive,
          role: newUser.role,
          banned: newUser.banned
        }
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("خطأ في تسجيل المستخدم:", error)
    return NextResponse.json(
      { error: "خطأ في الخادم الداخلي" },
      { status: 500 }
    )
  }
}