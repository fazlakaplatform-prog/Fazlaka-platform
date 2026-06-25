// File: src/app/api/auth/send-magic-link/route.ts
import { NextRequest, NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"

export async function POST(request: NextRequest) {
  try {
    const { email, name, purpose = "login" } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      )
    }

    // التحقق من تنسيق البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "تنسيق البريد الإلكتروني غير صالح" },
        { status: 400 }
      )
    }

    console.log("معالجة طلب الرابط السحري لـ:", email, "الغرض:", purpose)

    // التحقق مما إذا كان البريد الإلكتروني موجوداً كبريد أساسي أو ثانوي باستخدام Prisma
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { 
            secondaryEmails: {
              some: { email: email } // ابحث عن مستخدم لديه بريد إلكتروني ثانوي مطابق
            }
          }
        ]
      }
    });
    
    if (existingUser && purpose === "register") {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل بالفعل كبريد أساسي أو ثانوي" },
        { status: 400 }
      )
    }

    // إذا كان الغرض هو تسجيل الدخول، تحقق من وجود المستخدم
    if (purpose === "login" && !existingUser) {
      return NextResponse.json(
        { error: "لا يوجد حساب مرتبط بهذا البريد الإلكتروني" },
        { status: 404 }
      )
    }

    // إنشاء توكن سحري
    const magicToken = uuidv4()
    const magicTokenExpiry = new Date(Date.now() + 900000) // 15 دقيقة

    console.log("تم إنشاء توكن سحري للغرض:", purpose, "التوكن:", magicToken.substring(0, 10) + "...")

    // تخزين التوكن بناءً على الغرض
    if (purpose === "register") {
      // حذف أي رابط سحري موجود لهذا البريد
      await prisma.magicLink.deleteMany({ where: { email } });
      
      // إنشاء سجل رابط سحري جديد في جدول MagicLink
      await prisma.magicLink.create({
        data: {
          email,
          name,
          magicToken,
          magicTokenExpiry,
          purpose
        }
      });
    } else { // purpose === "login"
      if (existingUser) {
        // للمستخدمين الحاليين، تحديث سجلهم مباشرة
        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            magicToken,
            magicTokenExpiry,
          },
        });
      }
    }

    // إعداد الناقل البريدي
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
      // إضافة إعدادات الأمان
      tls: {
        rejectUnauthorized: true
      }
    })

    // إنشاء رابط سحري
    const magicUrl = `${process.env.NEXTAUTH_URL}/verify-magic-link?token=${magicToken}&purpose=${purpose}`

    // تحديد محتوى البريد بناءً على الغرض
    const emailSubject = purpose === "register" ? "إنشاء حساب - فذلكه" : "تسجيل الدخول - فذلكه"
    const emailAction = purpose === "register" ? "إنشاء حساب" : "تسجيل الدخول"
    const emailMessage = purpose === "register" 
      ? "لإكمال عملية إنشاء حسابك، يرجى النقر على الزر أدناه:"
      : "تلقينا طلباً لتسجيل الدخول إلى حسابك. إذا لم تكن أنت من قام بهذا الطلب، فيرجى تجاهل هذا البريد الإلكتروني."

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
              مرحباً ${name || ""}،
            </p>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              ${emailMessage}
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${magicUrl}" 
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
                <li>هذا الرابط صالح لمدة 15 دقيقة فقط</li>
                <li>لا تشارك هذا الرابط مع أي شخص</li>
                <li>إذا لم تطلب هذا الرابط، يرجى تجاهل هذه الرسالة</li>
                ${purpose === "register" ? "<li>بعد النقر على الرابط، سيتم توجيهك لإكمال بيانات التسجيل</li>" : ""}
              </ul>
            </div>
            
            <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
              إذا لم يعمل الزر أعلاه، يمكنك نسخ ولصق الرابط التالي في متصفحك:
            </p>
            
            <p style="background: #f5f5f5; padding: 10px; border-radius: 5px; word-break: break-all; font-size: 12px; color: #666;">
              ${magicUrl}
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

    // إرسال بريد الرابط السحري
    await transporter.sendMail(mailOptions)
    console.log("تم إرسال بريد الرابط السحري إلى:", email, "للغرض:", purpose)

    return NextResponse.json(
      { 
        message: "تم إرسال الرابط السحري بنجاح",
        purpose: purpose,
        // إرجاع التوكن في وضع التطوير
        ...(process.env.NODE_ENV === 'development' && { magicToken })
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("خطأ في الرابط السحري:", error)
    return NextResponse.json(
      { error: "خطأ في الخادم الداخلي" },
      { status: 500 }
    )
  }
}