import { AppRole } from "@prisma/client";
import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { withDatabaseRetry } from "@/lib/prisma";
import { verifyPassword } from "@/lib/auth/password";
import { signInSchema } from "@/lib/validation/auth";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/sign-in",
  },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const parsed = signInSchema.safeParse(credentials);

        if (!parsed.success) {
          return null;
        }

        const email = parsed.data.email.toLowerCase();
        const user = await withDatabaseRetry((prisma) =>
          prisma.userAccount.findUnique({
            where: { email },
          }),
        );

        if (!user || !user.active) {
          return null;
        }

        const matches = await verifyPassword(parsed.data.password, user.passwordHash);

        if (!matches) {
          return null;
        }

        await withDatabaseRetry((prisma) =>
          prisma.userAccount.update({
            where: { id: user.id },
            data: { lastLoginAt: new Date() },
          }),
        );

        return {
          id: user.id,
          email: user.email,
          name: user.email,
          role: user.role as AppRole,
          tenantId: user.tenantId,
          employeeId: user.employeeId,
        };
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user }) => {
      if (user) {
        token.role = user.role;
        token.tenantId = user.tenantId;
        token.employeeId = user.employeeId;
      }

      return token;
    },
    session: async ({ session, token }) => {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.role = token.role as AppRole;
        session.user.tenantId =
          typeof token.tenantId === "string" ? token.tenantId : "";
        session.user.employeeId =
          typeof token.employeeId === "string" ? token.employeeId : null;
      }

      return session;
    },
  },
});
