# Module Usage - Release Readiness 001

Date: 2026-04-17
Module status: Usable for local and staging-style preparation

## 1. What this operations slice adds

- standalone deployment packaging for Next.js
- baseline CI workflow
- local container orchestration definition
- app and database health endpoint
- environment variable template for release setup
- security header baseline

## 2. Who uses it

- DevOps and Security Engineer
- Full-Stack Developer during deployment preparation
- QA for operational smoke checks

## 3. How to access it

From `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`:

- environment template: `.env.example`
- container setup: `compose.local.yml`
- Docker image build: `Dockerfile`
- health endpoint: `/api/health`
- CI pipeline: `.github/workflows/ci.yml`

## 4. Main operational workflow

1. Copy `.env.example` to `.env` for the target environment and replace placeholder values.
2. Build the application with `npm run build`.
3. Run schema deployment with `npm run db:deploy` in shared environments.
4. Start the app with `npm run start:standalone` or use the local compose file for container review.
5. Verify `GET /api/health` returns `status: healthy`.
6. Confirm logs are visible and release checkpoints are recorded before handing off for launch.

## 5. Important validations and edge cases

- `AUTH_SECRET` must be replaced before any shared or production-like environment
- `AUTH_URL` must match the real environment URL in shared environments
- local default PostgreSQL values are development-only and must not be reused for production
- if Docker is unavailable on the machine, the compose definition should be treated as prepared but unexecuted until validated elsewhere
- if schema changes are part of a release, database backup must happen before `db:deploy`

## 6. Known limitations

- no automated backup job exists yet
- no deployed monitoring stack is configured yet
- no hosting provider-specific pipeline is selected yet
- compose execution was not validated on this machine because Docker CLI is unavailable
