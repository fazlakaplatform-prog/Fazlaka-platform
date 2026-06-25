// File: src/app/api/user/by-email/route.ts

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email')
    
    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    // تعريف كائن التحديد المشترك لإعادة استخدامه
    const userSelect = {
      id: true,
      name: true,
      email: true,
      image: true,
      bio: true,
      banner: true,
      location: true,
      website: true,
      isActive: true,
      role: true,
      banned: true,
      createdAt: true,
      updatedAt: true,
      verificationToken: true, // تمت الإضافة: مطلوب لحساب isVerified
      secondaryEmails: {
        select: {
          id: true,
          email: true,
          isVerified: true,
          createdAt: true
        }
      }
    };

    // البحث عن المستخدم باستخدام البريد الأساسي
    let user = await prisma.user.findUnique({
      where: { email },
      select: userSelect
    });
    
    // إذا لم يتم العثور على المستخدم بالبريد الأساسي، ابحث في البريد الثانوي
    if (!user) {
      const secondaryEmailUser = await prisma.user.findFirst({
        where: {
          secondaryEmails: {
            some: {
              email: email,
              isVerified: true
            }
          }
        },
        select: userSelect
      });
      
      user = secondaryEmailUser;
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // حساب isVerified بناءً على وجود verificationToken
    const userWithVerificationStatus = {
      ...user,
      isVerified: !user.verificationToken
    };

    return NextResponse.json(userWithVerificationStatus)
  } catch (error) {
    console.error("Error fetching user by email:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}