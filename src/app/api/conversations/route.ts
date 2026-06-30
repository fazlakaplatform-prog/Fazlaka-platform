import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: { some: { userId } },
      },
      include: {
        participants: {
          include: {
            user: { select: { id: true, name: true, image: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
          include: { sender: { select: { id: true, name: true, image: true } } },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const mapped = conversations.map((conv) => {
      const otherParticipants = conv.participants
        .filter((p) => p.userId !== userId)
        .map((p) => ({
          id: p.user.id,
          name: p.user.name || "Unknown",
          image: p.user.image,
        }));

      const lastMessage = conv.messages.length > 0
        ? {
            id: conv.messages[0].id,
            conversationId: conv.id,
            senderId: conv.messages[0].senderId,
            content: conv.messages[0].content,
            imageUrl: conv.messages[0].imageUrl,
            isEdited: conv.messages[0].isEdited,
            isRead: conv.messages[0].isRead,
            createdAt: conv.messages[0].createdAt.toISOString(),
            sender: conv.messages[0].sender
              ? { id: conv.messages[0].sender.id, name: conv.messages[0].sender.name || "", image: conv.messages[0].sender.image }
              : null,
          }
        : null;

      return {
        id: conv.id,
        createdAt: conv.createdAt.toISOString(),
        updatedAt: conv.updatedAt.toISOString(),
        participants: otherParticipants,
        lastMessage,
      };
    });

    return NextResponse.json({ conversations: mapped });
  } catch (error) {
    console.error("Error fetching conversations:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
