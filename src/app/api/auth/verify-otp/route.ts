// File: src/app/api/auth/verify-otp.ts
import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import mongoose from "mongoose"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

// تعريف المخطط المؤقت لكود التحقق
const TempOTPSchema = new mongoose.Schema({
  email: String,
  otpCode: String,
  otpExpiry: Date,
  purpose: String,
  name: String,
  createdAt: { type: Date, default: Date.now }
});

// إنشاء النموذج فقط إذا لم يكن موجوداً
const TempOTP = mongoose.models.TempOTP || mongoose.model('TempOTP', TempOTPSchema);

export async function POST(request: NextRequest) {
  try {
    const { email, otpCode, purpose } = await request.json()

    if (!email || !otpCode) {
      return NextResponse.json(
        { error: "البريد الإلكتروني وكود التحقق مطلوبان" },
        { status: 400 }
      )
    }

    // التحقق من تنسيق كود التحقق
    if (!/^\d{6}$/.test(otpCode)) {
      return NextResponse.json(
        { error: "تنسيق كود التحقق غير صالح" },
        { status: 400 }
      )
    }

    console.log(`التحقق من كود التحقق لـ ${purpose}:`, email, "الكود:", otpCode.substring(0, 3) + "***")

    await clientPromise;
    
    // التأكد من اتصال mongoose
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    let userData = null;

    // إذا كان الغرض هو التسجيل، ابحث في المجموعة المؤقتة
    if (purpose === "register") {
      console.log("البحث عن كود التحقق في المجموعة المؤقتة للتسجيل...")
      const tempOTP = await TempOTP.findOne({
        email: email,
        otpCode: otpCode,
        purpose: "register",
        otpExpiry: { $gt: new Date() }
      });

      console.log("نتيجة البحث في المجموعة المؤقتة:", tempOTP ? "تم العثور" : "لم يتم العثور")

      if (!tempOTP) {
        console.log("كود التحقق غير صالح أو منتهي الصلاحية للتسجيل")
        return NextResponse.json(
          { error: "كود التحقق غير صالح أو منتهي الصلاحية" },
          { status: 400 }
        )
      }

      // إرجاع بيانات التسجيل
      userData = {
        email: tempOTP.email,
        name: tempOTP.name
      };

      console.log("إرجاع بيانات التسجيل لـ:", tempOTP.email)
      
      return NextResponse.json(
        { 
          message: "تم التحقق من كود التحقق بنجاح",
          purpose: "register",
          userData: userData
        },
        { status: 200 }
      )
    } else {
      // البحث عن المستخدم باستخدام البريد الأساسي
      let user = await User.findOne({ email });
      
      // إذا لم يتم العثور على المستخدم بالبريد الأساسي، ابحث في البريد الثانوي
      if (!user) {
        user = await User.findOne({ 
          "secondaryEmails.email": email,
          "secondaryEmails.isVerified": true 
        });
        
        // إذا تم العثور على المستخدم عبر الإيميل الثانوي، استخدم البريد الأساسي
        if (user) {
          console.log(`تم العثور على المستخدم عبر البريد الثانوي لـ ${purpose}:`, email, "البريد الأساسي:", user.email);
        }
      }

      if (!user) {
        console.log("لم يتم العثور على المستخدم للتحقق من كود التحقق:", email)
        return NextResponse.json(
          { error: "لم يتم العثور على المستخدم" },
          { status: 404 }
        )
      }

      // التحقق من كود التحقق
      if (user.otpCode !== otpCode) {
        console.log("كود التحقق غير صالح للمستخدم:", user._id)
        return NextResponse.json(
          { error: "كود التحقق غير صالح" },
          { status: 400 }
        )
      }

      // التحقق من انتهاء صلاحية كود التحقق
      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        console.log("انتهت صلاحية كود التحقق للمستخدم:", user._id)
        return NextResponse.json(
          { error: "انتهت صلاحية كود التحقق" },
          { status: 400 }
        )
      }

      // التحقق من غرض كود التحقق
      if (user.otpPurpose !== purpose) {
        console.log(`عدم تطابق غرض كود التحقق. المتوقع: ${purpose}, الموجود: ${user.otpPurpose}`)
        return NextResponse.json(
          { error: "كود التحقق غير صالح" },
          { status: 400 }
        )
      }

      console.log("تم التحقق من كود التحقق بنجاح للمستخدم:", user._id)

      // إذا كان الغرض هو إعادة تعيين كلمة المرور، قم بإنشاء توكن إعادة تعيين كلمة المرور
      if (purpose === "reset") {
        const resetToken = uuidv4()
        const resetTokenExpiry = new Date(Date.now() + 3600000) // ساعة واحدة
        
        // تحديث المستخدم بتوكن إعادة التعيين
        await User.findByIdAndUpdate(user._id, {
          resetToken,
          resetTokenExpiry,
          otpVerified: true,
          updatedAt: new Date(),
        });
        
        return NextResponse.json(
          { 
            message: "تم التحقق من كود التحقق بنجاح",
            resetToken,
            redirectUrl: `/reset-password?token=${resetToken}`,
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email, // دائماً إرجاع البريد الأساسي
              image: user.image,
              secondaryEmails: user.secondaryEmails || []
            }
          },
          { status: 200 }
        )
      } else {
        // للأغراض الأخرى، فقط وضع علامة على أن كود التحقق تم التحقق منه
        await User.findByIdAndUpdate(user._id, {
          otpVerified: true,
          updatedAt: new Date(),
        });

        return NextResponse.json(
          { 
            message: "تم التحقق من كود التحقق بنجاح",
            user: {
              id: user._id.toString(),
              name: user.name,
              email: user.email, // دائماً إرجاع البريد الأساسي
              image: user.image,
              secondaryEmails: user.secondaryEmails || []
            }
          },
          { status: 200 }
        )
      }
    }
  } catch (error) {
    console.error("خطأ في التحقق من كود التحقق:", error)
    return NextResponse.json(
      { error: "خطأ في الخادم الداخلي" },
      { status: 500 }
    )
  }
}