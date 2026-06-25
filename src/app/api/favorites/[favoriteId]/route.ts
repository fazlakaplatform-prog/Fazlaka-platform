import { NextResponse } from "next/server";
import { deleteFavorite } from "@/services/favorites";

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ favoriteId: string }> }
) {
  try {
    const { favoriteId } = await params;
    
    if (!favoriteId) {
      return NextResponse.json({ error: "Favorite ID is required" }, { status: 400 });
    }

    const success = await deleteFavorite(favoriteId);
    
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