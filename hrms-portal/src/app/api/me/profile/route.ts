import { AppRole } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSession } from "@/lib/api/session";

export async function GET() {
  const authResult = await requireSession([
    AppRole.TENANT_ADMIN,
    AppRole.HR_ADMIN,
    AppRole.MANAGER,
    AppRole.EMPLOYEE,
  ]);

  if (authResult.error) {
    return authResult.error;
  }

  if (!authResult.session.user.employeeId) {
    return NextResponse.json({
      item: {
        department: "Tenant Workspace",
        directReportsCount: 0,
        email: authResult.session.user.email ?? "",
        employeeCode: "N/A",
        fullName: authResult.session.user.email ?? "Tenant Admin",
        jobTitle: "Tenant Admin",
        managerName: null,
        profileStatus: "ACTIVE",
        workLocation: "Platform scope",
      },
    });
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: authResult.session.user.employeeId,
      tenantId: authResult.session.user.tenantId,
    },
    include: {
      _count: {
        select: {
          directReports: true,
        },
      },
      manager: {
        select: {
          fullName: true,
        },
      },
    },
  });

  if (!employee) {
    return NextResponse.json(
      {
        title: "Profile not found",
        message: "No employee profile is linked to the current session.",
        debugRef: "DEBUG-API-PROFILE-NOTFOUND",
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    item: {
      department: employee.department,
      directReportsCount: employee._count.directReports,
      email: employee.email,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      jobTitle: employee.jobTitle,
      managerName: employee.manager?.fullName ?? null,
      profileStatus: employee.profileStatus,
      workLocation: employee.workLocation ?? "Not set",
    },
  });
}
