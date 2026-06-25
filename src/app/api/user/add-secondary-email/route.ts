// src/app/api/user/add-secondary-email/route.ts
import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import nodemailer from "nodemailer"

// تعريف واجهة للجلسة
interface Session {
  user?: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
  };
}

export async function POST(request: NextRequest) {
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

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }
    
    // التحقق من وجود المستخدم باستخدام Prisma
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { secondaryEmails: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // التحقق من أن البريد الإلكتروني الثانوي ليس هو نفسه البريد الأساسي
    if (user.email === email) {
      return NextResponse.json(
        { error: "This email is already your primary email" },
        { status: 400 }
      )
    }

    // التحقق من عدم وجود البريد الإلكتروني في قائمة البريد الإلكتروني الثانوي
    const existingSecondaryEmail = user.secondaryEmails.find(e => e.email === email);

    if (existingSecondaryEmail) {
      // إذا كان البريد موجود بالفعل، قم بتحديث كود التحقق فقط
      const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
      const verificationCodeExpiry = new Date(Date.now() + 600000) // 10 دقائق
      
      // تحديث كود التحقق للبريد الإلكتروني الموجود باستخدام Prisma
      await prisma.secondaryEmail.update({
        where: { id: existingSecondaryEmail.id },
        data: {
          verificationCode,
          verificationCodeExpiry
        }
      });
      
      console.log("Updated verification code for existing secondary email:", email)
      
      // إرسال البريد الإلكتروني
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: email,
        subject: "كود التحقق - إضافة بريد إلكتروني ثانوي - فذلكه",
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">كود التحقق</h2>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                مرحباً ${user.name}،
              </p>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                استخدم كود التحقق التالي لإضافة هذا البريد الإلكتروني إلى حسابك:
              </p>
              
              <div style="text-align: center; margin: 40px 0;">
                <div style="display: inline-block; background: #f8f9fa; padding: 20px 40px; border-radius: 10px; border: 2px dashed #667eea;">
                  <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">
                    ${verificationCode}
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
                  <li>إذا لم تطلب هذا الكود، يرجى تجاهل هذه الرسالة</li>
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
      };

      // إرسال البريد الإلكتروني
      await transporter.sendMail(mailOptions);
      console.log("Verification email sent to existing secondary email:", email)

      return NextResponse.json(
        { 
          message: "Verification code sent to your secondary email",
          // في بيئة التطوير فقط، أرجع الكود للاختبار
          ...(process.env.NODE_ENV === 'development' && { verificationCode })
        },
        { status: 200 }
      )
    }

    // التحقق من عدم استخدام البريد الإلكتروني من قبل مستخدم آخر
    const anotherUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: email },
          { 
            secondaryEmails: {
              some: { email: email }
            }
          }
        ]
      }
    });

    if (anotherUser) {
      return NextResponse.json(
        { error: "This email is already in use by another account" },
        { status: 400 }
      )
    }

    // إنشاء كود تحقق مكون من 6 أرقام
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString()
    const verificationCodeExpiry = new Date(Date.now() + 600000) // 10 دقائق

    console.log("Generated verification code for new secondary email:", verificationCode.substring(0, 3) + "***")

    // إضافة البريد الإلكتروني الثانوي مع كود التحقق باستخدام Prisma
    await prisma.secondaryEmail.create({
      data: {
        email,
        isVerified: false,
        verificationCode,
        verificationCodeExpiry,
        userId: session.user.id
      }
    });

    // إعداد الناقل البريدي
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // إعداد محتوى البريد الإلكتروني
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "كود التحقق - إضافة بريد إلكتروني ثانوي - فذلكه",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">كود التحقق</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              مرحباً ${user.name}،
            </p>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              استخدم كود التحقق التالي لإضافة هذا البريد الإلكتروني إلى حسابك:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <div style="display: inline-block; background: #f8f9fa; padding: 20px 40px; border-radius: 10px; border: 2px dashed #667eea;">
                <span style="font-size: 32px; font-weight: bold; color: #667eea; letter-spacing: 8px;">
                  ${verificationCode}
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
                <li>إذا لم تطلب هذا الكود، يرجى تجاهل هذه الرسالة</li>
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
    };

    // إرسال البريد الإلكتروني
    await transporter.sendMail(mailOptions);
    console.log("Verification email sent to new secondary email:", email)

    return NextResponse.json(
      { 
        message: "Verification code sent to your secondary email",
        // في بيئة التطوير فقط، أرجع الكود للاختبار
        ...(process.env.NODE_ENV === 'development' && { verificationCode })
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("Add secondary email error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}