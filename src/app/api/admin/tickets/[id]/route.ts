import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth"; // تأكد من المسار الصحيح
import { prisma } from "@/lib/prisma";
import { TicketStatus, TicketMessageSender, Prisma } from "@prisma/client"; // تمت إضافة Prisma
import { pusherServer } from "@/lib/pusher";

// دالة رفع الصور
async function uploadImageToImgBB(file: File): Promise<string> {
  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);
  const base64Image = buffer.toString("base64");
  const formData = new FormData();
  formData.append("key", process.env.IMGBB_API_KEY || "");
  formData.append("image", base64Image);
  const response = await fetch("https://api.imgbb.com/1/upload", { method: "POST", body: formData });
  if (!response.ok) throw new Error("Failed to upload image");
  return (await response.json()).data.url;
}

// GET Ticket Details
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    // تمت إضافة "as string" هنا
    if (!session || !['ADMIN', 'OWNER', 'EDITOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        attachments: true,
        messages: { include: { attachments: true }, orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

// PUT: Reply or Change Status
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    // وتمت إضافة "as string" هنا أيضاً
    if (!session || !['ADMIN', 'OWNER', 'EDITOR'].includes(session.user.role as string)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const formData = await request.formData();
    
    const reply = formData.get("reply") as string;
    const status = formData.get("status") as string; // يمكن أن يكون RESOLVED أو CLOSED
    const file = formData.get("file") as File | null;

    // تم إصلاح الخطأ: استخدام نوع Prisma الصحيح
    const updateData: Prisma.TicketUpdateInput = { updatedAt: new Date() };
    
    // تحديث الحالة (مثلاً غلق التذكرة)
    if (status) {
        // تحويل النص إلى Enum
        updateData.status = status as TicketStatus;
        if (status === 'RESOLVED') updateData.resolvedAt = new Date();
    }

    // إذا كان هناك رد
    if (reply || file) {
      // تم إصلاح الخطأ: استخدام const وتحديد النوع
      const attachmentsData: { name: string; url: string; isImage: boolean; type: string; size: number }[] = [];
      if (file && file.size > 0) {
        const url = await uploadImageToImgBB(file);
        attachmentsData.push({ name: file.name, url, isImage: true, type: file.type, size: file.size });
      }

      const newMsg = await prisma.ticketMessage.create({
        data: {
          ticketId: id,
          content: reply || "",
          sender: TicketMessageSender.ADMIN,
          senderName: session.user.name || "Support Team", // حفظ اسم الأدمن
          senderImage: session.user.image || null,         // حفظ صورة الأدمن
          attachments: { create: attachmentsData },
        },
        include: { attachments: true }
      });

      await pusherServer.trigger(`private-ticket-${id}`, 'new-message', {
        ...newMsg,
        createdAt: newMsg.createdAt.toISOString()
      });

      if (!status) updateData.status = TicketStatus.WAITING_FOR_USER;
    }

    await prisma.ticket.update({ where: { id }, data: updateData });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Admin PUT Error:", error);
    return NextResponse.json({ error: "Failed to update" }, { status: 500 });
  }
}