// middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

// تحديد المسارات العامة التي لا تتطلب مصادقة
const publicPaths = [
  "/sign-in",
  "/auth/error",
  "/api/auth",
  "/banned", // صفحة المحظورين
  "/terms-conditions", // الشروط والأحكام
  "/support", // الدعم
  "/privacy-policy", // سياسة الخصوصية
  "/contact", // اتصل بنا
];

// تحديد المسارات التي تتطلب دور المسؤول
const adminPaths = ["/admin", "/admin/"];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // التحقق مما إذا كان المسار هو مسار عام
  if (publicPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // الحصول على التوكن من الجلسة
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // إذا كان المستخدم مسجل دخوله (لديه توكن)، نتحقق من حالته
  if (token) {
    try {
      const response = await fetch(`${request.nextUrl.origin}/api/user/me`, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });

      if (response.ok) {
        const user = await response.json();

        // **التعديل هنا: السماح للمستخدمين المحظورين بالوصول إلى صفحة الملف الشخصي فقط**
        // يتم توجيههم فقط إذا حاولوا الوصول إلى مسار آخر غير /profile
        if (user.banned && !pathname.startsWith("/profile")) {
          const url = new URL("/banned", request.url);
          return NextResponse.redirect(url);
        }

        // التحقق مما إذا كان المسار يتطلب دور المسؤول
        const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));
        if (isAdminPath) {
          // التحقق مما إذا كان المستخدم لديه دور مناسب (owner, editor, أو admin)
          if (!user.role || !["owner", "editor", "admin"].includes(user.role)) {
            const url = new URL("/auth/error?error=AccessDenied", request.url);
            return NextResponse.redirect(url);
          }
        }
      } else {
        // إذا فشل جلب بيانات المستخدم، قد تكون الجلسة غير صالحة
        const url = new URL("/sign-in", request.url);
        url.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(url);
      }
    } catch (error) {
      console.error("Error in middleware:", error);
      const url = new URL("/auth/error?error=MiddlewareError", request.url);
      return NextResponse.redirect(url);
    }
  } else {
    // إذا لم يكن المستخدم مسجل دخوله والمسار يتطلب صلاحيات، قم بتوجيهه لتسجيل الدخول
    const isAdminPath = adminPaths.some((path) => pathname.startsWith(path));
    if (isAdminPath) {
      const url = new URL("/sign-in", request.url);
      url.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api (API routes)
     */
    "/((?!_next/static|_next/image|favicon.ico|public|api).*)",
  ],
};