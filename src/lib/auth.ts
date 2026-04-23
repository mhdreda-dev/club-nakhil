import { AccountStatus, Role } from "@prisma/client";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import { getServerSession } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { z } from "zod";

import { AUTH_ERROR_CODES } from "@/lib/auth-errors";
import { prisma } from "@/lib/prisma";

const credentialsSchema = z.object({
  email: z.string().email().toLowerCase(),
  password: z.string().min(6),
});

export const authOptions: NextAuthOptions = {
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Club Nakhil",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(rawCredentials) {
        const parsed = credentialsSchema.safeParse(rawCredentials);

        if (!parsed.success) {
          return null;
        }

        const user = await prisma.user.findUnique({
          where: {
            email: parsed.data.email,
          },
        });

        if (!user) {
          return null;
        }

        const passwordMatches = await compare(parsed.data.password, user.passwordHash);

        if (!passwordMatches) {
          return null;
        }

        if (user.status === AccountStatus.PENDING) {
          throw new Error(AUTH_ERROR_CODES.PENDING_APPROVAL);
        }

        if (user.status === AccountStatus.BLOCKED) {
          throw new Error(AUTH_ERROR_CODES.ACCOUNT_BLOCKED);
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          status: user.status,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role as Role;
        token.status = user.status as AccountStatus;
      }

      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: {
            id: token.id as string,
          },
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            status: true,
          },
        });

        if (!dbUser) {
          return {};
        }

        token.email = dbUser.email;
        token.name = dbUser.name;
        token.role = dbUser.role;
        token.status = dbUser.status;
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id && token.role && token.status) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.status = token.status as AccountStatus;
      }
      return session;
    },
  },
};

// ============ ADD THIS EXPORT ============
export async function getAuthSession() {
  return getServerSession(authOptions);
}
