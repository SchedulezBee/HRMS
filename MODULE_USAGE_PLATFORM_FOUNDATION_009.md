# Module Usage - Platform Foundation 009

Date: 2026-04-16
Module status: Usable in local development

## 1. What this slice adds

- backend dashboard summary endpoint
- backend operational report sections
- backend recent audit-log visibility
- preview route reporting cards and audit activity tied to live backend data when signed in
- workspace reporting snapshot and recent audit activity

## 2. Local setup

From `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`:

- run `npm install`
- run `npm run db:prepare-local`
- run `npx prisma db push`
- run `npx prisma generate`
- run `npm run db:seed`
- run `npm run dev`

## 3. How to verify the reporting and audit flow

1. Open `/sign-in`
2. Sign in as `Tenant Admin` using `tenant.admin@corevision.local` and password `Password123!`
3. Open `/preview`
4. Confirm the `Dashboard` module shows tenant-scoped reporting cards instead of preview-only counts
5. Open the `Reports` module
6. Confirm operational report sections and recent audit items are visible
7. Open `/workspace`
8. Confirm the reporting snapshot and recent audit activity panels are visible in the authenticated
   backend screen
9. Sign out
10. Sign in as `Manager` using `daniel.tan@corevision.local` and password `Password123!`
11. Confirm dashboard and reports stay limited to self plus direct-report scope
12. Sign out
13. Sign in as `Employee` using `marcus.lee@corevision.local` and password `Password123!`
14. Confirm dashboard and reports stay limited to self-service scope

## 4. API surfaces added in this slice

- `/api/dashboard`
- `/api/reports`
- `/api/audit-log`

## 5. Current limitations

- manager and employee audit visibility is conservative and actor-scoped in MVP
- reports are operational summary views only; no export, charting, or advanced analytics flow is
  included
- preview route still benefits from later browser-driven QA for visual confirmation of interaction
  states and centered popup behavior
