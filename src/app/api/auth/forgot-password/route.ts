// File: src/app/api/auth/forgot-password.ts

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

    console.log("Processing password reset request for:", email)

    await clientPromise;
    
    // البحث عن المستخدم باستخدام البريد الأساسي
    let user = await User.findOne({ email });
    
    // إذا لم يتم العثور على المستخدم بالبريد الأساسي، ابحث في البريد الثانوي
    if (!user) {
      user = await User.findOne({ 
        "secondaryEmails.email": email,
        "secondaryEmails.isVerified": true 
      });
      
      if (user) {
        console.log("Found user via secondary email:", email, "Primary email:", user.email);
      }
    }

    if (!user) {
      console.log("User not found:", email)
      // لا نكشف أن المستخدم غير موجود لأسباب أمنية
      return NextResponse.json(
        { message: "If an account exists with this email, a password reset link has been sent." },
        { status: 200 }
      )
    }

    // إنشاء رمز إعادة تعيين كلمة المرور
    const resetToken = uuidv4()
    const resetTokenExpiry = new Date(Date.now() + 3600000) // ساعة واحدة

    console.log("Generated reset token for user:", user._id)

    // تحديث المستخدم برمز إعادة التعيين
    await User.findByIdAndUpdate(user._id, {
      resetToken,
      resetTokenExpiry,
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
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email, // إرسال إلى الإيميل الذي تم الطلب به (سواء كان أساسيًا أو ثانويًا)
      subject: "إعادة تعيين كلمة المرور - فذلكه",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">إعادة تعيين كلمة المرور</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              مرحباً ${user.name}،
            </p>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              تلقينا طلباً لإعادة تعيين كلمة المرور لحسابك. إذا لم تكن أنت من قام بهذا الطلب، فيرجى تجاهل هذا البريد الإلكتروني.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${resetUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                إعادة تعيين كلمة المرور
              </a>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              هذا الرابط سينتهي صلاحيته خلال ساعة واحدة.
            </p>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 10px 0 0 0;">
              إذا لم يعمل الزر أعلاه، يمكنك نسخ ولصق الرابط التالي في متصفحك:
            </p>
            
            <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #666;">
              ${resetUrl}
            </p>
            
            ${email !== user.email ? `
            <div style="background: #f0f8ff; border: 1px solid #d0e7ff; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #0066cc; margin: 0; font-size: 14px;">
                <strong>ملاحظة:</strong> تم إرسال هذا البريد إلى الإيميل الثانوي الخاص بك. الإيميل الأساسي لحسابك هو ${user.email}.
              </p>
            </div>
            ` : ''}
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
    console.log("Password reset email sent to:", email)

    return NextResponse.json(
      { message: "If an account exists with this email, a password reset link has been sent." },
      { status: 200 }
    )
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}