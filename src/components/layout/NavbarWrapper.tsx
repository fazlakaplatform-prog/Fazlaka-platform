// src/components/layout/NavbarWrapper.tsx
"use client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Navbar from "./Navbar";
import BannedNavbar from "./BannedNavbar";

export default function NavbarWrapper() {
  const { currentUser, isLoading } = useCurrentUser();

  // أثناء تحميل حالة المستخدم، لا تعرض شيئًا أو يمكنك عرض هيكل عظمي (skeleton)
  if (isLoading) {
    return null; 
  }

  // إذا كان المستخدم محظورًا، اعرض النافبار الخاص بالمحظورين
  if (currentUser?.banned) {
    // BannedNavbar يحتاج إلى كائن الترجمات (t)
    // يمكنك تمريره هنا أو جعل المكون يقرأه بنفسه
    // سنفترض أن المكون يقرأه بنفسه كما في الكود الأصلي
    return <BannedNavbar />;
  }

  // وإلا، اعرض النافبار العادي
  return <Navbar />;
}