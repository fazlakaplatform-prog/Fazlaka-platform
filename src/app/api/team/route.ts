import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { createTeamMember } from '@/services/team';

export async function GET(request: NextRequest) {
  try {
    console.log("Fetching team members...");
    
    const { searchParams } = new URL(request.url);
    const language = searchParams.get('language') || 'ar';
    
    console.log("Language parameter:", language);
    
    // Sort by order field, then by creation date
    const teamMembers = await prisma.team.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'asc' }
      ]
    });
    
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
    const teamMemberData = await request.json();
    
    // استخدام الخدمة لإنشاء العضو (وهي تتولى Slug والتحقق)
    const newMember = await createTeamMember(teamMemberData);
    
    // إرسال إشعارات لجميع المستخدمين عند إضافة عضو فريق جديد
    try {
      const { notifyAllUsers } = await import('@/services/notifications');
      await notifyAllUsers(
        'عضو جديد في الفريق',
        'New Team Member',
        `تم إضافة عضو جديد في الفريق: ${newMember.name}`,
        `A new team member has been added: ${newMember.nameEn || newMember.name}`,
        newMember.id,
        'team',
        `/team/${newMember.slug}`
      );
    } catch (notifyError) {
      console.error('Error sending notifications:', notifyError);
    }
    
    return NextResponse.json({ teamMember: newMember }, { status: 201 });
  } catch (error) {
    console.error('Error creating team member:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to create team member';
    
    // التعامل مع خطأ تكرار الـ slug أو الأخطاء الأخرى
    const status = errorMessage.includes('already exists') ? 400 : 500;
    
    return NextResponse.json(
      { error: errorMessage },
      { status }
    );
  }
}