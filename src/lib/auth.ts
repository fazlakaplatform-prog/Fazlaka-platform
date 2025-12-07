// src/lib/auth.ts
import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import { ObjectId, type MongoClient } from "mongodb";
import type { NextAuthOptions, User as NextAuthUser } from "next-auth";
import type { Adapter } from "next-auth/adapters";

interface DBUser {
  _id: ObjectId;
  email: string;
  name?: string | null;
  image?: string | null;
  password?: string;
  isActive?: boolean;
  emailVerified?: boolean;
  googleId?: string;
  createdAt?: Date;
  role?: string;
  banned?: boolean;
  secondaryEmails?: Array<{
    email: string;
    isVerified: boolean;
  }>;
}

type SessionUserShape = {
  id?: string;
  email?: string | null;
  name?: string | null;
  image?: string | null;
  role?: string;
  banned?: boolean;
};

export const authOptions: NextAuthOptions = {
  // تحويل آمن لنوع الـ adapter ليتوافق مع next-auth
  adapter: (MongoDBAdapter(clientPromise as Promise<MongoClient>) as unknown) as Adapter,

  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID ?? "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? "",
    }),
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      // توقيع authorize الآن مطابق لتوقيع next-auth: (credentials, req)
      async authorize(
        credentials: Record<"email" | "password", string> | undefined,
        req?: unknown
      ): Promise<NextAuthUser | null> {
        if (!credentials?.email) {
          throw new Error("EmailIsRequired");
        }

        try {
          const client = await clientPromise;
          const db = client.db();

          let user = (await db.collection("users").findOne({
            email: credentials.email,
          })) as DBUser | null;

          if (!user) {
            user = (await db.collection("users").findOne({
              "secondaryEmails.email": credentials.email,
              "secondaryEmails.isVerified": true,
            })) as DBUser | null;
          }

          if (!user) throw new Error("UserNotFound");
          if (!user.isActive) throw new Error("AccountNotVerified");
          if (user.banned) throw new Error("AccountSuspended");

          if (credentials.password) {
            const isPasswordValid = await bcrypt.compare(
              credentials.password,
              user.password ?? ""
            );
            if (!isPasswordValid) throw new Error("IncorrectPassword");
          }

          const returned = {
            id: user._id.toString(),
            email: user.email,
            // NextAuthUser requires name:string, image:string -> استخدم سلاسل فارغة كقيمة افتراضية
            name: user.name ?? "",
            image: user.image ?? "",
            role: user.role ?? "user",
            banned: user.banned ?? false,
          };

          return returned as unknown as NextAuthUser;
        } catch (err) {
          console.error("Auth authorize error:", err);
          throw err;
        }
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60,
  },

  callbacks: {
    async jwt({ token, user, account, trigger, session }) {
      if (account && user) {
        if (account.provider === "google") {
          try {
            const client = await clientPromise;
            const db = client.db();

            let existingUser = (await db.collection("users").findOne({
              email: user.email as string,
            })) as DBUser | null;

            if (!existingUser) {
              existingUser = (await db.collection("users").findOne({
                "secondaryEmails.email": user.email as string,
                "secondaryEmails.isVerified": true,
              })) as DBUser | null;
            }

            if (!existingUser) {
              const newUser = {
                name: (user.name as string) ?? "",
                email: user.email,
                image: (user.image as string) ?? "",
                isActive: true,
                emailVerified: true,
                googleId: account.providerAccountId,
                createdAt: new Date(),
                role: "user",  // تعيين الدور كمستخدم عادي
                banned: false, // تعيين الحالة كغير محظور
              };
              const result = await db.collection("users").insertOne(newUser);
              token.id = result.insertedId.toString();
              token.name = newUser.name ?? "";
              token.image = newUser.image ?? "";
              token.email = newUser.email;
              token.role = newUser.role;
              token.banned = newUser.banned;
            } else {
              token.id = existingUser._id.toString();
              // استخدم "" بدل null لضمان توافق النوع string
              token.name = existingUser.name ?? "";
              token.image = existingUser.image ?? "";
              token.email = existingUser.email;
              
              // التحقق من وجود الحقول وتحديثها إذا لزم الأمر
              const updateData: Record<string, unknown> = {};
              let needsUpdate = false;
              
              if (!existingUser.role) {
                updateData.role = "user";
                token.role = "user";
                needsUpdate = true;
              } else {
                token.role = existingUser.role;
              }
              
              if (existingUser.banned === undefined) {
                updateData.banned = false;
                token.banned = false;
                needsUpdate = true;
              } else {
                token.banned = existingUser.banned;
              }
              
              if (needsUpdate) {
                updateData.updatedAt = new Date();
                await db.collection("users").updateOne(
                  { _id: existingUser._id },
                  { $set: updateData }
                );
              }
            }
          } catch (err) {
            console.error("Google sign in jwt error:", err);
          }
        } else {
          const u = user as unknown as { 
            id?: string; 
            name?: string; 
            image?: string; 
            email?: string;
            role?: string;
            banned?: boolean;
          };
          if (u.id) token.id = u.id;
          if (u.name) token.name = u.name;
          if (u.image) token.image = u.image;
          if (u.email) token.email = u.email;
          if (u.role) token.role = u.role;
          if (u.banned !== undefined) token.banned = u.banned;
        }
        return token;
      }

      if (trigger === "update" && session) {
        const sUser = session.user as SessionUserShape;
        if (sUser.name) token.name = sUser.name;
        if (sUser.image) token.image = sUser.image;
        if (sUser.email) token.email = sUser.email;
        if (sUser.role) token.role = sUser.role;
        if (sUser.banned !== undefined) token.banned = sUser.banned;
        return token;
      }

      if (token.id) {
        try {
          const client = await clientPromise;
          const db = client.db();
          const collection = db.collection("users");
          const currentUser = (await collection.findOne({
            _id: new ObjectId(token.id as string),
          })) as DBUser | null;

          if (currentUser) {
            token.name = currentUser.name ?? token.name ?? "";
            token.email = currentUser.email ?? token.email ?? "";
            token.image = currentUser.image ?? token.image ?? "";
            
            // التحقق من وجود الحقول وتحديثها إذا لزم الأمر
            const updateData: Record<string, unknown> = {};
            let needsUpdate = false;
            
            if (!currentUser.role) {
              updateData.role = "user";
              token.role = "user";
              needsUpdate = true;
            } else {
              token.role = currentUser.role;
            }
            
            if (currentUser.banned === undefined) {
              updateData.banned = false;
              token.banned = false;
              needsUpdate = true;
            } else {
              token.banned = currentUser.banned;
            }
            
            if (needsUpdate) {
              updateData.updatedAt = new Date();
              await collection.updateOne(
                { _id: currentUser._id },
                { $set: updateData }
              );
            }
          }
        } catch (err) {
          console.error("Error updating token from DB:", err);
        }
      }

      return token;
    },

    async session({ session, token }) {
      const sUser = session.user as SessionUserShape;
      if (token.id) sUser.id = token.id as string;
      if (token.name) sUser.name = token.name as string;
      if (token.image) sUser.image = token.image as string;
      if (token.email) sUser.email = token.email as string;
      if (token.role) sUser.role = token.role as string;
      if (token.banned !== undefined) sUser.banned = token.banned as boolean;
      session.user = sUser as unknown as typeof session.user;
      return session;
    },
  },

  pages: {
    signIn: "/sign-in",
    error: "/auth/error",
  },

  secret: process.env.NEXTAUTH_SECRET ?? undefined,
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };