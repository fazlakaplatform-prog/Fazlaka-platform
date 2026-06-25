// src/app/api/admin/users/[id]/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient, Role } from "@prisma/client"
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

// تعريف واجهة للمستخدم
interface User {
  id: string;
  name: string | null;
  email: string;
  password?: string | null;
  role: Role;
  bio?: string | null;
  image?: string | null;
  banner?: string | null;
  isActive: boolean;
  banned: boolean;
  emailVerified: Date | null;
  secondaryEmails?: Array<{
    id: string;
    email: string;
    isVerified: boolean;
  }>;
  verificationToken?: string | null;
  resetToken?: string | null;
  magicToken?: string | null;
  otpCode?: string | null;
  emailChangeCode?: string | null;
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
    
    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        secondaryEmails: true
      }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // إزالة الحقول الحساسة
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

    // بناء كائن التحديث
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (name !== undefined) updateData.name = name;
    if (email !== undefined) updateData.email = email;
    if (role !== undefined) updateData.role = role as Role;
    if (bio !== undefined) updateData.bio = bio;
    if (image !== undefined) updateData.image = image;
    if (banner !== undefined) updateData.banner = banner;
    if (banned !== undefined) updateData.banned = banned;
    if (isActive !== undefined) updateData.isActive = isActive;
    if (emailVerified !== undefined) updateData.emailVerified = emailVerified ? new Date() : null;
    
    // إذا تم توفير كلمة مرور جديدة، قم بتشفيرها
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
    }
    
    // تحديث المستخدم
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        secondaryEmails: true
      }
    });
    
    // إزالة الحقول الحساسة
    const { password: removedPassword, verificationToken, resetToken, magicToken, otpCode, emailChangeCode, ...userWithoutSensitiveFields } = updatedUser;
    
    // تحديث البريد الإلكتروني الثانوي إذا تم توفيره
    if (secondaryEmails !== undefined) {
      // حذف جميع البريد الإلكتروني الثانوي الحالي
      await prisma.secondaryEmail.deleteMany({
        where: { userId: id }
      });
      
      // إضافة البريد الإلكتروني الثانوي الجديد
      for (const secEmail of secondaryEmails) {
        await prisma.secondaryEmail.create({
          data: {
            userId: id,
            email: secEmail.email,
            isVerified: secEmail.isVerified
          }
        });
      }
      
      // جلب المستخدم المحدث مع البريد الإلكتروني الثانوي
      const finalUser = await prisma.user.findUnique({
        where: { id },
        include: {
          secondaryEmails: true
        }
      });
      
      if (finalUser) {
        const { password: _, ...finalUserWithoutPassword } = finalUser;
        return NextResponse.json({
          message: "User updated successfully",
          user: finalUserWithoutPassword
        });
      }
    }
    
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
    
    // التحقق من وجود المستخدم
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // حذف المستخدم (سيتم حذف البريد الإلكتروني الثانوي تلقائيًا بسبب onDelete: Cascade)
    await prisma.user.delete({
      where: { id }
    });
    
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