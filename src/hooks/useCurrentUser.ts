import useSWR from "swr";
import { useSession } from "next-auth/react"; // تمت إضافة هذا الاستيراد

const fetcher = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) {
    const error = new Error("An error occurred while fetching the data.");
    try {
      // @ts-expect-error - قد لا يكون الجسون صالحاً
      error.info = await res.json();
    } catch(e) {
      // تجاهل خطأ JSON إذا لم يكن الجسون صالحاً
    }
    // @ts-expect-error - إضافة خاصية مخصصة لكائن الخطأ
    error.status = res.status;
    throw error;
  }
  return res.json();
};

export function useCurrentUser() {
  const { data: session } = useSession(); // نحتاج للجلسة لمعرفة ما إذا كان المستخدم مسجل دخوله
  const { data, error, mutate } = useSWR(
    () => (session?.user?.id ? "/api/user/me" : null), // لا تجلب البيانات إذا لم يكن المستخدم مسجل دخوله
    fetcher,
    {
      revalidateOnFocus: false, // لا تعيد جلب البيانات عند التركيز على النافذة
      revalidateOnReconnect: true, // أعد الجلب عند استعادة الاتصال
      dedupingInterval: 60000, // تجنب الطلبات المكررة خلال 60 ثانية
    }
  );

  return {
    currentUser: data,
    isLoading: !error && !data, // يكون في حالة تحميل إذا لم يكن هناك خطأ أو بيانات
    isError: error,
    refetch: mutate, // دالة لإعادة جلب البيانات يدوياً
  };
}