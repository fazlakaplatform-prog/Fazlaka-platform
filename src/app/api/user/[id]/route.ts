import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import clientPromise from "@/lib/mongodb"
import { ObjectId } from "mongodb"

// تعريف واجهة لبيانات المستخدم
interface UserData {
  _id: ObjectId;
  email: string;
  name?: string;
  image?: string;
  bio?: string;
  banner?: string;
  location?: string;
  website?: string;
  password?: string;
  verificationToken?: string;
  resetToken?: string;
  magicToken?: string;
  otpCode?: string;
  emailChangeCode?: string;
  updatedAt?: Date;
  role?: string;
  banned?: boolean;
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
    
    // التأكد من أن id هو ObjectId صالح
    if (!ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      )
    }
    
    const client = await clientPromise;
    const db = client.db();
    
    // البحث عن المستخدم باستخدام ObjectId
    let user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    
    // إذا لم يتم العثور على المستخدم، حاول البحث باستخدام حقول أخرى
    if (!user) {
      // محاولة البحث باستخدام googleId
      user = await db.collection('users').findOne({ googleId: id });
    }
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // إنشاء نسخة من المستخدم لإزالة الحقول الحساسة
    const userWithoutSensitiveFields = { ...user } as UserData;
    
    // إزالة الحقول الحساسة باستخدام delete
    delete userWithoutSensitiveFields.password;
    delete userWithoutSensitiveFields.verificationToken;
    delete userWithoutSensitiveFields.resetToken;
    delete userWithoutSensitiveFields.magicToken;
    delete userWithoutSensitiveFields.otpCode;
    delete userWithoutSensitiveFields.emailChangeCode;

    return NextResponse.json(userWithoutSensitiveFields)
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

    const client = await clientPromise;
    const db = client.db();
    
    // استبدال أي بيانات محددة
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
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
    
    const updatedUser = await db.collection('users').findOne({ _id: new ObjectId(id) }) as UserData;
    
    // إنشاء نسخة من المستخدم لإزالة الحقول الحساسة
    const userWithoutSensitiveFields = { ...updatedUser };
    
    // إزالة الحقول الحساسة باستخدام delete
    delete userWithoutSensitiveFields.password;
    delete userWithoutSensitiveFields.verificationToken;
    delete userWithoutSensitiveFields.resetToken;
    delete userWithoutSensitiveFields.magicToken;
    delete userWithoutSensitiveFields.otpCode;
    delete userWithoutSensitiveFields.emailChangeCode;

    return NextResponse.json(userWithoutSensitiveFields)
  } catch (error) {
    console.error("Error updating user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}