import { NextResponse } from "next/server";
import { getFavoritesCount, getMultipleFavoritesCount } from "@/services/favorites";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const contentId = searchParams.get("contentId");
  const contentType = searchParams.get("contentType") as 'episode' | 'article' | null;
  const contentIds = searchParams.get("contentIds");

  if (!contentType) {
    return NextResponse.json({ error: "Missing contentType" }, { status: 400 });
  }

  try {
    // إذا تم توفير معرف واحد
    if (contentId) {
      const count = await getFavoritesCount(contentId, contentType);
      return NextResponse.json({ contentId, count });
    }
    
    // إذا تم توفير قائمة من المعرفات
    if (contentIds) {
      const ids = contentIds.split(',');
      const counts = await getMultipleFavoritesCount(ids, contentType);
      return NextResponse.json({ counts });
    }
    
    return NextResponse.json({ error: "Missing contentId or contentIds" }, { status: 400 });
  } catch (error) {
    console.error("Error getting favorites count:", error);
    return NextResponse.json({ error: "Failed to get favorites count" }, { status: 500 });
  }
}