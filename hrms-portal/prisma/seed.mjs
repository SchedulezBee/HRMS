import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, AppRole, LeaveStatus, AttendanceStatus } from "@prisma/client";
import { Pool } from "pg";
import bcrypt from "bcryptjs";

const connectionString = process.env.DIRECT_DATABASE_URL ?? process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to run the seed script.");
}

const pool = new Pool({
  connectionString,
  connectionTimeoutMillis: 5_000,
  idleTimeoutMillis: 10_000,
  max: 2,
});
const prisma = new PrismaClient({ adapter: new PrismaPg(pool) });
const sharedPassword = "Password123!";

async function seed() {
  const passwordHash = await bcrypt.hash(sharedPassword, 10);

  const tenant = await prisma.tenant.upsert({
    where: { code: "COREVISION" },
    update: {
      name: "Core Vision",
      contactEmail: "ops@corevision.local",
      active: true,
    },
    create: {
      code: "COREVISION",
      name: "Core Vision",
      contactEmail: "ops@corevision.local",
      active: true,
    },
  });

  const departments = [
    {
      code: "ENG",
      name: "Engineering",
      description: "Product engineering and platform delivery.",
    },
    {
      code: "POPS",
      name: "People Ops",
      description: "HR operations, employee records, and policy administration.",
    },
    {
      code: "OPS",
      name: "Operations",
      description: "Operational support and shared services.",
    },
    {
      code: "FIN",
      name: "Finance",
      description: "Finance operations and reporting support.",
    },
  ];

  for (const department of departments) {
    await prisma.department.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: department.code,
        },
      },
      update: {
        active: true,
        description: department.description,
        name: department.name,
      },
      create: {
        active: true,
        code: department.code,
        description: department.description,
        name: department.name,
        tenantId: tenant.id,
      },
    });
  }

  const daniel = await prisma.employee.upsert({
    where: {
      tenantId_employeeCode: {
        tenantId: tenant.id,
        employeeCode: "EMP-1021",
      },
    },
    update: {
      fullName: "Daniel Tan",
      email: "daniel.tan@corevision.local",
      employmentStatus: "Permanent",
      department: "Engineering",
      jobTitle: "Team Lead",
      workLocation: "Kuala Lumpur",
      profileStatus: "ACTIVE",
    },
    create: {
      tenantId: tenant.id,
      employeeCode: "EMP-1021",
      fullName: "Daniel Tan",
      email: "daniel.tan@corevision.local",
      employmentStatus: "Permanent",
      department: "Engineering",
      jobTitle: "Team Lead",
      workLocation: "Kuala Lumpur",
      profileStatus: "ACTIVE",
    },
  });

  const alya = await prisma.employee.upsert({
    where: {
      tenantId_employeeCode: {
        tenantId: tenant.id,
        employeeCode: "EMP-1001",
      },
    },
    update: {
      fullName: "Alya Rahman",
      email: "alya.rahman@corevision.local",
      employmentStatus: "Permanent",
      department: "People Ops",
      jobTitle: "HR Executive",
      managerId: daniel.id,
      workLocation: "Kuala Lumpur",
      profileStatus: "ACTIVE",
    },
    create: {
      tenantId: tenant.id,
      employeeCode: "EMP-1001",
      fullName: "Alya Rahman",
      email: "alya.rahman@corevision.local",
      employmentStatus: "Permanent",
      department: "People Ops",
      jobTitle: "HR Executive",
      managerId: daniel.id,
      workLocation: "Kuala Lumpur",
      profileStatus: "ACTIVE",
    },
  });

  const marcus = await prisma.employee.upsert({
    where: {
      tenantId_employeeCode: {
        tenantId: tenant.id,
        employeeCode: "EMP-1098",
      },
    },
    update: {
      fullName: "Marcus Lee",
      email: "marcus.lee@corevision.local",
      employmentStatus: "Contract",
      department: "Operations",
      jobTitle: "Admin Officer",
      managerId: alya.id,
      workLocation: "Shah Alam",
      profileStatus: "ACTIVE",
    },
    create: {
      tenantId: tenant.id,
      employeeCode: "EMP-1098",
      fullName: "Marcus Lee",
      email: "marcus.lee@corevision.local",
      employmentStatus: "Contract",
      department: "Operations",
      jobTitle: "Admin Officer",
      managerId: alya.id,
      workLocation: "Shah Alam",
      profileStatus: "ACTIVE",
    },
  });

  const nurImani = await prisma.employee.upsert({
    where: {
      tenantId_employeeCode: {
        tenantId: tenant.id,
        employeeCode: "EMP-1084",
      },
    },
    update: {
      fullName: "Nur Imani",
      email: "nur.imani@corevision.local",
      employmentStatus: "Permanent",
      department: "Finance",
      jobTitle: "Payroll Analyst",
      managerId: alya.id,
      workLocation: "Kuala Lumpur",
      profileStatus: "ACTIVE",
    },
    create: {
      tenantId: tenant.id,
      employeeCode: "EMP-1084",
      fullName: "Nur Imani",
      email: "nur.imani@corevision.local",
      employmentStatus: "Permanent",
      department: "Finance",
      jobTitle: "Payroll Analyst",
      managerId: alya.id,
      workLocation: "Kuala Lumpur",
      profileStatus: "ACTIVE",
    },
  });

  await prisma.department.updateMany({
    where: {
      tenantId: tenant.id,
      code: "ENG",
    },
    data: {
      managerEmployeeId: daniel.id,
    },
  });

  await prisma.department.updateMany({
    where: {
      tenantId: tenant.id,
      code: "POPS",
    },
    data: {
      managerEmployeeId: alya.id,
    },
  });

  await prisma.department.updateMany({
    where: {
      tenantId: tenant.id,
      code: "OPS",
    },
    data: {
      managerEmployeeId: marcus.id,
    },
  });

  await prisma.department.updateMany({
    where: {
      tenantId: tenant.id,
      code: "FIN",
    },
    data: {
      managerEmployeeId: nurImani.id,
    },
  });

  const users = [
    {
      email: "tenant.admin@corevision.local",
      role: AppRole.TENANT_ADMIN,
      employeeId: null,
    },
    {
      email: "alya.rahman@corevision.local",
      role: AppRole.HR_ADMIN,
      employeeId: alya.id,
    },
    {
      email: "daniel.tan@corevision.local",
      role: AppRole.MANAGER,
      employeeId: daniel.id,
    },
    {
      email: "marcus.lee@corevision.local",
      role: AppRole.EMPLOYEE,
      employeeId: marcus.id,
    },
  ];

  for (const user of users) {
    await prisma.userAccount.upsert({
      where: { email: user.email },
      update: {
        tenantId: tenant.id,
        employeeId: user.employeeId,
        passwordHash,
        role: user.role,
        active: true,
      },
      create: {
        tenantId: tenant.id,
        employeeId: user.employeeId,
        email: user.email,
        passwordHash,
        role: user.role,
        active: true,
      },
    });
  }

  const leavePolicies = [
    {
      code: "ANNUAL",
      name: "Annual Leave",
      enabled: true,
      openingBalance: 2,
      entitlement: 12,
    },
    {
      code: "MEDICAL",
      name: "Medical Leave",
      enabled: true,
      openingBalance: 0,
      entitlement: 14,
    },
    {
      code: "EMERGENCY",
      name: "Emergency Leave",
      enabled: true,
      openingBalance: 0,
      entitlement: 3,
    },
  ];

  for (const leavePolicy of leavePolicies) {
    await prisma.leavePolicy.upsert({
      where: {
        tenantId_code: {
          tenantId: tenant.id,
          code: leavePolicy.code,
        },
      },
      update: {
        enabled: leavePolicy.enabled,
        entitlement: leavePolicy.entitlement,
        name: leavePolicy.name,
        openingBalance: leavePolicy.openingBalance,
      },
      create: {
        tenantId: tenant.id,
        code: leavePolicy.code,
        enabled: leavePolicy.enabled,
        entitlement: leavePolicy.entitlement,
        name: leavePolicy.name,
        openingBalance: leavePolicy.openingBalance,
      },
    });
  }

  await prisma.leaveRequest.upsert({
    where: { id: "seed-leave-1" },
    update: {
      tenantId: tenant.id,
      employeeId: alya.id,
      leaveType: "Annual Leave",
      startDate: new Date("2026-04-21T00:00:00.000Z"),
      endDate: new Date("2026-04-22T00:00:00.000Z"),
      totalDays: 2,
      reason: "Family travel",
      status: LeaveStatus.PENDING,
    },
    create: {
      id: "seed-leave-1",
      tenantId: tenant.id,
      employeeId: alya.id,
      leaveType: "Annual Leave",
      startDate: new Date("2026-04-21T00:00:00.000Z"),
      endDate: new Date("2026-04-22T00:00:00.000Z"),
      totalDays: 2,
      reason: "Family travel",
      status: LeaveStatus.PENDING,
    },
  });

  await prisma.leaveRequest.upsert({
    where: { id: "seed-leave-2" },
    update: {
      tenantId: tenant.id,
      employeeId: marcus.id,
      leaveType: "Medical Leave",
      startDate: new Date("2026-04-18T00:00:00.000Z"),
      endDate: new Date("2026-04-18T00:00:00.000Z"),
      totalDays: 1,
      reason: "Clinic visit",
      status: LeaveStatus.APPROVED,
    },
    create: {
      id: "seed-leave-2",
      tenantId: tenant.id,
      employeeId: marcus.id,
      leaveType: "Medical Leave",
      startDate: new Date("2026-04-18T00:00:00.000Z"),
      endDate: new Date("2026-04-18T00:00:00.000Z"),
      totalDays: 1,
      reason: "Clinic visit",
      status: LeaveStatus.APPROVED,
    },
  });

  await prisma.attendanceRecord.upsert({
    where: {
      tenantId_employeeId_attendanceDate: {
        tenantId: tenant.id,
        employeeId: daniel.id,
        attendanceDate: new Date("2026-04-16T00:00:00.000Z"),
      },
    },
    update: {
      timeIn: new Date("2026-04-16T00:52:00.000Z"),
      timeOut: null,
      status: AttendanceStatus.MISSING_CLOCK_OUT,
      remarks: "Open shift pending clock out.",
    },
    create: {
      tenantId: tenant.id,
      employeeId: daniel.id,
      attendanceDate: new Date("2026-04-16T00:00:00.000Z"),
      timeIn: new Date("2026-04-16T00:52:00.000Z"),
      timeOut: null,
      status: AttendanceStatus.MISSING_CLOCK_OUT,
      remarks: "Open shift pending clock out.",
    },
  });

  await prisma.attendanceRecord.upsert({
    where: {
      tenantId_employeeId_attendanceDate: {
        tenantId: tenant.id,
        employeeId: alya.id,
        attendanceDate: new Date("2026-04-16T00:00:00.000Z"),
      },
    },
    update: {
      timeIn: new Date("2026-04-16T00:14:00.000Z"),
      timeOut: new Date("2026-04-16T09:46:00.000Z"),
      status: AttendanceStatus.COMPLETE,
      remarks: "Complete day record.",
    },
    create: {
      tenantId: tenant.id,
      employeeId: alya.id,
      attendanceDate: new Date("2026-04-16T00:00:00.000Z"),
      timeIn: new Date("2026-04-16T00:14:00.000Z"),
      timeOut: new Date("2026-04-16T09:46:00.000Z"),
      status: AttendanceStatus.COMPLETE,
      remarks: "Complete day record.",
    },
  });

  await prisma.attendanceRecord.upsert({
    where: {
      tenantId_employeeId_attendanceDate: {
        tenantId: tenant.id,
        employeeId: marcus.id,
        attendanceDate: new Date("2026-04-16T00:00:00.000Z"),
      },
    },
    update: {
      timeIn: new Date("2026-04-16T01:31:00.000Z"),
      timeOut: null,
      status: AttendanceStatus.LATE,
      remarks: "Late check in pending review.",
    },
    create: {
      tenantId: tenant.id,
      employeeId: marcus.id,
      attendanceDate: new Date("2026-04-16T00:00:00.000Z"),
      timeIn: new Date("2026-04-16T01:31:00.000Z"),
      timeOut: null,
      status: AttendanceStatus.LATE,
      remarks: "Late check in pending review.",
    },
  });

  const tenantAdmin = await prisma.userAccount.findUnique({
    where: { email: "tenant.admin@corevision.local" },
  });

  if (tenantAdmin) {
    await prisma.auditLog.upsert({
      where: { id: "seed-audit-1" },
      update: {
        tenantId: tenant.id,
        actorUserId: tenantAdmin.id,
        module: "Seed",
        actionType: "BOOTSTRAP",
        targetRecordId: tenant.id,
        beforeValue: null,
        afterValue: { status: "seeded", version: 1 },
      },
      create: {
        id: "seed-audit-1",
        tenantId: tenant.id,
        actorUserId: tenantAdmin.id,
        module: "Seed",
        actionType: "BOOTSTRAP",
        targetRecordId: tenant.id,
        beforeValue: null,
        afterValue: { status: "seeded", version: 1 },
      },
    });
  }

  console.log("Seed completed for tenant COREVISION.");
  console.log("Shared development password:", sharedPassword);
}

seed()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
