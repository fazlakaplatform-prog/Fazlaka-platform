import useSWR from "swr";
import { useSession } from "next-auth/react";

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    try {
      // @ts-expect-error - Extending Error object with response info is valid at runtime but not typed in TS lib definitions.
      error.info = await res.json();
    } catch { /* Ignore JSON parsing errors */ }
    // @ts-expect-error - Attaching HTTP status to error object for consumer handling.
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export function useCurrentUser() {
  // 1. نحصل على status مع البيانات
  const { data: session, status } = useSession(); 
  
  const { data, error, mutate } = useSWR(
    () => (session?.user?.id ? "/api/user/me" : null),
    fetcher,
    {
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      dedupingInterval: 60000,
    }
  );

  // 2. تعديل منطق التحميل (isLoading)
  // نحن نعتبره تحميلاً فقط إذا كانت الجلسة نفسها تتحامل،
  // أو إذا كانت الجلسة موجودة (مسجل دخول) ولكن بيانات المستخدم لم تصل بعد.
  const isLoading = status === "loading" || (!error && !data && session?.user?.id);

  return {
    currentUser: data,
    isLoading: isLoading, // الآن سيعود false للمستخدمين غير المسجلين
    isError: error,
    isAuthenticated: !!session, // إضافة مفيدة لتعرف هل المستخدم مسجل الدخول أم لا
    refetch: mutate,
  };
}