import NextAuth from "next-auth/next";
import GoogleProvider from "next-auth/providers/google";
import CredentialsProvider from "next-auth/providers/credentials";
import { MongoDBAdapter } from "@auth/mongodb-adapter";
import clientPromise from "@/lib/mongodb";
import bcrypt from "bcryptjs";
import type { MongoClient } from "mongodb";
import type { NextAuthOptions } from "next-auth";
import type { Adapter } from "next-auth/adapters";

export const authOptions: NextAuthOptions = {
  // الـ adapter سيقوم بإنشاء المستخدم تلقائياً لموفري الخدمة مثل Google
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
      async authorize(credentials) {
        if (!credentials?.email) {
          throw new Error("EmailIsRequired");
        }

        const client = await clientPromise;
        const db = client.db();
        const user = await db.collection("users").findOne({ email: credentials.email });

        if (!user) throw new Error("UserNotFound");
        if (user.banned) throw new Error("AccountSuspended");

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password ?? "");
        if (!isPasswordValid) throw new Error("IncorrectPassword");

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          image: user.image,
        };
      },
    }),
  ],

  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  // Callbacks الآن بسيطة جداً وتتعامل فقط مع البيانات الأساسية
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },

    async session({ session, token }) {
      if (token.id) {
        session.user.id = token.id as string;
      }
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