// src/app/api/contact/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import clientPromise from "@/lib/mongodb";
import nodemailer from "nodemailer";
import type { Attachment } from "nodemailer/lib/mailer";

/**
 * Types
 */
type AttachmentData = {
  name: string;
  size: number;
  type: string;
  url: string | null;
  isImage: boolean;
  error?: string;
};

type TokenUser = {
  sub?: string; // user id
  email?: string;
  name?: string;
  picture?: string;
  [k: string]: unknown;
};

/**
 * دالة لرفع الصور إلى ImgBB
 */
async function uploadImageToImgBB(file: File): Promise<string> {
  if (file.size > 5 * 1024 * 1024) {
    throw new Error("حجم الصورة كبير جداً (الحد الأقصى 5 ميجابايت)");
  }

  if (!file.type.match(/image\/(jpeg|jpg|png|webp)/)) {
    throw new Error("نوع الملف غير صالح (يرجى رفع JPEG, PNG, أو WebP)");
  }

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Image = buffer.toString("base64");

  const formData = new FormData();
  formData.append("key", process.env.IMGBB_API_KEY || "");
  formData.append("image", base64Image);

  const imgbbResponse = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  if (!imgbbResponse.ok) {
    throw new Error("فشل رفع الصورة إلى ImgBB");
  }

  const imgbbData = await imgbbResponse.json();
  return imgbbData.data.url;
}

