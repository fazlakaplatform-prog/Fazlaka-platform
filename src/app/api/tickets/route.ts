import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { TicketStatus, TicketCategory, TicketPriority, TicketMessageSender } from "@prisma/client";
import { pusherServer } from "@/lib/pusher";

// دالة رفع الصور
async function uploadImageToImgBB(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Image = buffer.toString("base64");

  const formData = new FormData();
  formData.append("key", process.env.IMGBB_API_KEY || "");
  formData.append("image", base64Image);

  const response = await fetch("https://api.imgbb.com/1/upload", {
    method: "POST",
    body: formData,
  });

  if (!response.ok) throw new Error("Failed to upload image");
  const data = await response.json();
  return data.data.url;
}

// Helper mappings
const mapCategoryToEnum = (category: string): TicketCategory => {
  const map: Record<string, TicketCategory> = {
    'technical': TicketCategory.TECHNICAL,
    'account': TicketCategory.ACCOUNT,
    'billing': TicketCategory.BILLING,
    'content': TicketCategory.CONTENT,
    'other': TicketCategory.OTHER,
  };
  return map[category.toLowerCase()] || TicketCategory.OTHER;
};

const mapPriorityToEnum = (priority: string): TicketPriority => {
  const map: Record<string, TicketPriority> = {
    'low': TicketPriority.LOW,
    'medium': TicketPriority.MEDIUM,
    'high': TicketPriority.HIGH,
    'urgent': TicketPriority.URGENT,
  };
  return map[priority.toLowerCase()] || TicketPriority.MEDIUM;
};

function generateTicketNumber(): string {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
  return `TK-${year}${month}${day}-${random}`;
}

// GET Tickets
export async function GET(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const tickets = await prisma.ticket.findMany({
      where: { userId: token.sub },
      orderBy: { createdAt: 'desc' },
      include: { attachments: true },
    });

    return NextResponse.json({ success: true, data: tickets });
  } catch (_error) { // تم إصلاح التحذير: استخدام _error
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}

// POST Create Ticket (With Image)
export async function POST(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.email || !token.sub || !token.name) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const category = formData.get("category") as string || "technical";
    const priority = formData.get("priority") as string || "medium";
    const subject = formData.get("subject") as string;
    const description = formData.get("description") as string;
    const file = formData.get("file") as File | null;

    if (!subject || !description) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // معالجة المرفقات
    // تم إصلاح الخطأ: استخدام const وتحديد النوع بدلاً من any
    const attachmentsData: { name: string; url: string; isImage: boolean; type: string; size: number }[] = [];
    
    if (file && file.size > 0) {
      const url = await uploadImageToImgBB(file);
      attachmentsData.push({
        name: file.name,
        url: url,
        isImage: true,
        type: file.type,
        size: file.size,
      });
    }

    const newTicket = await prisma.ticket.create({
      data: {
        ticketNumber: generateTicketNumber(),
        userId: token.sub,
        userName: token.name,
        userEmail: token.email,
        userImageUrl: token.picture,
        category: mapCategoryToEnum(category),
        priority: mapPriorityToEnum(priority),
        status: TicketStatus.OPEN,
        subject: subject,
        description: description,
        attachments: { create: attachmentsData },
        // إنشاء الرسالة الأولى مع بيانات المرسل
        messages: {
          create: {
            content: description,
            sender: TicketMessageSender.USER,
            senderName: token.name,
            senderImage: token.picture,
            attachments: { create: attachmentsData },
          },
        },
      },
      include: { attachments: true, messages: true },
    });

    // Real-time notification for Admin
    await pusherServer.trigger("admin-tickets", "new-ticket", {
      ...newTicket,
      createdAt: newTicket.createdAt.toISOString(),
    });

    return NextResponse.json({ success: true, data: newTicket });
  } catch (error) {
    console.error("Error creating ticket:", error);
    return NextResponse.json({ error: "Failed to create ticket" }, { status: 500 });
  }
}