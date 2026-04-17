import { AppRole } from "@prisma/client";
import { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: AppRole;
      tenantId: string;
      employeeId?: string | null;
    };
  }

  interface User {
    role: AppRole;
    tenantId: string;
    employeeId?: string | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role?: AppRole;
    tenantId?: string;
    employeeId?: string | null;
  }
}
