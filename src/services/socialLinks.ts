import { prisma } from '@/lib/prisma';
import { SocialLink } from '@prisma/client';

export async function getSocialLinks(teamId?: string): Promise<SocialLink[]> {
  try {
    const where = teamId ? { teamId } : {};

    const socialLinks = await prisma.socialLink.findMany({
      where,
      orderBy: [
        { order: 'asc' },
        { createdAt: 'desc' }
      ]
    });
    
    return socialLinks;
  } catch (error) {
    console.error('Error fetching social links:', error);
    throw error;
  }
}

export async function getSocialLinkById(id: string): Promise<SocialLink | null> {
  try {
    return await prisma.socialLink.findUnique({
      where: { id }
    });
  } catch (error) {
    console.error('Error fetching social link by id:', error);
    throw error;
  }
}

export async function createSocialLink(data: {
  platform: string;
  url: string;
  isActive?: boolean;
  order?: number | string; // قبول النص أو الرقم
  teamId?: string | null;
}): Promise<SocialLink> {
  try {
    // تحويل الترتيب إلى رقم (Number) بشكل آمن
    const orderValue = typeof data.order === 'string' 
      ? parseInt(data.order, 10) 
      : (data.order || 0);

    const newLink = await prisma.socialLink.create({
      data: {
        platform: data.platform,
        url: data.url,
        isActive: data.isActive ?? true,
        order: orderValue,
        // إرسال null بشكل صريح إذا لم يتم توفير teamId
        teamId: data.teamId || null
      }
    });
    
    return newLink;
  } catch (error) {
    console.error('Error creating social link:', error);
    throw error;
  }
}

export async function updateSocialLink(id: string, data: Partial<SocialLink>): Promise<SocialLink> {
  try {
    const updatedLink = await prisma.socialLink.update({
      where: { id },
      data: {
        ...data,
        updatedAt: new Date()
      }
    });
    
    return updatedLink;
  } catch (error) {
    console.error('Error updating social link:', error);
    throw error;
  }
}

export async function deleteSocialLink(id: string): Promise<SocialLink> {
  try {
    const deletedLink = await prisma.socialLink.delete({
      where: { id }
    });
    
    return deletedLink;
  } catch (error) {
    console.error('Error deleting social link:', error);
    throw error;
  }
}