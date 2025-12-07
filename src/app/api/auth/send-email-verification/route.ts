import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import clientPromise from "@/lib/mongodb"
import User from "@/models/User"

export async function POST(request: NextRequest) {
  try {
    const { currentEmail, newEmail } = await request.json()

    if (!currentEmail || !newEmail) {
      return NextResponse.json(
        { error: "Current email and new email are required" },
        { status: 400 }
      )
    }

    // التحقق من أن الإيميل الجديد مختلف عن الإيميل الحالي
    if (currentEmail === newEmail) {
      return NextResponse.json(
        { error: "New email must be different from current email" },
        { status: 400 }
      )
    }

    console.log("Processing email change request from:", currentEmail, "to:", newEmail)

    await clientPromise;
    const user = await User.findOne({ email: currentEmail });

    if (!user) {
      console.log("User not found:", currentEmail)
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // التحقق من أن الإيميل الجديد غير مستخدم بالفعل
    const existingUser = await User.findOne({ email: newEmail });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email is already in use" },
        { status: 400 }
      )
    }

    // إنشاء كود OTP مكون من 6 أرقام
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 600000) // 10 دقائق

    console.log("Generated OTP for email change:", otpCode.substring(0, 3) + "***")

    // تحديث المستخدم بكود OTP
    await User.findByIdAndUpdate(user._id, {
      emailChangeCode: otpCode,
      emailChangeCodeExpiry: otpExpiry,
      newEmail: newEmail,
      updatedAt: new Date(),
    });

    // إعداد الناقل البريد الإلكتروني
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    })

    // إعداد محتوى البريد الإلكتروني
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: newEmail,
      subject: "تغيير البريد الإلكتروني - فذلكه",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">تغيير البريد الإلكتروني</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              مرحباً ${user.name}،
            </p>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              تلقينا طلباً لتغيير بريدك الإلكتروني من ${currentEmail} إلى ${newEmail}. إذا لم تكن أنت من قام بهذا الطلب، فيرجى تجاهل هذا البريد الإلكتروني.
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <div style="display: inline-block; background: #f8f9fa; padding: 20px 40px; border-radius: 10px; border: 2px dashed #667eea;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">
                  ${otpCode}
                </span>
              </div>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>ملاحظات:</strong>
              </p>
              <ul style="color: #856404; margin: 10px 0 0 20px; font-size: 14px; padding-right: 20px;">
                <li>هذا الكود صالح لمدة 10 دقائق فقط</li>
                <li>لا تشارك هذا الكود مع أي شخص</li>
                <li>إذا لم تطلب تغيير البريد الإلكتروني، يرجى تجاهل هذه الرسالة</li>
              </ul>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              إذا واجهت أي مشكلة، يرجى التواصل مع فريق الدعم.
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
    console.log("Email change verification code sent to:", newEmail)

    return NextResponse.json(
      { message: "Verification code sent successfully" },
      { status: 200 }
    )
  } catch (error) {
    console.error("Email change verification error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}