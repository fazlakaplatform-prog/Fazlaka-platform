// src/app/api/admin/users/[id]/activity/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

const prisma = new PrismaClient()

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    
    // التحقق من صلاحيات المسؤول
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER' && session.user.role !== 'EDITOR')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id } = await context.params

    // التحقق من وجود المستخدم
    const userExists = await prisma.user.findUnique({ where: { id } })
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // جلب مختلف أنواع النشاطات
    const [
      loginHistory,
      verificationAttempts,
      passwordResetAttempts,
      tickets,
      comments,
      userActivities
    ] = await Promise.all([
      // سجل تسجيل الدخول
      prisma.loginHistory.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 20
      }),
      // محاولات التحقق
      prisma.verificationAttempt.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      // محاولات إعادة تعيين كلمة المرور
      prisma.passwordResetAttempt.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10
      }),
      // التذاكر
      prisma.ticket.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          ticketNumber: true,
          subject: true,
          status: true,
          createdAt: true
        }
      }),
      // التعليقات
      prisma.comment.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 10,
        select: {
          id: true,
          content: true,
          createdAt: true,
          episodeId: true,
          articleId: true
        }
      }),
      // نشاط عام (timestamps)
      prisma.userActivity.findMany({
        where: { userId: id },
        orderBy: { createdAt: 'desc' },
        take: 30
      })
    ])

    return NextResponse.json({
      loginHistory,
      verificationAttempts,
      passwordResetAttempts,
      tickets,
      comments,
      userActivities
    })

  } catch (error) {
    console.error("Error fetching user activity:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}