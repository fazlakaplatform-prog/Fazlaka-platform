// src/app/api/admin/users/[id]/stats/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // الحصول على إحصائيات تسجيل الدخول
    const loginHistory = await prisma.loginHistory.findMany({
      where: { userId: id },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const totalLogins = await prisma.loginHistory.count({
      where: { userId: id }
    });

    const lastLogin = loginHistory[0]?.createdAt;

    // الحصول على إحصائيات التحقق
    const verificationAttempts = await prisma.verificationAttempt.count({
      where: { userId: id }
    });

    // الحصول على إحصائيات إعادة تعيين كلمة المرور
    const passwordResets = await prisma.passwordResetAttempt.count({
      where: { userId: id }
    });

    // الحصول على إحصائيات تغيير البريد الإلكتروني
    const emailChanges = await prisma.emailChangeHistory.count({
      where: { userId: id }
    });

    // الحصول على آخر نشاط
    const lastActivity = await prisma.userActivity.findFirst({
      where: { userId: id },
      orderBy: { createdAt: 'desc' }
    });

    return NextResponse.json({
      totalLogins,
      lastLoginDate: lastLogin,
      loginHistory: loginHistory.map(login => ({
        date: login.createdAt,
        ip: login.ip,
        device: login.userAgent
      })),
      verificationAttempts,
      passwordResets,
      emailChanges,
      lastActivity: lastActivity?.createdAt
    });
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}