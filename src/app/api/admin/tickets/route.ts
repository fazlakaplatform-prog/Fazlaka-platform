import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { TicketStatus, TicketCategory, TicketPriority, Prisma } from "@prisma/client"; // تمت إضافة Prisma

// Helper mapping
// تم تعديل الدالة لتتجاهل 'all' وترجع undefined
const mapStatus = (val: string | null): TicketStatus | undefined => {
  if (!val || val.toLowerCase() === 'all') return undefined;
  return val.toUpperCase().replace('-', '_') as TicketStatus;
};

const mapCategory = (val: string | null): TicketCategory | undefined => {
  if (!val) return undefined;
  return val.toUpperCase() as TicketCategory;
};

const mapPriority = (val: string | null): TicketPriority | undefined => {
  if (!val) return undefined;
  return val.toUpperCase() as TicketPriority;
};

export async function GET(request: NextRequest) {
  try {
    // TODO: Add Admin Authentication Check Here
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');

    // Build filter
    // تم إصلاح الخطأ هنا: استخدام نوع Prisma الصحيح
    const where: Prisma.TicketWhereInput = {};
    
    // نستخدم الدالة المعدلة
    const statusFilter = mapStatus(status);
    if (statusFilter) where.status = statusFilter;
    
    const categoryFilter = mapCategory(category);
    if (categoryFilter) where.category = categoryFilter;
    
    const priorityFilter = mapPriority(priority);
    if (priorityFilter) where.priority = priorityFilter;
    
    if (assignedTo !== null) where.assignedTo = assignedTo;

    const tickets = await prisma.ticket.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        attachments: true,
      }
    });

    // Calculate stats
    const stats = {
      total: await prisma.ticket.count(),
      open: await prisma.ticket.count({ where: { status: TicketStatus.OPEN } }),
      inProgress: await prisma.ticket.count({ where: { status: TicketStatus.IN_PROGRESS } }),
      resolved: await prisma.ticket.count({ where: { status: TicketStatus.RESOLVED } }),
    };

    return NextResponse.json({ success: true, data: tickets, stats });
  } catch (error) {
    console.error("Error fetching admin tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}