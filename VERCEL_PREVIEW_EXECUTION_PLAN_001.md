# Vercel Preview Execution Plan 001

Date: 2026-04-17
Module: Vercel free-path preview deployment

## Purpose

This note replaces the earlier paid-hosting-oriented staging path with the user's approved free path:

- deploy the app on Vercel
- keep PostgreSQL on the user's own systems or another free/self-managed setup
- use Vercel Preview as the Phase 1 online validation environment

## Inputs

- `C:\Users\Administrator\Documents\Projects\Project\PRODUCT_OWNER_TASK_NOTE_002.md`
- `C:\Users\Administrator\Documents\Projects\Project\DEVOPS_VERCEL_FREE_DEPLOYMENT_004.md`
- `C:\Users\Administrator\Documents\Projects\Project\hrms-portal\.env.staging.example`
- `C:\Users\Administrator\Documents\Projects\Project\hrms-portal\README.md`

## Steps

1. Create or open the Vercel project.
2. Import the repository.
3. Set Root Directory to `hrms-portal` if needed.
4. Confirm Next.js is auto-detected.
5. Add Preview environment variables:
   - `DATABASE_URL`
   - `DIRECT_DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL`
   - `AUTH_TRUST_HOST`
   - `NODE_ENV=production`
6. Point the DB variables to the user's PostgreSQL preview database.
7. Trigger a Preview deployment.
8. Verify:
   - `/api/health`
   - `/sign-in`
   - valid sign-in
   - `/workspace`
9. Record:
   - Vercel project name
   - Preview URL
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

## First Preview Smoke Test

- Vercel Preview URL opens
- `GET /api/health` returns healthy
- sign-in succeeds
- one HR Admin or Manager session reaches `/workspace`
- no auth or database failure appears in Vercel logs

## Stop Conditions

Stop and return to the Orchestrator if any of these happen:

- Vercel project access is unavailable
- Root Directory is misconfigured
- Preview deployment fails
- `/api/health` is unhealthy
- sign-in fails due to DB or auth setup

## Completion Rule

After Preview execution is completed, return control to the Orchestrator for the next action.
