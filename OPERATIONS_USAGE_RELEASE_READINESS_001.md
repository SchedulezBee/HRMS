# Operations Usage Release Readiness 001

Date: 2026-04-17
Module: Release and operational readiness baseline

## What This Slice Adds
- Standalone deployment output for the Next.js application.
- A multi-stage Dockerfile for container builds.
- A local Docker Compose stack for app plus PostgreSQL.
- A database init script for local container bootstrapping.
- A health endpoint at `/api/health`.
- CI workflow for install, database prep, seed, lint, and build verification.
- Updated environment sample and project README.

## Local Non-Container Workflow
Run from:
- `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`

Commands:
1. `npm ci`
2. `npm run db:prepare-local`
3. `npx prisma generate`
4. `npx prisma db push`
5. `npm run db:seed`
6. `npm run dev`

Default local app URL:
- `http://localhost:3000`

Health check:
- `http://localhost:3000/api/health`

## Local Container Workflow
Required:
- Docker Desktop or equivalent Docker runtime installed locally

Command:
1. `docker compose -f compose.local.yml up --build`

Expected services:
- `postgres`
- `app`

Expected URLs:
- app: `http://localhost:3000`
- health: `http://localhost:3000/api/health`
- postgres: `localhost:5432`

Container notes:
- the compose stack uses the local SQL init file to create `hrms_portal` and `hrms_portal_shadow`
- the app container reads container-specific database URLs that point at the `postgres` service

## Verification Commands
- `npm run lint`
- `npm run build`
- `npm run ci:verify`

Standalone runtime check:
1. `npm run build`
2. `npm run start:standalone`
3. browse to `/api/health`

## CI Usage
The workflow file:
- `.github/workflows/ci.yml`

Current CI flow:
1. install dependencies
2. prepare local database files
3. generate Prisma client
4. push schema
5. seed data
6. run lint
7. run build

## Secrets And Environment Rules
Populate real values per environment for:
- `DATABASE_URL`
- `DIRECT_DATABASE_URL`
- `AUTH_SECRET`
- `AUTH_URL`
- `AUTH_TRUST_HOST`

Do not use the example secrets outside local development.

## Current Limitations
- Docker runtime verification was not executed on this machine because Docker CLI is not installed here.
- Production hosting target is still not selected.
- Production backup automation and secret manager integration are not yet wired.
- Browser-level confirmation of the newest centered modal interactions is still a residual QA coverage gap rather than a confirmed defect.
