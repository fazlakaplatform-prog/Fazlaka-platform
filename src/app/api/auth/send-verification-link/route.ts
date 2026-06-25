// File: src/app/api/auth/send-verification-link/route.ts
import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, type = "primary" } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    // التحقق من تنسيق البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email format" },
        { status: 400 }
      )
    }

    console.log(`Processing verification link request for ${type} email:`, email)

    let user = null;
    
    if (type === "primary") {
      // البحث عن المستخدم باستخدام البريد الأساسي
      user = await prisma.user.findUnique({ 
        where: { email },
        include: { secondaryEmails: true } // تضمين البريد الإلكتروني الثانوي للحصول على سياق إذا لزم الأمر
      });
    } else if (type === "secondary") {
      // البحث عن المستخدم الذي يمتلك هذا البريد الإلكتروني الثانوي
      user = await prisma.user.findFirst({ 
        where: { 
          secondaryEmails: {
            some: { email: email }
          }
        }
      });
    }
    
    if (!user) {
      console.log(`User not found for ${type} email:`, email)
      // لا نكشف أن المستخدم غير موجود لأسباب أمنية
      return NextResponse.json(
        { message: "If an account exists with this email, a verification link has been sent." },
        { status: 200 }
      )
    }

    // إنشاء توكن تحقق جديد
    const verificationToken = uuidv4()
    const verificationTokenExpiry = new Date(Date.now() + 24 * 3600000) // 24 ساعة

    console.log(`Generated verification token for ${type} email:`, verificationToken.substring(0, 10) + "...")

    // تحديث المستخدم أو البريد الثانوي بالتوكن
    if (type === "primary") {
      // تحديث سجل المستخدم مباشرة
      await prisma.user.update({
        where: { id: user.id },
        data: {
          verificationToken,
          verificationTokenExpiry,
        },
      });
    } else if (type === "secondary") {
      // ابحث عن سجل البريد الإلكتروني الثانوي المحدد وقم بتحديثه مباشرة
      const secondaryEmail = await prisma.secondaryEmail.findFirst({
        where: { email: email }
      });

      if (secondaryEmail) {
        await prisma.secondaryEmail.update({
          where: { id: secondaryEmail.id },
          data: {
            verificationToken,
            verificationTokenExpiry,
          },
        });
      } else {
        // هذا النادر، لكنه من الجيد التعامل معه
        return NextResponse.json(
          { error: "Secondary email record not found." },
          { status: 404 }
        )
      }
    }

    // إعداد الناقل البريدي
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
      tls: {
        rejectUnauthorized: true
      }
    })

    // إنشاء رابط التحقق
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email-link?token=${verificationToken}&type=${type}&email=${encodeURIComponent(email)}`

    // تحديد محتوى البريد بناءً على النوع
    const emailSubject = type === "primary" 
      ? "تأكيد البريد الإلكتروني الأساسي - فذلكه" 
      : "تأكيد البريد الإلكتروني الثانوي - فذلكه"
    const emailAction = type === "primary" 
      ? "تأكيد البريد الإلكتروني الأساسي" 
      : "تأكيد البريد الإلكتروني الثانوي"

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: emailSubject,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">
              ${emailAction}
            </h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              مرحباً ${user.name}،
            </p>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              يرجى النقر على الزر أدناه لتأكيد ${type === "primary" ? "البريد الإلكتروني الأساسي" : "البريد الإلكتروني الثانوي"} الخاص بك:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%;); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                ${emailAction}
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>ملاحظات هامة:</strong>
              </p>
              <ul style="color: #856404; margin: 10px 0 0 20px; font-size: 14px; padding-right: 20px;">
                <li>هذا الرابط صالح لمدة 24 ساعة فقط</li>
                <li>لا تشارك هذا الرابط مع أي شخص</li>
                <li>إذا لم تطلب هذا الرابط، يرجى تجاهل هذه الرسالة</li>
              </ul>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
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

    // إرسال بريد التحقق
    await transporter.sendMail(mailOptions)
    console.log(`Verification link email sent to ${type} email:`, email)

    return NextResponse.json(
      { 
        message: "Verification link sent successfully",
        // إرجاع التوكن في وضع التطوير
        ...(process.env.NODE_ENV === 'development' && { verificationToken })
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Error sending verification link:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}