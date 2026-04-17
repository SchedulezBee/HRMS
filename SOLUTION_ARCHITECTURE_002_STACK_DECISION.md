# Solution Architecture 002 - Stack Decision

Date: 2026-04-16
Status: Recommended for next implementation slice
Primary inputs:

- `C:\Users\Administrator\Documents\Projects\Project\SOLUTION_ARCHITECTURE_001.md`
- `C:\Users\Administrator\Documents\Projects\Project\QA_REPORT_002.md`
- `C:\Users\Administrator\Documents\Projects\Project\PROJECT_RULEBOOK.md`

## 1. Architecture Overview

This document defines the concrete technology stack for the next implementation slice of the HRMS MVP.

The earlier architecture already approved the direction of:

- modular monolith
- API-first backend
- relational database as source of truth
- tenant-aware role-based security

What was not previously finalized was the exact implementation stack.

That is now being resolved here so the next developer slice can proceed with a concrete backend target.

## 2. Core Modules

The next implementation slice should continue using the existing MVP module structure:

- Identity and Access
- Tenant and Organization
- Employee Master
- Leave Management
- Attendance
- Approval Workflow
- Dashboard and Reporting
- Audit and Activity
- Notification and Feedback

No new business modules are being added in this stack decision.

## 3. Data Model / Entities

The approved entity direction from the earlier architecture remains valid.

For the next slice, the first persisted entities should be:

- UserAccount
- Role
- Tenant
- Employee
- LeaveRequest
- AttendanceRecord
- AuditLog

This sequencing is chosen because these entities unlock the most urgent missing QA gaps:

- backend persistence
- role enforcement
- attendance storage

## 4. API / Integration Plan

### Recommended concrete stack

- Web app and backend runtime: `Next.js` App Router
- UI layer: `React` with `TypeScript`
- Styling: `Tailwind CSS`
- ORM and schema management: `Prisma`
- Primary database target: `PostgreSQL`
- Validation layer: `Zod`
- Authentication approach: `Auth.js` with application-managed role and tenant claims

### Why this stack is recommended

1. The project already uses Next.js, React, TypeScript, and Tailwind, so keeping those avoids unnecessary rewrite.
2. Prisma is a strong fit for fast MVP delivery, typed data access, and migration management.
3. PostgreSQL is the correct production-grade relational database target for a SaaS HRMS product.
4. Auth.js fits the existing Next.js direction and provides a practical path to session handling without introducing a separate auth platform too early.
5. Zod fits well for request validation, form validation alignment, and API contract clarity.

### Immediate backend implementation target

The next developer slice should implement:

- Prisma schema and migrations
- PostgreSQL-backed persistence layer
- route handlers or server-side actions for employee, leave, attendance, and approval flows
- Auth.js session flow with role and tenant-aware access checks
- server-side authorization guards

## 5. Security / Access Design

### Decided now

- Authentication should move from UI preview mode to real session-based identity
- Authorization must be enforced server-side, not only in the UI
- Role and tenant scope must be carried into backend checks
- Audit logging should begin on create, update, approval, and attendance actions

### Deferred intentionally

- external identity provider integration
- single sign-on
- advanced security platform integrations

These are deferred because they are not necessary to validate the MVP product flow in the next slice.

## 6. Non-Functional Requirements

### Persistence decision

The reason a real database was not wired earlier is sequencing, not omission.

The first implementation slices were intentionally used to establish:

- application shell
- workflow shape
- centered popup behavior
- role-aware UI behavior
- QA-visible interaction patterns

Those slices reduced design churn before committing backend structure.

Now that the UI and workflow direction is stable enough, backend persistence should be wired next.

### Services that should be wired in the next slice

- PostgreSQL database
- Prisma migrations and client
- Auth.js session/auth layer
- Zod validation for backend request safety

### Services intentionally deferred

- email delivery provider
- SMS or messaging provider
- biometric attendance integration
- GPS attendance integration
- document/file storage service
- external payroll integration
- observability vendors such as Sentry or external APM

These are deferred because:

1. They are not blockers for validating the MVP operational workflows.
2. They depend on still-open business questions such as launch market and notification scope.
3. Wiring them now would increase complexity before core HR workflows are fully persisted.

## 7. Technical Risks

1. PostgreSQL still needs environment setup and credentials before developer implementation can be fully completed.
2. Auth.js role and tenant claims must be designed carefully to avoid weak server-side authorization.
3. Audit logging can become inconsistent if not introduced together with the first persisted workflows.
4. Attendance storage may still need rework later if mobile, GPS, or biometric scope expands.

## 8. Implementation Constraints

1. Keep the modular monolith approach for the next slice.
2. Do not introduce microservices.
3. Do not add external platforms unless they are required for the immediate MVP backend gap.
4. Use PostgreSQL as the intended real database target for the project.
5. Keep any temporary local-only persistence only as a transition aid during migration to real database-backed flows.
6. The next implementation slice should prioritize:
   - backend persistence
   - real authorization
   - attendance storage
   - audit-ready write flows
