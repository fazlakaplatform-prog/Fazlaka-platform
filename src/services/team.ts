import { prisma } from '@/lib/prisma';
import { Team, Prisma } from '@prisma/client';

// واجهة البيانات كما نستقبلها من الـ API
// نستخدم أنواع Prisma للإدخال لضمان التوافق، مع استبعاد الحقول التوليدية
export type TeamMemberInput = Omit<Prisma.TeamCreateInput, 'id' | 'createdAt' | 'updatedAt'>;

// واجهة البيانات الموسعة مع النصوص المترجمة للعرض في الواجهة الأمامية
export interface TeamMemberView extends Team {
  localizedName?: string;
  localizedRole?: string;
  localizedBio?: string;
  localizedImageUrl?: string;
}

// دالة مساعدة لتوليد Slug
const generateSlug = (name: string, nameEn: string): string => {
  const nameToUse = nameEn || name;
  return nameToUse
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
};

// دالة للحصول على النص المناسب بناءً على اللغة
const getLocalizedText = (language: string, arText?: string | null, enText?: string | null) => {
  return language === 'ar' ? (arText || '') : (enText || '');
};

// جلب جميع أعضاء الفريق
export async function fetchTeamMembers(language: string = 'ar'): Promise<TeamMemberView[]> {
  try {
    const teamMembers = await prisma.team.findMany({
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    return teamMembers.map(member => ({
      ...member,
      localizedName: getLocalizedText(language, member.name, member.nameEn),
      localizedRole: getLocalizedText(language, member.role, member.roleEn),
      localizedBio: getLocalizedText(language, member.bio, member.bioEn),
      localizedImageUrl: getLocalizedText(language, member.imageUrl, member.imageUrlEn)
    }));
  } catch (error) {
    console.error('Error fetching team members:', error);
    return [];
  }
}

// جلب عضو فريق بالمعرف
export async function fetchTeamMemberById(id: string): Promise<Team | null> {
  try {
    return await prisma.team.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error('Error fetching team member by ID:', error);
    return null;
  }
}

// جلب عضو فريق بالـ slug
export async function fetchTeamMemberBySlug(slug: string, language: string = 'ar'): Promise<TeamMemberView | null> {
  try {
    const teamMember = await prisma.team.findUnique({
      where: { slug }
    });
    
    if (!teamMember) return null;
    
    return {
      ...teamMember,
      localizedName: getLocalizedText(language, teamMember.name, teamMember.nameEn),
      localizedRole: getLocalizedText(language, teamMember.role, teamMember.roleEn),
      localizedBio: getLocalizedText(language, teamMember.bio, teamMember.bioEn),
      localizedImageUrl: getLocalizedText(language, teamMember.imageUrl, teamMember.imageUrlEn)
    };
  } catch (error) {
    console.error('Error fetching team member by slug:', error);
    return null;
  }
}

// إنشاء عضو فريق جديد
export async function createTeamMember(data: TeamMemberInput): Promise<Team> {
  try {
    // التأكد من وجود قيم للحقول المطلوبة
    const name = data.name || '';
    const nameEn = (data.nameEn || data.name || '') as string;
    
    // توليد slug إذا لم يكن موجوداً
    let finalSlug = data.slug;
    if (!finalSlug) {
      finalSlug = generateSlug(name, nameEn);
    }

    // التحقق من عدم تكرار الـ slug
    const existing = await prisma.team.findUnique({ where: { slug: finalSlug } });
    if (existing) {
      throw new Error('A team member with this slug already exists');
    }

    return await prisma.team.create({
      data: {
        name,
        nameEn,
        role: data.role,
        roleEn: data.roleEn,
        bio: data.bio,
        bioEn: data.bioEn,
        imageUrl: data.imageUrl,
        imageUrlEn: data.imageUrlEn,
        order: data.order || 0,
        socialMedia: data.socialMedia as Prisma.InputJsonValue, // تحويل النوع للتوافق مع Prisma JSON
        slug: finalSlug
      }
    });
  } catch (error) {
    console.error('Error creating team member:', error);
    throw error;
  }
}

// تحديث عضو فريق
export async function updateTeamMember(id: string, data: Partial<TeamMemberInput>): Promise<Team | null> {
  try {
    // بناء كائن التحديث يدوياً لتجنب مشاكل الأنواع
    const updateData: Prisma.TeamUpdateInput = {};
    
    if (data.name !== undefined) updateData.name = data.name;
    if (data.nameEn !== undefined) updateData.nameEn = data.nameEn;
    if (data.role !== undefined) updateData.role = data.role;
    if (data.roleEn !== undefined) updateData.roleEn = data.roleEn;
    if (data.bio !== undefined) updateData.bio = data.bio;
    if (data.bioEn !== undefined) updateData.bioEn = data.bioEn;
    if (data.imageUrl !== undefined) updateData.imageUrl = data.imageUrl;
    if (data.imageUrlEn !== undefined) updateData.imageUrlEn = data.imageUrlEn;
    if (data.order !== undefined) updateData.order = data.order;
    if (data.socialMedia !== undefined) updateData.socialMedia = data.socialMedia as Prisma.InputJsonValue;
    if (data.slug !== undefined) updateData.slug = data.slug;

    return await prisma.team.update({
      where: { id },
      data: updateData
    });
  } catch (error) {
    console.error('Error updating team member:', error);
    throw error;
  }
}

// حذف عضو فريق
export async function deleteTeamMember(id: string): Promise<boolean> {
  try {
    await prisma.team.delete({
      where: { id }
    });
    return true;
  } catch (error) {
    console.error('Error deleting team member:', error);
    throw error;
  }
}

// البحث عن أعضاء الفريق
export async function searchTeamMembers(query: string, language: string = 'ar'): Promise<TeamMemberView[]> {
  try {
    const teamMembers = await prisma.team.findMany({
      where: {
        OR: [
          { name: { contains: query, mode: 'insensitive' } },
          { nameEn: { contains: query, mode: 'insensitive' } },
          { role: { contains: query, mode: 'insensitive' } },
          { roleEn: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
          { bioEn: { contains: query, mode: 'insensitive' } }
        ]
      },
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    return teamMembers.map(member => ({
      ...member,
      localizedName: getLocalizedText(language, member.name, member.nameEn),
      localizedRole: getLocalizedText(language, member.role, member.roleEn),
      localizedBio: getLocalizedText(language, member.bio, member.bioEn),
      localizedImageUrl: getLocalizedText(language, member.imageUrl, member.imageUrlEn)
    }));
  } catch (error) {
    console.error('Error searching team members:', error);
    return [];
  }
}

// جلب أعضاء الفريق (تمت إزالة فلتر isActive لأنه غير موجود في schema الجديد)
export async function fetchActiveTeamMembers(language: string = 'ar'): Promise<TeamMemberView[]> {
  // يتم استدعاء نفس دالة جلب الكل لأن الحقل غير موجود حالياً
  return fetchTeamMembers(language);
}

// تحديث ترتيب أعضاء الفريق
export async function updateTeamMembersOrder(updates: { id: string; order: number }[]): Promise<boolean> {
  try {
    // استخدام transaction لضمان تحديث الجميع بنجاح أو فشل الكل
    await prisma.$transaction(
      updates.map(update => 
        prisma.team.update({
          where: { id: update.id },
          data: { order: update.order }
        })
      )
    );
    
    return true;
  } catch (error) {
    console.error('Error updating team members order:', error);
    return false;
  }
}

// دالة مساعدة للحصول على النص المناسب بناءً على اللغة
export function getLocalizedTeamText(arText?: string | null, enText?: string | null, language: string = 'ar'): string {
  return getLocalizedText(language, arText, enText);
}