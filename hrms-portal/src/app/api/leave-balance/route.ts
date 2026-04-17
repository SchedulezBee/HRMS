import { AppRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api/session";
import { computeLeaveBalances } from "@/lib/hrms/leave-balance";

export async function GET() {
  const authResult = await requireSession([
    AppRole.HR_ADMIN,
    AppRole.MANAGER,
    AppRole.EMPLOYEE,
  ]);

  if (authResult.error) {
    return authResult.error;
  }

  if (!authResult.session.user.employeeId) {
    return NextResponse.json(
      {
        title: "Profile link required",
        message: "A linked employee profile is required to view leave balances.",
        debugRef: "DEBUG-API-LEAVE-BALANCE-LINK",
      },
      { status: 400 },
    );
  }

  const requests = await prisma.leaveRequest.findMany({
    where: {
      employeeId: authResult.session.user.employeeId,
      tenantId: authResult.session.user.tenantId,
    },
    select: {
      leaveType: true,
      status: true,
      totalDays: true,
    },
  });

  const leavePolicies = await prisma.leavePolicy.findMany({
    where: {
      tenantId: authResult.session.user.tenantId,
    },
    orderBy: { name: "asc" },
    select: {
      enabled: true,
      entitlement: true,
      name: true,
      openingBalance: true,
    },
  });

  return NextResponse.json({
    items: computeLeaveBalances(requests, leavePolicies),
  });
}
