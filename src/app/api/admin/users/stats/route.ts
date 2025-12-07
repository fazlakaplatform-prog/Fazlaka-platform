// src/app/api/admin/users/stats/route.ts
import { NextResponse } from "next/server"
import clientPromise from "@/lib/mongodb"

export async function GET() {
  try {
    const client = await clientPromise;
    const db = client.db();
    
    // إحصائيات المستخدمين
    const totalUsers = await db.collection('users').countDocuments();
    const activeUsers = await db.collection('users').countDocuments({ isActive: true, banned: false });
    const bannedUsers = await db.collection('users').countDocuments({ banned: true });
    const inactiveUsers = await db.collection('users').countDocuments({ isActive: false });
    
    // إحصائيات الأدوار
    const usersByRole = await db.collection('users').aggregate([
      { $group: { _id: "$role", count: { $sum: 1 } } }
    ]).toArray();
    
    // إحصائيات التسجيلات الشهرية
    const monthlyRegistrations = await db.collection('users').aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]).toArray();
    
    // المستخدمون الجدد في آخر 30 يومًا
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await db.collection('users').countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    
    return NextResponse.json({
      totalUsers,
      activeUsers,
      bannedUsers,
      inactiveUsers,
      newUsers,
      usersByRole,
      monthlyRegistrations
    });
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}