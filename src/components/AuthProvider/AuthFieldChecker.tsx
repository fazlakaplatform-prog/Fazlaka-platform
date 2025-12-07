// src/components/AuthFieldChecker.tsx
"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";

export default function AuthFieldChecker() {
  const { data: session, status } = useSession();

  useEffect(() => {
    // التحقق فقط إذا كان المستخدم مسجل دخوله
    if (status === "authenticated" && session?.user?.id) {
      // استدعاء API للتحقق من الحقول
      fetch("/api/auth/ensure-user-fields", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      })
        .then((response) => response.json())
        .then((data) => {
          if (data.updated) {
            console.log("User fields updated:", data.user);
          }
        })
        .catch((error) => {
          console.error("Error ensuring user fields:", error);
        });
    }
  }, [session, status]);

  // هذا المكون لا يعرض أي واجهة مستخدم
  return null;
}