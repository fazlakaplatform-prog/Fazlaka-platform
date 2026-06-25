import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// تعريف واجهة لبيانات المستخدم
interface UserData {
  id: string;
  email: string;
  name?: string;
  image?: string;
  bio?: string;
  banner?: string;
  location?: string;
  website?: string;
  isActive: boolean;
  role: 'user' | 'owner' | 'editor';
  banned: boolean;
  createdAt: Date;
  updatedAt: Date;
  // حقول التحقق
  isVerified?: boolean;
  // حقول البريد الإلكتروني الثانوي
  secondaryEmails?: {
    id: string;
    email: string;
    isVerified: boolean;
  }[];
}

// تعريف واجهة للجلسة
interface Session {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
    role?: string;
    banned?: boolean;
  };
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        secondaryEmails: true,
      },
    });
    
    // إذا لم يتم العثور على المستخدم، حاول البحث باستخدام googleId
    if (!user) {
      // تم الإصلاح: استخدام findFirst بدلاً من findUnique لأن googleId ليس مفرداً (Unique) في المخطط
      const userByGoogleId = await prisma.user.findFirst({
        where: { googleId: id },
        include: {
          secondaryEmails: true,
        },
      });
      
      if (!userByGoogleId) {
        return NextResponse.json(
          { error: "User not found" },
          { status: 404 }
        )
      }
      
      return NextResponse.json({
        id: userByGoogleId.id,
        email: userByGoogleId.email,
        name: userByGoogleId.name,
        image: userByGoogleId.image,
        bio: userByGoogleId.bio,
        banner: userByGoogleId.banner,
        location: userByGoogleId.location,
        website: userByGoogleId.website,
        isActive: userByGoogleId.isActive,
        role: userByGoogleId.role,
        banned: userByGoogleId.banned,
        createdAt: userByGoogleId.createdAt,
        updatedAt: userByGoogleId.updatedAt,
        isVerified: userByGoogleId.verificationToken ? false : true,
        secondaryEmails: userByGoogleId.secondaryEmails.map(email => ({
          id: email.id,
          email: email.email,
          isVerified: email.isVerified,
        })),
      });
    }

    return NextResponse.json({
      id: user.id,
      email: user.email,
      name: user.name,
      image: user.image,
      bio: user.bio,
      banner: user.banner,
      location: user.location,
      website: user.website,
      isActive: user.isActive,
      role: user.role,
      banned: user.banned,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      isVerified: user.verificationToken ? false : true,
      secondaryEmails: user.secondaryEmails.map(email => ({
        id: email.id,
        email: email.email,
        isVerified: email.isVerified,
      })),
    });
  } catch (error) {
    console.error("Error fetching user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions) as Session
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await context.params;
    const body = await request.json()
    const { name, bio, image, banner, location, website, role, banned } = body

    // التحقق من أن المستخدم هو نفسه أو مسؤول
    if (session.user.id !== id && session.user.role !== "owner" && session.user.role !== "editor") {
      return NextResponse.json(
        { error: "Forbidden" },
        { status: 403 }
      )
    }

    // استبدال أي بيانات محددة
    const updateData: Record<string, unknown> = {};
    
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (image) updateData.image = image;
    if (banner !== undefined) updateData.banner = banner;
    if (location) updateData.location = location;
    if (website) updateData.website = website;
    
    // فقط المالك يمكنه تغيير الرتبة والحظر
    if (session.user.role === "owner") {
      if (role) updateData.role = role;
      if (banned !== undefined) updateData.banned = banned;
    }
    
    const updatedUser = await prisma.user.update({
      where: { id },
      data: updateData,
      include: {
        secondaryEmails: true,
      },
    });
    
    return NextResponse.json({
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      image: updatedUser.image,
      bio: updatedUser.bio,
      banner: updatedUser.banner,
      location: updatedUser.location,
      website: updatedUser.website,
      isActive: updatedUser.isActive,
      role: updatedUser.role,
      banned: updatedUser.banned,
      createdAt: updatedUser.createdAt,
      updatedAt: updatedUser.updatedAt,
      isVerified: updatedUser.verificationToken ? false : true,
      secondaryEmails: updatedUser.secondaryEmails.map(email => ({
        id: email.id,
        email: email.email,
        isVerified: email.isVerified,
      })),
    });
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}