// File: src/app/api/auth/magic-link-handler/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

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

    let user = null;

    // إذا كان الغرض هو التسجيل، ابحث في جدول MagicLink
    if (purpose === "register") {
      console.log("البحث عن رابط التسجيل في جدول MagicLink...")
      const tempLink = await prisma.magicLink.findFirst({
        where: {
          magicToken: token,
          purpose: "register",
          magicTokenExpiry: {
            gt: new Date() // تحقق من أن التوكن لم ينتهِ صلاحيته
          }
        }
      });

      console.log("نتيجة البحث في جدول MagicLink:", tempLink ? "تم العثور" : "لم يتم العثور")

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
      // للمستخدمين الحاليين، ابحث في جدول User
      console.log("البحث عن مستخدم في جدول User...")
      user = await prisma.user.findFirst({
        where: {
          magicToken: token,
          magicTokenExpiry: {
            gt: new Date() // تحقق من أن التوكن لم ينتهِ صلاحيته
          }
        }
      });

      console.log("نتيجة البحث في جدول User:", user ? "تم العثور" : "لم يتم العثور")

      if (!user) {
        console.log("الرابط السحري غير صالح أو منتهي الصلاحية")
        return NextResponse.json(
          { error: "الرابط السحري غير صالح أو منتهي الصلاحية" },
          { status: 400 }
        )
      }

      // تحديث المستخدم بمعلومات تسجيل الدخول
      await prisma.user.update({
        where: { id: user.id },
        data: {
          magicToken: null, // مسح التوكن لمنع إعادة استخدامه
          magicTokenExpiry: null,
          lastLogin: new Date(),
        },
      });

      console.log("تم تسجيل الدخول بنجاح للمستخدم:", user.id)

      return NextResponse.json(
        { 
          message: "تم تسجيل الدخول بنجاح",
          purpose: "login",
          user: {
            id: user.id,
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