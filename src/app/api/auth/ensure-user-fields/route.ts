// src/app/api/auth/ensure-user-fields/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { Role } from "@prisma/client"; // استوردنا النوع الصحيح حسب الـ enum في schema.prisma

export async function POST(_request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        banned: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // استخدمنا نوع Role المستورد من @prisma/client
    const updateData: { role?: Role; banned?: boolean } = {};
    let needsUpdate = false;

    if (!user.role) {
      // **انتبه:** تأكد أن القيمة التالية مطابقة لقيم enum في schema.prisma
      // غالبًا تكون "user" أو "USER" حسب تعريفك. غيرها إذا لزم.
      updateData.role = "user" as Role;
      needsUpdate = true;
    }

    if (user.banned === undefined || user.banned === null) {
      updateData.banned = false;
      needsUpdate = true;
    }

    if (needsUpdate) {
      const updatedUser = await prisma.user.update({
        where: { id: session.user.id },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          banned: true,
        },
      });

      return NextResponse.json({
        message: "User fields updated successfully",
        updated: true,
        user: updatedUser,
      });
    }

    return NextResponse.json({
      message: "User fields already exist",
      updated: false,
      user,
    });
  } catch (error) {
    console.error("Error ensuring user fields:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
