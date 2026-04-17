# Module Usage - Platform Foundation 005

Date: 2026-04-16
Module status: Usable in local development

## 1. What this slice adds

- backend-wired attendance actions in signed-in `/preview` mode
- same-day clock-in, clock-out, refresh, and flag-exception handling in the preview portal
- corrected `.env.example` values for the approved local PostgreSQL setup

## 2. Local setup

From `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`:

- run `npm install`
- run `npm run db:prepare-local`
- run `npx prisma db push`
- run `npx prisma generate`
- run `npm run db:seed`
- run `npm run dev`

## 3. Local database

This project uses the machine's PostgreSQL 17 service:

- host: `localhost`
- port: `5432`
- database: `hrms_portal`
- shadow database: `hrms_portal_shadow`
- local dev user: `postgres`
- local dev password: `postgres`

## 4. Main routes

- `/` - entry page
- `/sign-in` - sign in with seeded credentials
- `/workspace` - lightweight backend verification workspace
- `/preview` - richer portal UI with backend sync when signed in

## 5. Seeded credentials

Shared development password for demo app users:

- `Password123!`

Seeded app users:

- `tenant.admin@corevision.local` - Tenant Admin
- `alya.rahman@corevision.local` - HR Admin
- `daniel.tan@corevision.local` - Manager
- `marcus.lee@corevision.local` - Employee

## 6. How to use the preview attendance flow

1. Open `/sign-in`
2. Sign in with `HR Admin`, `Manager`, or `Employee`
3. Open `/preview`
4. Open the `Attendance` module
5. Use the primary attendance button:
   - `Clock in` creates the same-day attendance entry
   - `Clock out` completes the same-day attendance entry
   - `Refresh entry` starts a fresh same-day entry after a completed record already exists
6. Use `Flag exception` to mark the current same-day entry for follow-up
7. Confirm the centered popup shows the outcome and debug reference
8. Confirm the attendance review list refreshes with the updated state

## 7. Current limitations

- QA still needs to confirm the richer attendance UI flow through direct browser interaction
- the preview route is still an MVP integration surface, not the final production UI
- local PostgreSQL credentials are development-only and should not be reused outside local development
