# DevOps Vercel Free Deployment 004

Date: 2026-04-17
Role: DevOps & Security Engineer
Status: Approved for handoff

## 1. Environment Setup

Recommended hosting path for the current project direction:

- app hosting: Vercel Hobby
- database: external PostgreSQL managed on the user's own systems or other free/self-managed setup

Reason for recommendation:

- the user explicitly wants free hosting and to handle infrastructure on their own systems
- the app is a Next.js project, and Vercel officially supports zero-config deployment for Next.js
- Vercel Preview deployments are suitable for testing and QA
- on Vercel, custom environments are a paid feature, so the free-path equivalent of staging is Preview

Required environment split on the free path:

1. Development
   - local machine
   - local PostgreSQL
2. Preview
   - Vercel preview deployment
   - external PostgreSQL preview database
3. Production
   - Vercel production deployment
   - external PostgreSQL production database

## 2. Deployment Flow

Recommended Vercel free deployment flow:

1. import the project into Vercel
2. set the project Root Directory to `hrms-portal` if the repository root is above that folder
3. let Vercel auto-detect Next.js
4. add Preview environment variables:
   - `DATABASE_URL`
   - `DIRECT_DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL`
   - `AUTH_TRUST_HOST`
   - `NODE_ENV`
5. point `AUTH_URL` to the Vercel deployment URL for the target environment
6. deploy a Preview build for testing
7. verify:
   - `/api/health`
   - `/sign-in`
   - `/workspace`
8. if Preview is healthy, promote the same code path toward Production later

Important note:

- because Vercel Hobby does not provide paid custom environments, use `Preview` as the Phase 1 online test environment instead of a separate named staging environment

## 3. Access / Secrets Rules

- keep Preview and Production environment variables separate in Vercel
- do not reuse local `.env` files directly in Vercel
- use a unique `AUTH_SECRET` for each deployed environment
- keep database credentials outside the repository
- only approved operators should have access to the Vercel project settings

## 4. Monitoring / Logs

Use Vercel-native visibility for the app:

- deployment logs
- function/runtime logs
- preview deployment URL checks

Use database-side monitoring on the user's own PostgreSQL system for:

- connection health
- migration success
- storage / availability

Minimum Phase 1 online smoke check:

- Vercel Preview deployment loads
- `GET /api/health` returns healthy
- sign-in succeeds
- one role-scoped route loads after sign-in

## 5. Backup / Rollback Plan

- keep the external PostgreSQL preview database backed up by the user's own system process
- use Vercel deployment history for app rollback
- do not treat app rollback as database rollback; database restore remains a separate operation on the user's side

## 6. Security Controls

- use Vercel HTTPS-only deployment URLs
- separate Preview and Production secrets
- do not expose production data in Preview
- keep debug visibility appropriate for Preview testing only
- before Production, review whether debug-heavy responses need to be reduced

## 7. Release Risks

- database hosting is now external to Vercel, so DB uptime and credential management depend on the user's own systems
- Preview is the free-path substitute for staging, not a full paid staging environment
- migrations must be run carefully against the correct database because Vercel does not manage the PostgreSQL service here

## 8. Operational Readiness Status

Recommendation:

- proceed with Vercel Preview as the Phase 1 online test environment
- keep PostgreSQL on the user's own system or chosen free/self-managed environment
- after Preview smoke testing passes, treat Phase 1 as operationally demonstrated
