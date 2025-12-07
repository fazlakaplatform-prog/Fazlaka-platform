// src/app/api/auth/ensure-user-fields/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const client = await clientPromise;
    const db = client.db();
    
    // البحث عن المستخدم
    const user = await db.collection('users').findOne({ 
      _id: new ObjectId(session.user.id) 
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // التحقق من وجود الحقول وتحديثها إذا لزم الأمر
    const updateData: Record<string, unknown> = {};
    let needsUpdate = false;
    
    if (!user.role) {
      updateData.role = "user";
      needsUpdate = true;
    }
    
    if (user.banned === undefined) {
      updateData.banned = false;
      needsUpdate = true;
    }
    
    if (needsUpdate) {
      updateData.updatedAt = new Date();
      
      await db.collection('users').updateOne(
        { _id: new ObjectId(session.user.id) },
        { $set: updateData }
      );
      
      // جلب المستخدم المحدث
      const updatedUser = await db.collection('users').findOne({ 
        _id: new ObjectId(session.user.id) 
      });
      
      return NextResponse.json({
        message: "User fields updated successfully",
        updated: true,
        user: {
          id: updatedUser?._id,
          email: updatedUser?.email,
          name: updatedUser?.name,
          role: updatedUser?.role,
          banned: updatedUser?.banned
        }
      });
    }
    
    return NextResponse.json({
      message: "User fields already exist",
      updated: false,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        role: user.role,
        banned: user.banned
      }
    });
  } catch (error) {
    console.error("Error ensuring user fields:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}