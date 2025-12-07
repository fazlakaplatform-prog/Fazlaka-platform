import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "@/models/User";

// تعريف واجهة للبريد الإلكتروني الثانوي
interface SecondaryEmail {
  email: string;
  isVerified: boolean;
  verificationToken?: string;
  addedAt?: Date;
}

// تعريف واجهة لبيانات الطلب
interface ChangePasswordRequest {
  newPassword: string;
  currentPassword?: string;
  email?: string;
  otpCode?: string;
}

/**
 * التحقق من كلمة المرور الحالية
 */
async function verifyCurrentPassword(userId: string, currentPassword: string): Promise<boolean> {
  try {
    const user = await User.findById(userId).select("+password");
    if (!user || !user.password) return false;
    return await bcrypt.compare(currentPassword, user.password);
  } catch (error) {
    console.error("Error verifying current password:", error);
    return false;
  }
}

/**
 * التحقق من كود OTP
 */
async function verifyOtpCode(userId: string, otpCode: string): Promise<boolean> {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    
    if (!user.otpCode || user.otpCode !== otpCode) {
      return false;
    }

    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return false;
    }

    return user.otpPurpose === "change-password";
  } catch (error) {
    console.error("Error verifying OTP code:", error);
    return false;
  }
}

/**
 * التحقق من البريد الإلكتروني
 */
async function verifyEmail(userId: string, email: string): Promise<boolean> {
  try {
    const user = await User.findById(userId);
    if (!user) return false;
    
    if (user.email === email) {
      return true;
    }
    
    // التحقق من البريد الإلكتروني الثانوي
    const isSecondaryEmail = user.secondaryEmails?.some((secEmail: SecondaryEmail) => 
      secEmail.email === email && secEmail.isVerified
    );
    
    return isSecondaryEmail || false;
  } catch (error) {
    console.error("Error verifying email:", error);
    return false;
  }
}

/**
 * تحديث كلمة المرور
 */
async function updatePassword(userId: string, newPassword: string): Promise<void> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 12);
    
    await User.findByIdAndUpdate(userId, {
      password: hashedPassword,
      otpCode: null,
      otpExpiry: null,
      otpPurpose: null,
      otpVerified: false,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error updating password:", error);
    throw new Error("Failed to update password");
  }
}

/**
 * التحقق من قوة كلمة المرور
 */
function validatePasswordStrength(password: string): { isValid: boolean; message?: string } {
  if (password.length < 8) {
    return { isValid: false, message: "Password must be at least 8 characters" };
  }
  
  // يمكن إضافة المزيد من الشروط هنا مثل التحقق من وجود أحرف كبيرة، صغيرة، أرقام، رموز
  if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
    return { 
      isValid: false, 
      message: "Password must contain at least one uppercase letter, one lowercase letter, and one number" 
    };
  }
  
  return { isValid: true };
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // 1. التحقق من جلسة المستخدم
    // تم إنشاء كائن جديد يحتوي فقط على الخصائص المطلوبة لـ getServerSession
    const getServerSessionOptions = {
      secret: authOptions.secret,
      providers: authOptions.providers,
    };
    
    const session = await getServerSession(getServerSessionOptions);
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. قراءة البيانات من الطلب
    const body = await request.json() as ChangePasswordRequest;
    const { newPassword, currentPassword, email, otpCode } = body;

    if (!newPassword) {
      return NextResponse.json({ error: "New password is required" }, { status: 400 });
    }

    // التحقق من قوة كلمة المرور
    const passwordValidation = validatePasswordStrength(newPassword);
    if (!passwordValidation.isValid) {
      return NextResponse.json({ error: passwordValidation.message }, { status: 400 });
    }

    // التأكد من اتصال mongoose
    if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(process.env.MONGODB_URI as string);
    }

    // 3. التحقق من وجود المستخدم
    const user = await User.findById(session.user.id);
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // 4. التحقق من هوية المستخدم
    let isVerified = false;
    
    if (currentPassword) {
      // التحقق باستخدام كلمة المرور الحالية
      isVerified = await verifyCurrentPassword(session.user.id, currentPassword);
      if (!isVerified) {
        return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });
      }
    } else if (otpCode) {
      // التحقق باستخدام كود OTP
      isVerified = await verifyOtpCode(session.user.id, otpCode);
      if (!isVerified) {
        return NextResponse.json({ error: "Invalid verification code" }, { status: 400 });
      }
    } else if (email) {
      // التحقق باستخدام البريد الإلكتروني (للمستخدمين الذين سجلوا بواسطة Google)
      isVerified = await verifyEmail(session.user.id, email);
      if (!isVerified) {
        return NextResponse.json({ error: "Email mismatch" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Verification method required" }, { status: 400 });
    }

    // 5. تحديث كلمة المرور
    await updatePassword(session.user.id, newPassword);

    // 6. إرسال رسالة نجاح
    return NextResponse.json({ message: "Password changed successfully" }, { status: 200 });

  } catch (error: unknown) {
    console.error("Error changing password:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// دالة للتعامل مع طلبات OPTIONS (مهمة لحل مشكلة CORS و 405)
export async function OPTIONS(): Promise<NextResponse> {
  return new NextResponse(null, { 
    status: 200,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    }
  });
}