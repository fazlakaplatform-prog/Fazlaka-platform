// app/api/terms/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET: Fetch single term by ID
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const term = await prisma.terms.findUnique({
      where: { id },
      include: { items: true }
    });
    
    if (!term) {
      return NextResponse.json(
        { success: false, error: 'Terms content not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ success: true, data: term });
  } catch (error) {
    console.error('Error fetching terms content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch terms content' },
      { status: 500 }
    );
  }
}

// PUT: Update term by ID
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { items, ...updateData } = body;

    // Use transaction to safely update related items
    const updatedTerm = await prisma.$transaction(async (tx) => {
      // 1. Delete old items if new items are provided
      if (items !== undefined) {
        await tx.termsItem.deleteMany({ where: { termsId: id } });
      }

      // 2. Update main term and create new items if provided
      return await tx.terms.update({
        where: { id },
        data: {
          ...updateData,
          items: items ? {
            create: items.map((item: { item: string; itemEn?: string }) => ({
              item: item.item,
              itemEn: item.itemEn || null
            }))
          } : undefined
        },
        include: { items: true }
      });
    });
    
    // Optional: Notify update
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
      
      await fetch(`${baseUrl}/api/stream/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'change',
          collection: 'terms',
          operation: 'update',
          id: id
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json({ success: true, data: updatedTerm });
  } catch (error) {
    console.error('Error updating terms content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update terms content' },
      { status: 500 }
    );
  }
}

// DELETE: Remove term by ID
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    // Items are deleted automatically due to onDelete: Cascade
    await prisma.terms.delete({ where: { id } });
    
    // Optional: Notify deletion
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
      
      await fetch(`${baseUrl}/api/stream/notify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'change',
          collection: 'terms',
          operation: 'delete',
          id: id
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json(
      { success: true, message: 'Terms content deleted successfully' }
    );
  } catch (error) {
    console.error('Error deleting terms content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete terms content' },
      { status: 500 }
    );
  }
}