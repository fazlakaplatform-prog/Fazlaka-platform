// src/app/api/friends/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// جلب الأصدقاء (كما هو)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requests = await prisma.friendship.findMany({
      where: {
        OR: [
          { requesterId: session.user.id },
          { receiverId: session.user.id },
        ],
      },
      include: {
        requester: { select: { id: true, name: true, image: true } },
        receiver: { select: { id: true, name: true, image: true } },
      },
    });

    return NextResponse.json(requests);
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// إرسال طلب صداقة (كما هو)
export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { receiverId } = await req.json();
    if (session.user.id === receiverId) {
      return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, receiverId },
          { requesterId: receiverId, receiverId: session.user.id },
        ],
      },
    });

    if (existing) return NextResponse.json({ error: "Request already exists" }, { status: 400 });

    const request = await prisma.friendship.create({
      data: { requesterId: session.user.id, receiverId },
    });

    return NextResponse.json(request);
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}

// --- جديد: حذف الصداقة (Unfriend) ---
export async function DELETE(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { searchParams } = new URL(req.url);
    const friendId = searchParams.get("friendId"); // معرف المستخدم الآخر

    if (!friendId) return NextResponse.json({ error: "FriendId required" }, { status: 400 });

    // البحث عن علاقة الصداقة وحذفها
    await prisma.friendship.deleteMany({
      where: {
        OR: [
          { requesterId: session.user.id, receiverId: friendId },
          { requesterId: friendId, receiverId: session.user.id },
        ],
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}