import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function isRtl(language: string = 'ar'): boolean {
  return language === 'ar';
}

export function formatDate(dateString: string, language: string = 'ar'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  
  if (diffInSeconds < 60) return language === 'ar' ? 'الآن' : 'Just now';
  if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return language === 'ar' ? `منذ ${minutes} دقيقة` : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  }
  if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return language === 'ar' ? `منذ ${hours} ساعة` : `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }
  const days = Math.floor(diffInSeconds / 86400);
  return language === 'ar' ? `منذ ${days} يوم` : `${days} day${days > 1 ? 's' : ''} ago`;
}