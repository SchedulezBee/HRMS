# Staging Deployment Preparation 001

Date: 2026-04-17
Module: Staging-style deployment preparation

## Purpose

This note gives the next operator a practical sequence to prepare a staging-style HRMS deployment
without changing application business logic.

## Files To Use

- app root: `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`
- staging env template: `C:\Users\Administrator\Documents\Projects\Project\hrms-portal\.env.staging.example`
- release checklist: `C:\Users\Administrator\Documents\Projects\Project\DEVOPS_RELEASE_CHECKLIST_002.md`
- operational baseline: `C:\Users\Administrator\Documents\Projects\Project\DEVOPS_SECURITY_READINESS_001.md`

## Staging Preparation Steps

1. Copy `.env.staging.example` to the actual staging secret store or environment file location.
2. Replace every placeholder value.
3. Provision the staging PostgreSQL database and shadow database if migration tooling will use it.
4. Run CI or local verification:
   - `npm run lint`
   - `npm run build`
5. Build the deployable artifact:
   - container flow if the host is container-based
   - standalone flow if the host runs Node directly
6. Run database deployment:
   - `npm run db:deploy`
7. Start the app with staging secrets.
8. Verify:
   - `GET /api/health`
   - `/sign-in`
   - one authenticated route such as `/workspace`
9. Record operator, timestamp, and result.

## Recommended Smoke Test After Staging Start

- health endpoint returns `healthy`
- seeded or staging test sign-in works
- preview route loads
- one role-scoped API call succeeds
- logs do not show startup auth or database failures

## Explicit Gaps

- no hosting provider has been approved yet
- no secret manager has been approved yet
- no production deployment should happen directly from this note

## Completion Rule

After staging preparation is completed, return control to the Orchestrator for the next action.
