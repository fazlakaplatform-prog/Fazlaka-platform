import { NextRequest } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { verifyToken } from "@/lib/jwt"

export async function getUserIdFromRequest(request: NextRequest): Promise<string | null> {
  // Try NextAuth session first
  try {
    const session = await getServerSession(authOptions as any) as { user?: { id?: string } } | null
    if (session?.user?.id) return session.user.id
  } catch {}

  // Fall back to JWT Bearer token
  const authHeader = request.headers.get("authorization")
  if (authHeader?.startsWith("Bearer ")) {
    const token = authHeader.slice(7)
    const payload = verifyToken(token)
    if (payload?.userId) return payload.userId
  }

  return null
}
