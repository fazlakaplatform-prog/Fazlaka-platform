import { NextResponse } from "next/server";
import { fetchUserFavorites } from "@/services/favorites";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    
    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 });
    }
    
    const favorites = await fetchUserFavorites(userId);
    
    return NextResponse.json({ favorites });
  } catch (error) {
    console.error("Error fetching user favorites:", error);
    return NextResponse.json({ error: "Failed to fetch favorites" }, { status: 500 });
  }
}