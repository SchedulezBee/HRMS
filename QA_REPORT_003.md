# QA Report 003

Date: 2026-04-16
Status: Completed for current slice
Primary inputs:

- `C:\Users\Administrator\Documents\Projects\Project\QA_REPORT_002.md`
- `C:\Users\Administrator\Documents\Projects\Project\FULL_STACK_DEVELOPER_IMPLEMENTATION_003.md`
- `C:\Users\Administrator\Documents\Projects\Project\MODULE_USAGE_PLATFORM_FOUNDATION_003.md`
- working build from `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`

## 1. Test Scope

This QA pass validates the new backend-authenticated slice introduced in developer implementation 003.

Covered areas:

- build and runtime smoke checks
- browser route availability for `/`, `/sign-in`, `/preview`, and `/workspace`
- unauthenticated redirect and API protection behavior
- seeded credentials sign-in flow
- role-scoped API visibility for HR Admin and Employee
- invalid credential handling
- backend stability during repeated auth callbacks

Not fully covered in execution:

- frontend preview forms posting into the backend APIs
- manager approval action flow through the browser UI
- full CRUD coverage for employee, leave, and attendance APIs
- production deployment behavior

## 2. Test Scenarios

1. Verify the application still passes lint.
2. Verify the application still passes production build.
3. Verify the production app serves `/`, `/sign-in`, and `/preview`.
4. Verify unauthenticated `/workspace` access redirects.
5. Verify unauthenticated `/api/employees` access returns `401`.
6. Verify HR Admin sign-in succeeds and `/workspace` renders.
7. Verify HR Admin can read employees, leave, and attendance data.
8. Verify Employee sign-in succeeds and `/workspace` renders.
9. Verify Employee is forbidden from `/api/employees`.
10. Verify Employee only sees self-scoped leave and attendance data.
11. Verify invalid credentials do not authenticate.
12. Verify repeated auth callbacks remain stable across runs.

## 3. Acceptance Criteria Coverage

### Passed

- `npm run lint` passed
- `npm run build` passed
- production server returned HTTP `200` for `/`, `/sign-in`, and `/preview`
- unauthenticated `/workspace` redirected with HTTP `307`
- unauthenticated `/api/employees` returned HTTP `401`
- HR Admin sign-in succeeded in runtime testing
- HR Admin workspace rendered successfully
- HR Admin could read seeded employee, leave, and attendance data
- Employee sign-in succeeded in runtime testing
- Employee workspace rendered successfully
- Employee access to `/api/employees` was blocked with HTTP `403`
- Employee leave and attendance API reads were scoped down to one seeded record each
- invalid credentials were rejected and returned the user back to sign-in with a credentials error state

### Partially Covered

- backend auth and role enforcement are now present and testable, but stability is inconsistent across repeated auth callback runs
- workspace route proves real database-backed reads, but it is still a lightweight verification screen rather than the full operational portal
- preview route remains available and keeps centered popup behavior, but it is still not connected to backend persistence

### Failed or Not Met

- auth callback stability is not reliable enough yet for confident MVP progression
- local database workflow is still using `db push` because `prisma migrate dev` is not working on the current local setup
- browser-level end-to-end workflow coverage for create/submit/update actions is still not met

## 4. Defects Found

### Defect 1

Type: Functional / Stability  
Severity: High  
Title: Auth callback intermittently fails with HTTP `500` due to dropped Postgres connection

Evidence:

- one runtime pass on port `3111` completed successfully for both HR Admin and Employee sign-ins, workspace access, and role-scoped API reads
- subsequent runtime passes on ports `3112` and `3114` produced `500` errors during the credentials callback
- server logs showed Prisma/Auth.js errors including `Connection terminated unexpectedly` and `Server has closed the connection`

Impact:

- authentication is no longer dependable across repeated server runs
- a core backend capability can fail before the user reaches the workspace
- this blocks treating the backend slice as a stable QA-approved foundation

### Defect 2

Type: Requirement Gap  
Severity: Medium  
Title: Preview portal is still not wired to backend APIs

Evidence:

- developer handoff states the preview route remains local-state driven
- QA validated backend reads through `/workspace`, but not browser-driven create/submit actions from the richer preview UI

Impact:

- the project now has two parallel experiences: a richer frontend preview and a lighter backend workspace
- user-visible workflows are still split between local-state preview behavior and real backend behavior

### Defect 3

Type: Environment / Process Gap  
Severity: Medium  
Title: Local migration workflow is not stable enough for normal `migrate dev` usage

Evidence:

- developer handoff documents that `prisma migrate dev` still closes the connection on the local Prisma dev database
- current verified flow depends on `npx prisma db push` plus seed and a generated SQL migration artifact

Impact:

- local setup is workable but less predictable than a normal migration-driven development flow
- this increases risk of environment drift as the schema evolves

## 5. Severity / Impact

- High: backend authentication exists but is intermittently unstable
- Medium: frontend and backend experiences are still split
- Medium: migration workflow remains a local-environment workaround instead of a normal stable process

## 6. Retest Status

- Build verification: Passed
- Runtime smoke check: Passed
- Unauthenticated protection checks: Passed
- HR Admin runtime auth and read checks: Passed in at least one clean run
- Employee runtime auth and read checks: Passed in at least one clean run
- Invalid credentials behavior: Passed
- Repeated auth stability: Failed

Runtime verification executed:

- `npm run lint` passed
- `npm run build` passed
- local production server returned:
  - `/` -> `200`
  - `/sign-in` -> `200`
  - `/preview` -> `200`
  - `/workspace` unauthenticated -> `307`
  - `/api/employees` unauthenticated -> `401`
- successful role verification run produced:
  - HR Admin employees count -> `3`
  - HR Admin leave count -> `2`
  - HR Admin attendance count -> `3`
  - Employee employees API -> `403`
  - Employee leave count -> `1`
  - Employee attendance count -> `1`

Execution note:

- runtime testing used direct HTTP requests and seeded credential sessions rather than browser automation
- repeated server runs were useful because they exposed intermittent auth/database instability not visible in a single happy-path run

## 7. Release Risk

Release risk for MVP acceptance: High

Reason:

- the backend foundation is now real and partially validated
- however, authentication instability on repeated runs is a blocker
- the richer preview UI is still not backed by the real APIs

## 8. Recommendation

Do not mark this slice as QA-approved for stable progression yet.

Recommended next action:

1. Return to the Orchestrator.
2. Hand off to the Full-Stack Developer.
3. Prioritize auth/database stability first.
4. After stability is fixed, wire the preview portal workflows to the real backend APIs.
