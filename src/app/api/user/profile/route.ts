// src/app/api/user/profile/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import mongoose from "mongoose"
import bcrypt from "bcryptjs"

// تعريف واجهة للجلسة
interface Session {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  };
}

export async function PUT(request: NextRequest) {
  try {
    // استخدام تعليق ESLint وتحويل مزدوج لتجنب مشاكل TypeScript
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as unknown as any) as Session
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { name, bio, image, banner, password } = body

    // التأكد من اتصال mongoose
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    // استخدام المجموعة مباشرة للتحديث
    const db = mongoose.connection.db;
    
    // التأكد من أن db ليس undefined
    if (!db) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      )
    }
    
    const usersCollection = db.collection('users');
    
    // بناء كائن التحديث
    const updateData: Record<string, unknown> = {
      updatedAt: new Date(),
    };
    
    if (name) updateData.name = name;
    if (bio) updateData.bio = bio;
    if (image) updateData.image = image;
    if (banner !== undefined) updateData.banner = banner;
    
    // إذا تم توفير كلمة مرور جديدة، قم بتشفيرها
    if (password) {
      const hashedPassword = await bcrypt.hash(password, 12);
      updateData.password = hashedPassword;
    }
    
    // تحديث المستخدم
    const result = await usersCollection.updateOne(
      { _id: new mongoose.Types.ObjectId(session.user.id) },
      { $set: updateData }
    );
    
    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }
    
    // جلب المستخدم المحدث
    const updatedUser = await usersCollection.findOne({ 
      _id: new mongoose.Types.ObjectId(session.user.id) 
    });
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: "User not found after update" },
        { status: 404 }
      )
    }
    
    // إزالة الحقول الحساسة
    const userWithoutSensitiveFields = { ...updatedUser };
    delete userWithoutSensitiveFields.password;
    delete userWithoutSensitiveFields.verificationToken;
    delete userWithoutSensitiveFields.resetToken;
    delete userWithoutSensitiveFields.magicToken;
    delete userWithoutSensitiveFields.otpCode;
    delete userWithoutSensitiveFields.emailChangeCode;

    return NextResponse.json({
      message: "Profile updated successfully",
      user: userWithoutSensitiveFields
    });
  } catch (error) {
    console.error("Error updating profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    // استخدام تعليق ESLint وتحويل مزدوج لتجنب مشاكل TypeScript
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session = await getServerSession(authOptions as unknown as any) as Session
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      )
    }

    // التأكد من اتصال mongoose
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    // استخدام المجموعة مباشرة للتحديث
    const db = mongoose.connection.db;
    
    // التأكد من أن db ليس undefined
    if (!db) {
      return NextResponse.json(
        { error: "Database connection error" },
        { status: 500 }
      )
    }
    
    const usersCollection = db.collection('users');
    
    // استخدام findOne مع projection لاستبعاد الحقول الحساسة
    const user = await usersCollection.findOne(
      { _id: new mongoose.Types.ObjectId(session.user.id) },
      { 
        projection: { 
          password: 0, 
          verificationToken: 0, 
          resetToken: 0, 
          magicToken: 0, 
          otpCode: 0, 
          emailChangeCode: 0 
        }
      }
    );

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // التأكد من أن مصفوفة secondaryEmails موجودة
    if (!user.secondaryEmails) {
      user.secondaryEmails = [];
    }

    console.log("User profile:", JSON.stringify(user, null, 2));

    return NextResponse.json(user)
  } catch (error) {
    console.error("Error fetching user profile:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}