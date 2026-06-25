// src/app/api/admin/users/[id]/notify/route.ts
import { NextRequest, NextResponse } from "next/server"
import { PrismaClient } from "@prisma/client"
import nodemailer from "nodemailer"

const prisma = new PrismaClient()

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { title, message, type, sendEmail, emailSubject, emailMessage } = await request.json()

    if (!title || !message) {
      return NextResponse.json(
        { error: "Title and message are required" },
        { status: 400 }
      )
    }

    // البحث عن المستخدم
    const user = await prisma.user.findUnique({
      where: { id }
    });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // إنشاء إشعار جديد
    // تم إزالة read: false لأن الحالة الافتراضية للإشعار هي "غير مقروء" وحقل القراءة قد يكون readAt بدلاً من read
    const notification = await prisma.notification.create({
      data: {
        userId: user.id,
        title,
        message,
        type: type || 'info'
      }
    });

    // إرسال بريد إلكتروني إذا تم الطلب
    if (sendEmail && emailSubject && emailMessage) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });

      const mailOptions = {
        from: process.env.EMAIL_FROM,
        to: user.email,
        subject: emailSubject,
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">${title}</h2>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                مرحباً ${user.name}،
              </p>
              
              <div style="background: #f8f9fa; border-left: 4px solid #667eea; padding: 15px; margin: 20px 0;">
                <p style="color: #333; margin: 0; line-height: 1.6;">
                  ${emailMessage}
                </p>
              </div>
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXTAUTH_URL}/dashboard" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold;
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                  الذهاب إلى لوحة التحكم
                </a>
              </div>
              
              <p style="color: #999; font-size: 14px; line-height: 1.6; margin: 30px 0 0 0;">
                مع أطيب التحيات،<br>
                  فريق فذلكه
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

      await transporter.sendMail(mailOptions);
    }

    return NextResponse.json({
      message: "Notification sent successfully",
      notification
    });
  } catch (error) {
    console.error("Error sending notification:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}