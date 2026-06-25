// src/app/api/admin/users/[id]/chats/route.ts
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
    
    if (!session?.user || (session.user.role !== 'ADMIN' && session.user.role !== 'OWNER' && session.user.role !== 'EDITOR')) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { id: targetUserId } = await context.params
    const { searchParams } = new URL(request.url)
    const conversationId = searchParams.get("conversationId")

    const userExists = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!userExists) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (conversationId) {
      const messages = await prisma.message.findMany({
        where: { conversationId },
        orderBy: { createdAt: 'asc' },
        include: {
          sender: { select: { id: true, name: true, image: true } }
        }
      })
      return NextResponse.json({ messages })
    }

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          some: { userId: targetUserId }
        },
        // --- تمت الإضافة: تجاهل المحادثات التي لا تحتوي على رسائل ---
        messages: {
          some: {} 
        }
      },
      include: {
        participants: {
          include: {
            user: {
              select: { id: true, name: true, image: true, email: true }
            }
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          include: {
            sender: { select: { id: true, name: true } }
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    })

    const formattedConversations = conversations.map(conv => {
      const otherParticipant = conv.participants.find(p => p.userId !== targetUserId)
      const lastMessage = conv.messages[0]
      
      return {
        id: conv.id,
        createdAt: conv.createdAt,
        updatedAt: conv.updatedAt,
        otherUser: otherParticipant?.user || null,
        lastMessage: lastMessage ? {
          content: lastMessage.content,
          senderName: lastMessage.sender.name,
          createdAt: lastMessage.createdAt
        } : null
      }
    })

    return NextResponse.json({ conversations: formattedConversations })

  } catch (error) {
    console.error("Error fetching user chats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}