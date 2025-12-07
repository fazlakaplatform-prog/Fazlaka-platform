// src/app/api/tickets/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import Ticket, { ITicket } from "@/models/Ticket"; // الآن يمكنك استيراد ITicket بشكل صحيح

/**
 * جلب تفاصيل تذكرة محددة
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.email) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { id } = await params;

    // الاتصال بقاعدة البيانات باستخدام Mongoose
    await connectDB();

    // جلب التذكرة
    const ticket = await Ticket.findOne({
      _id: id,
      userId: token.sub,
    });

    if (!ticket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: ticket,
    });
  } catch (error) {
    console.error("Error fetching ticket details:", error);
    return NextResponse.json(
      { error: "فشل جلب تفاصيل التذكرة", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * إضافة رسالة جديدة إلى تذكرة موجودة
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.email) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { id } = await params;

    // استقبال البيانات كـ FormData
    const formData = await request.formData();

    const message = (formData.get("message") as string) || "";
    const messageEn = (formData.get("messageEn") as string) || "";
    const attachments = formData.getAll("attachment") as File[];

    if (!message) {
      return NextResponse.json({ error: "الرسالة مطلوبة" }, { status: 400 });
    }

    // الاتصال بقاعدة البيانات باستخدام Mongoose
    await connectDB();

    // جلب التذكرة
    const ticket = await Ticket.findOne({
      _id: id,
      userId: token.sub,
    });

    if (!ticket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    // معالجة المرفقات
    const attachmentsData = [];
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

    // إضافة الرسالة الجديدة
    ticket.messages.push({
      content: message.trim(),
      contentEn: messageEn.trim(),
      sender: 'user',
      attachments: attachmentsData,
      createdAt: new Date(),
    });

    // تحديث حالة التذكرة إذا كانت تنتظر رد المستخدم
    if (ticket.status === 'waiting_for_user') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    // إرسال إشعار بالبريد الإلكتروني (اختياري)
    try {
      await sendTicketReplyNotification(ticket);
    } catch (emailError) {
      console.error("Error sending ticket reply notification:", emailError);
      // لا نوقف العملية إذا فشل إرسال البريد
    }

    return NextResponse.json({
      success: true,
      message: "تم إرسال الرسالة بنجاح",
      data: {
        id: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error("Error adding message to ticket:", error);
    return NextResponse.json(
      { error: "فشل إرسال الرسالة", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * إغلاق تذكرة
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.email) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { id } = await params;

    // الاتصال بقاعدة البيانات باستخدام Mongoose
    await connectDB();

    // جلب التذكرة
    const ticket = await Ticket.findOne({
      _id: id,
      userId: token.sub,
    });

    if (!ticket) {
      return NextResponse.json({ error: "التذكرة غير موجودة" }, { status: 404 });
    }

    // تحديث حالة التذكرة إلى مغلقة
    ticket.status = 'closed';
    await ticket.save();

    return NextResponse.json({
      success: true,
      message: "تم إغلاق التذكرة بنجاح",
      data: {
        id: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        status: ticket.status,
      },
    });
  } catch (error) {
    console.error("Error closing ticket:", error);
    return NextResponse.json(
      { error: "فشل إغلاق التذكرة", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * دالة مساعدة لرفع الصور إلى ImgBB
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

/**
 * دالة مساعدة لإرسال إشعار بالبريد الإلكتروني
 */
async function sendTicketReplyNotification(ticket: ITicket) {
  // هنا يمكنك إضافة كود إرسال البريد الإلكتروني
  // باستخدام nodemailer أو خدمة أخرى
  console.log(`Ticket reply notification sent for ticket #${ticket.ticketNumber}`);
}