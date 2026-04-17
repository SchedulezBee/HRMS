import { z } from "zod";

export const tenantProfileUpdateSchema = z.object({
  active: z.boolean(),
  contactEmail: z.email().or(z.literal("")).optional(),
  name: z.string().min(2),
});

export const departmentCreateSchema = z.object({
  active: z.boolean().default(true),
  code: z.string().min(2),
  description: z.string().optional(),
  managerEmployeeId: z.string().optional(),
  name: z.string().min(2),
});

export const departmentUpdateSchema = z.object({
  active: z.boolean().optional(),
  code: z.string().min(2).optional(),
  description: z.string().optional(),
  managerEmployeeId: z.string().nullable().optional(),
  name: z.string().min(2).optional(),
});

export const adminUserProvisionSchema = z.object({
  active: z.boolean().default(true),
  employeeId: z.string().min(1),
  password: z.string().min(8),
});

export const adminUserUpdateSchema = z.object({
  active: z.boolean().optional(),
  password: z.string().min(8).optional(),
});

export const leavePolicyCreateSchema = z.object({
  code: z.string().min(2),
  enabled: z.boolean().default(true),
  entitlement: z.number().min(0),
  name: z.string().min(2),
  openingBalance: z.number().min(0),
});

export const leavePolicyUpdateSchema = z.object({
  code: z.string().min(2).optional(),
  enabled: z.boolean().optional(),
  entitlement: z.number().min(0).optional(),
  name: z.string().min(2).optional(),
  openingBalance: z.number().min(0).optional(),
});

export const employeeCreateSchema = z.object({
  tenantCode: z.string().min(2),
  employeeCode: z.string().min(3),
  fullName: z.string().min(2),
  preferredName: z.string().optional(),
  email: z.email(),
  phoneNumber: z.string().optional(),
  identityNumber: z.string().optional(),
  employmentStatus: z.string().min(2),
  department: z.string().min(2),
  jobTitle: z.string().min(2),
  managerId: z.string().optional(),
  hireDate: z.iso.datetime().optional(),
  workLocation: z.string().optional(),
  profileStatus: z.string().default("ACTIVE"),
});

export const employeeUpdateSchema = z.object({
  fullName: z.string().min(2),
  preferredName: z.string().optional(),
  email: z.email(),
  phoneNumber: z.string().optional(),
  identityNumber: z.string().optional(),
  employmentStatus: z.string().min(2),
  department: z.string().min(2),
  jobTitle: z.string().min(2),
  managerId: z.string().nullable().optional(),
  hireDate: z.iso.datetime().nullable().optional(),
  workLocation: z.string().optional(),
  profileStatus: z.string().min(2),
});

export const leaveRequestCreateSchema = z.object({
  tenantCode: z.string().min(2),
  employeeId: z.string().min(1),
  leaveType: z.string().min(2),
  startDate: z.iso.datetime(),
  endDate: z.iso.datetime(),
  totalDays: z.number().positive(),
  reason: z.string().min(3),
});

export const leaveApprovalSchema = z
  .object({
    approvalRemarks: z.string().optional(),
    status: z.enum(["APPROVED", "REJECTED"]),
  })
  .superRefine((value, context) => {
    if (value.status === "REJECTED" && !value.approvalRemarks?.trim()) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Rejection remarks are required for rejected leave requests.",
        path: ["approvalRemarks"],
      });
    }
  });

export const attendanceRecordSchema = z.object({
  tenantCode: z.string().min(2),
  employeeId: z.string().min(1),
  attendanceDate: z.iso.datetime(),
  timeIn: z.iso.datetime().nullable().optional(),
  timeOut: z.iso.datetime().nullable().optional(),
  status: z.enum(["ON_TIME", "LATE", "MISSING_CLOCK_OUT", "COMPLETE", "FLAGGED"]),
  remarks: z.string().optional(),
});

export const attendanceReviewSchema = z
  .object({
    remarks: z.string().optional(),
    reviewedAt: z.iso.datetime().optional(),
    status: z.enum(["ON_TIME", "LATE", "MISSING_CLOCK_OUT", "COMPLETE", "FLAGGED"]),
    timeIn: z.iso.datetime().nullable().optional(),
    timeOut: z.iso.datetime().nullable().optional(),
  })
  .refine(
    (value) =>
      value.remarks !== undefined ||
      value.timeIn !== undefined ||
      value.timeOut !== undefined ||
      value.status !== undefined,
    {
      message: "Attendance review requires at least one review value.",
      path: ["status"],
    },
  );
