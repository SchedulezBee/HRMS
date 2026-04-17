# Module Usage - Platform Foundation 003

Date: 2026-04-16
Module status: Usable in local development

## 1. What this slice adds

- browser sign-in with seeded demo accounts
- database-backed workspace view
- seeded tenant, employee, leave, attendance, and audit data
- preserved UI preview route from earlier slices

## 2. Local setup

From `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`:

- run `npm install`
- run `npx prisma db push`
- run `npm run db:seed`
- run `npm run dev`

## 3. Main routes

- `/` - entry page that points to backend sign-in and UI preview
- `/sign-in` - sign in using seeded credentials
- `/workspace` - authenticated backend-backed workspace
- `/preview` - existing UI-only preview portal

## 4. Seeded credentials

Shared development password for all demo accounts:

- `Password123!`

Seeded users:

- `tenant.admin@corevision.local` - Tenant Admin
- `alya.rahman@corevision.local` - HR Admin
- `daniel.tan@corevision.local` - Manager
- `marcus.lee@corevision.local` - Employee

## 5. How to use it

1. Open `/sign-in`
2. Choose a seeded account or type one manually
3. Sign in with the shared password
4. Review the role-scoped data in `/workspace`
5. Use `/preview` when you want to inspect the richer frontend slice with centered popups and debug overlays

## 6. Current limitations

- `/workspace` is currently a read-focused verification screen, not the full operational UI
- preview-route forms still use local state and are not yet posting to backend APIs
- local Prisma development currently works reliably with `db push`; `migrate dev` is not the preferred path on this local setup right now

## 7. Useful commands

- `npm run lint`
- `npm run build`
- `npm run db:seed`
