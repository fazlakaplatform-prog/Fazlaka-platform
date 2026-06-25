import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(request: NextRequest) {
  try {
    const { teamMembers } = await request.json();
    
    if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
      return NextResponse.json(
        { error: 'No team members provided' },
        { status: 400 }
      );
    }
    
    let imported = 0;
    const errors: string[] = [];
    
    for (const memberData of teamMembers) {
      try {
        if (!memberData.name || !memberData.slug) {
          errors.push(`Skipping team member with missing name or slug`);
          continue;
        }
        
        const slug = memberData.slug;
        
        // تجهيز البيانات للتحديث أو الإنشاء
        const dataToUpsert = {
          name: memberData.name,
          nameEn: memberData.nameEn || memberData['Name (EN)'] || memberData.name,
          role: memberData.role || memberData['Role'],
          roleEn: memberData.roleEn || memberData['Role (EN)'] || memberData.role,
          bio: memberData.bio || memberData['Bio'],
          bioEn: memberData.bioEn || memberData['Bio (EN)'] || memberData.bio,
          imageUrl: memberData.imageUrl || memberData['Image URL'],
          imageUrlEn: memberData.imageUrlEn || memberData['Image URL (EN)'] || memberData.imageUrl,
          order: memberData.order || 0,
          socialMedia: memberData.socialMedia || [],
          updatedAt: new Date()
        };

        // استخدام upsert لتحديث إذا وجد أو إنشاء جديد
        await prisma.team.upsert({
          where: { slug },
          update: dataToUpsert,
          create: {
            ...dataToUpsert,
            slug,
            createdAt: memberData.createdAt || memberData['Created At'] ? new Date(memberData.createdAt || memberData['Created At']) : new Date()
          }
        });
        
        imported++;
      } catch (error) {
        console.error('Error importing team member:', error);
        errors.push(`Error importing team member: ${memberData.name || memberData.slug || 'Unknown'}`);
      }
    }
    
    return NextResponse.json({ 
      imported,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error in import API:', error);
    return NextResponse.json(
      { error: 'Failed to import team members' },
      { status: 500 }
    );
  }
}