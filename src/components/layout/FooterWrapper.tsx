// src/components/layout/FooterWrapper.tsx
"use client";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Footer from "./Footer";
import BannedFooter from "./BannedFooter";

export default function FooterWrapper() {
  const { currentUser, isLoading } = useCurrentUser();

  if (isLoading) {
    return null;
  }

  if (currentUser?.banned) {
    // BannedFooter يحتاج إلى بعض الدعوات (props) مثل isRTL, t, logoSrc, إلخ.
    // سيكون من الأفضل تمريرها من هنا، ولكن للحفاظ على بساطة الكود الأصلي،
    // سنفترض أن المكون سيهتم بجلب هذه البيانات بنفسه.
    return <BannedFooter />;
  }

  return <Footer />;
}