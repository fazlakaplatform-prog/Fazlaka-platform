// src/app/api/admin/users/[id]/unban/route.ts
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

    // تحديث حالة فك الحظر
    await db.collection('users').updateOne(
      { _id: new ObjectId(id) },
      { 
        $set: { 
          banned: false,
          banReason: null,
          unbannedAt: new Date(),
          unbanReason: reason,
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
        subject: "فك حظر حسابك - فذلكه",
        html: `
          <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); padding: 30px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
            </div>
            
            <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
              <h2 style="color: #16a34a; margin: 0 0 20px 0; font-size: 24px;">فك حظر حسابك</h2>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                مرحباً ${user.name}،
              </p>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                يسعدنا إبلاغك بأن حسابك قد تم فك حظره ويمكنك الآن استخدام المنصة بشكل طبيعي.
              </p>
              
              ${reason ? `
              <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 15px; margin: 20px 0;">
                <p style="color: #166534; margin: 0; font-size: 14px;">
                  <strong>سبب فك الحظر:</strong> ${reason}
                </p>
              </div>
              ` : ''}
              
              <div style="text-align: center; margin: 40px 0;">
                <a href="${process.env.NEXTAUTH_URL}/sign-in" 
                   style="background: linear-gradient(135deg, #16a34a 0%, #22c55e 100%); 
                          color: white; 
                          padding: 15px 30px; 
                          text-decoration: none; 
                          border-radius: 5px; 
                          font-weight: bold;
                          display: inline-block;
                          box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);">
                  تسجيل الدخول
                </a>
              </div>
              
              <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
                نأمل أن تتمتع بتجربة رائعة على منصتنا.
              </p>
              
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
      message: "User unbanned successfully",
      user: {
        id: user._id,
        email: user.email,
        name: user.name
      }
    });
  } catch (error) {
    console.error("Error unbanning user:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}