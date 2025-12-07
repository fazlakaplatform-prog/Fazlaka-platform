import { NextResponse } from "next/server";
import { checkFavorite, addToFavorites, removeFromFavorites } from "@/services/favorites";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get("userId");
  const contentId = searchParams.get("contentId");
  const contentType = searchParams.get("contentType"); // 'episode' or 'article'

  if (!userId || !contentId || !contentType) {
    return NextResponse.json({ error: "Missing userId, contentId, or contentType" }, { status: 400 });
  }

  try {
    const isFavorite = await checkFavorite(userId, contentId, contentType as 'episode' | 'article');
    
    return NextResponse.json({ isFavorite });
  } catch (error) {
    console.error("Error checking favorite:", error);
    return NextResponse.json({ error: "Failed to check favorite status" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { userId, contentId, contentType } = body;

    if (!userId || !contentId || !contentType) {
      return NextResponse.json({ error: "Missing userId, contentId, or contentType" }, { status: 400 });
    }

    // Check if already a favorite
    const isAlreadyFavorite = await checkFavorite(userId, contentId, contentType as 'episode' | 'article');
    
    if (isAlreadyFavorite) {
      return NextResponse.json({ message: "Already in favorites" }, { status: 200 });
    }

    // Create new favorite
    const newFavorite = await addToFavorites(userId, contentId, contentType as 'episode' | 'article');

    if (!newFavorite) {
      return NextResponse.json({ error: "Failed to add to favorites" }, { status: 500 });
    }

    return NextResponse.json({ success: true, id: newFavorite._id });
  } catch (error) {
    console.error("Error creating favorite:", error);
    return NextResponse.json({ 
      error: "Failed to add to favorites",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}

// === التعديل هنا ===
export async function DELETE(request: Request) {
  try {
    // قراءة البيانات من جسم الطلب بدلاً من معلمات الرابط
    const body = await request.json();
    const { userId, contentId, contentType } = body;

    if (!userId || !contentId || !contentType) {
      return NextResponse.json({ error: "Missing userId, contentId, or contentType" }, { status: 400 });
    }

    const success = await removeFromFavorites(userId, contentId, contentType as 'episode' | 'article');
    
    if (!success) {
      return NextResponse.json({ error: "Favorite not found or deletion failed" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing favorite:", error);
    return NextResponse.json({ 
      error: "Failed to remove from favorites",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  }
}