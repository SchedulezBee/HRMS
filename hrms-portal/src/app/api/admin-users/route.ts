import { AppRole } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { writeAuditLog } from "@/lib/audit";
import { requireSession } from "@/lib/api/session";
import { adminUserProvisionSchema } from "@/lib/validation/hrms";

export async function GET() {
  const authResult = await requireSession([AppRole.TENANT_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const [items, employees] = await Promise.all([
    prisma.userAccount.findMany({
      where: {
        tenantId: authResult.session.user.tenantId,
        role: AppRole.HR_ADMIN,
      },
      include: {
        employee: {
          select: {
            fullName: true,
            employeeCode: true,
            department: true,
            jobTitle: true,
          },
        },
      },
      orderBy: { email: "asc" },
    }),
    prisma.employee.findMany({
      where: {
        tenantId: authResult.session.user.tenantId,
      },
      include: {
        user: {
          select: {
            id: true,
            role: true,
            active: true,
          },
        },
      },
      orderBy: { fullName: "asc" },
    }),
  ]);

  const candidates = employees
    .filter((employee) => !employee.user || employee.user.role === AppRole.HR_ADMIN)
    .map((employee) => ({
      id: employee.id,
      employeeCode: employee.employeeCode,
      fullName: employee.fullName,
      department: employee.department,
      jobTitle: employee.jobTitle,
      linkedAdminUserId: employee.user?.role === AppRole.HR_ADMIN ? employee.user.id : null,
      linkedAdminActive: employee.user?.role === AppRole.HR_ADMIN ? employee.user.active : null,
    }));

  return NextResponse.json({ items, candidates });
}

export async function POST(request: NextRequest) {
  const authResult = await requireSession([AppRole.TENANT_ADMIN]);

  if (authResult.error) {
    return authResult.error;
  }

  const body = await request.json();
  const parsed = adminUserProvisionSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(
      {
        title: "Validation failed",
        message: parsed.error.issues[0]?.message ?? "HR Admin provisioning payload is invalid.",
        debugRef: "DEBUG-API-ADMIN-VALIDATION",
      },
      { status: 400 },
    );
  }

  const employee = await prisma.employee.findFirst({
    where: {
      id: parsed.data.employeeId,
      tenantId: authResult.session.user.tenantId,
    },
    include: {
      user: true,
    },
  });

  if (!employee) {
    return NextResponse.json(
      {
        title: "Employee not found",
        message: "The selected employee could not be found for HR Admin provisioning.",
        debugRef: "DEBUG-API-ADMIN-EMPLOYEE",
      },
      { status: 404 },
    );
  }

  if (employee.user && employee.user.role !== AppRole.HR_ADMIN) {
    return NextResponse.json(
      {
        title: "Existing access conflict",
        message: "This employee already has a non-HR admin account. MVP provisioning only supports new or existing HR Admin access.",
        debugRef: "DEBUG-API-ADMIN-CONFLICT",
      },
      { status: 400 },
    );
  }

  const passwordHash = await hashPassword(parsed.data.password);
  const existingByEmail = await prisma.userAccount.findUnique({
    where: { email: employee.email },
  });

  if (existingByEmail && existingByEmail.employeeId !== employee.id) {
    return NextResponse.json(
      {
        title: "Email conflict",
        message: "The employee email is already bound to another account and cannot be reused for HR Admin access.",
        debugRef: "DEBUG-API-ADMIN-EMAIL",
      },
      { status: 400 },
    );
  }

  const result = employee.user
    ? await prisma.userAccount.update({
        where: { id: employee.user.id },
        data: {
          active: parsed.data.active,
          passwordHash,
          role: AppRole.HR_ADMIN,
        },
        include: {
          employee: {
            select: {
              fullName: true,
              employeeCode: true,
              department: true,
              jobTitle: true,
            },
          },
        },
      })
    : await prisma.userAccount.create({
        data: {
          active: parsed.data.active,
          email: employee.email,
          employeeId: employee.id,
          passwordHash,
          role: AppRole.HR_ADMIN,
          tenantId: authResult.session.user.tenantId,
        },
        include: {
          employee: {
            select: {
              fullName: true,
              employeeCode: true,
              department: true,
              jobTitle: true,
            },
          },
        },
      });

  await writeAuditLog({
    prisma,
    tenantId: authResult.session.user.tenantId,
    actorUserId: authResult.session.user.id,
    module: "AdminUser",
    actionType: employee.user ? "UPDATE" : "CREATE",
    targetRecordId: result.id,
    beforeValue: employee.user ?? undefined,
    afterValue: result,
  });

  return NextResponse.json(
    {
      title: employee.user ? "HR Admin updated" : "HR Admin provisioned",
      message: employee.user
        ? "Existing HR Admin access was updated successfully."
        : "HR Admin access was created successfully for the selected employee.",
      debugRef: `DEBUG-API-ADMIN-${result.id}`,
      item: result,
    },
    { status: employee.user ? 200 : 201 },
  );
}
