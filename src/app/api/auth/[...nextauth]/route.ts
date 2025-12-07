import NextAuth from "next-auth"
import { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import CredentialsProvider from "next-auth/providers/credentials"
import clientPromise from "@/lib/mongodb"
import bcrypt from "bcryptjs"
import { ObjectId } from "mongodb"

// تعريف أنواع مخصصة للجلسة والرمز
declare module "next-auth" {
  interface Session {
    user: {
      id: string
      name: string
      email: string
      image: string
    }
  }
  
  interface User {
    id: string
    name: string
    email: string
    image: string
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    name: string
    email: string
    image: string
  }
}

const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
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
          const client = await clientPromise;
          const db = client.db();
          
          // البحث عن المستخدم باستخدام العميل مباشرة بدلاً من Mongoose
          let user = await db.collection('users').findOne({ email: credentials.email });
          
          // إذا لم يتم العثور على المستخدم بالبريد الأساسي، ابحث في البريد الثانوي
          if (!user) {
            user = await db.collection('users').findOne({ 
              "secondaryEmails.email": credentials.email,
              "secondaryEmails.isVerified": true 
            });
            
            // إذا تم العثور على المستخدم عبر الإيميل الثانوي، استخدم البريد الأساسي للمصادقة
            if (user) {
              console.log("تم العثور على المستخدم عبر البريد الثانوي:", credentials.email, "البريد الأساسي:", user.email);
            }
          }

          if (!user) {
            throw new Error("لم يتم العثور على المستخدم")
          }

          // التحقق من كلمة المرور إذا تم تقديمها
          if (credentials.password) {
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password
            )

            if (!isPasswordValid) {
              throw new Error("كلمة المرور غير صحيحة")
            }
          }

          return {
            id: user._id.toString(),
            email: user.email, // دائماً استخدم البريد الأساسي للجلسة
            name: user.name,
            image: user.image,
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
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      // عند تسجيل الدخول لأول مرة
      if (account && user) {
        if (account.provider === "google") {
          const client = await clientPromise;
          const db = client.db();
          
          // البحث عن المستخدم باستخدام العميل مباشرة بدلاً من Mongoose
          let existingUser = await db.collection('users').findOne({ email: user.email });
          
          // إذا لم يتم العثور على المستخدم بالبريد الأساسي، ابحث في البريد الثانوي
          if (!existingUser) {
            existingUser = await db.collection('users').findOne({ 
              "secondaryEmails.email": user.email,
              "secondaryEmails.isVerified": true 
            });
            
            // إذا تم العثور على المستخدم عبر الإيميل الثانوي، استخدم البريد الأساسي
            if (existingUser) {
              console.log("مصادقة جوجل: تم العثور على المستخدم عبر البريد الثانوي:", user.email, "البريد الأساسي:", existingUser.email);
            }
          }

          if (!existingUser) {
            const newUser = {
              name: user.name,
              email: user.email,
              image: user.image,
              isActive: true,
              emailVerified: true, // تفعيل البريد الإلكتروني تلقائياً لـ Google
              googleId: account.providerAccountId,
              createdAt: new Date(),
            };
            
            const result = await db.collection('users').insertOne(newUser);
            
            token.id = result.insertedId.toString();
            token.name = newUser.name;
            token.image = newUser.image;
          } else {
            token.id = existingUser._id.toString();
            token.name = existingUser.name;
            token.image = existingUser.image;
          }
        } else {
          token.id = user.id
          token.name = user.name
          token.image = user.image
        }
        return token
      }

      // عند تحديث الجلسة
      if (trigger === "update" && session) {
        token.name = session.user.name
        token.image = session.user.image
        token.email = session.user.email
        return token
      }

      // تحديث بيانات الرمز من قاعدة البيانات
      if (token.id) {
        try {
          const client = await clientPromise;
          const db = client.db();
          const collection = db.collection('users');
          
          // التحقق من أن token.id هو معرف MongoDB صالح
          let userId;
          try {
            userId = new ObjectId(token.id);
          } catch (error) {
            console.error("تنسيق ObjectId غير صالح:", token.id, error);
            return token;
          }
          
          const currentUser = await collection.findOne({ _id: userId });
          
          if (currentUser) {
            token.name = currentUser.name
            token.email = currentUser.email
            token.image = currentUser.image
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