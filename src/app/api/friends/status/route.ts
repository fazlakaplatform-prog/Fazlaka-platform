// src/app/api/friends/status/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// تعريف واجهة للمستخدم المشترك
interface MutualFriend {
  id: string;
  name: string | null;
  image: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    // 1. Check friendship status
    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: session.user.id, receiverId: userId },
          { requesterId: userId, receiverId: session.user.id },
        ],
      },
    });

    let status = "NONE";
    if (friendship) {
      status = friendship.status;
      if (status === "PENDING") {
        // Check who sent the request
        if (friendship.requesterId === session.user.id) {
          status = "PENDING_SENT";
        } else {
          status = "PENDING_RECEIVED";
        }
      } else if (status === "ACCEPTED") {
        status = "ACCEPTED";
      }
    }

    // 2. Get Mutual Friends (if not friends yet)
    // تم إضافة النوع بشكل صريح لإصلاح الخطأ
    let mutualFriends: MutualFriend[] = [];
    
    if (status !== "ACCEPTED") {
      const myFriends = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: session.user.id, status: "ACCEPTED" },
            { receiverId: session.user.id, status: "ACCEPTED" },
          ],
        },
        select: {
          requesterId: true,
          receiverId: true,
        },
      });

      const myFriendIds = myFriends.map((f) =>
        f.requesterId === session.user.id ? f.receiverId : f.requesterId
      );

      const theirFriends = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: userId, status: "ACCEPTED" },
            { receiverId: userId, status: "ACCEPTED" },
          ],
        },
        select: {
          requesterId: true,
          receiverId: true,
        },
      });

      const theirFriendIds = theirFriends.map((f) =>
        f.requesterId === userId ? f.receiverId : f.requesterId
      );

      const mutualIds = myFriendIds.filter((id) => theirFriendIds.includes(id));

      if (mutualIds.length > 0) {
        mutualFriends = await prisma.user.findMany({
          where: { id: { in: mutualIds } },
          select: { id: true, name: true, image: true },
          take: 5,
        });
      }
    }

    return NextResponse.json({ status, mutualFriends });
  } catch (error) {
    console.error("Error checking status:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}