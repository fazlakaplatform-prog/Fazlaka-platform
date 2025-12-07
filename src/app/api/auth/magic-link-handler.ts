// File: src/app/api/auth/magic-link-handler.ts
import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

// تعريف المخطط المؤقت للرابط السحري
const TempMagicLinkSchema = new mongoose.Schema({
  email: String,
  name: String,
  magicToken: String,
  magicTokenExpiry: Date,
  purpose: String,
  createdAt: { type: Date, default: Date.now }
});

// إنشاء النموذج فقط إذا لم يكن موجوداً
const TempMagicLink = mongoose.models.TempMagicLink || mongoose.model('TempMagicLink', TempMagicLinkSchema);

export async function POST(request: NextRequest) {
  try {
    const { token, purpose = "login" } = await request.json()

    if (!token) {
      console.log("الرابط السحري مفقود")
      return NextResponse.json(
        { error: "الرابط السحري مطلوب" },
        { status: 400 }
      )
    }

    console.log("معالجة الرابط السحري للغرض:", purpose, "التوكن:", token.substring(0, 10) + "...")

    await clientPromise;
    
    // التأكد من اتصال mongoose
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    let user = null;

    // إذا كان الغرض هو التسجيل، ابحث في المجموعة المؤقتة
    if (purpose === "register") {
      console.log("البحث عن رابط التسجيل في المجموعة المؤقتة...")
      const tempLink = await TempMagicLink.findOne({
        magicToken: token,
        purpose: "register",
        magicTokenExpiry: { $gt: new Date() }
      });

      console.log("نتيجة البحث في المجموعة المؤقتة:", tempLink ? "تم العثور" : "لم يتم العثور")

      if (!tempLink) {
        console.log("الرابط السحري غير صالح أو منتهي الصلاحية للتسجيل")
        return NextResponse.json(
          { error: "الرابط السحري غير صالح أو منتهي الصلاحية" },
          { status: 400 }
        )
      }

      // إرجاع بيانات التسجيل
      console.log("إرجاع بيانات التسجيل لـ:", tempLink.email)
      return NextResponse.json(
        { 
          message: "تم التحقق من الرابط السحري بنجاح",
          purpose: "register",
          userData: {
            email: tempLink.email,
            name: tempLink.name
          }
        },
        { status: 200 }
      )
    } else {
      // للمستخدمين الحاليين، ابحث في مجموعة المستخدمين
      console.log("البحث عن مستخدم في مجموعة المستخدمين...")
      user = await User.findOne({
        magicToken: token,
        magicTokenExpiry: { $gt: new Date() }
      });

      console.log("نتيجة البحث في مجموعة المستخدمين:", user ? "تم العثور" : "لم يتم العثور")

      if (!user) {
        console.log("الرابط السحري غير صالح أو منتهي الصلاحية")
        return NextResponse.json(
          { error: "الرابط السحري غير صالح أو منتهي الصلاحية" },
          { status: 400 }
        )
      }

      // تحديث المستخدم بمعلومات تسجيل الدخول
      await User.findByIdAndUpdate(user._id, {
        magicToken: undefined,
        magicTokenExpiry: undefined,
        lastLogin: new Date(),
        updatedAt: new Date(),
      });

      console.log("تم تسجيل الدخول بنجاح للمستخدم:", user._id)

      return NextResponse.json(
        { 
          message: "تم تسجيل الدخول بنجاح",
          purpose: "login",
          user: {
            id: user._id.toString(),
            name: user.name,
            email: user.email,
            image: user.image
          }
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error("خطأ في معالجة الرابط السحري:", error)
    return NextResponse.json(
      { error: "خطأ في الخادم الداخلي" },
      { status: 500 }
    )
  }
}