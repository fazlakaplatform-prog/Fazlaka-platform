import jwt from "jsonwebtoken"

const SECRET = process.env.NEXTAUTH_SECRET || "fallback-secret"

export function signToken(payload: { userId: string }): string {
  return jwt.sign(payload, SECRET, { expiresIn: "30d" })
}

export function verifyToken(token: string): { userId: string } | null {
  try {
    return jwt.verify(token, SECRET) as { userId: string }
  } catch {
    return null
  }
}
