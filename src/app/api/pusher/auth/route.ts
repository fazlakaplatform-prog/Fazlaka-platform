import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { pusherServer } from "@/lib/pusher";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const formData = await request.formData();
    const socket_id = formData.get("socket_id") as string;
    const channel_name = formData.get("channel_name") as string;

    // التعامل مع القنوات الخاصة (Private Channels)
    if (channel_name.startsWith("private-")) {
      // منطق قنوات المحادثات: private-conversation-{conversationId}
      if (channel_name.includes("conversation-")) {
        const conversationId = channel_name.split("-")[2];
        
        // التحقق مما إذا كان المستخدم مشاركاً في هذه المحادثة
        const participant = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: conversationId,
            userId: session.user.id,
          },
        });

        if (!participant) {
          return new NextResponse("Forbidden: Not a participant", { status: 403 });
        }
      }
      
      // منطق التذاكر (من الكود القديم)
      // ... احتفظ بالمنطق القديم للتذاكر هنا إذا لزم الأمر
    }

    const authResponse = pusherServer.authorizeChannel(socket_id, channel_name, {
      user_id: session.user.id,
      user_info: {
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
      },
    });

    return NextResponse.json(authResponse);
  } catch (error) {
    console.error("Pusher Auth Error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}