"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";

export function useUserUpdate() {
  const { data: session, update } = useSession(); 
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateUser = async (userData: {
    name?: string;
    image?: string;
    bio?: string;
    location?: string;
    website?: string;
  }) => {
    if (!session?.user?.id) {
      setError("المستخدم غير مسجل الدخول");
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 1. إرسال طلب تحديث البيانات إلى الـ API
      const response = await fetch(`/api/user/${session.user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("فشل تحديث البيانات");
      }

      const updatedUserFromDB = await response.json();

      // 2. تحديث الجلسة على العميل بالبيانات الجديدة
      // هذا يستدعي callback الـ jwt مع trigger: "update"
      await update({
        name: userData.name ?? session.user.name,
        image: userData.image ?? session.user.image,
      });

      return updatedUserFromDB;
    } catch (err) {
      setError(err instanceof Error ? err.message : "حدث خطأ غير متوقع");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  return { updateUser, isLoading, error };
}