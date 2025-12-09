import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import mongoose from "mongoose"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, emailVerified = false } = await request.json()

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

    console.log("تسجيل مستخدم جديد:", email)

    await clientPromise;
    
    // التأكد من اتصال mongoose
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    // التحقق مما إذا كان المستخدم موجوداً بالفعل
    const existingUser = await User.findOne({ 
      $or: [
        { email: email },
        { "secondaryEmails.email": email }
      ]
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل بالفعل" },
        { status: 400 }
      )
    }

    // تشفير كلمة المرور
    const hashedPassword = await bcrypt.hash(password, 12)

    // إنشاء مستخدم جديد
    const user = new User({
      name,
      email,
      password: hashedPassword,
      emailVerified: emailVerified,
      isActive: emailVerified,
      role: "user",
      banned: false,
      createdAt: new Date(),
      updatedAt: new Date()
    })

    await user.save()

    console.log("تم إنشاء المستخدم بنجاح:", user._id)

    return NextResponse.json(
      { 
        message: "تم إنشاء الحساب بنجاح",
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          emailVerified: user.emailVerified,
          isActive: user.isActive,
          role: user.role,
          banned: user.banned
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