import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { pusherServer } from "@/lib/pusher";

// Helper: التحقق من ملكية الرسالة ومدة الـ 10 دقائق
async function validateMessageAccess(messageId: string, userId: string) {
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    select: { senderId: true, createdAt: true, conversationId: true },
  });

  if (!message) return { error: "Message not found", status: 404 };
  if (message.senderId !== userId) return { error: "Forbidden", status: 403 };

  const tenMinutes = 10 * 60 * 1000;
  const isEditable = new Date().getTime() - new Date(message.createdAt).getTime() < tenMinutes;
  
  if (!isEditable) return { error: "Time limit exceeded (10 mins)", status: 403 };

  return { message, isEditable };
}

// --- GET: جلب الرسائل ---
export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const conversationId = searchParams.get("conversationId");
    const friendId = searchParams.get("friendId");

    let targetConversationId = conversationId;

    if (!targetConversationId && friendId) {
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: session.user.id } } },
            { participants: { some: { userId: friendId } } },
          ],
        },
      });
      if (existingConversation) targetConversationId = existingConversation.id;
    }

    if (!targetConversationId) {
      return NextResponse.json({ messages: [], conversationId: null });
    }

    const participant = await prisma.conversationParticipant.findFirst({
      where: { conversationId: targetConversationId, userId: session.user.id },
    });
    if (!participant) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const messages = await prisma.message.findMany({
      where: { conversationId: targetConversationId },
      orderBy: { createdAt: "asc" },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });

    return NextResponse.json({ messages, conversationId: targetConversationId });
  } catch (error) {
    console.error("Error fetching messages:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- POST: إرسال رسالة (نص أو صورة) ---
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { conversationId: inputConvId, content, receiverId, imageUrl } = body;

    // يجب وجود محتوى نصي أو صورة
    if (!content && !imageUrl) return NextResponse.json({ error: "Content or Image required" }, { status: 400 });

    let conversationId = inputConvId;

    if (!conversationId && receiverId) {
      const friendship = await prisma.friendship.findFirst({
        where: {
          OR: [
            { requesterId: session.user.id, receiverId },
            { requesterId: receiverId, receiverId: session.user.id },
          ],
          status: "ACCEPTED"
        }
      });
      if (!friendship) return NextResponse.json({ error: "Not friends" }, { status: 403 });

      const existingConv = await prisma.conversation.findFirst({
        where: {
          AND: [
            { participants: { some: { userId: session.user.id } } },
            { participants: { some: { userId: receiverId } } },
          ],
        },
      });

      if (existingConv) {
        conversationId = existingConv.id;
      } else {
        const newConv = await prisma.conversation.create({
          data: {
            participants: {
              create: [{ userId: session.user.id }, { userId: receiverId }],
            },
          },
        });
        conversationId = newConv.id;
      }
    }

    if (!conversationId) return NextResponse.json({ error: "Missing context" }, { status: 400 });

    const message = await prisma.message.create({
      data: { 
        conversationId, 
        senderId: session.user.id, 
        content: content || "", 
        imageUrl: imageUrl || null 
      },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });

    await pusherServer.trigger(`private-conversation-${conversationId}`, "new-message", message);

    return NextResponse.json({ ...message, conversationId });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- PUT: تعديل رسالة ---
export async function PUT(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { messageId, content } = await req.json();
    if (!messageId || !content) return NextResponse.json({ error: "Missing data" }, { status: 400 });

    const validation = await validateMessageAccess(messageId, session.user.id);
    if (validation.error) return NextResponse.json({ error: validation.error }, { status: validation.status });

    const updatedMessage = await prisma.message.update({
      where: { id: messageId },
      data: { content, isEdited: true },
      include: { sender: { select: { id: true, name: true, image: true } } },
    });

    await pusherServer.trigger(
      `private-conversation-${validation.message!.conversationId}`,
      "message-updated",
      updatedMessage
    );

    return NextResponse.json(updatedMessage);
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

// --- DELETE: حذف رسالة ---
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const messageId = searchParams.get("messageId");

    if (!messageId) return NextResponse.json({ error: "Message ID required" }, { status: 400 });

    const validation = await validateMessageAccess(messageId, session.user.id);
    if (validation.error) return NextResponse.json({ error: validation.error }, { status: validation.status });

    await prisma.message.delete({ where: { id: messageId } });

    await pusherServer.trigger(
      `private-conversation-${validation.message!.conversationId}`,
      "message-deleted",
      { messageId }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}