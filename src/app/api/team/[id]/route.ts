import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Team from '@/models/Team';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const teamMember = await Team.findById(id);
    
    if (!teamMember) {
      return NextResponse.json(
        { error: 'Team member not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({ teamMember });
  } catch (error) {
    console.error('Error in team member API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team member' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    const teamMemberData = await request.json();
    
    const updatedMember = await Team.findByIdAndUpdate(
      id,
      { ...teamMemberData, updatedAt: new Date() },
      { new: true, runValidators: true }
    );
    
    if (!updatedMember) {
      return NextResponse.json(
        { error: 'Team member not found or update failed' },
        { status: 404 }
      );
    }
    
    // إرسال إشعار بالتحديث - استخدام URL كامل
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
      
      await fetch(`${baseUrl}/api/stream/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'change',
          collection: 'teams',
          operation: 'update',
          id: id
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json({ teamMember: updatedMember });
  } catch (error) {
    console.error('Error in team member API:', error);
    return NextResponse.json(
      { error: 'Failed to update team member' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await connectDB();
    const { id } = await params;
    
    const deletedMember = await Team.findByIdAndDelete(id);
    
    if (!deletedMember) {
      return NextResponse.json(
        { error: 'Team member not found or deletion failed' },
        { status: 404 }
      );
    }
    
    // إرسال إشعار بالحذف - استخدام URL كامل
    try {
      const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 
                     (process.env.NODE_ENV === 'development' ? 'http://localhost:3000' : '');
      
      await fetch(`${baseUrl}/api/stream/notify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'change',
          collection: 'teams',
          operation: 'delete',
          id: id
        }),
      });
    } catch (notifyError) {
      console.error('Error sending notification:', notifyError);
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in team member API:', error);
    return NextResponse.json(
      { error: 'Failed to delete team member' },
      { status: 500 }
    );
  }
}