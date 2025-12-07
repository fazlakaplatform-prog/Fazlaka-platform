// src/app/api/admin/tickets/route.ts
import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import Ticket from "@/models/Ticket";

// تعريف واجهة لمرشحات البحث
interface TicketFilter {
  status?: string;
  category?: string;
  priority?: string;
  assignedTo?: string | null;
}

export async function GET(request: NextRequest) {
  try {
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const assignedTo = searchParams.get('assignedTo');

    // Build filter
    const filter: TicketFilter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (priority) filter.priority = priority;
    if (assignedTo !== null) filter.assignedTo = assignedTo;

    const tickets = await Ticket.find(filter).sort({ createdAt: -1 }).lean();

    // Calculate stats
    const stats = {
      total: await Ticket.countDocuments(),
      open: await Ticket.countDocuments({ status: 'open' }),
      inProgress: await Ticket.countDocuments({ status: 'in_progress' }),
      resolved: await Ticket.countDocuments({ status: 'resolved' }),
    };

    return NextResponse.json({ success: true, data: tickets, stats });
  } catch (error) {
    console.error("Error fetching admin tickets:", error);
    return NextResponse.json({ error: "Failed to fetch tickets" }, { status: 500 });
  }
}