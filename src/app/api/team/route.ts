import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Team from '@/models/Team';

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching team members...");
    
    // Ensure database connection
    await connectDB();
    
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    console.log("Language parameter:", language);
    
    // Sort by order field, then by creation date
    const teamMembers = await Team.find({}).sort({ order: 1, createdAt: 1 });
    
    console.log(`Found ${teamMembers.length} team members`);
    
    return NextResponse.json({ 
      teamMembers,
      count: teamMembers.length 
    });
  } catch (error) {
    console.error('Error in team members API:', error);
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch team members',
        details: errorMessage
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    const teamMemberData = await request.json();
    
    // Check if slug already exists
    const existingMember = await Team.findOne({ slug: teamMemberData.slug });
    if (existingMember) {
      return NextResponse.json(
        { error: 'A team member with this slug already exists' },
        { status: 400 }
      );
    }
    
    const newMember = new Team({
      ...teamMemberData,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    await newMember.save();
    
    // إرسال إشعارات لجميع المستخدمين عند إضافة عضو فريق جديد
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'عضو جديد في الفريق',
        'New Team Member',
        `تم إضافة عضو جديد في الفريق: ${newMember.name}`,
        `A new team member has been added: ${newMember.nameEn || newMember.name}`,
        newMember._id.toString(),
        'team',
        `/team/${newMember.slug}` // افترض أن لديك صفحة لكل عضو
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({ teamMember: newMember }, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    return NextResponse.json(
      { error: 'Failed to create team member' },
      { status: 500 }
    );
  }
}