// src/app/api/admin/users/[id]/stats/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const client = await clientPromise;
    const db = client.db();
    
    // البحث عن المستخدم
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // الحصول على إحصائيات تسجيل الدخول
    const loginHistory = await db.collection('loginHistory')
      .find({ userId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .limit(10)
      .toArray();

    const totalLogins = await db.collection('loginHistory')
      .countDocuments({ userId: new ObjectId(id) });

    const lastLogin = loginHistory[0]?.createdAt;

    // الحصول على إحصائيات التحقق
    const verificationAttempts = await db.collection('verificationAttempts')
      .countDocuments({ userId: new ObjectId(id) });

    // الحصول على إحصائيات إعادة تعيين كلمة المرور
    const passwordResets = await db.collection('passwordResetAttempts')
      .countDocuments({ userId: new ObjectId(id) });

    // الحصول على إحصائيات تغيير البريد الإلكتروني
    const emailChanges = await db.collection('emailChangeHistory')
      .countDocuments({ userId: new ObjectId(id) });

    // الحصول على آخر نشاط
    const lastActivity = await db.collection('userActivities')
      .findOne({ userId: new ObjectId(id) }, { sort: { createdAt: -1 } });

    return NextResponse.json({
      totalLogins,
      lastLoginDate: lastLogin,
      loginHistory: loginHistory.map(login => ({
        date: login.createdAt,
        ip: login.ip,
        device: login.userAgent
      })),
      verificationAttempts,
      passwordResets,
      emailChanges,
      lastActivity: lastActivity?.createdAt
    });
  } catch (error) {
    console.error("Error fetching user stats:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}