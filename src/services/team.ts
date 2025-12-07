// src/services/team.ts

import { getDatabase } from '@/lib/mongodb';
import { ObjectId, WithId } from 'mongodb';

export interface TeamMember {
  _id?: string | ObjectId; // Allow both string and ObjectId for _id
  name: string;
  nameEn: string;
  role: string;
  roleEn: string;
  bio: string;
  bioEn: string;
  imageUrl: string;
  imageUrlEn: string;
  slug: string;
  socialMedia?: { platform: string; url: string }[];
  order: number;
  createdAt?: Date;
  updatedAt?: Date;
  // Add localized properties
  localizedName?: string;
  localizedRole?: string;
  localizedBio?: string;
  localizedImageUrl?: string;
}

export type TeamMemberDocument = WithId<TeamMember>;

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string, enText?: string) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// جلب جميع أعضاء الفريق
export async function fetchTeamMembers(language: string = 'ar'): Promise<TeamMember[]> {
  try {
    const db = await getDatabase();
    const teamMembers = await db.collection('teams')
      .find({})
      .sort({ order: 1, createdAt: -1 })
      .toArray() as TeamMemberDocument[];
    
    return teamMembers.map(member => ({
      ...member,
      _id: member._id.toString(),
      localizedName: getLocalizedText(language, member.name, member.nameEn),
      localizedRole: getLocalizedText(language, member.role, member.roleEn),
      localizedBio: getLocalizedText(language, member.bio, member.bioEn),
      localizedImageUrl: getLocalizedText(language, member.imageUrl, member.imageUrlEn)
    }));
  } catch (error) {
    console.error('Error fetching team members from MongoDB:', error);
    return [];
  }
}

// جلب عضو فريق بالمعرف
export async function fetchTeamMemberById(id: string): Promise<TeamMember | null> {
  try {
    const db = await getDatabase();
    const teamMember = await db.collection('teams').findOne({ 
      _id: new ObjectId(id) 
    }) as TeamMemberDocument;
    
    if (!teamMember) return null;
    
    return {
      ...teamMember,
      _id: teamMember._id.toString()
    };
  } catch (error) {
    console.error('Error fetching team member by ID from MongoDB:', error);
    return null;
  }
}

// جلب عضو فريق بالـ slug
export async function fetchTeamMemberBySlug(slug: string, language: string = 'ar'): Promise<TeamMember | null> {
  try {
    const db = await getDatabase();
    const teamMember = await db.collection('teams').findOne({ 
      slug: slug 
    }) as TeamMemberDocument;
    
    if (!teamMember) return null;
    
    return {
      ...teamMember,
      _id: teamMember._id.toString(),
      localizedName: getLocalizedText(language, teamMember.name, teamMember.nameEn),
      localizedRole: getLocalizedText(language, teamMember.role, teamMember.roleEn),
      localizedBio: getLocalizedText(language, teamMember.bio, teamMember.bioEn),
      localizedImageUrl: getLocalizedText(language, teamMember.imageUrl, teamMember.imageUrlEn)
    };
  } catch (error) {
    console.error('Error fetching team member by slug from MongoDB:', error);
    return null;
  }
}

// إنشاء عضو فريق جديد
export async function createTeamMember(teamMemberData: Omit<TeamMember, '_id' | 'createdAt' | 'updatedAt' | 'localizedName' | 'localizedRole' | 'localizedBio' | 'localizedImageUrl'>): Promise<TeamMember> {
  try {
    const db = await getDatabase();
    const newTeamMember = {
      ...teamMemberData,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    const result = await db.collection('teams').insertOne(newTeamMember);
    return {
      ...newTeamMember,
      _id: result.insertedId
    };
  } catch (error) {
    console.error('Error creating team member in MongoDB:', error);
    throw error;
  }
}

// تحديث عضو فريق
export async function updateTeamMember(teamMemberId: string, teamMemberData: Partial<TeamMember>): Promise<TeamMember | null> {
  try {
    const db = await getDatabase();
    const updateData = {
      ...teamMemberData,
      updatedAt: new Date()
    };
    
    const result = await db.collection('teams').findOneAndUpdate(
      { _id: new ObjectId(teamMemberId) },
      { $set: updateData },
      { returnDocument: 'after' }
    ) as TeamMemberDocument;
    
    if (!result) return null;
    
    return {
      ...result,
      _id: result._id.toString()
    };
  } catch (error) {
    console.error('Error updating team member in MongoDB:', error);
    throw error;
  }
}

// حذف عضو فريق
export async function deleteTeamMember(teamMemberId: string): Promise<boolean> {
  try {
    const db = await getDatabase();
    const result = await db.collection('teams').deleteOne({ 
      _id: new ObjectId(teamMemberId) 
    });
    return result.deletedCount > 0;
  } catch (error) {
    console.error('Error deleting team member from MongoDB:', error);
    throw error;
  }
}

// البحث عن أعضاء الفريق
export async function searchTeamMembers(query: string, language: string = 'ar'): Promise<TeamMember[]> {
  try {
    const db = await getDatabase();
    const searchRegex = new RegExp(query, 'i');
    
    const teamMembers = await db.collection('teams')
      .find({
        $or: [
          { name: searchRegex },
          { nameEn: searchRegex },
          { role: searchRegex },
          { roleEn: searchRegex },
          { bio: searchRegex },
          { bioEn: searchRegex }
        ]
      })
      .sort({ order: 1, createdAt: -1 })
      .toArray() as TeamMemberDocument[];
    
    return teamMembers.map(member => ({
      ...member,
      _id: member._id.toString(),
      localizedName: getLocalizedText(language, member.name, member.nameEn),
      localizedRole: getLocalizedText(language, member.role, member.roleEn),
      localizedBio: getLocalizedText(language, member.bio, member.bioEn),
      localizedImageUrl: getLocalizedText(language, member.imageUrl, member.imageUrlEn)
    }));
  } catch (error) {
    console.error('Error searching team members from MongoDB:', error);
    return [];
  }
}

// جلب أعضاء الفريق النشطين
export async function fetchActiveTeamMembers(language: string = 'ar'): Promise<TeamMember[]> {
  try {
    const db = await getDatabase();
    const teamMembers = await db.collection('teams')
      .find({ isActive: true })
      .sort({ order: 1, createdAt: -1 })
      .toArray() as TeamMemberDocument[];
    
    return teamMembers.map(member => ({
      ...member,
      _id: member._id.toString(),
      localizedName: getLocalizedText(language, member.name, member.nameEn),
      localizedRole: getLocalizedText(language, member.role, member.roleEn),
      localizedBio: getLocalizedText(language, member.bio, member.bioEn),
      localizedImageUrl: getLocalizedText(language, member.imageUrl, member.imageUrlEn)
    }));
  } catch (error) {
    console.error('Error fetching active team members from MongoDB:', error);
    return [];
  }
}

// تحديث ترتيب أعضاء الفريق
export async function updateTeamMembersOrder(updates: { id: string; order: number }[]): Promise<boolean> {
  try {
    const db = await getDatabase();
    
    for (const update of updates) {
      await db.collection('teams').updateOne(
        { _id: new ObjectId(update.id) },
        { $set: { order: update.order, updatedAt: new Date() } }
      );
    }
    
    return true;
  } catch (error) {
    console.error('Error updating team members order in MongoDB:', error);
    return false;
  }
}

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
export function getLocalizedTeamText(arText?: string, enText?: string, language: string = 'ar'): string {
  return getLocalizedText(language, arText, enText);
}