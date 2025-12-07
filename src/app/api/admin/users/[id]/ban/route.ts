// src/app/api/admin/users/[id]/ban/route.ts
import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import nodemailer from "nodemailer"

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { reason, notifyUser = true } = await request.json()

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

    // تحديث حالة الحظر
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          banned: true,
          banReason: reason,
          bannedAt: new Date(),
          updatedAt: new Date()
        }
      }
    );

    // إرسال إشعار للمستخدم إذا تم الطلب
    if (notifyUser) {
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
        subject: "حظر حسابك - فذلكه",
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #dc2626; margin: 0 0 20px 0; font-size: 24px;">حظر حسابك</h2>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                مرحباً ${user.name}،
              </p>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                نأسف لإبلاغك بأن حسابك قد تم حظره بسبب انتهاك شروط الاستخدام.
              </p>
              
              ${reason ? `
              <div style="background: #fef2f2; border: 1px solid #fecaca; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #991b1b; margin: 0; font-size: 14px;">
                  <strong>سبب الحظر:</strong> ${reason}
                </p>
              </div>
              ` : ''}
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                إذا كنت تعتقد أن هذا خطأ، يرجى التواصل مع فريق الدعم عبر البريد الإلكتروني.
              </p>
              
              <div style="background: #f3f4f6; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #374151; margin: 0; font-size: 14px;">
                  <strong>معلومات التواصل:</strong><br>
                  البريد الإلكتروني: support@fazlaka.com
                </p>
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
      message: "User banned successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error("Error banning user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}