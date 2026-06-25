// File: src/app/api/auth/verify-otp/route.ts
import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import { prisma } from "@/lib/prisma"

type PurposeType = "login" | "register" | "reset" | "verify" | "change-password"

// خريطة التحويل لربط القيم النصية مع قيم الـ Enum في Prisma
const purposeToEnumMap: Record<string, "LOGIN" | "REGISTER" | "RESET" | "VERIFY" | "CHANGE_PASSWORD"> = {
  "login": "LOGIN",
  "register": "REGISTER",
  "reset": "RESET",
  "verify": "VERIFY",
  "change-password": "CHANGE_PASSWORD"
}

export async function POST(request: NextRequest) {
  try {
    const { email, otpCode, purpose = "login" } = await request.json()

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

    let userData = null;

    // إذا كان الغرض هو التسجيل، ابحث في جدول OTP المؤقت
    if (purpose === "register") {
      console.log("البحث عن كود التحقق في جدول OTP للتسجيل...")
      const tempOTP = await prisma.oTP.findFirst({
        where: {
          email: email,
          otpCode: otpCode,
          purpose: "register", // في جدول OTP الحقل نصي
          otpExpiry: {
            gt: new Date()
          }
        }
      });

      console.log("نتيجة البحث في جدول OTP:", tempOTP ? "تم العثور" : "لم يتم العثور")

      if (!tempOTP) {
        console.log("كود التحقق غير صالح أو منتهي الصلاحية للتسجيل")
        return NextResponse.json(
          { error: "كود التحقق غير صالح أو منتهي الصلاحية" },
          { status: 400 }
        )
      }

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
      let user = await prisma.user.findUnique({ 
        where: { email },
        include: { secondaryEmails: true } 
      });
      
      // إذا لم يتم العثور على المستخدم بالبريد الأساسي، ابحث في البريد الثانوي
      if (!user) {
        user = await prisma.user.findFirst({ 
          where: { 
            secondaryEmails: {
              some: {
                email: email,
                isVerified: true 
              }
            }
          },
          include: { secondaryEmails: true }
        });
        
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
        console.log("كود التحقق غير صالح للمستخدم:", user.id)
        return NextResponse.json(
          { error: "كود التحقق غير صالح" },
          { status: 400 }
        )
      }

      // التحقق من انتهاء صلاحية كود التحقق
      if (!user.otpExpiry || new Date() > user.otpExpiry) {
        console.log("انتهت صلاحية كود التحقق للمستخدم:", user.id)
        return NextResponse.json(
          { error: "انتهت صلاحية كود التحقق" },
          { status: 400 }
        )
      }

      // === التصحيح المهم هنا ===
      // تحويل الغرض من النص (change-password) إلى القيمة المقابلة في الـ Enum (CHANGE_PASSWORD)
      const prismaPurpose = purposeToEnumMap[purpose] || "LOGIN";

      // التحقق من غرض كود التحقق
      if (user.otpPurpose !== prismaPurpose) {
        console.log(`عدم تطابق غرض كود التحقق. المتوقع: ${prismaPurpose}, الموجود: ${user.otpPurpose}`)
        return NextResponse.json(
          { error: "كود التحقق غير صالح لهذا الغرض" },
          { status: 400 }
        )
      }

      console.log("تم التحقق من كود التحقق بنجاح للمستخدم:", user.id)

      // إذا كان الغرض هو التحقق من البريد الإلكتروني (verify)، قم بتحديث الحالة
      if (purpose === "verify") {
        await prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: new Date(),
            isActive: true,
            otpVerified: true,
          },
        });

        return NextResponse.json(
          {
            message: "تم التحقق من البريد الإلكتروني بنجاح",
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              secondaryEmails: user.secondaryEmails || []
            }
          },
          { status: 200 }
        )
      }

      // إذا كان الغرض هو إعادة تعيين كلمة المرور، قم بإنشاء توكن إعادة تعيين كلمة المرور
      if (purpose === "reset") {
        const resetToken = uuidv4()
        const resetTokenExpiry = new Date(Date.now() + 3600000) // ساعة واحدة
        
        await prisma.user.update({
          where: { id: user.id },
          data: {
            resetToken,
            resetTokenExpiry,
            otpVerified: true,
          },
        });
        
        return NextResponse.json(
          { 
            message: "تم التحقق من كود التحقق بنجاح",
            resetToken,
            redirectUrl: `/reset-password?token=${resetToken}`,
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
              image: user.image,
              secondaryEmails: user.secondaryEmails || []
            }
          },
          { status: 200 }
        )
      } else {
        // للأغراض الأخرى (بما في ذلك change-password)، فقط وضع علامة على أن كود التحقق تم التحقق منه
        await prisma.user.update({
          where: { id: user.id },
          data: {
            otpVerified: true,
          },
        });

        return NextResponse.json(
          { 
            message: "تم التحقق من كود التحقق بنجاح",
            user: {
              id: user.id,
              name: user.name,
              email: user.email,
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