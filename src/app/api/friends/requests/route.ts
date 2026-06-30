import { NextRequest, NextResponse } from "next/server";
import { getUserIdFromRequest } from "@/lib/auth-helper";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const requests = await prisma.friendship.findMany({
      where: {
        receiverId: userId,
        status: "PENDING",
      },
      include: {
        requester: { select: { id: true, name: true, image: true, bio: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    const mapped = requests.map((r) => ({
      id: r.id,
      user: {
        id: r.requester.id,
        name: r.requester.name,
        image: r.requester.image,
        bio: r.requester.bio,
      },
      status: r.status,
      createdAt: r.createdAt.toISOString(),
    }));

    return NextResponse.json({ requests: mapped });
  } catch (error) {
    console.error("Error fetching requests:", error);
    return NextResponse.json({ error: "Internal Error" }, { status: 500 });
  }
}
