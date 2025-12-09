"use client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Footer from "./Footer";
import BannedFooter from "./BannedFooter";

export default function FooterWrapper() {
  const { currentUser, isLoading } = useCurrentUser();

  // أثناء تحميل حالة المستخدم، يمكنك عرض هيكل عظمي أو الفوتر العادي
  if (isLoading && currentUser === undefined) {
    return <Footer />; // عرض الفوتر العادي أثناء التحميل
  }

  // إذا كان المستخدم مسجل دخول ومحظورًا، اعرض الفوتر الخاص بالمحظورين
  if (currentUser && currentUser.banned) {
    return <BannedFooter />;
  }

  // في جميع الحالات الأخرى (مستخدم غير مسجل دخول أو مسجل وغير محظور)، اعرض الفوتر العادي
  return <Footer />;
}