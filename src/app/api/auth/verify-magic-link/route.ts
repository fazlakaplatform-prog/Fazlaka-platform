// File: src/app/api/auth/verify-magic-link/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

type RegisterUserData = { email: string; name?: string }
type LoginUserData = { id: string; name?: string | null; email?: string | null; image?: string | null }

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const token = searchParams.get('token')
    const purpose = searchParams.get('purpose') || 'login'

    if (!token) {
      console.log("الرابط السحري مفقود في طلب GET")
      return NextResponse.redirect(new URL('/sign-in?error=missing-token', request.url))
    }

    console.log("استلام طلب التحقق من الرابط السحري للغرض:", purpose, "التوكن:", token.substring(0, 10) + "...")

    let isValid = false;
    let userData: RegisterUserData | LoginUserData | null = null;

    if (purpose === "register") {
      // البحث في جدول MagicLink للتسجيل
      const tempLink = await prisma.magicLink.findFirst({
        where: {
          magicToken: token,
          purpose: "register",
          magicTokenExpiry: {
            gt: new Date() // تحقق من أن التوكن لم تنتهِ صلاحيته
          }
        }
      });

      if (tempLink) {
        isValid = true;
        userData = {
          email: tempLink.email,
          // name قد تكون nullable حسب الـ schema
          name: tempLink.name ?? undefined
        };
        console.log("تم التحقق من رابط التسجيل الصالح لـ:", tempLink.email)
      } else {
        console.log("رابط التسجيل غير صالح أو منتهي الصلاحية")
      }
    } else {
      // البحث في جدول User لتسجيل الدخول
      const user = await prisma.user.findFirst({
        where: {
          magicToken: token,
          magicTokenExpiry: {
            gt: new Date() // تحقق من أن التوكن لم تنتهِ صلاحيته
          }
        }
      });

      if (user) {
        isValid = true;
        userData = {
          id: user.id,
          name: user.name ?? undefined,
          email: user.email ?? undefined,
          image: user.image ?? undefined
        };
        console.log("تم التحقق من رابط تسجيل الدخول الصالح لـ:", user.email)
      } else {
        console.log("رابط تسجيل الدخول غير صالح أو منتهي الصلاحية")
      }
    }

    if (!isValid) {
      return NextResponse.redirect(new URL('/sign-in?error=invalid-or-expired-token', request.url))
    }

    // إعادة التوجيه إلى صفحة التحقق مع البيانات
    const redirectUrl = new URL('/verify-magic-link', request.url)
    redirectUrl.searchParams.set('token', token)
    redirectUrl.searchParams.set('purpose', purpose)
    
    // إضافة البيانات كمعلمات في الرابط للتسجيل — فقط إذا القيم موجودة كـ string
    if (purpose === "register" && userData) {
      // TypeScript يعرف userData كـ RegisterUserData | LoginUserData, فنعمل تحقق دقيق
      const r = userData as RegisterUserData
      if (r.email) redirectUrl.searchParams.set('email', r.email)
      if (r.name) redirectUrl.searchParams.set('name', r.name)
    }
    
    return NextResponse.redirect(redirectUrl)
  } catch (error) {
    console.error("خطأ في التحقق من الرابط السحري (GET):", error)
    return NextResponse.redirect(new URL('/sign-in?error=server-error', request.url))
  }
}

export async function POST(request: NextRequest) {
  try {
    const { token, purpose = "login" } = await request.json()

    if (!token) {
      console.log("الرابط السحري مفقود في طلب POST")
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
            gt: new Date()
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
            name: tempLink.name ?? undefined
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
            gt: new Date()
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
            name: user.name ?? undefined,
            email: user.email ?? undefined,
            image: user.image ?? undefined
          }
        },
        { status: 200 }
      )
    }
  } catch (error) {
    console.error("خطأ في معالجة الرابط السحري (POST):", error)
    return NextResponse.json(
      { error: "خطأ في الخادم الداخلي" },
      { status: 500 }
    )
  }
}
