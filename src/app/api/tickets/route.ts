// src/app/api/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { connectDB } from "@/lib/mongodb";
import Ticket, { ITicket } from "@/models/Ticket";
import { Document } from "mongoose";

// تعريف واجهة لمرشحات البحث
interface TicketFilter {
  userId: string;
  status?: string;
  category?: string;
}

// تعريف واجهة لبيانات التذكرة الجديدة
interface NewTicketData {
  ticketNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  userImageUrl: string;
  category: string;
  priority: string;
  status: string;
  subject: string;
  subjectEn: string;
  description: string;
  descriptionEn: string;
  attachments: Array<{
    name: string;
    size: number;
    type: string;
    url: string | null;
    isImage: boolean;
    error?: string;
  }>;
  messages: Array<{
    content: string;
    contentEn: string;
    sender: string;
    attachments: Array<{
      name: string;
      size: number;
      type: string;
      url: string | null;
      isImage: boolean;
      error?: string;
    }>;
    createdAt: Date;
  }>;
}

/**
 * إنشاء رقم تذكرة فريد
 */
function generateTicketNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TK-${year}${month}${day}-${random}`;
}

/**
 * جلب جميع التذاكر للمستخدم الحالي
 */
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.email) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    // بناء مرشحات البحث
    const filters: TicketFilter = { userId: token.sub! };
    if (status) filters.status = status;
    if (category) filters.category = category;

    // الاتصال بقاعدة البيانات باستخدام Mongoose
    await connectDB();
    
    // حساب عدد التذاكر
    const totalTickets = await Ticket.countDocuments(filters);
    
    // جلب التذاكر مع ترقيم الصفحات
    const tickets = await Ticket.find(filters)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    return NextResponse.json({
      success: true,
      data: tickets,
      pagination: {
        page,
        limit,
        total: totalTickets,
        pages: Math.ceil(totalTickets / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching tickets:", error);
    return NextResponse.json(
      { error: "فشل جلب التذاكر", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

/**
 * إنشاء تذكرة جديدة
 */
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({
      req: request,
      secret: process.env.NEXTAUTH_SECRET,
    });

    if (!token || !token.email) {
      return NextResponse.json({ error: "يجب تسجيل الدخول أولاً" }, { status: 401 });
    }

    // استقبال البيانات كـ FormData
    const formData = await request.formData();

    const category = (formData.get("category") as string) || "";
    const priority = (formData.get("priority") as string) || "medium";
    const subject = (formData.get("subject") as string) || "";
    const subjectEn = (formData.get("subjectEn") as string) || "";
    const description = (formData.get("description") as string) || "";
    const descriptionEn = (formData.get("descriptionEn") as string) || "";
    const attachments = formData.getAll("attachment") as File[];

    if (!category || !subject || !description) {
      return NextResponse.json({ error: "الحقول المطلوبة مفقودة" }, { status: 400 });
    }

    // الاتصال بقاعدة البيانات باستخدام Mongoose
    await connectDB();

    // التحقق من وجود تذكرة مفتوحة بنفس الموضوع
    const existingTicket = await Ticket.findOne({
      userId: token.sub,
      status: { $in: ['open', 'in_progress', 'waiting_for_user'] },
      subject: subject.trim(),
    });

    if (existingTicket) {
      return NextResponse.json(
        { error: "لديك بالفعل تذكرة مفتوحة بنفس الموضوع", ticketId: existingTicket._id },
        { status: 409 }
      );
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

    // إنشاء تذكرة جديدة
    const ticketData: NewTicketData = {
      ticketNumber: generateTicketNumber(),
      userId: token.sub ?? "",
      userName: (token.name as string) || "",
      userEmail: token.email,
      userImageUrl: (token.picture as string) || "",
      category: category.trim(),
      priority: priority.trim(),
      status: "open",
      subject: subject.trim(),
      subjectEn: subjectEn.trim(),
      description: description.trim(),
      descriptionEn: descriptionEn.trim(),
      attachments: attachmentsData,
      messages: [{
        content: description.trim(),
        contentEn: descriptionEn.trim(),
        sender: 'user',
        attachments: attachmentsData,
        createdAt: new Date(),
      }],
    };

    const ticket = new Ticket(ticketData);
    await ticket.save();

    // إرسال إشعار بالبريد الإلكتروني (اختياري)
    try {
      await sendTicketNotification(ticket);
    } catch (emailError) {
      console.error("Error sending ticket notification:", emailError);
      // لا نوقف العملية إذا فشل إرسال البريد
    }

    return NextResponse.json({
      success: true,
      data: {
        id: ticket._id.toString(),
        ticketNumber: ticket.ticketNumber,
        message: "تم إنشاء التذكرة بنجاح",
      },
    });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json(
      { error: "فشل إنشاء التذكرة", details: error instanceof Error ? error.message : "Unknown error" },
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
async function sendTicketNotification(ticket: ITicket & Document) {
  // هنا يمكنك إضافة كود إرسال البريد الإلكتروني
  // باستخدام nodemailer أو خدمة أخرى
  console.log(`Ticket notification sent for ticket #${ticket.ticketNumber}`);
}