# Module Usage - Platform Foundation 004

Date: 2026-04-16
Module status: Usable in local development

## 1. What this slice adds

- stable local PostgreSQL-backed development flow
- repeated sign-in stability on the new local database endpoint
- authenticated `/preview` mode with live backend sync
- backend employee creation from the preview portal
- backend leave submission and approval updates from the preview portal

## 2. Local setup

From `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`:

- run `npm install`
- run `npm run db:prepare-local`
- run `npx prisma db push`
- run `npx prisma generate`
- run `npm run db:seed`
- run `npm run dev`

## 3. Local database

This project now uses the machine's PostgreSQL 17 service:

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
- `/preview` - richer portal UI, now backend-synced when signed in

## 5. Seeded credentials

Shared development password for demo app users:

- `Password123!`

Seeded app users:

- `tenant.admin@corevision.local` - Tenant Admin
- `alya.rahman@corevision.local` - HR Admin
- `daniel.tan@corevision.local` - Manager
- `marcus.lee@corevision.local` - Employee

## 6. How to use the new backend preview mode

1. Open `/sign-in`
2. Sign in with one of the seeded app users
3. Open `/preview`
4. Confirm the header shows live backend mode instead of local-only mode
5. In HR Admin mode, add an employee through the centered modal
6. In Employee mode, submit leave through the centered modal using `YYYY-MM-DD` or `YYYY-MM-DD to YYYY-MM-DD`
7. In Manager or HR Admin mode, approve or reject pending leave items

## 7. Current limitations

- attendance writes are still not fully backend-wired from the preview route
- `/workspace` remains a verification-oriented screen, not the full operational portal
- local PostgreSQL credentials are development-only and should not be reused outside this machine
