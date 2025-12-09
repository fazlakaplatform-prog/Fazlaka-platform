"use client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Navbar from "./Navbar";
import BannedNavbar from "./BannedNavbar";

export default function NavbarWrapper() {
  const { currentUser, isLoading } = useCurrentUser();

  // أثناء تحميل حالة المستخدم، يمكنك عرض هيكل عظمي أو النافبار العادي
  if (isLoading && currentUser === undefined) {
    return <Navbar />; // عرض النافبار العادي أثناء التحميل
  }

  // إذا كان المستخدم مسجل دخول ومحظورًا، اعرض النافبار الخاص بالمحظورين
  if (currentUser && currentUser.banned) {
    return <BannedNavbar />;
  }

  // في جميع الحالات الأخرى (مستخدم غير مسجل دخول أو مسجل وغير محظور)، اعرض النافبار العادي
  return <Navbar />;
}