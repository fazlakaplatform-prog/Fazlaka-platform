// src/app/api/admin/users/stats/route.ts
import { NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

// تعريف واجهة لنتائج استعلام التسجيلات الشهرية
interface MonthlyRegistrationItem {
  year: number;
  month: number;
  count: bigint;
}

export async function GET() {
  try {
    // إحصائيات المستخدمين
    const totalUsers = await prisma.user.count();
    const activeUsers = await prisma.user.count({ where: { isActive: true, banned: false } });
    const bannedUsers = await prisma.user.count({ where: { banned: true } });
    const inactiveUsers = await prisma.user.count({ where: { isActive: false } });
    
    // إحصائيات الأدوار
    const usersByRole = await prisma.user.groupBy({
      by: ['role'],
      _count: {
        role: true
      }
    });
    
    // إحصائيات التسجيلات الشهرية
    const monthlyRegistrations = await prisma.$queryRaw<MonthlyRegistrationItem[]>`
      SELECT 
        EXTRACT(YEAR FROM "createdAt") as year,
        EXTRACT(MONTH FROM "createdAt") as month,
        COUNT(*) as count
      FROM "users"
      WHERE "createdAt" IS NOT NULL
      GROUP BY EXTRACT(YEAR FROM "createdAt"), EXTRACT(MONTH FROM "createdAt")
      ORDER BY year DESC, month DESC
      LIMIT 12
    `;
    
    // المستخدمون الجدد في آخر 30 يومًا
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await prisma.user.count({
      where: {
        createdAt: {
          gte: thirtyDaysAgo
        }
      }
    });
    
    // تحويل بيانات الأدوار لتكون بنفس التنسيق
    const formattedUsersByRole = usersByRole.map(item => ({
      _id: item.role,
      count: item._count.role
    }));
    
    // تحويل بيانات التسجيلات الشهرية لتكون بنفس التنسيق
    // تم إصلاح الخطأ هنا: استخدام النوع المحدد بدلاً من any
    const formattedMonthlyRegistrations = monthlyRegistrations.map(item => ({
      _id: {
        year: item.year,
        month: item.month
      },
      count: Number(item.count) // استخدام Number لتحويل BigInt إلى Number
    }));
    
    return NextResponse.json({
      totalUsers,
      activeUsers,
      bannedUsers,
      inactiveUsers,
      newUsers,
      usersByRole: formattedUsersByRole,
      monthlyRegistrations: formattedMonthlyRegistrations
    });
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}