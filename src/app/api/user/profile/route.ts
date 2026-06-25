// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { getUserIdFromRequest } from "@/lib/auth-helper"

export async function PUT(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, bio, image, banner, password } = body

    // بناء كائن التحديث
    const updateData: Record<string, unknown> = {};
    
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (image) updateData.image = image;
    if (banner !== undefined) updateData.banner = banner;
    
    // إذا تم توفير كلمة مرور جديدة، قم بتشفيرها
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
    }
    
    // تحديث المستخدم باستخدام Prisma
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      include: {
        secondaryEmails: true
      }
    });
    
    // إزالة الحقول الحساسة
    // تم الإصلاح: إضافة secondaryEmails للإزالة من userWithoutSensitiveFields
    const { 
      password: _password, 
      verificationToken, 
      resetToken, 
      magicToken, 
      otpCode, 
      emailChangeCode,
      secondaryEmails,
      ...userWithoutSensitiveFields 
    } = updatedUser;

    // تصفية رسائل البريد الإلكتروني الثانوية لإزالة الحقول الحساسة
    const filteredSecondaryEmails = secondaryEmails.map(email => ({
      id: email.id,
      email: email.email,
      isVerified: email.isVerified,
      createdAt: email.createdAt,
    }));

    // حساب isVerified بناءً على وجود verificationToken
    const isVerified = !updatedUser.verificationToken;

    return NextResponse.json({
      message: "Profile updated successfully",
      user: {
        ...userWithoutSensitiveFields,
        isVerified,
        secondaryEmails: filteredSecondaryEmails,
      }
    });
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const userId = await getUserIdFromRequest(request)
    
    if (!userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // جلب بيانات المستخدم باستخدام Prisma
    const user = await prisma.user.findUnique({
      where: { id: userId },
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
    // تم الإصلاح: إضافة secondaryEmails للإزالة من userWithoutSensitiveFields
    const { 
      password, 
      verificationToken, 
      resetToken, 
      magicToken, 
      otpCode, 
      emailChangeCode,
      secondaryEmails,
      ...userWithoutSensitiveFields 
    } = user;

    // تصفية رسائل البريد الإلكتروني الثانوية لإزالة الحقول الحساسة
    const filteredSecondaryEmails = secondaryEmails.map(email => ({
      id: email.id,
      email: email.email,
      isVerified: email.isVerified,
      createdAt: email.createdAt,
    }));

    // حساب isVerified بناءً على وجود verificationToken
    const isVerified = !user.verificationToken;

    return NextResponse.json({
      ...userWithoutSensitiveFields,
      isVerified,
      secondaryEmails: filteredSecondaryEmails,
    })
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}