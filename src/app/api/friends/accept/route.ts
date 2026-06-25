// src/app/api/friends/accept/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { requesterId, action } = await req.json();

    const friendship = await prisma.friendship.findFirst({
      where: {
        requesterId,
        receiverId: session.user.id,
        status: "PENDING",
      },
    });

    if (!friendship) return NextResponse.json({ error: "Request not found" }, { status: 404 });

    if (action === "ACCEPT") {
      const updated = await prisma.friendship.update({
        where: { id: friendship.id },
        data: { status: "ACCEPTED" },
      });

      // تم إزالة كود إنشاء المحادثة التلقائي هنا
      // المحادثة سيتم إنشاؤها تلقائياً عند إرسال أول رسالة في ملف messages/route.ts
      // هذا يمنع تكرار المحادثات الفارغة

      return NextResponse.json({ updated });
    } else {
      await prisma.friendship.delete({ where: { id: friendship.id } });
      return NextResponse.json({ success: true });
    }
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}