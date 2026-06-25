import { Role } from '@prisma/client'; // استيراد الأنواع فقط من Prisma Client
import { prisma } from '@/lib/prisma'; // استيراد نسخة Prisma من الملف المحلي

export interface UserData {
  id: string;
  name: string | null;
  email: string | null;
  image?: string | null;
  bio?: string | null;
  location?: string | null;
  website?: string | null;
  interests?: string[];
  createdAt: Date;
  banner?: string | null;
  isActive: boolean;
  role: Role; // استخدام نوع Role من Prisma
  banned: boolean;
  isVerified?: boolean;
  secondaryEmails?: {
    id: string;
    email: string;
    isVerified: boolean;
  }[];
}

export async function fetchUserData(userId: string): Promise<UserData | null> {
  try {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        secondaryEmails: true,
      },
    });
    
    if (!user) {
      return null;
    }
    
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      image: user.image,
      bio: user.bio,
      location: user.location,
      website: user.website,
      interests: [], 
      createdAt: user.createdAt,
      banner: user.banner,
      isActive: user.isActive,
      role: user.role,
      banned: user.banned,
      isVerified: user.verificationToken ? false : true,
      secondaryEmails: (user.secondaryEmails || []).map(email => ({
        id: email.id,
        email: email.email,
        isVerified: email.isVerified,
      })),
    };
  } catch (error) {
    console.error('Error fetching user data:', error);
    return null;
  }
}

export async function updateUserInterests(_userId: string, _interests: string[]): Promise<boolean> {
  try {
    // حقل interests غير موجود في المخطط الحالي
    // المتغيرات غير مستخدمة لذا تم وضع _ قبلها
    console.warn('Interests field not implemented in Prisma schema yet');
    return true;
  } catch (error) {
    console.error('Error updating user interests:', error);
    return false;
  }
}

export async function updateUserProfile(userId: string, data: {
  name?: string;
  bio?: string;
  location?: string;
  website?: string;
  image?: string;
  banner?: string;
}): Promise<boolean> {
  try {
    const result = await prisma.user.update({
      where: { id: userId },
      data,
    });
    
    return !!result;
  } catch (error) {
    console.error('Error updating user profile:', error);
    return false;
  }
}

export async function addSecondaryEmail(userId: string, email: string): Promise<boolean> {
  try {
    const result = await prisma.secondaryEmail.create({
      data: {
        email,
        userId,
      },
    });
    
    return !!result;
  } catch (error) {
    console.error('Error adding secondary email:', error);
    return false;
  }
}

export async function verifySecondaryEmail(emailId: string): Promise<boolean> {
  try {
    const result = await prisma.secondaryEmail.update({
      where: { id: emailId },
      data: { isVerified: true },
    });
    
    return !!result;
  } catch (error) {
    console.error('Error verifying secondary email:', error);
    return false;
  }
}