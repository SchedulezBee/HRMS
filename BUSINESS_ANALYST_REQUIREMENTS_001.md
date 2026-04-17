# Business Analyst Requirements 001

Date: 2026-04-16
Status: Draft for handoff
Primary input: `C:\Users\Administrator\Documents\Projects\Project\PRODUCT_OWNER_TASK_NOTE_001.md`
Benchmark reference: Info-Tech HRMS used for inspiration only, not for feature copying

## 1. Functional Overview

This document defines the MVP requirements for a SaaS-ready HRMS portal.

The MVP covers the minimum practical module set needed to launch an initial HR platform product without attempting full-suite parity.

The MVP scope includes:

- tenant-ready account structure
- employee master records
- organization structure
- role-based access
- employee self-service
- manager review and approval workflows
- leave management
- basic attendance management
- dashboard visibility
- operational reports
- audit visibility

The MVP does not include advanced payroll, ATS, LMS, appraisal, project costing, advanced scheduling, or full benchmark module parity.

## 2. User Roles

### Tenant Admin

Owns tenant-level setup and high-level administrative control for a customer account.

Primary permissions:

- create and manage company profile
- configure departments and reporting structure
- create HR Admin users
- view tenant-wide dashboards and reports
- manage tenant-level settings within approved MVP scope

### HR Admin

Owns day-to-day HR operations.

Primary permissions:

- create and update employee records
- assign employee manager and department
- manage leave types and policy values if enabled for MVP configuration
- review attendance data
- approve or override records where business rules allow
- view HR operational dashboards and reports

### Manager

Owns team-level oversight.

Primary permissions:

- view direct-report employee list
- review team attendance
- approve or reject leave requests for assigned team members
- view team-level dashboard summaries

### Employee

Uses self-service features.

Primary permissions:

- view own employee profile
- submit leave requests
- view leave balance and leave history
- record attendance based on allowed method
- view own attendance history
- receive workflow results and status feedback

## 3. Business Rules

### Tenant and Access Rules

1. Each customer tenant must have isolated data access from other tenants.
2. Users may only access data allowed by their assigned role and reporting scope.
3. Employee users can view and act on their own records only, unless granted a higher role.
4. Managers can only access records for employees assigned to their reporting line.
5. HR Admin and Tenant Admin access levels must be role-controlled and auditable.

### Employee Record Rules

1. Each employee must belong to exactly one tenant.
2. Each employee must have a unique employee identifier within the tenant.
3. Each employee should be assignable to department, job title, employment status, and reporting manager.
4. Core profile changes must be traceable through audit history.

### Leave Rules

1. Employees may submit leave only for leave types available to them.
2. A leave request must include leave type, date range, duration, and reason when required.
3. Leave requests must follow an approval flow before being marked approved.
4. Approved leave must affect visible leave balance records.
5. Rejected leave must retain request history and rejection reason.
6. Cancelled leave behavior must be recorded and reversible through audit history.
7. Assumption for MVP: leave balance logic begins with configurable opening balance and basic entitlement values, not advanced accrual automation unless later approved.

### Attendance Rules

1. Employees must be able to record attendance using the approved MVP method.
2. Attendance records must capture date, time-in, time-out, and status outcome.
3. Missing or incomplete attendance entries must be visible for review.
4. Manager or HR review visibility must exist for exception handling.
5. Assumption for MVP: attendance starts with basic web-based or admin-recorded attendance and does not require biometric or GPS support unless later approved.

### Approval Rules

1. Leave approvals must route to the assigned approving manager or configured approver.
2. Approval result must be stored with action date, actor, and optional remarks.
3. The system must prevent unauthorized users from approving requests outside their scope.

### Audit and Reporting Rules

1. Important employee, leave, attendance, and approval actions must be auditable.
2. Dashboards and reports must respect role-based visibility.
3. Reports in MVP should focus on operational clarity rather than advanced analytics.

### UI Feedback Rule

1. Success, error, warning, and validation messages must be shown through centered popup feedback rather than only inline page updates.
2. Error feedback should be sufficiently descriptive to aid debugging during development.

## 4. User Stories

### Employee Management

1. As an HR Admin, I want to create an employee record so that the employee can be managed inside the HRMS.
2. As an HR Admin, I want to update employee profile and employment details so that records remain accurate.
3. As an Employee, I want to view my own profile so that I can confirm my personal and work information.

### Role and Access

4. As a Tenant Admin, I want to assign administrative roles so that tenant operations can be managed securely.
5. As the system, I need role-based access restrictions so that users only see data allowed by their role.

### Leave Management

6. As an Employee, I want to submit a leave request so that I can request time off through the portal.
7. As a Manager, I want to approve or reject leave requests for my team so that leave follows a controlled workflow.
8. As an Employee, I want to see my leave balance and leave history so that I understand my available entitlement and request status.

### Attendance

9. As an Employee, I want to record my attendance so that my work presence is captured by the system.
10. As a Manager, I want to review attendance exceptions for my team so that I can monitor lateness, missing entries, or irregularities.
11. As an HR Admin, I want to review attendance records so that HR can resolve issues and maintain records.

