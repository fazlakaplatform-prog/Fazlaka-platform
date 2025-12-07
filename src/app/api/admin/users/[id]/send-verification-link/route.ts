import { NextRequest, NextResponse } from "next/server"
import { ObjectId } from "mongodb"
import clientPromise from "@/lib/mongodb"
import { v4 as uuidv4 } from "uuid"
import nodemailer from "nodemailer"

// Define types for better type safety
interface SecondaryEmail {
  email: string;
  verified: boolean;
  verificationToken?: string;
  verificationTokenExpiry?: Date;
}

interface User {
  _id: ObjectId;
  name: string;
  secondaryEmails?: SecondaryEmail[];
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { email, isPrimary = false } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      )
    }

    const client = await clientPromise;
    const db = client.db();
    
    // البحث عن المستخدم
    const user = await db.collection<User>('users').findOne({ _id: new ObjectId(id) });
    
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      )
    }

    // إنشاء رمز تحقق
    const verificationToken = uuidv4()
    const verificationTokenExpiry = new Date(Date.now() + 24 * 3600000) // 24 ساعة

    // تحديث المستخدم برمز التحقق
    if (isPrimary) {
      // تحديث البريد الأساسي
      await db.collection('users').updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            verificationToken,
            verificationTokenExpiry,
            updatedAt: new Date()
          }
        }
      );
    } else {
      // تحديث البريد الثانوي
      const secondaryEmails = user.secondaryEmails || [];
      const emailIndex = secondaryEmails.findIndex((e: SecondaryEmail) => e.email === email);
      
      if (emailIndex === -1) {
        return NextResponse.json(
          { error: "Secondary email not found" },
          { status: 404 }
        )
      }
      
      await db.collection('users').updateOne(
        { _id: new ObjectId(id) },
        { 
          $set: { 
            [`secondaryEmails.${emailIndex}.verificationToken`]: verificationToken,
            [`secondaryEmails.${emailIndex}.verificationTokenExpiry`]: verificationTokenExpiry,
            updatedAt: new Date()
          }
        }
      );
    }

    // إعداد النقل البريدي
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
      },
    });

    // إنشاء رابط التحقق
    const verificationUrl = `${process.env.NEXTAUTH_URL}/verify-email?token=${verificationToken}`

    // إعداد محتوى البريد الإلكتروني
    const mailOptions = {
      from: process.env.EMAIL_FROM,
      to: email,
      subject: "تأكيد البريد الإلكتروني - فذلكه",
      html: `
        <div dir="rtl" style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 28px;">فذلكه</h1>
            <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0;">منصة تعليمية رائدة</p>
          </div>
          
          <div style="background: white; padding: 40px; border-radius: 0 0 10px 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
            <h2 style="color: #333; margin: 0 0 20px 0; font-size: 24px;">تأكيد البريد الإلكتروني</h2>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              مرحباً ${user.name}،
            </p>
            
            <p style="color: #666; line-height: 1.6; margin: 0 0 30px 0;">
              يرجى النقر على الزر أدناه لتأكيد بريدك الإلكتروني:
            </p>
            
            <div style="text-align: center; margin: 40px 0;">
              <a href="${verificationUrl}" 
                 style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; 
                        padding: 15px 30px; 
                        text-decoration: none; 
                        border-radius: 5px; 
                        font-weight: bold;
                        display: inline-block;
                        box-shadow: 0 4px 15px rgba(102, 126, 234, 0.4);">
                تأكيد البريد الإلكتروني
              </a>
            </div>
            
            <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 15px; margin: 20px 0;">
              <p style="color: #856404; margin: 0; font-size: 14px;">
                <strong>ملاحظات:</strong>
              </p>
              <ul style="color: #856404; margin: 10px 0 0 20px; font-size: 14px; padding-right: 20px;">
                <li>هذا الرابط صالح لمدة 24 ساعة</li>
                <li>إذا لم تطلب هذا التحقق، يرجى تجاهل هذه الرسالة</li>
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

    return NextResponse.json({
      message: "Verification link sent successfully"
    });
  } catch (error) {
    console.error("Error sending verification link:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}