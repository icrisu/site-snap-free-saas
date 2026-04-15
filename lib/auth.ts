import NextAuth from "next-auth";
import type { NextAuthConfig, User as NextAuthUser } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";
import type { Role } from "@/generated/prisma/client";
import { assignFreePlan } from "@/lib/billing/assign-free-plan";
import { verifyTurnstileToken } from "@/lib/turnstile";

interface ExtendedUser extends NextAuthUser {
  role: Role;
}

const providers: NextAuthConfig["providers"] = [
  Credentials({
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
      turnstileToken: { label: "Turnstile Token", type: "text" },
    },
    async authorize(credentials) {
      if (!credentials?.email || !credentials?.password) return null;

      const turnstileToken = (credentials.turnstileToken as string) || "";
      if (!(await verifyTurnstileToken(turnstileToken))) {
        return null;
      }

      const user = await prisma.user.findUnique({
        where: { email: credentials.email as string },
      });

      if (!user || !user.password) return null;

      const isValid = await bcrypt.compare(
        credentials.password as string,
        user.password,
      );

      if (!isValid) return null;
      if (!user.emailVerified) return null;

      return {
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        role: user.role,
      } as ExtendedUser;
    },
  }),
];

if (
  process.env.GOOGLE_CLIENT_ID &&
  process.env.GOOGLE_CLIENT_SECRET &&
  process.env.DISABLE_SIGNUP_PAYMENTS !== "true"
) {
  providers.push(
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma) as NextAuthConfig["adapter"],
  session: { strategy: "jwt" },
  pages: {
    signIn: "/auth/signin",
  },
  providers,
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as ExtendedUser).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
      }
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      if (user.id) {
        await assignFreePlan(user.id);
      }
    },
  },
});
