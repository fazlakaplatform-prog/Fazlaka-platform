// src/app/api/admin/users/[id]/change-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import bcrypt from 'bcryptjs'

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json()
    const { newPassword } = body

    if (!newPassword) {
      return NextResponse.json(
        { error: "New password is required" },
        { status: 400 }
      )
    }

    if (newPassword.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters long" },
        { status: 400 }
      )
    }

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
    
    // تشفير كلمة المرور الجديدة
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);
    
    // تحديث كلمة المرور
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          password: hashedNewPassword,
          updatedAt: new Date()
        }
      }
    );
    
    return NextResponse.json({
      message: "Password changed successfully"
    });
  } catch (error) {
    console.error("Error changing password:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}