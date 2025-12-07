// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import bcrypt from 'bcryptjs'

// تعريف واجهة للمستخدم
interface User {
  _id: ObjectId;
  name: string;
  email: string;
  password?: string;
  role: string;
  bio?: string;
  image?: string;
  banner?: string;
  isActive: boolean;
  banned: boolean;
  emailVerified: boolean;
  secondaryEmails?: Array<{
    _id: string;
    email: string;
    isVerified: boolean;
  }>;
  verificationToken?: string;
  resetToken?: string;
  magicToken?: string;
  otpCode?: string;
  emailChangeCode?: string;
  createdAt: Date;
  updatedAt?: Date;
}

// GET - لجلب تفاصيل مستخدم معين
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const client = await clientPromise;
    const db = client.db();
    
    // البحث عن المستخدم
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) }) as User | null;
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // إزالة الحقول الحساسة
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password, verificationToken, resetToken, magicToken, otpCode, emailChangeCode, ...userWithoutSensitiveFields } = user;
    
    return NextResponse.json(userWithoutSensitiveFields);
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// PUT - لتحديث بيانات مستخدم معين
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request.json()
    const { name, email, role, bio, image, banner, banned, isActive, emailVerified, secondaryEmails, password } = body

    const client = await clientPromise;
    const db = client.db();
    
    // بناء كائن التحديث
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role;
    if (bio !== undefined) updateData.bio = bio;
    if (image !== undefined) updateData.image = image;
    if (banner !== undefined) updateData.banner = banner;
    if (banned !== undefined) updateData.banned = banned;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified;
    if (secondaryEmails !== undefined) updateData.secondaryEmails = secondaryEmails;
    
    // إذا تم توفير كلمة مرور جديدة، قم بتشفيرها
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
    }
    
    // تحديث المستخدم
    const result = await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // جلب المستخدم المحدث
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(id) }) as User | null;
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found after update" },
        { status: 404 }
      )
    }
    
    // إزالة الحقول الحساسة
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: removedPassword, verificationToken, resetToken, magicToken, otpCode, emailChangeCode, ...userWithoutSensitiveFields } = updatedUser;
    
    return NextResponse.json({
      message: "User updated successfully",
      user: userWithoutSensitiveFields
    });
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// DELETE - لحذف مستخدم معين
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const client = await clientPromise;
    const db = client.db();
    
    // حذف المستخدم
    const result = await db.collection('users').deleteOne({ _id: new ObjectId(id) });
    
    if (result.deletedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    return NextResponse.json({
      message: "User deleted successfully"
    });
  } catch (error) {
    console.error("Error deleting user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}