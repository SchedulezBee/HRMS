# Full Stack Developer Implementation 004

Date: 2026-04-16
Status: Completed for current slice
Primary inputs:

- `C:\Users\Administrator\Documents\Projects\Project\QA_REPORT_003.md`
- `C:\Users\Administrator\Documents\Projects\Project\FULL_STACK_DEVELOPER_IMPLEMENTATION_003.md`
- `C:\Users\Administrator\Documents\Projects\Project\PROJECT_RULEBOOK.md`

## 1. Feature / Module Implemented

Backend stabilization and preview-to-backend wiring slice for the HRMS MVP web portal.

This slice addresses the unstable auth/database path from QA 003 and starts merging the richer
preview UI into the real backend flows.

## 2. Scope Covered

- moved local development persistence onto the machine's stable PostgreSQL 17 service on `localhost:5432`
- added a repeatable local database preparation script for `hrms_portal` and `hrms_portal_shadow`
- hardened Prisma runtime with pooled Postgres adapter configuration and one-time retry on connection errors
- kept Auth.js credential auth and stabilized repeated login behavior against the new database endpoint
- updated preview route to detect an authenticated session and sync real employee, leave, and attendance data
- wired preview employee creation to the backend employee API when signed in
- wired preview leave submission to the backend leave API when signed in
- wired preview approval actions to the backend approvals API when signed in
- kept unauthenticated preview mode available with local-state fallback

## 3. Technical Components Built

- stable local PostgreSQL environment using the Windows service `postgresql-x64-17`
- `db:prepare-local` script for local database bootstrap
- Prisma runtime helper with pooled `pg` configuration and retry-based reconnection
- preview session handoff from server route to client portal
- backend-aware preview sync and write handlers for employee and leave workflows
- API response enrichment for employee manager, leave employee, and attendance employee display data

## 4. Validation / Rules Applied

- `npm run db:prepare-local` passed
- `npx prisma db push` passed
- `npx prisma generate` passed
- `npm run db:seed` passed
- `npm run lint` passed
- `npm run build` passed
- repeated good login checks passed across fresh production server boots
- bad credentials returned the expected credentials error state instead of a `500`
- authenticated preview route rendered backend mode successfully
- HR Admin employee creation via backend API succeeded
- Employee leave submission via backend API succeeded

## 5. Known Constraints

- preview attendance actions are still read-focused in backend mode; attendance write capture is still queued for a later slice
- preview UI and backend are now partially merged, but not every legacy local-state interaction has been replaced yet
- local PostgreSQL setup assumes this machine is a development environment and now uses the local `postgres` user with password `postgres`

## 6. Pending Dependencies

- finish replacing remaining preview local-state interactions with backend calls
- expand browser-level QA around preview create/submit/approve flows
- decide whether to add dedicated local dev database credentials separate from `postgres`
- complete audit log visibility in the operational UI

## 7. Build Status

- `npm run db:prepare-local` passed
- `npx prisma db push` passed
- `npx prisma generate` passed
- `npm run db:seed` passed
- `npm run lint` passed
- `npm run build` passed

## 8. Notes for QA / DevOps

- QA should now retest the exact blocker from QA 003: repeated credential sign-ins across fresh server starts
- QA should use `/preview` while signed in to verify backend mode instead of treating `/workspace` as the only backend-backed route
- DevOps should treat the current local PostgreSQL password as dev-only and rotate it in any shared or persistent environment
