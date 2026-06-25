/**
 * دالة لتنسيق التاريخ بناءً على اللغة
 */
export function formatDate(dateString: string | Date, language: string = 'ar'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) {
    const diffHours = Math.floor(diffTime / (1000 * 60 * 60));
    if (diffHours === 0) {
      const diffMinutes = Math.floor(diffTime / (1000 * 60));
      if (diffMinutes === 0) {
        return language === 'ar' ? 'الآن' : 'Just now';
      }
      return language === 'ar' 
        ? `منذ ${diffMinutes} دقيقة` 
        : `${diffMinutes} minute${diffMinutes > 1 ? 's' : ''} ago`;
    }
    return language === 'ar' 
      ? `منذ ${diffHours} ساعة` 
      : `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  } else if (diffDays === 1) {
    return language === 'ar' ? 'أمس' : 'Yesterday';
  } else if (diffDays < 7) {
    return language === 'ar' 
      ? `منذ ${diffDays} أيام` 
      : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  } else if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7);
    return language === 'ar' 
      ? `منذ ${weeks} أسبوع${weeks > 1 ? '' : 'ين'}` 
      : `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (diffDays < 365) {
    const months = Math.floor(diffDays / 30);
    return language === 'ar' 
      ? `منذ ${months} شهر${months > 1 ? '' : 'ين'}` 
      : `${months} month${months > 1 ? 's' : ''} ago`;
  } else {
    // Format as full date
    return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}

/**
 * دالة لتنسيق التاريخ الكامل
 */
export function formatFullDate(dateString: string | Date, language: string = 'ar'): string {
  const date = new Date(dateString);
  
  return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * دالة لتنسيق التاريخ القصير
 */
export function formatShortDate(dateString: string | Date, language: string = 'ar'): string {
  const date = new Date(dateString);
  
  return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

/**
 * دالة لتنسيق الوقت فقط
 */
export function formatTime(dateString: string | Date, language: string = 'ar'): string {
  const date = new Date(dateString);
  
  return date.toLocaleTimeString(language === 'ar' ? 'ar-SA' : 'en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * دالة للحصول على الوقت النسبي
 */
export function getRelativeTime(dateString: string | Date, language: string = 'ar'): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  
  const seconds = Math.floor(diffTime / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);
  const weeks = Math.floor(days / 7);
  const months = Math.floor(days / 30);
  const years = Math.floor(days / 365);
  
  if (years > 0) {
    return language === 'ar' 
      ? `منذ ${years} سنة${years > 1 ? '' : 'ات'}` 
      : `${years} year${years > 1 ? 's' : ''} ago`;
  } else if (months > 0) {
    return language === 'ar' 
      ? `منذ ${months} شهر${months > 1 ? '' : 'ين'}` 
      : `${months} month${months > 1 ? 's' : ''} ago`;
  } else if (weeks > 0) {
    return language === 'ar' 
      ? `منذ ${weeks} أسبوع${weeks > 1 ? '' : 'ين'}` 
      : `${weeks} week${weeks > 1 ? 's' : ''} ago`;
  } else if (days > 0) {
    return language === 'ar' 
      ? `منذ ${days} يوم${days > 1 ? '' : 'ين'}` 
      : `${days} day${days > 1 ? 's' : ''} ago`;
  } else if (hours > 0) {
    return language === 'ar' 
      ? `منذ ${hours} ساعة${hours > 1 ? '' : 'ات'}` 
      : `${hours} hour${hours > 1 ? 's' : ''} ago`;
  } else if (minutes > 0) {
    return language === 'ar' 
      ? `منذ ${minutes} دقيقة${minutes > 1 ? '' : 'ات'}` 
      : `${minutes} minute${minutes > 1 ? 's' : ''} ago`;
  } else {
    return language === 'ar' ? 'الآن' : 'Just now';
  }
}

/**
 * دالة للتحقق مما إذا كان التاريخ اليوم
 */
export function isToday(dateString: string | Date): boolean {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.toDateString() === today.toDateString();
}

/**
 * دالة للتحقق مما إذا كان التاريخ بالأمس
 */
export function isYesterday(dateString: string | Date): boolean {
  const date = new Date(dateString);
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  
  return date.toDateString() === yesterday.toDateString();
}

/**
 * دالة للتحقق مما إذا كان التاريخ في هذا الأسبوع
 */
export function isThisWeek(dateString: string | Date): boolean {
  const date = new Date(dateString);
  const today = new Date();
  const weekStart = new Date(today.setDate(today.getDate() - today.getDay()));
  const weekEnd = new Date(today.setDate(today.getDate() - today.getDay() + 6));
  
  return date >= weekStart && date <= weekEnd;
}

/**
 * دالة للتحقق مما إذا كان التاريخ في هذا الشهر
 */
export function isThisMonth(dateString: string | Date): boolean {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getMonth() === today.getMonth() && 
         date.getFullYear() === today.getFullYear();
}

/**
 * دالة للتحقق مما إذا كان التاريخ في هذه السنة
 */
export function isThisYear(dateString: string | Date): boolean {
  const date = new Date(dateString);
  const today = new Date();
  
  return date.getFullYear() === today.getFullYear();
}

/**
 * دالة للحصول على بداية اليوم
 */
export function getStartOfDay(date: Date = new Date()): Date {
  const startOfDay = new Date(date);
  startOfDay.setHours(0, 0, 0, 0);
  return startOfDay;
}

/**
 * دالة للحصول على نهاية اليوم
 */
export function getEndOfDay(date: Date = new Date()): Date {
  const endOfDay = new Date(date);
  endOfDay.setHours(23, 59, 59, 999);
  return endOfDay;
}

/**
 * دالة للحصول على بداية الأسبوع
 */
export function getStartOfWeek(date: Date = new Date()): Date {
  const startOfWeek = new Date(date);
  const day = startOfWeek.getDay();
  const diff = startOfWeek.getDate() - day + (day === 0 ? -6 : 1);
  startOfWeek.setDate(diff);
  startOfWeek.setHours(0, 0, 0, 0);
  return startOfWeek;
}

/**
 * دالة للحصول على نهاية الأسبوع
 */
export function getEndOfWeek(date: Date = new Date()): Date {
  const endOfWeek = new Date(date);
  const day = endOfWeek.getDay();
  const diff = endOfWeek.getDate() - day + (day === 0 ? -6 : 1) + 6;
  endOfWeek.setDate(diff);
  endOfWeek.setHours(23, 59, 59, 999);
  return endOfWeek;
}

/**
 * دالة للحصول على بداية الشهر
 */
export function getStartOfMonth(date: Date = new Date()): Date {
  const startOfMonth = new Date(date);
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);
  return startOfMonth;
}

/**
 * دالة للحصول على نهاية الشهر
 */
export function getEndOfMonth(date: Date = new Date()): Date {
  const endOfMonth = new Date(date);
  endOfMonth.setMonth(endOfMonth.getMonth() + 1);
  endOfMonth.setDate(0);
  endOfMonth.setHours(23, 59, 59, 999);
  return endOfMonth;
}

/**
 * دالة لإضافة أيام إلى تاريخ
 */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
}

/**
 * دالة لطرح أيام من تاريخ
 */
export function subtractDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

/**
 * دالة لحساب الفرق بين تاريخين بالأيام
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = new Date(date1);
  const d2 = new Date(date2);
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

/**
 * دالة لتنسيق المدة الزمنية
 */
export function formatDuration(minutes: number, language: string = 'ar'): string {
  if (minutes < 60) {
    return language === 'ar' 
      ? `${minutes} دقيقة` 
      : `${minutes} minute${minutes > 1 ? 's' : ''}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return language === 'ar' 
      ? `${hours} ساعة` 
      : `${hours} hour${hours > 1 ? 's' : ''}`;
  }
  
  return language === 'ar' 
    ? `${hours} ساعة و ${remainingMinutes} دقيقة` 
    : `${hours} hour${hours > 1 ? 's' : ''} and ${remainingMinutes} minute${remainingMinutes > 1 ? 's' : ''}`;
}

/**
 * دالة للحصول على اسم الشهر
 */
export function getMonthName(month: number, language: string = 'ar'): string {
  const months = {
    ar: ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'],
    en: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
  };
  
  return months[language as keyof typeof months][month] || '';
}

/**
 * دالة للحصول على اسم اليوم
 */
export function getDayName(day: number, language: string = 'ar'): string {
  const days = {
    ar: ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'],
    en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
  };
  
  return days[language as keyof typeof days][day] || '';
}

/**
 * دالة للتحقق من صحة التاريخ
 */
export function isValidDate(dateString: string): boolean {
  const date = new Date(dateString);
  return date instanceof Date && !isNaN(date.getTime());
}

/**
 * دالة لتحويل التاريخ إلى ISO string
 */
export function toISOString(date: Date | string): string {
  const d = new Date(date);
  return d.toISOString();
}

/**
 * دالة لإنشاء تاريخ من components
 */
export function createDateFromComponents(
  year: number,
  month: number,
  day: number,
  hours: number = 0,
  minutes: number = 0,
  seconds: number = 0
): Date {
  return new Date(year, month - 1, day, hours, minutes, seconds);
}

/**
 * دالة للحصول على العمر بالسنوات
 */
export function getAge(birthDate: string | Date): number {
  const today = new Date();
  const birth = new Date(birthDate);
  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
    age--;
  }
  
  return age;
}

/**
 * دالة للتحقق مما إذا كان التاريخ في المستقبل
 */
export function isFutureDate(dateString: string | Date): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date > now;
}

/**
 * دالة للتحقق مما إذا كان التاريخ في الماضي
 */
export function isPastDate(dateString: string | Date): boolean {
  const date = new Date(dateString);
  const now = new Date();
  return date < now;
}

/**
 * دالة للحصول على التوقيت المحلي
 */
export function getLocalTimezone(): string {
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

/**
 * دالة لتنسيق التاريخ مع التوقيت
 */
export function formatDateTimezone(
  dateString: string | Date, 
  language: string = 'ar',
  timezone?: string
): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone || getLocalTimezone()
  };
  
  return date.toLocaleDateString(language === 'ar' ? 'ar-SA' : 'en-US', options);
}