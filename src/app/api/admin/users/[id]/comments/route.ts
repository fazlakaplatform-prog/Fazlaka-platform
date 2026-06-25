// src/app/api/admin/users/[id]/comments/route.ts
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

    // التحقق من وجود المستخدم
    const userExists = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    // جلب تعليقات المستخدم
    const comments = await prisma.comment.findMany({
      where: { userId: targetUserId },
      orderBy: { createdAt: 'desc' },
      include: {
        episode: {
          select: { id: true, title: true, slug: true }
        },
        article: {
          select: { id: true, title: true, slug: true }
        },
        _count: {
          select: { likes: true, replies: true }
        }
      }
    })

    return NextResponse.json({ comments })

  } catch (error) {
    console.error("Error fetching user comments:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}