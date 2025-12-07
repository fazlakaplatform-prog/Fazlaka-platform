// src/app/api/admin/tickets/[id]/route.ts
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

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await connectDB();
    
    const ticket = await Ticket.findById(id);
    
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, data: ticket });
  } catch (error) {
    console.error("Error fetching ticket:", error);
    return NextResponse.json({ error: "Failed to fetch ticket" }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { status, assignedTo, reply } = await request.json();

    await connectDB();
    
    const ticket = await Ticket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
    }

    // Update fields
    if (status) ticket.status = status;
    if (assignedTo) ticket.assignedTo = assignedTo;
    
    // Add admin reply
    if (reply) {
      ticket.messages.push({
        content: reply,
        sender: 'admin',
        createdAt: new Date(),
      });
    }

    await ticket.save();

    // TODO: Send email notification to user about update

    return NextResponse.json({ success: true, message: "Ticket updated successfully" });
  } catch (error) {
    console.error("Error updating ticket:", error);
    return NextResponse.json({ error: "Failed to update ticket" }, { status: 500 });
  }
}