### Dashboards and Reports

12. As an HR Admin, I want dashboard summaries and operational reports so that I can monitor leave and attendance activity.
13. As a Manager, I want a team summary view so that I can quickly identify pending approvals and attendance issues.

## 5. Acceptance Criteria

### Employee Record Management

1. HR Admin can create a new employee with required fields only after validation passes.
2. The system blocks duplicate employee identifiers within the same tenant.
3. An employee record is stored with department, manager, and status values.
4. Employee users can view only their own employee profile.
5. Changes to employee master data are recorded in audit history.

### Role-Based Access

1. Users can only access screens and data allowed by their assigned role.
2. Managers cannot view employees outside their reporting scope.
3. Tenant data from one customer is not visible to another customer tenant.

### Leave Workflow

1. Employees can submit leave using only enabled leave types.
2. The system validates required fields before submission.
3. Submitted leave enters a pending state until approved or rejected.
4. Managers can approve or reject only requests within their approval scope.
5. Approved leave updates visible leave balance records.
6. Rejected leave keeps the request history and stores the rejection reason.
7. The user receives centered popup feedback for success or failure actions.

### Attendance Workflow

1. Employees can create attendance records using the approved attendance input path.
2. The system stores time-in and time-out values with a date reference.
3. Incomplete or abnormal records are visible to review roles.
4. Managers and HR Admin can view attendance data according to their access scope.
5. Attendance actions return centered popup success or error feedback.

### Dashboards and Reports

1. HR Admin dashboard shows operational counts relevant to leave and attendance.
2. Manager dashboard shows pending approvals and team attendance visibility.
3. Report access follows role-based visibility rules.

### Debug and Error Visibility

1. Validation and failure messages must expose enough detail for development tracing.
2. Silent failures are not acceptable in MVP behavior.

## 6. Process Flow

### Employee Setup Flow

1. Tenant Admin or HR Admin creates base company structure.
2. HR Admin creates employee record.
3. HR Admin assigns department, role, and manager.
4. Employee account becomes available for self-service access.

### Leave Request Flow

1. Employee opens leave module.
2. Employee selects leave type and request dates.
3. System validates balance and required fields.
4. Leave request is submitted as pending.
5. Assigned approver reviews the request.
6. Approver approves or rejects the request.
7. System records the action, updates status, and shows centered popup feedback.

### Attendance Flow

1. Employee opens attendance function.
2. Employee records attendance entry.
3. System validates required fields and saves the record.
4. Attendance result becomes visible to employee and authorized reviewers.
5. Exceptions remain visible for manager or HR review.

### Approval and Exception Handling Flow

1. Pending requests are surfaced to the assigned approver.
2. Unauthorized users attempting approval are blocked.
3. Rejected actions require a recorded reason if configured as mandatory.
4. Errors are shown through centered popup messages with traceable detail during development.

## 7. Data / Field Requirements

### Tenant

- tenant name
- tenant code
- company contact details
- subscription status
- created date
- active status

### User Account

- user id
- tenant id
- employee id reference where applicable
- role
- login identifier
- active status
- last login

### Employee Master

- employee id
- tenant id
- full name
- preferred name
- email
- phone number
- identity number or equivalent identifier
- employment status
- department
- job title
- reporting manager
- hire date
- work location
- profile status

### Leave

- leave request id
- employee id
- leave type
- start date
- end date
- total days or units
- reason
- status
- approver id
- approval remarks
- action timestamp

### Leave Balance

- employee id
- leave type
- opening balance
- entitlement
- used balance
- remaining balance
- last updated date

### Attendance

- attendance id
- employee id
- attendance date
- time in
- time out
- attendance status
- remarks
- reviewed by
- review status

### Audit Log

- audit id
- tenant id
- actor id
- module name
- action type
- target record id
- before value reference
- after value reference
- timestamp

## 8. Open Questions / Assumptions

### Open Questions

1. Is the first launch targeted at Malaysia only or a broader regional SaaS market?
2. Are statutory leave rules required in MVP or should leave rules remain company-configurable only?
3. Is payroll fully excluded from MVP, or should the data model keep placeholder compatibility for later payroll expansion?
4. What attendance methods are approved for V1: web entry only, admin entry, mobile entry, GPS, or biometric integration?
5. Are notifications in MVP limited to in-app and email, or should other channels be considered later?
6. Does the first release require document uploads for employee records or leave requests?

### Assumptions

1. The MVP focuses on SMEs or mid-sized customers that need operational HR digitization before advanced enterprise complexity.
2. Multi-tenant readiness is required from the beginning, even if the first release is operationally simple.
3. Advanced payroll, ATS, LMS, appraisal, project costing, and advanced scheduling remain outside initial MVP scope.
4. Centered popup feedback is a mandatory UI behavior rule for user-facing success and error events.
5. Debug-oriented error visibility is enabled during development and test environments.
