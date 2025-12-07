import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import nodemailer from "nodemailer"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    console.log("Processing resend verification request for:", email)

    await clientPromise;
    const user = await User.findOne({ email });

    if (!user) {
      console.log("User not found:", email)
      // لا نكشف أن المستخدم غير موجود لأسباب أمنية
      return NextResponse.json(
        { message: "If an account exists with this email, a verification email has been sent." },
        { status: 200 }
      )
    }

    // إذا كان الحساب مفعل بالفعل
    if (user.isActive) {
      return NextResponse.json(
        { error: "Account is already verified" },
        { status: 400 }
      )
    }

    // إنشاء رمز تحقق جديد
    const verificationToken = uuidv4()
    const verificationTokenExpiry = new Date(Date.now() + 24 * 3600000) // 24 ساعة

    console.log("Generated new verification token for user:", user._id)

    // تحديث المستخدم برمز التحقق الجديد
    await User.findByIdAndUpdate(user._id, {
      verificationToken,
      verificationTokenExpiry,
      updatedAt: new Date(),
    });

    // إعداد النقل البريدي
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    // إعداد محتوى البريد الإلكتروني
    const verificationUrl = `${process.env.NEXTAUTH_URL || process.env.VERCEL_URL}/verify-email?token=${verificationToken}`

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "تفعيل حسابك - فذلكه",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">تفعيل حسابك</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              مرحباً ${user.name}،
            </p>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              لقد طلبت إعادة إرسال بريد تفعيل حسابك. يرجى النقر على الزر أدناه لتفعيل حسابك:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                تفعيل الحساب
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              هذا الرابط سينتهي صلاحيته خلال 24 ساعة.
            </p>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
              إذا لم يعمل الزر أعلاه، يمكنك نسخ ولصق الرابط التالي في متصفحك:
            </p>
            
            <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #666;">
              ${verificationUrl}
            </p>
          </div>
          
          <div style="background: #f8f9fa; padding: 20px; text-align: center; border-radius: 10px; margin-top: 20px;">
            <p style="color: #666; margin: 0; font-size: 14px;">
              © 2024 فذلكه. جميع الحقوق محفوظة.
            </p>
          </div>
        </div>
      `,
    }

    // إرسال البريد الإلكتروني
    await transporter.sendMail(mailOptions)
    console.log("Verification email sent to:", email)

    return NextResponse.json(
      { message: "Verification email sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}