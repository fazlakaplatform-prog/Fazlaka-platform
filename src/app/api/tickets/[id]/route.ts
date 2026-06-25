import { NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import { prisma } from "@/lib/prisma";
import { TicketStatus, TicketMessageSender } from "@prisma/client";
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

// GET: جلب تفاصيل التذكرة
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const ticket = await prisma.ticket.findFirst({
      where: { id, userId: token.sub },
      include: {
        attachments: true,
        messages: {
          include: { attachments: true },
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: ticket });
  } catch (_error) { // تم إصلاح التحذير: استخدام _error
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

// POST: إضافة رد (نص أو صورة)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    const formData = await request.formData();
    const message = formData.get("message") as string;
    const file = formData.get("file") as File | null;

    const ticket = await prisma.ticket.findFirst({ where: { id, userId: token.sub } });
    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });

    // تم إصلاح الخطأ: استخدام const وتحديد النوع بدلاً من any
    const attachmentsData: { name: string; url: string; isImage: boolean; type: string; size: number }[] = [];
    
    // معالجة الصورة إذا وجدت
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

    // إنشاء الرسالة مع حفظ بيانات المرسل
    const newMessage = await prisma.ticketMessage.create({
      data: {
        ticketId: id,
        content: message || "",
        sender: TicketMessageSender.USER,
        senderName: token.name || "User",      // <--- تمت الإضافة
        senderImage: token.picture || null,    // <--- تمت الإضافة
        attachments: { create: attachmentsData },
      },
      include: { attachments: true }
    });

    // تحديث التذكرة
    await prisma.ticket.update({
      where: { id },
      data: { status: TicketStatus.IN_PROGRESS, updatedAt: new Date() },
    });

    // إرسال حدث Realtime
    await pusherServer.trigger(`private-ticket-${id}`, 'new-message', {
      ...newMessage,
      createdAt: newMessage.createdAt.toISOString()
    });

    return NextResponse.json({ success: true, data: newMessage });
  } catch (error) {
    console.error("POST Error:", error);
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 });
  }
}

// PUT: إغلاق التذكرة
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    if (!token || !token.sub) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const { id } = await params;
    
    await prisma.ticket.update({
      where: { id, userId: token.sub },
      data: { status: TicketStatus.CLOSED, resolvedAt: new Date() },
    });

    return NextResponse.json({ success: true });
  } catch (_error) { // تم إصلاح التحذير: استخدام _error
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}