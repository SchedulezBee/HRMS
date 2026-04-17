# DevOps Staging Platform Recommendation 003

Date: 2026-04-17
Role: DevOps & Security Engineer
Status: Approved for handoff

## 1. Environment Setup

Recommended staging platform:

- Railway for the first real staging environment

Reason for recommendation:

- the current app is already prepared for standalone Next.js deployment
- Railway's official Next.js guide explicitly supports:
  - standalone output
  - Railpack-based deployment with start command override
  - Dockerfile deployment when needed
  - PostgreSQL in the same project
  - reference environment variables
  - pre-deploy migration commands
- this fits the Product Owner instruction to keep staging low-ops and commercially sensible
- for this app, Railpack is the safer first staging choice than Dockerfile because the pre-deploy migration step needs Node tooling and Prisma CLI available during deployment

Required Railway staging components:

1. one Railway project for staging
2. one app service connected to the repository
3. one PostgreSQL service in the same Railway project
4. Railway-generated public domain for the staging app
5. staging environment variables populated from the approved template

## 2. Deployment Flow

Recommended Railway staging flow:

1. create a new Railway project named for staging
2. deploy the app from GitHub using Railpack
3. add Railway PostgreSQL from the project canvas
4. connect `DATABASE_URL` to the app service using a reference variable
5. set the remaining app secrets manually:
   - `DIRECT_DATABASE_URL`
   - `AUTH_SECRET`
   - `AUTH_URL`
   - `AUTH_TRUST_HOST`
   - `NODE_ENV`
   - `PORT`
6. configure the pre-deploy command:
   - `npx prisma migrate deploy`
7. trigger deployment
8. verify:
   - `/api/health`
   - `/sign-in`
   - `/workspace` after sign-in
9. record the staging URL and operator

Recommended app URL format:

- use the Railway-generated staging domain first
- custom staging domain is optional, not required for first validation
- if the repository root is above `hrms-portal`, set Railway root directory to `/hrms-portal` and point config-as-code to `/hrms-portal/railway.toml`

## 3. Access / Secrets Rules

- keep staging secrets separate from local and future production secrets
- use Railway project access only for the minimum operators needed
- do not store the live staging secrets in markdown files
- `AUTH_SECRET` must be unique for staging
- `AUTH_URL` must match the Railway staging domain exactly

## 4. Monitoring / Logs

Use Railway-native operational visibility for the first staging pass:

- deployment logs
- runtime logs
- service metrics
- database service visibility

Staging smoke-check minimum:

- successful deployment logs
- successful pre-deploy migration run
- `GET /api/health` returns healthy
- sign-in works with staging credentials
- one role-scoped route and one API route respond correctly

## 5. Backup / Rollback Plan

Before any staging data refresh or major redeploy:

1. confirm Railway database backup capability or snapshot approach
2. keep the previous app deployment available for rollback
3. log the release version used in staging

Rollback path:

1. roll back to the last healthy deployment in the platform if the new deploy fails
2. restore the database only if a destructive schema or data issue occurred

## 6. Security Controls

- enforce HTTPS through the platform-provided public domain
- use separate staging credentials from production
- keep staging limited to internal testers and project operators
- avoid exposing production-like secrets or real customer data in staging
- continue using the app's existing health endpoint and security headers

## 7. Release Risks

Known limitations of this recommendation:

- Railway CLI is not installed on this machine, so live Railway provisioning was not executed locally from the terminal
- operator ownership for the actual Railway workspace still needs to be assigned
- production hosting is intentionally not decided in this note

Fallback option:

- Render is an acceptable fallback if Railway account setup or policy becomes a blocker, because Render also officially supports Next.js web services, PostgreSQL, logs, health checks, and rollbacks

## 8. Operational Readiness Status

Recommendation:

- proceed with Railway as the first staging platform
- execute staging deployment preparation next
- do not move to production planning until Railway staging deployment and smoke verification succeed