export async function GET() {
  try {
    return NextResponse.json({ message: "Contact API is working" });
  } catch (error) {
    console.error("Error in GET /api/contact:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // === التحقق من المستخدم عبر getToken (بديل آمن لـ getServerSession داخل Route Handlers) ===
    // ملاحظة: NEXTAUTH_SECRET يجب أن يكون مضبوط في env لتعمل قراءة التوكن من الكوكيز
    const token = (await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    })) as TokenUser | null;

    if (!token || !token.email) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    // استقبال البيانات كـ FormData
    const formData = await request.formData();

    const name = (formData.get("name") as string) || "";
    const email = (formData.get("email") as string) || "";
    const message = (formData.get("message") as string) || "";
    const attachments = formData.getAll("attachment") as File[];

    if (!message || !name || !email) {
      return NextResponse.json({ error: "الحقول المطلوبة مفقودة" }, { status: 400 });
    }

    // التحقق من أن المستخدم يضيف بياناته الخاصة فقط
    if (token.email && email !== token.email) {
      return NextResponse.json({ error: "غير مصرح به" }, { status: 403 });
    }

    // الاتصال بقاعدة البيانات
    let client, db;
    try {
      client = await clientPromise;
      db = client.db(process.env.MONGODB_DB || "fazlaka");
    } catch (dbError) {
      console.error("Database connection error:", dbError);
      return NextResponse.json({ error: "فشل الاتصال بقاعدة البيانات" }, { status: 500 });
    }

    // معالجة المرفقات - رفع الصور إلى ImgBB وحفظ الملفات الأخرى كبيانات
    const attachmentsData: AttachmentData[] = [];

    for (const file of attachments) {
      try {
        if (file.type.startsWith("image/")) {
          const imageUrl = await uploadImageToImgBB(file);
          attachmentsData.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: imageUrl,
            isImage: true,
          });
        } else {
          attachmentsData.push({
            name: file.name,
            size: file.size,
            type: file.type,
            url: null,
            isImage: false,
          });
        }
      } catch (error) {
        console.error(`Error processing file ${file.name}:`, error);
        attachmentsData.push({
          name: file.name,
          size: file.size,
          type: file.type,
          url: null,
          isImage: file.type.startsWith("image/"),
          error: error instanceof Error ? error.message : "فشل معالجة الملف",
        });
      }
    }

    // حفظ البيانات في MongoDB
    const contactData = {
      name: name.trim(),
      email: email.trim().toLowerCase(),
      message: message.trim(),
      userId: token.sub ?? "",
      userFirstName: (token.name?.split(" ")[0]?.trim()) || "",
      userLastName: (token.name ? token.name.split(" ").slice(1).join(" ").trim() : "") || "",
      userImageUrl: (token.picture as string) || "",
      attachments: attachmentsData,
      createdAt: new Date(),
    };

    let result;
    try {
      result = await db.collection("contacts").insertOne(contactData);
      console.log("Contact saved successfully:", result.insertedId);
    } catch (saveError) {
      console.error("Error saving contact:", saveError);
      return NextResponse.json({ error: "فشل حفظ الرسالة في قاعدة البيانات" }, { status: 500 });
    }

    // إعداد وإرسال البريد الإلكتروني
    try {
      const transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER_HOST,
        port: parseInt(process.env.EMAIL_SERVER_PORT || "587"),
        secure: false,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      });

      // معالجة المرفقات للبريد الإلكتروني باستخدام نوع Nodemailer الرسمي
      const emailAttachments: Attachment[] = [];

      for (const attachment of attachments) {
        const buffer = Buffer.from(await attachment.arrayBuffer());
        if (attachment.type.startsWith("image/")) {
          emailAttachments.push({
            filename: attachment.name,
            content: buffer,
            contentType: attachment.type,
            cid: `img_${Date.now()}_${attachment.name}`,
          });
        } else {
          emailAttachments.push({
            filename: attachment.name,
            content: buffer,
            contentType: attachment.type,
          });
        }
      }

      const attachmentsListHtml = attachmentsData
        .map((att) => {
          if (att.isImage && att.url) {
            return `
            <div style="margin-bottom: 15px; padding: 10px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
              <div style="display: flex; align-items: center; gap: 10px;">
                <img src="cid:img_${Date.now()}_${att.name}" alt="${att.name}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;" />
                <div style="flex: 1;">
                  <p style="margin: 0; font-weight: bold; color: #495057;">${att.name}</p>
                  <p style="margin: 5px 0; font-size: 12px; color: #6c757d;">الحجم: ${(att.size / 1024).toFixed(2)} KB</p>
                  <a href="${att.url}" target="_blank" style="display: inline-block; margin-top: 5px; padding: 5px 10px; background: #007bff; color: white; text-decoration: none; border-radius: 4px; font-size: 12px;">عرض الصورة</a>
                </div>
              </div>
            </div>
          `;
          } else {
            return `
            <div style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef;">
              <p style="margin: 0; font-weight: bold; color: #495057;">${att.name}</p>
              <p style="margin: 5px 0; font-size: 12px; color: #6c757d;">الحجم: ${(att.size / 1024).toFixed(2)} KB</p>
              ${att.error ? `<p style="margin: 5px 0; font-size: 12px; color: #dc3545;">خطأ: ${att.error}</p>` : ""}
            </div>
          `;
          }
        })
        .join("");

      await transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: process.env.RECEIVER_EMAIL,
        subject: `📧 رسالة جديدة من ${name} - فذلكه`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>رسالة جديدة من ${name}</title>
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 20px; background: #f8f9fa; }
              .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1); }
              .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; }
              .header h1 { margin: 0; font-size: 24px; font-weight: 600; }
              .user-info { display: flex; align-items: center; padding: 20px; background: #f8f9fa; border-bottom: 1px solid #e9ecef; }
              .user-avatar { width: 60px; height: 60px; border-radius: 50%; margin-left: 15px; border: 3px solid #667eea; }
              .user-details h3 { margin: 0; color: #495057; font-size: 18px; }
              .user-details p { margin: 5px 0 0; color: #6c757d; font-size: 14px; }
              .content { padding: 30px; }
              .message-box { background: #f8f9fa; border-radius: 8px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #667eea; }
              .message-box p { margin: 0; color: #495057; line-height: 1.6; white-space: pre-wrap; }
              .attachments-section { margin-top: 20px; }
              .attachments-title { font-size: 18px; font-weight: 600; color: #495057; margin-bottom: 15px; display: flex; align-items: center; }
              .attachments-title::before { content: "📎"; margin-left: 8px; }
              .footer { background: #f8f9fa; padding: 20px; text-align: center; border-top: 1px solid #e9ecef; }
              .footer p { margin: 0; color: #6c757d; font-size: 12px; }
              .timestamp { background: #e9ecef; padding: 5px 10px; border-radius: 15px; font-size: 12px; color: #495057; display: inline-block; margin-top: 10px; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>📧 رسالة جديدة من نموذج التواصل</h1>
                <div class="timestamp">${new Date().toLocaleString("ar-EG", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}</div>
              </div>
              
              <div class="user-info">
                ${token.picture ? `<img src="${token.picture}" alt="${name}" class="user-avatar">` : `<div class="user-avatar" style="background: #667eea; display: flex; align-items: center; justify-content: center; color: white; font-size: 24px; font-weight: bold;">${name.charAt(0).toUpperCase()}</div>`}
                <div class="user-details">
                  <h3>${name}</h3>
                  <p>📧 ${email}</p>
                  <p>🆔 ${token.sub ?? ""}</p>
                </div>
              </div>
              
              <div class="content">
                <div class="message-box">
                  <p>${message}</p>
                </div>
                
                ${attachmentsData.length > 0 ? `
                  <div class="attachments-section">
                    <div class="attachments-title">المرفقات (${attachmentsData.length})</div>
                    ${attachmentsListHtml}
                  </div>
                ` : ""}
              </div>
              
              <div class="footer">
                <p>🚀 تم الإرسال عبر منصة فذلكه</p>
                <p style="margin-top: 5px;">© ${new Date().getFullYear()} جميع الحقوق محفوظة</p>
              </div>
            </div>
          </body>
          </html>
        `,
        attachments: emailAttachments,
      });

      console.log("Email sent successfully");
    } catch (emailError) {
      console.error("Error sending email:", emailError);
      // لا نوقف العملية إذا فشل إرسال البريد
    }

    return NextResponse.json({
      success: true,
      id: result.insertedId.toString(),
      message: "تم إرسال الرسالة بنجاح",
      attachments: attachmentsData,
    });
  } catch (error) {
    console.error("Error in POST /api/contact:", error);
    return NextResponse.json(
      { error: "فشل في إرسال الرسالة", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}
