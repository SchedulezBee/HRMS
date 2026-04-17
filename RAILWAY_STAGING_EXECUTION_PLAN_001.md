# Railway Staging Execution Plan 001

Date: 2026-04-17
Module: Railway staging execution

## Purpose

This note turns the approved staging-first release direction into a concrete execution path using
Railway as the recommended first staging host.

## Inputs

- `C:\Users\Administrator\Documents\Projects\Project\PRODUCT_OWNER_TASK_NOTE_002.md`
- `C:\Users\Administrator\Documents\Projects\Project\DEVOPS_RELEASE_CHECKLIST_002.md`
- `C:\Users\Administrator\Documents\Projects\Project\DEVOPS_STAGING_PLATFORM_RECOMMENDATION_003.md`
- `C:\Users\Administrator\Documents\Projects\Project\hrms-portal\.env.staging.example`

## Steps

1. Create a Railway project for staging.
2. Connect the HRMS repository to a new app service.
3. Use the current app root:
   - `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`
4. If the repository root is above `hrms-portal`, set:
   - root directory -> `/hrms-portal`
   - config-as-code path -> `/hrms-portal/railway.toml`
5. Add PostgreSQL to the same Railway project.
6. Set the app environment values using the staging template.
7. Add a Railway reference variable for `DATABASE_URL` from the PostgreSQL service.
8. Confirm the service is using the repo config in `railway.toml`.
9. Deploy the application.
10. Verify:
   - `GET /api/health`
   - `/sign-in`
   - valid sign-in
   - `/workspace`
11. Record:
   - Railway project name
   - staging URL
   - deploy timestamp
   - operator
   - result

## Required Variables

- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `AUTH_TRUST_HOST`
- `NODE_ENV`
- `PORT`

## First Staging Smoke Test

- health endpoint returns healthy
- no `npx prisma migrate deploy` failure in deploy logs
- no auth callback failure in logs
- seeded or staging test login succeeds
- one manager or HR Admin session reaches `/workspace`

## Stop Conditions

Stop and return to the Orchestrator if any of these happen:

- Railway account or access cannot be provisioned
- PostgreSQL cannot be attached or referenced correctly
- migrations fail during pre-deploy
- `/api/health` does not return healthy
- sign-in fails after a successful deployment

## Completion Rule

After staging execution is completed, return to the Orchestrator for the next action.
