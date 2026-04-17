# Solution Architecture 001

Date: 2026-04-16
Status: Draft for handoff
Primary input: `C:\Users\Administrator\Documents\Projects\Project\BUSINESS_ANALYST_REQUIREMENTS_001.md`
Related rules: `C:\Users\Administrator\Documents\Projects\Project\PROJECT_RULEBOOK.md`

## 1. Architecture Overview

The MVP should be built as a SaaS-ready modular web platform using a lean modular monolith approach.

This approach is recommended for the first release because it keeps delivery practical, avoids premature distributed-system complexity, and still supports phased expansion into a broader HR platform.

The system should be designed around strict tenant isolation, role-based access, auditable workflows, and clean module boundaries so later modules can be added without rewriting core foundations.

Recommended architectural direction:

- single deployable application for MVP
- clear internal module boundaries
- shared authentication and authorization layer
- API-first backend for portal and future client channels
- relational database as source of truth
- audit trail and operational logging from the first release
- environment-aware debug visibility during development

High-level component view:

- web application portal
- backend application layer
- authorization and tenant access layer
- domain modules for employee, leave, attendance, approvals, and reporting
- relational database
- audit and activity logging
- notification and popup message handling support

This design is intentionally simple enough for MVP delivery while preserving growth paths for later payroll, ATS, LMS, appraisal, claims, and other HR modules.

## 2. Core Modules

### Identity and Access Module

Responsibilities:

- user authentication
- session management
- password and login controls
- role assignment
- tenant-aware authorization checks

Why it exists:

- all other modules depend on secure user and tenant access boundaries

### Tenant and Organization Module

Responsibilities:

- tenant profile management
- department structure
- manager hierarchy
- company configuration values required by MVP

Why it exists:

- SaaS readiness requires a clear tenant container and organization structure from the beginning

### Employee Master Module

Responsibilities:

- employee profile creation
- employment details
- manager assignment
- employee status management
- employee self-service profile view

Why it exists:

- employee data is the foundation for leave, attendance, reporting, and later HR modules

### Leave Management Module

Responsibilities:

- leave type availability
- leave balance records
- leave request submission
- approval workflow integration
- request history

Why it exists:

- leave is one of the highest-value HRMS MVP workflows and directly supports self-service adoption

### Attendance Module

Responsibilities:

- attendance entry creation
- attendance status handling
- exception visibility
- employee history view
- manager and HR review visibility

Why it exists:

- attendance is another core MVP operation and pairs closely with leave and manager oversight

### Approval Workflow Module

Responsibilities:

- approval routing
- pending action queues
- approval and rejection decisions
- action remarks
- workflow history

Why it exists:

- approvals are a shared capability across leave now and future modules later

### Dashboard and Reporting Module

Responsibilities:

- role-based summary cards
- pending approval counts
- attendance and leave operational reports
- filtered visibility by role and tenant

Why it exists:

- admins and managers need quick operational insight without building advanced analytics first

### Audit and Activity Module

Responsibilities:

- capture key create, update, approval, rejection, and status actions
- retain actor, target, and timestamp references
- support traceability for debugging and operations

Why it exists:

- the product rules require traceable errors and action visibility from early phases

### Notification and Feedback Module

Responsibilities:

- standardize success, warning, validation, and error feedback
- support centered popup delivery pattern across modules
- provide reusable feedback behavior for create, update, delete, and workflow actions

Why it exists:

- this is required by project rule and should not be implemented inconsistently screen by screen

## 3. Data Model / Entities

### Core Tenant Entities

- Tenant
- Department
- Team or reporting unit if needed
- Role
- UserAccount

### Core HR Entities

- Employee
- EmployeeProfileChangeLog
- EmploymentStatus
- ManagerAssignment

### Leave Entities

- LeaveType
- LeavePolicyConfig
- LeaveBalance
- LeaveRequest
- LeaveApprovalAction

### Attendance Entities

- AttendanceRecord
- AttendanceException
- AttendanceReviewAction

### Shared Workflow and Traceability Entities

- ApprovalTask
- NotificationEvent
- AuditLog
- SystemErrorLog

Entity design rules:

