// src/app/api/admin/users/[id]/reset-password/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import nodemailer from "nodemailer"
import { v4 as uuidv4 } from "uuid"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;

    const client = await clientPromise;
    const db = client.db();
    
    // البحث عن المستخدم
    const user = await db.collection('users').findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // إنشاء رمز إعادة تعيين كلمة المرور
    const resetToken = uuidv4()
    const resetTokenExpiry = new Date(Date.now() + 3600000) // ساعة واحدة

    // تحديث المستخدم برمز إعادة التعيين
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          resetToken,
          resetTokenExpiry,
          updatedAt: new Date()
        }
      }
    );

    // إعداد النقل البريدي
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // إعداد محتوى البريد الإلكتروني
    const resetUrl = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`

    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: user.email,
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
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>ملاحظات هامة:</strong>
              </p>
              <ul style="color: #856404; margin: 10px 0 0 20px; font-size: 14px; padding-right: 20px;">
                <li>هذا الرابط سينتهي صلاحيته خلال ساعة واحدة</li>
                <li>لا تشارك هذا الرابط مع أي شخص</li>
                <li>إذا لم تطلب إعادة تعيين كلمة المرور، يرجى تجاهل هذه الرسالة</li>
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

    // إرسال بريد إعادة تعيين كلمة المرور
    await transporter.sendMail(mailOptions);

    return NextResponse.json({
      message: "Password reset email sent successfully"
    });
  } catch (error) {
    console.error("Error resetting password:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}