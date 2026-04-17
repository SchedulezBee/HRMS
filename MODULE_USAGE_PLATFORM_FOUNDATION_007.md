# Module Usage - Platform Foundation 007

Date: 2026-04-16
Module status: Usable in local development

## 1. What this slice adds

- employee self profile visibility in backend mode
- employee leave balance cards based on current leave history
- employee leave history visibility
- manager direct-report employee visibility
- manager team attendance and approval summary aligned to reporting scope
- a refreshed authenticated `/workspace` page that mirrors these backend scope rules

## 2. Local setup

From `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`:

- run `npm install`
- run `npm run db:prepare-local`
- run `npx prisma db push`
- run `npx prisma generate`
- run `npm run db:seed`
- run `npm run dev`

## 3. How to verify the new self-service and team scope flow

1. Open `/sign-in`
2. Sign in as `Employee` using `marcus.lee@corevision.local` and password `Password123!`
3. Open `/preview`
4. Confirm the dashboard and leave module show Marcus Lee self-service data and leave balance cards
5. Open `/workspace`
6. Confirm only Marcus profile, leave, and attendance records are visible
7. Sign out
8. Sign in as `Manager` using `daniel.tan@corevision.local` and password `Password123!`
9. Open `/preview`
10. Confirm the `Employees` module shows only Daniel Tan direct-report visibility, which in seeded
    data is Alya Rahman
11. Confirm manager summaries show team approvals and team attendance issues without treating the
    manager's own self-service records as team counts
12. Open `/workspace`
13. Confirm the profile summary, direct-report visibility, and team summary cards are populated

## 4. Current limitations

- leave balances are computed from leave history with simple MVP entitlement assumptions
- the seed dataset is intentionally small, so manager scope examples are limited
- QA still needs broader browser-level regression coverage for the expanded preview and workspace
  flows
