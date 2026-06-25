// src/app/api/admin/users/[id]/ai-chats/route.ts
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

    const { id: targetUserId } = await context.params
    const { searchParams } = new URL(request.url)
    const chatId = searchParams.get("chatId")

    // التحقق من وجود المستخدم
    const userExists = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // إذا كان الطلب لجلب محادثة محددة
    if (chatId) {
      const chat = await prisma.chatHistory.findFirst({
        where: { 
          id: chatId,
          userId: targetUserId // التأكد من أن المحادثة تخص المستخدم المحدد
        }
      })
      
      if (!chat) {
        return NextResponse.json({ error: "Chat not found" }, { status: 404 })
      }

      // messages يتم تخزينها كـ Json، لذا نقوم بإرجاعها كما هي
      return NextResponse.json({ 
        id: chat.id,
        title: chat.title,
        messages: chat.messages || [],
        createdAt: chat.createdAt
      })
    }

    // جلب جميع محادثات الذكاء الاصطناعي للمستخدم
    const chats = await prisma.chatHistory.findMany({
      where: { userId: targetUserId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        createdAt: true,
        updatedAt: true,
        // لا نجلب الرسائل هنا لتقليل حجم البيانات
      }
    })

    return NextResponse.json({ chats })

  } catch (error) {
    console.error("Error fetching user AI chats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}