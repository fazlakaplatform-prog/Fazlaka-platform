import { NextRequest, NextResponse } from "next/server"
import nodemailer from "nodemailer"
import { prisma } from "@/lib/prisma"

// تعريف أنواع الواردة من الفرونت إند
type PurposeType = "login" | "register" | "reset" | "verify" | "change-password"

// خريطة التحويل (Mapping) لربط النصوص الواردة مع قيم الـ Enum في Prisma
const purposeToEnumMap: Record<string, "LOGIN" | "REGISTER" | "RESET" | "VERIFY" | "CHANGE_PASSWORD"> = {
  "login": "LOGIN",
  "register": "REGISTER",
  "reset": "RESET",
  "verify": "VERIFY",
  "change-password": "CHANGE_PASSWORD"
}

export async function POST(request: NextRequest) {
  try {
    const { email, name, purpose = "login" } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "البريد الإلكتروني مطلوب" },
        { status: 400 }
      )
    }

    // التحقق من صحة تنسيق البريد الإلكتروني
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "تنسيق البريد الإلكتروني غير صالح" },
        { status: 400 }
      )
    }

    console.log(`معالجة طلب كود التحقق لـ ${purpose}:`, email)

    // التحقق مما إذا كان البريد الإلكتروني موجودًا
    const existingUser = await prisma.user.findFirst({
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
    
    if (existingUser && purpose === "register") {
      return NextResponse.json(
        { error: "هذا البريد الإلكتروني مسجل بالفعل كبريد أساسي أو ثانوي" },
        { status: 400 }
      )
    }
    
    // إنشاء كود تحقق مؤقت
    const otpCode = Math.floor(100000 + Math.random() * 900000).toString()
    const otpExpiry = new Date(Date.now() + 600000) // 10 دقائق

    console.log(`تم إنشاء كود التحقق لـ ${purpose}:`, otpCode.substring(0, 3) + "***")

    // تخزين كود التحقق بناءً على الغرض
    if (purpose === "register") {
      // حذف أي كود تحقق موجود لهذا البريد
      await prisma.oTP.deleteMany({ where: { email } });
      
      // إنشاء سجل كود تحقق جديد في جدول OTP
      await prisma.oTP.create({
        data: {
          email,
          otpCode,
          otpExpiry,
          purpose, // في جدول OTP الحقل نصي، لذا نرسل النص كما هو
          name
        }
      });
    } else {
      // للمستخدمين الحاليين، تحديث سجلهم مباشرة
      if (existingUser) {
        // نحول النص إلى القيمة المناسبة للـ Enum في User model
        const prismaPurpose = purposeToEnumMap[purpose] || "LOGIN";

        await prisma.user.update({
          where: { id: existingUser.id },
          data: {
            otpCode,
            otpExpiry,
            otpPurpose: prismaPurpose, // استخدام القيمة المحولة
            otpVerified: false, 
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
      tls: {
        rejectUnauthorized: true
      }
    })

    // النصوص للإيميل
    const purposeText: Record<PurposeType, string> = {
      login: "تسجيل الدخول",
      register: "إنشاء حساب",
      reset: "إعادة تعيين كلمة المرور",
      verify: "التحقق من الهوية",
      "change-password": "تغيير كلمة المرور"
    }

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: `كود التحقق - ${purposeText[purpose as PurposeType]} - فذلكه`,
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">كود التحقق</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              مرحباً ${name || ""}،
            </p>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              استخدم كود التحقق التالي لـ ${purposeText[purpose as PurposeType]}:
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
    }

    // إرسال بريد كود التحقق
    await transporter.sendMail(mailOptions)
    console.log(`تم إرسال بريد كود التحقق إلى: ${email}`)

    return NextResponse.json(
      { 
        message: "تم إرسال كود التحقق بنجاح",
        ...(process.env.NODE_ENV === 'development' && { otpCode })
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("خطأ في كود التحقق:", error)
    return NextResponse.json(
      { error: "خطأ في الخادم الداخلي" },
      { status: 500 }
    )
  }
}