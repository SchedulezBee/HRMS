import { AppRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { hasAnyRole } from "@/lib/auth/permissions";

export async function requireSession(allowedRoles?: AppRole[]) {
  const session = await auth();

  if (!session?.user?.id) {
    return {
      error: NextResponse.json(
        {
          title: "Authentication required",
          message: "You must sign in before accessing this endpoint.",
          debugRef: "DEBUG-AUTH-401",
        },
        { status: 401 },
      ),
    };
  }

  if (allowedRoles && !hasAnyRole(session.user.role, allowedRoles)) {
    return {
      error: NextResponse.json(
        {
          title: "Forbidden",
          message: "Your role does not have access to this endpoint.",
          debugRef: "DEBUG-AUTH-403",
        },
        { status: 403 },
      ),
    };
  }

  return { session };
}
