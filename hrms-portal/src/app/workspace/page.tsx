import { AppRole, LeaveStatus } from "@prisma/client";
import {
  Building2,
  CalendarClock,
  CheckCheck,
  Clock3,
  Database,
  FileSearch,
  ShieldCheck,
  UserRound,
  UsersRound,
} from "lucide-react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { SignOutButton } from "@/components/sign-out-button";
import { computeLeaveBalances } from "@/lib/hrms/leave-balance";
import { getAuditWhere } from "@/lib/hrms/reporting";
import { prisma } from "@/lib/prisma";

const roleLabels: Record<AppRole, string> = {
  TENANT_ADMIN: "Tenant Admin",
  HR_ADMIN: "HR Admin",
  MANAGER: "Manager",
  EMPLOYEE: "Employee",
};

const privilegedRoles: AppRole[] = [AppRole.TENANT_ADMIN, AppRole.HR_ADMIN, AppRole.MANAGER];

function formatDateTime(value?: Date | null) {
  if (!value) {
    return "No login recorded";
  }

  return new Intl.DateTimeFormat("en-MY", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(value);
}

export default async function WorkspacePage() {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/sign-in");
  }

  const isTenantAdmin = session.user.role === AppRole.TENANT_ADMIN;
  const isHrAdmin = session.user.role === AppRole.HR_ADMIN;
  const isEmployee = session.user.role === AppRole.EMPLOYEE;
  const isManager = session.user.role === AppRole.MANAGER;
  const hasLinkedEmployee = Boolean(session.user.employeeId);

  const tenantWhere = { tenantId: session.user.tenantId };
  const employeeWhere =
    isEmployee && session.user.employeeId
      ? { ...tenantWhere, id: session.user.employeeId }
      : isManager && session.user.employeeId
        ? { ...tenantWhere, managerId: session.user.employeeId }
        : tenantWhere;
  const leaveWhere =
    isEmployee && session.user.employeeId
      ? { ...tenantWhere, employeeId: session.user.employeeId }
      : isManager && session.user.employeeId
        ? {
            ...tenantWhere,
            OR: [
              { employeeId: session.user.employeeId },
              {
                employee: {
                  managerId: session.user.employeeId,
                },
              },
            ],
          }
        : tenantWhere;
  const attendanceWhere =
    isEmployee && session.user.employeeId
      ? { ...tenantWhere, employeeId: session.user.employeeId }
      : isManager && session.user.employeeId
        ? {
            ...tenantWhere,
            OR: [
              { employeeId: session.user.employeeId },
              {
                employee: {
                  managerId: session.user.employeeId,
                },
              },
            ],
          }
        : tenantWhere;
  const [
    tenant,
    profileEmployee,
    employees,
    leaveRequests,
    selfLeaveRequests,
    leavePolicies,
    attendanceRecords,
    auditCount,
    recentAuditLogs,
    departments,
    departmentEmployeeCounts,
    hrAdminUsers,
  ] = await Promise.all([
    prisma.tenant.findUnique({
      where: { id: session.user.tenantId },
      select: {
        id: true,
        code: true,
        name: true,
        contactEmail: true,
        active: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            departments: true,
            employees: true,
            users: true,
          },
        },
      },
    }),
    session.user.employeeId
      ? prisma.employee.findFirst({
          where: {
            id: session.user.employeeId,
            tenantId: session.user.tenantId,
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
        })
      : Promise.resolve(null),
    prisma.employee.findMany({
      where: employeeWhere,
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    prisma.leaveRequest.findMany({
      where: leaveWhere,
      include: {
        employee: {
          select: { fullName: true, employeeCode: true },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    session.user.employeeId
      ? prisma.leaveRequest.findMany({
          where: {
            tenantId: session.user.tenantId,
            employeeId: session.user.employeeId,
          },
          select: {
            leaveType: true,
            status: true,
            totalDays: true,
          },
          orderBy: { createdAt: "desc" },
        })
      : Promise.resolve([]),
    prisma.leavePolicy.findMany({
      where: {
        tenantId: session.user.tenantId,
        ...(isTenantAdmin || isHrAdmin ? {} : { enabled: true }),
      },
      orderBy: [{ enabled: "desc" }, { name: "asc" }],
      take: 6,
    }),
    prisma.attendanceRecord.findMany({
      where: attendanceWhere,
      include: {
        employee: {
          select: { fullName: true, employeeCode: true },
        },
        reviewedBy: {
          select: { email: true },
        },
      },
      orderBy: { attendanceDate: "desc" },
      take: 6,
    }),
    prisma.auditLog.count({
      where: getAuditWhere({
        id: session.user.id,
        role: session.user.role,
        tenantId: session.user.tenantId,
        employeeId: session.user.employeeId ?? null,
      }),
    }),
    prisma.auditLog.findMany({
      where: getAuditWhere({
        id: session.user.id,
        role: session.user.role,
        tenantId: session.user.tenantId,
        employeeId: session.user.employeeId ?? null,
      }),
      include: {
        actor: {
          select: {
            email: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
    isTenantAdmin || isHrAdmin
      ? prisma.department.findMany({
          where: tenantWhere,
          include: {
            managerEmployee: {
              select: {
                fullName: true,
              },
            },
          },
          orderBy: [{ active: "desc" }, { name: "asc" }],
          take: 6,
        })
      : Promise.resolve([]),
    isTenantAdmin || isHrAdmin
      ? prisma.employee.groupBy({
          by: ["department"],
          where: tenantWhere,
          _count: {
            _all: true,
          },
        })
      : Promise.resolve([]),
    isTenantAdmin || isHrAdmin
      ? prisma.userAccount.findMany({
          where: {
            tenantId: session.user.tenantId,
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
          take: 6,
        })
      : Promise.resolve([]),
  ]);

  const leaveBalances = computeLeaveBalances(
    selfLeaveRequests,
    leavePolicies.filter((policy) => policy.enabled),
  );
  const pendingApprovals = leaveRequests.filter(
    (item) =>
      item.status === LeaveStatus.PENDING &&
      (!isManager || item.employeeId !== session.user.employeeId),
  ).length;
  const attendanceIssues = attendanceRecords.filter(
    (item) =>
      item.status !== "COMPLETE" &&
      item.status !== "ON_TIME" &&
      (!isManager || item.employeeId !== session.user.employeeId),
  ).length;

  const employeeAccessLabel = hasLinkedEmployee
    ? isEmployee
      ? "Self only"
      : isManager
        ? "Self profile + direct reports"
        : "Tenant scoped"
    : "Tenant admin scope";
  const approvalScopeLabel = privilegedRoles.includes(session.user.role)
    ? isManager
      ? "Direct-report requests only"
      : "Tenant scoped"
    : "Not allowed";
  const employeePanelTitle = isManager
    ? "Direct reports"
    : isEmployee
      ? "My profile record"
      : "Employees";
  const leavePanelTitle = isManager
    ? "Self and team leave"
    : isEmployee
      ? "My leave history"
      : "Leave";
  const attendancePanelTitle = isManager
    ? "Team attendance review"
    : isEmployee
      ? "My attendance"
      : "Attendance";

  const departmentCountMap = new Map(
    departmentEmployeeCounts.map((item) => [item.department, item._count._all]),
  );

  return (
    <main className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(16,185,129,0.16),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.18),_transparent_28%),linear-gradient(180deg,_#f4f8fb_0%,_#eef3f8_100%)] px-4 py-4 text-slate-900 lg:px-6">
      <div className="mx-auto flex min-h-screen w-full max-w-[1600px] flex-col gap-6 lg:flex-row">
        <aside className="w-full rounded-[32px] border border-white/70 bg-slate-950 px-5 py-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.28)] lg:sticky lg:top-4 lg:h-[calc(100vh-2rem)] lg:w-[320px]">
          <div className="rounded-[28px] bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-emerald-300">Core Vision</p>
            <h1 className="mt-2 text-2xl font-semibold">HRMS Workspace</h1>
            <p className="mt-3 text-sm leading-6 text-slate-300">
              Authenticated workspace for self-service, organization setup visibility, and backend
              verification with debug-friendly responses.
            </p>
          </div>

          <div className="mt-6 rounded-[28px] border border-white/10 bg-white/5 p-4">
            <p className="text-xs uppercase tracking-[0.22em] text-slate-400">Session</p>
            <p className="mt-3 text-lg font-semibold text-white">{session.user.email}</p>
            <p className="mt-1 text-sm text-slate-300">{roleLabels[session.user.role]}</p>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              Tenant: {tenant?.name ?? "Unknown tenant"}
              <br />
              Tenant ID: {session.user.tenantId}
              <br />
              Employee ID: {session.user.employeeId ?? "Not linked"}
            </p>
          </div>

          <div className="mt-6 grid gap-3">
            <SignOutButton />
            <a
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/10"
              href="/preview"
            >
              Open UI preview
            </a>
          </div>
        </aside>

        <section className="flex-1 rounded-[32px] border border-white/80 bg-white/80 p-5 shadow-[0_24px_80px_rgba(15,23,42,0.10)] backdrop-blur lg:p-6">
          <header className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-5">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
                  Developer implementation slice 11
              </p>
              <h2 className="mt-2 text-3xl font-semibold text-slate-900">
                  Leave policy and approval completion
              </h2>
            </div>
            <div className="rounded-full bg-slate-900 px-4 py-2 text-sm font-medium text-white">
              Debug enabled
            </div>
          </header>

          <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <MetricCard
              accent="from-emerald-500 to-emerald-300"
              icon={isTenantAdmin || isHrAdmin ? Building2 : UsersRound}
              label={isTenantAdmin || isHrAdmin ? "Departments" : isManager ? "Direct reports" : "Visible employees"}
              note={
                isTenantAdmin || isHrAdmin
                  ? "Tenant organization structure in scope."
                  : isManager
                    ? "Limited to the manager reporting line."
                    : isEmployee
                      ? "Scoped to the linked employee profile."
                      : "Tenant-aware employee visibility."
              }
              value={isTenantAdmin || isHrAdmin ? departments.length.toString() : employees.length.toString()}
            />
            <MetricCard
              accent="from-amber-500 to-orange-300"
              icon={isTenantAdmin ? ShieldCheck : CalendarClock}
              label={isTenantAdmin ? "HR Admin users" : isEmployee ? "Leave records" : "Visible leave"}
              note={
                isTenantAdmin
                  ? "Provisioned HR operations access accounts."
                  : isManager
                    ? "Includes self-service plus direct-report visibility."
                    : "Pulled from PostgreSQL role scope."
              }
              value={isTenantAdmin ? hrAdminUsers.length.toString() : leaveRequests.length.toString()}
            />
            <MetricCard
              accent="from-sky-500 to-cyan-300"
              icon={Clock3}
              label={isManager ? "Team attendance issues" : "Attendance records"}
              note={
                isManager
                  ? "Late, flagged, or incomplete direct-report entries."
                  : "Pulled from PostgreSQL seed and workflow data."
              }
              value={(isManager ? attendanceIssues : attendanceRecords.length).toString()}
            />
            <MetricCard
              accent="from-fuchsia-500 to-rose-300"
              icon={Database}
              label="Audit entries"
              note="Tenant-scoped development activity volume."
              value={auditCount.toString()}
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    Access model
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                    {roleLabels[session.user.role]}
                  </h3>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <DetailCard label="Employee access" value={employeeAccessLabel} />
                <DetailCard label="Approval access" value={approvalScopeLabel} />
                <DetailCard label="Session email" value={session.user.email ?? "Unknown"} />
                <DetailCard
                  label={isEmployee ? "Pending requests" : "Pending approvals"}
                  value={pendingApprovals.toString()}
                />
              </div>
              <div className="mt-5 rounded-3xl border border-emerald-100 bg-emerald-50 p-4 text-sm leading-6 text-emerald-900">
                This workspace now includes tenant profile, department structure, and HR Admin
                access visibility so organization setup is traceable alongside the self-service
                foundation.
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-slate-950 p-6 text-white shadow-[0_20px_60px_rgba(15,23,42,0.16)]">
              <div className="flex items-center gap-3">
                <FileSearch className="h-5 w-5 text-emerald-300" />
                <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-300">
                  Scope summary
                </p>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <ScopeChip
                  label="Actor"
                  value={profileEmployee?.fullName ?? session.user.email ?? "Tenant Admin"}
                />
                <ScopeChip
                  label={isManager ? "Direct reports" : "Tenant status"}
                  value={
                    isManager
                      ? (profileEmployee?._count.directReports ?? 0).toString()
                      : tenant?.active
                        ? "Active"
                        : "Paused"
                  }
                />
                <ScopeChip
                  label="Attendance issues"
                  value={attendanceIssues.toString()}
                />
                <ScopeChip
                  label="Profile status"
                  value={profileEmployee?.profileStatus ?? "TENANT_SCOPE"}
                />
              </div>
              <div className="mt-5 rounded-3xl border border-white/10 bg-white/5 p-4 text-sm leading-6 text-slate-300">
                Tenant Admin can view tenant-wide setup data and HR Admin access, while HR Admin can
                support organization structure within the approved MVP boundary.
              </div>
            </article>
          </section>

          {(isTenantAdmin || isHrAdmin) && tenant ? (
            <section className="mt-6 grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
              <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                      Tenant profile
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                      {tenant.name}
                    </h3>
                  </div>
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-2">
                  <DetailCard label="Tenant code" value={tenant.code} />
                  <DetailCard label="Contact email" value={tenant.contactEmail ?? "Not set"} />
                  <DetailCard label="Status" value={tenant.active ? "Active" : "Paused"} />
                  <DetailCard
                    label="Created"
                    value={new Intl.DateTimeFormat("en-MY", { dateStyle: "medium" }).format(tenant.createdAt)}
                  />
                </div>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <ScopeChip label="Departments" value={tenant._count.departments.toString()} />
                  <ScopeChip label="Employees" value={tenant._count.employees.toString()} />
                  <ScopeChip label="Users" value={tenant._count.users.toString()} />
                </div>
              </article>

              <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                    <CheckCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                      HR Admin access
                    </p>
                    <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                      {isTenantAdmin ? "Provisioned admin operations accounts" : "Visible admin operations accounts"}
                    </h3>
                  </div>
                </div>
                <div className="mt-5 grid gap-3">
                  {hrAdminUsers.length ? (
                    hrAdminUsers.map((adminUser) => (
                      <div key={adminUser.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                        <p className="font-semibold text-slate-900">
                          {adminUser.employee?.fullName ?? adminUser.email}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {adminUser.employee?.employeeCode ?? "No employee code"} -{" "}
                          {adminUser.employee?.jobTitle ?? "Unassigned"}
                        </p>
                        <p className="mt-1 text-sm text-slate-500">
                          {adminUser.employee?.department ?? "Unassigned"} - {adminUser.email}
                        </p>
                        <p className="mt-2 text-sm text-slate-500">
                          Last login: {formatDateTime(adminUser.lastLoginAt)}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                      No HR Admin users are provisioned yet.
                    </div>
                  )}
                </div>
              </article>
            </section>
          ) : null}

          {(isTenantAdmin || isHrAdmin) && departments.length ? (
            <section className="mt-6 rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-emerald-100 p-3 text-emerald-700">
                  <UsersRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-emerald-600">
                    Departments
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                    Organization structure visibility
                  </h3>
                </div>
              </div>
              <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {departments.map((department) => (
                  <div key={department.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                    <p className="font-semibold text-slate-900">{department.name}</p>
                    <p className="mt-1 text-sm text-slate-500">
                      {department.code} - {department.active ? "Active" : "Paused"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Lead: {department.managerEmployee?.fullName ?? "Not assigned"}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {department.description ?? "No department description added yet."}
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Employee records: {departmentCountMap.get(department.name) ?? 0}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          ) : null}

          <section className="mt-6 grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-sky-100 p-3 text-sky-700">
                  <UserRound className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-sky-600">
                    {isEmployee ? "My profile" : "Profile summary"}
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                    {profileEmployee?.fullName ?? "Tenant workspace access"}
                  </h3>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <DetailCard label="Employee code" value={profileEmployee?.employeeCode ?? "N/A"} />
                <DetailCard label="Job title" value={profileEmployee?.jobTitle ?? "Tenant Admin"} />
                <DetailCard label="Department" value={profileEmployee?.department ?? "Platform scope"} />
                <DetailCard label="Work location" value={profileEmployee?.workLocation ?? "Platform scope"} />
                <DetailCard label="Manager" value={profileEmployee?.manager?.fullName ?? "Not assigned"} />
                <DetailCard label="Profile email" value={profileEmployee?.email ?? session.user.email ?? "Unknown"} />
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-amber-100 p-3 text-amber-700">
                  <CheckCheck className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-amber-600">
                    Leave balance
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                    {hasLinkedEmployee ? "Current self-service entitlement view" : "No linked profile"}
                  </h3>
                </div>
              </div>
              {leaveBalances.length ? (
                <div className="mt-5 grid gap-3">
                  {leaveBalances.map((balance) => (
                    <BalanceCard
                      key={balance.leaveType}
                      label={balance.leaveType}
                      meta={`Used ${balance.usedBalance.toFixed(1)} days, pending ${balance.pendingBalance.toFixed(1)} days.`}
                      value={`${balance.remainingBalance.toFixed(1)} left`}
                    />
                  ))}
                </div>
              ) : (
                <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600">
                  Leave balances appear when the signed-in session is linked to an employee
                  profile with leave history.
                </div>
              )}
            </article>
          </section>

          <section className="mt-6">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-violet-100 p-3 text-violet-700">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-violet-600">
                    Leave policy
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                    Enabled leave types and entitlement setup
                  </h3>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                {leavePolicies.length ? (
                  leavePolicies.map((policy) => (
                    <BalanceCard
                      key={policy.id}
                      label={policy.name}
                      meta={`${policy.code} - ${policy.enabled ? "Enabled" : "Disabled"} - opening ${policy.openingBalance.toFixed(1)} days`}
                      value={`${policy.entitlement.toFixed(1)} entitlement`}
                    />
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-5 text-sm leading-6 text-slate-600 md:col-span-2 xl:col-span-3">
                    No leave policies are visible for this session scope yet.
                  </div>
                )}
              </div>
            </article>
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-3">
            <DataPanel
              title={employeePanelTitle}
              items={employees.map((employee) => ({
                id: employee.employeeCode,
                title: employee.fullName,
                subtitle: `${employee.jobTitle} - ${employee.department}`,
                meta: `${employee.email} - ${employee.employmentStatus} - ${employee.workLocation}`,
              }))}
              emptyMessage={
                isManager
                  ? "No direct reports are visible for this session."
                  : isEmployee
                    ? "No linked employee record is visible for this session."
                    : "No employees are visible for this session."
              }
              icon={UsersRound}
            />
            <DataPanel
              title={leavePanelTitle}
              items={leaveRequests.map((request) => ({
                id: request.id,
                title: request.employee.fullName,
                subtitle: `${request.leaveType} - ${request.status}`,
                meta: `${request.startDate.toISOString().slice(0, 10)} to ${request.endDate.toISOString().slice(0, 10)}`,
              }))}
              emptyMessage="No leave items are visible for this session."
              icon={CalendarClock}
            />
            <DataPanel
              title={attendancePanelTitle}
              items={attendanceRecords.map((record) => ({
                id: record.id,
                title: record.employee.fullName,
                subtitle: `${record.status} - ${record.employee.employeeCode}`,
                meta: `${record.attendanceDate.toISOString().slice(0, 10)}${record.reviewedBy?.email ? ` - reviewed by ${record.reviewedBy.email}` : ""}${record.remarks ? ` - ${record.remarks}` : ""}`,
              }))}
              emptyMessage="No attendance items are visible for this session."
              icon={Clock3}
            />
          </section>

          <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1fr]">
            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-cyan-100 p-3 text-cyan-700">
                  <FileSearch className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-600">
                    Reporting snapshot
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                    Role-scoped operational summary
                  </h3>
                </div>
              </div>
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                <DetailCard
                  label={isManager ? "Direct reports" : isEmployee ? "My profile" : "Visible employees"}
                  value={(isEmployee ? (profileEmployee ? 1 : 0) : employees.length).toString()}
                />
                <DetailCard
                  label={isEmployee ? "Pending requests" : "Pending approvals"}
                  value={pendingApprovals.toString()}
                />
                <DetailCard
                  label={isManager ? "Attendance issues" : "Attendance records"}
                  value={(isManager ? attendanceIssues : attendanceRecords.length).toString()}
                />
                <DetailCard
                  label={isTenantAdmin || isHrAdmin ? "Audit entries" : "Audit-visible actions"}
                  value={auditCount.toString()}
                />
              </div>
            </article>

            <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-fuchsia-100 p-3 text-fuchsia-700">
                  <Database className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.2em] text-fuchsia-600">
                    Recent audit activity
                  </p>
                  <h3 className="mt-1 text-2xl font-semibold text-slate-900">
                    Traceable backend changes
                  </h3>
                </div>
              </div>
              <div className="mt-5 grid gap-3">
                {recentAuditLogs.length ? (
                  recentAuditLogs.map((entry) => (
                    <div key={entry.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
                      <p className="font-semibold text-slate-900">
                        {entry.module} - {entry.actionType}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {entry.actor?.email ?? "System"} - {formatDateTime(entry.createdAt)}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        Target: {entry.targetRecordId}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
                    No audit-visible actions are currently available for this role scope.
                  </div>
                )}
              </div>
            </article>
          </section>
        </section>
      </div>
    </main>
  );
}

function MetricCard({
  label,
  value,
  note,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  note: string;
  icon: typeof UsersRound;
  accent: string;
}) {
  return (
    <article className="rounded-[28px] border border-white/70 bg-white/90 p-5 shadow-[0_20px_60px_rgba(15,23,42,0.10)] backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-slate-500">{label}</p>
          <p className="mt-4 text-3xl font-semibold text-slate-900">{value}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-lg ${accent}`}
        >
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="mt-4 text-sm leading-6 text-slate-600">{note}</p>
    </article>
  );
}

function DetailCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-sm font-medium text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

function ScopeChip({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
      <p className="mt-2 text-base font-semibold text-white">{value}</p>
    </div>
  );
}

function BalanceCard({ label, value, meta }: { label: string; value: string; meta: string }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">{label}</p>
      <p className="mt-3 text-lg font-semibold text-slate-900">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{meta}</p>
    </div>
  );
}

function DataPanel({
  title,
  items,
  emptyMessage,
  icon: Icon,
}: {
  title: string;
  items: Array<{ id: string; title: string; subtitle: string; meta: string }>;
  emptyMessage: string;
  icon: typeof UsersRound;
}) {
  return (
    <article className="rounded-[28px] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-3 text-slate-700">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">{title}</p>
          <h3 className="mt-1 text-2xl font-semibold text-slate-900">Latest visible items</h3>
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        {items.length ? (
          items.map((item) => (
            <div key={item.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold text-slate-900">{item.title}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.subtitle}</p>
                  <p className="mt-1 text-sm text-slate-500">{item.meta}</p>
                </div>
                <span className="rounded-full bg-white px-3 py-2 text-xs font-medium text-slate-600">
                  {item.id}
                </span>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-center text-sm text-slate-500">
            {emptyMessage}
          </div>
        )}
      </div>
    </article>
  );
}
