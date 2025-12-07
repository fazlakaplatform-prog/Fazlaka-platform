import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/mongodb';
import Team from '@/models/Team';

export async function POST(request: NextRequest) {
  try {
    await connectDB();
    
    const { teamMembers } = await request.json();
    
    if (!teamMembers || !Array.isArray(teamMembers) || teamMembers.length === 0) {
      return NextResponse.json(
        { error: 'No team members provided' },
        { status: 400 }
      );
    }
    
    let imported = 0;
    const errors = []; // تم التغيير من let إلى const
    
    for (const memberData of teamMembers) {
      try {
        // Skip if no name or slug
        if (!memberData.name || !memberData.slug) {
          errors.push(`Skipping team member with missing name or slug`);
          continue;
        }
        
        // Check if team member with this slug already exists
        const existingMember = await Team.findOne({ slug: memberData.slug });
        
        const memberUpdateData = {
          name: memberData.name,
          nameEn: memberData.nameEn || memberData['Name (EN)'] || memberData.name,
          role: memberData.role || memberData['Role'],
          roleEn: memberData.roleEn || memberData['Role (EN)'] || memberData.role,
          bio: memberData.bio || memberData['Bio'],
          bioEn: memberData.bioEn || memberData['Bio (EN)'] || memberData.bio,
          imageUrl: memberData.imageUrl || memberData['Image URL'],
          imageUrlEn: memberData.imageUrlEn || memberData['Image URL (EN)'] || memberData.imageUrl,
          slug: memberData.slug,
          order: memberData.order || 0,
          socialMedia: memberData.socialMedia || [],
          updatedAt: new Date()
        };
        
        if (existingMember) {
          // Update existing team member
          await Team.updateOne(
            { slug: memberData.slug },
            { $set: memberUpdateData }
          );
          imported++;
        } else {
          // Create new team member
          const newMember = new Team({
            ...memberUpdateData,
            createdAt: memberData.createdAt || memberData['Created At'] ? new Date(memberData.createdAt || memberData['Created At']) : new Date()
          });
          
          await newMember.save();
          imported++;
        }
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