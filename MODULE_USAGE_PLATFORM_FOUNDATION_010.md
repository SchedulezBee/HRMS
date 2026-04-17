# Module Usage - Platform Foundation 010

Date: 2026-04-16
Module status: Usable in local development

## 1. What this slice adds

- employee record edit flow for `Tenant Admin` and `HR Admin`
- attendance review and correction flow for `Tenant Admin` and `HR Admin`
- centered modals for employee maintenance and attendance review
- audit-backed backend routes for employee updates and attendance review changes
- richer authenticated workspace visibility for employment and attendance review context

## 2. Local setup

From `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`:

- run `npm install`
- run `npm run db:prepare-local`
- run `npx prisma db push`
- run `npx prisma generate`
- run `npm run db:seed`
- run `npm run dev`

## 3. How to verify employee maintenance

1. Open `/sign-in`
2. Sign in as `Tenant Admin` using `tenant.admin@corevision.local` and password `Password123!`
3. Open `/preview`
4. Open the `Employees` module
5. Select `Edit record` on an employee
6. Update at least one field such as title, work location, profile status, or reporting manager
7. Save the centered modal
8. Confirm a centered success popup appears with a debug reference
9. Confirm the employee list refreshes with the updated values
10. Sign out and repeat the same flow as `HR Admin` using `hr.admin@corevision.local`

## 4. How to verify attendance review

1. Sign in as `Tenant Admin` or `HR Admin`
2. Open `/preview`
3. Open the `Attendance` module
4. Select `Review entry` on an attendance item
5. Adjust status, review remarks, or time fields
6. Save the centered modal
7. Confirm a centered success popup appears with a debug reference
8. Confirm the attendance review list refreshes with review remarks and reviewer details
9. Sign in as `Manager`
10. Confirm attendance items remain visible but do not expose the `Review entry` action

## 5. API surfaces added in this slice

- `/api/employees/[id]`
- `/api/attendance/[id]`

## 6. Current limitations

- employee maintenance still uses the MVP string-based department field rather than a fully relational department picker
- browser-driven QA is still needed for the newest centered employee and attendance modals
- authenticated `/workspace` reflects review context but does not expose edit actions directly
