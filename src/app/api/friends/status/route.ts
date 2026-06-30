import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

interface MutualFriend {
  id: string;
  name: string | null;
  image: string | null;
}

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const targetUserId = searchParams.get("userId");

    if (!targetUserId) {
      return NextResponse.json({ error: "UserId is required" }, { status: 400 });
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: userId, receiverId: targetUserId },
          { requesterId: targetUserId, receiverId: userId },
        ],
      },
    });

    let status = "NONE";
    if (friendship) {
      status = friendship.status;
      if (status === "PENDING") {
        if (friendship.requesterId === userId) {
          status = "PENDING_SENT";
        } else {
          status = "PENDING_RECEIVED";
        }
      } else if (status === "ACCEPTED") {
        status = "ACCEPTED";
      }
    }

    let mutualFriends: MutualFriend[] = [];

    if (status !== "ACCEPTED") {
      const myFriends = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: userId, status: "ACCEPTED" },
            { receiverId: userId, status: "ACCEPTED" },
          ],
        },
        select: { requesterId: true, receiverId: true },
      });

      const myFriendIds = myFriends.map((f) =>
        f.requesterId === userId ? f.receiverId : f.requesterId
      );

      const theirFriends = await prisma.friendship.findMany({
        where: {
          OR: [
            { requesterId: targetUserId, status: "ACCEPTED" },
            { receiverId: targetUserId, status: "ACCEPTED" },
          ],
        },
        select: { requesterId: true, receiverId: true },
      });

      const theirFriendIds = theirFriends.map((f) =>
        f.requesterId === targetUserId ? f.receiverId : f.requesterId
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
