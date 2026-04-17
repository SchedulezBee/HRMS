import { LeaveStatus, type LeavePolicy, type LeaveRequest } from "@prisma/client";

export type LeaveBalanceSummary = {
  leaveType: string;
  openingBalance: number;
  entitlement: number;
  usedBalance: number;
  pendingBalance: number;
  remainingBalance: number;
};

export type LeavePolicyBalanceInput = Pick<
  LeavePolicy,
  "enabled" | "entitlement" | "name" | "openingBalance"
>;

export function computeLeaveBalances(
  requests: Array<Pick<LeaveRequest, "leaveType" | "status" | "totalDays">>,
  leavePolicies: LeavePolicyBalanceInput[],
) {
  const summaries = new Map<string, LeaveBalanceSummary>();

  for (const policy of leavePolicies.filter((item) => item.enabled)) {
    const totalAvailable = policy.openingBalance + policy.entitlement;

    summaries.set(policy.name, {
      entitlement: policy.entitlement,
      leaveType: policy.name,
      openingBalance: policy.openingBalance,
      pendingBalance: 0,
      remainingBalance: totalAvailable,
      usedBalance: 0,
    });
  }

  for (const request of requests) {
    const current =
      summaries.get(request.leaveType) ??
      {
        entitlement: 0,
        leaveType: request.leaveType,
        openingBalance: 0,
        pendingBalance: 0,
        remainingBalance: 0,
        usedBalance: 0,
      };

    if (request.status === LeaveStatus.APPROVED) {
      current.usedBalance += request.totalDays;
    }

    if (request.status === LeaveStatus.PENDING) {
      current.pendingBalance += request.totalDays;
    }

    current.remainingBalance = Math.max(
      0,
      current.openingBalance + current.entitlement - current.usedBalance,
    );
    summaries.set(request.leaveType, current);
  }

  return Array.from(summaries.values()).sort((left, right) =>
    left.leaveType.localeCompare(right.leaveType),
  );
}