1. Every business entity must carry a tenant reference.
2. User-facing records should support created and updated metadata.
3. Approval-related entities must retain actor, action, and timestamp details.
4. Logs should be separated from transactional records for maintainability.
5. The model should allow future module expansion without changing tenant, user, employee, or approval foundations.

## 4. API / Integration Plan

The MVP should expose internal versioned APIs for all major modules even if the first client is a web portal only.

Recommended API groups:

- `/api/v1/auth`
- `/api/v1/tenants`
- `/api/v1/users`
- `/api/v1/employees`
- `/api/v1/leave-types`
- `/api/v1/leave-balances`
- `/api/v1/leave-requests`
- `/api/v1/attendance`
- `/api/v1/approvals`
- `/api/v1/dashboard`
- `/api/v1/reports`
- `/api/v1/audit`

API behavior rules:

1. Every request must be tenant-aware and authorization-checked.
2. Mutating actions must trigger audit logging.
3. Validation failures must return structured error payloads suitable for centered popup display.
4. API responses should support traceable debug context in development environments.
5. Approval and exception endpoints should be reusable by future modules.

Initial integration approach:

- no mandatory third-party integration should block MVP
- leave room for later payroll, notification, biometric attendance, and email or messaging integrations
- design an internal notification abstraction so later channels can be added without rewriting module logic

## 5. Security / Access Design

### Authentication

- secure login flow for portal users
- password hashing and secure session or token handling
- environment-based debug handling so development visibility does not become uncontrolled production exposure

### Authorization

- role-based access control with tenant-aware enforcement
- scope-based filtering for manager-level access
- server-side enforcement for every protected action

### Tenant Isolation

- all business records must include tenant ownership
- every query path must filter by tenant scope
- cross-tenant data access must be blocked by default

### Audit and Traceability

- log important create, update, approve, reject, and status-change events
- capture actor identity and target record references
- retain error logs that help diagnose failures during development and test phases

### Security Baseline Expectations

- least-privilege access model
- protected secrets and configuration separation
- input validation on all public write actions
- safe error handling with more detailed traces only in development or approved environments

## 6. Non-Functional Requirements

### Scalability

- architecture must support growth from one tenant to many tenants without redesigning the core model
- module boundaries must be clean enough to allow later extraction if scale demands it

### Maintainability

- business logic should live in module services, not scattered through controllers or UI handlers
- shared concerns like auth, logging, popup feedback contracts, and audit must be centralized

### Performance

- common dashboard and list views should remain responsive for practical SME and mid-market usage
- indexes should support tenant, employee, approval status, leave status, and attendance date queries

### Reliability

- write operations should be transactional where workflow consistency matters
- approval and balance updates must avoid partial-save states

### Observability

- debug logging must be enabled in development
- operational logs must identify module and action context
- error tracking should support fast diagnosis of failed workflows

### Usability Constraints with Architectural Impact

- centered popup feedback requires a standard response contract for success, warning, validation, and error states
- role-based dashboards must load data relevant to the current actor without leaking unrelated records

## 7. Technical Risks

1. Multi-tenant design can become fragile if tenant filtering is not enforced centrally.
2. Leave and attendance rules may require rework if the launch geography introduces statutory complexity not yet defined.
3. Approval logic can become duplicated if shared workflow handling is not built as a reusable module.
4. Debug visibility can become a security issue if development-style error detail leaks into production.
5. Attendance scope may expand unexpectedly if GPS, mobile, or biometric requirements are introduced mid-build.
6. Future payroll support may require avoidable refactoring if employee and leave data are modeled too narrowly now.

## 8. Implementation Constraints

1. Build the MVP as a modular monolith first; do not introduce microservices in the initial phase.
2. Keep module boundaries explicit so future modules can be added without rewriting core foundations.
3. Do not design for full benchmark parity in V1.
4. Treat centered popup feedback as a shared platform behavior, not a page-specific custom pattern.
5. Keep debug and error visibility enabled for development and testing, but ensure environment-based control exists from the start.
6. Preserve API and data model room for later modules such as payroll, claims, ATS, appraisal, LMS, and broader notifications.
7. Do not finalize country-specific compliance logic until Product Owner and Business Analyst confirm launch-market rules.
