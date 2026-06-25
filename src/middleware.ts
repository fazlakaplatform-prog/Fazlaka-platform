import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// 1. المسارات التي تتطلب تسجيل دخول (للمستخدمين العاديين)
// أضف هنا المسارات التي تريد حمايتها فقط
const protectedPaths = ["/profile", "/orders", "/settings"]; // مثال

// 2. المسارات المسموح بها للمستخدمين المحظورين فقط
const BANNED_USER_ALLOWED_PATHS = [
  "/banned",
  "/profile",
  "/contact",
  "/privacy-policy",
  "/support",
  "/terms-conditions",
];

// 3. الأدوار المسموح لها بالوصول للوحة التحكم
const ADMIN_ROLES = ["OWNER", "EDITOR", "ADMIN"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // جلب التوكن
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // --- أولاً: التعامل مع المستخدم المحظور ---
  // إذا كان المستخدم مسجلاً ومحظوراً
  if (token && token.banned === true) {
    // السماح له بالوصول للمسارات المحددة فقط
    if (BANNED_USER_ALLOWED_PATHS.some((path) => pathname.startsWith(path))) {
      return NextResponse.next();
    }
    // منعه من أي مكان آخر وتوجيهه لصفحة الحظر
    const url = new URL("/banned", request.url);
    return NextResponse.redirect(url);
  }

  // --- ثانياً: التعامل مع لوحة التحكم (Admin) ---
  // هذه المنطقة تتطلب صلاحيات خاصة سواء كان مسجلاً أو لا
  if (pathname.startsWith("/admin")) {
    // إذا لم يسجل دخول، وجهه لتسجيل الدخول
    if (!token) {
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    // إذا سجل دخول ولكن ليس أدمن، وجهه للرئيسية
    if (!ADMIN_ROLES.includes(token.role as string)) {
      const url = new URL("/", request.url);
      return NextResponse.redirect(url);
    }
    // إذا كان أدمن، اسمح له
    return NextResponse.next();
  }

  // --- ثالثاً: التعامل مع الصفحات المحمية للمستخدمين العاديين ---
  // التحقق مما إذا كان المسار الحالي يتطلب تسجيل دخول
  const isProtectedPath = protectedPaths.some((path) => pathname.startsWith(path));

  if (isProtectedPath) {
    // إذا كان المسار محمياً والمستخدم غير مسجل، وجهه لتسجيل الدخول
    if (!token) {
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
    // إذا كان مسجلاً، اسمح له (تم التحقق من الحظر سابقاً)
    return NextResponse.next();
  }

  // --- رابعاً: التعامل مع صفحات التسجيل (Sign In / Sign Up) ---
  // إذا كان المستخدم مسجل الدخول بالفعل وحاول الدخول لصفحة تسجيل الدخول، وجهه للرئيسية
  if (["/sign-in", "/sign-up"].some((path) => pathname.startsWith(path))) {
    if (token) {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // --- أخيراً: السماح بكل ما سبق ---
  // باقي الصفحات (الرئيسية، من نحن، الخصوصية، إلخ) تعتبر عامة ومسموحة للجميع
  return NextResponse.next();
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|mp4)$).*)',
  ],
};