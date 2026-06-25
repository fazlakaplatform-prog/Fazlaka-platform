import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
// 1. تأكد من استخدام هذا الـ import للإصدار الرابع
import { PrismaAdapter } from "@next-auth/prisma-adapter" 
import { prisma } from "@/lib/prisma" // تأكد أن هذا الاستيراد يطابق ملف prisma.ts الخاص بك
import bcrypt from "bcryptjs"

// تعريف الأنواع (كما هو في كودك السابق)
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      role?: string
      banned?: boolean
    }
  }
  
  interface User {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
    banned?: boolean
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
    banned?: boolean
  }
}

const authOptions: NextAuthOptions = {
  // استخدام Prisma adapter
  adapter: PrismaAdapter(prisma),
  
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      // السماح بربط حساب جوجل بحساب موجود بنفس البريد الإلكتروني
      // (مثلاً المستخدم أنشأ حساب بالإيميل وكلمة المرور ثم أراد الدخول بجوجل بنفس الإيميل)
      allowDangerousEmailAccountLinking: true,
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("البريد الإلكتروني مطلوب")
        }

        try {
          // البحث عن المستخدم باستخدام Prisma
          let user = await prisma.user.findUnique({
            where: { email: credentials.email },
            include: { secondaryEmails: true }
          });
          
          if (!user) {
            user = await prisma.user.findFirst({
              where: {
                secondaryEmails: {
                  some: {
                    email: credentials.email,
                    isVerified: true
                  }
                }
              },
              include: { secondaryEmails: true }
            });
            
            if (user) {
              console.log("تم العثور على المستخدم عبر البريد الثانوي:", credentials.email, "البريد الأساسي:", user.email);
            }
          }

          if (!user) {
            throw new Error("لم يتم العثور على المستخدم")
          }

          if (credentials.password) {
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password || ""
            )

            if (!isPasswordValid) {
              throw new Error("كلمة المرور غير صحيحة")
            }
          }

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            image: user.image,
            role: user.role,
            banned: user.banned,
          }
        } catch (error) {
          console.error("خطأ في المصادقة:", error)
          throw error
        }
      }
    })
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, 
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (account && user) {
        token.id = user.id
        token.name = user.name
        token.image = user.image
        token.role = user.role
        token.banned = user.banned
        return token
      }

      if (trigger === "update" && session) {
        token.name = session.user.name
        token.image = session.user.image
        token.email = session.user.email
        return token
      }

      if (token.id) {
        try {
          const currentUser = await prisma.user.findUnique({
            where: { id: token.id },
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
              role: true,
              banned: true
            }
          });
          
          if (currentUser) {
            token.name = currentUser.name
            token.email = currentUser.email
            token.image = currentUser.image
            token.role = currentUser.role
            token.banned = currentUser.banned
          }
        } catch (error) {
          console.error("خطأ في تحديث الرمز من قاعدة البيانات:", error)
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string
        session.user.name = token.name as string
        session.user.image = token.image as string
        session.user.email = token.email as string
        session.user.role = token.role as string
        session.user.banned = token.banned as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

const handler = NextAuth(authOptions)

export { handler as GET, handler as POST }