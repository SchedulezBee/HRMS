# QA Report 004

Date: 2026-04-16
Status: Completed for current slice
Primary inputs:

- `C:\Users\Administrator\Documents\Projects\Project\QA_REPORT_003.md`
- `C:\Users\Administrator\Documents\Projects\Project\FULL_STACK_DEVELOPER_IMPLEMENTATION_004.md`
- `C:\Users\Administrator\Documents\Projects\Project\MODULE_USAGE_PLATFORM_FOUNDATION_004.md`
- working build from `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`

## 1. Test Scope

This QA pass retests the backend stabilization and preview-to-backend wiring slice introduced in
developer implementation 004.

Covered areas:

- lint and production build verification
- unauthenticated route and API protection behavior
- seeded credentials sign-in flow
- repeated auth stability across fresh production server boots
- authenticated `/preview` backend mode detection
- role-based API visibility for HR Admin and Employee
- backend persistence for employee creation, leave submission, leave approval, and attendance upsert
- invalid credential handling
- local setup documentation consistency check

Not fully covered in execution:

- browser automation of the centered modals inside `/preview`
- visual confirmation of every module branch in the richer portal UI
- multi-tenant data separation using a second tenant dataset
- production deployment behavior

## 2. Test Scenarios

1. Verify `npm run lint` still passes.
2. Verify `npm run build` still passes.
3. Verify `/`, `/sign-in`, and `/preview` return `200`.
4. Verify unauthenticated `/workspace` redirects with `307`.
5. Verify unauthenticated `/api/employees` returns `401`.
6. Verify HR Admin sign-in succeeds and authenticated pages render.
7. Verify HR Admin can read employee, leave, and attendance datasets.
8. Verify HR Admin can create an employee through the backend API.
9. Verify HR Admin can approve a pending leave request.
10. Verify Employee sign-in succeeds and role restrictions still apply.
11. Verify Employee is blocked from `/api/employees`.
12. Verify Employee can submit leave and upsert attendance through the backend APIs.
13. Verify invalid credentials do not produce `500` auth failures.
14. Verify repeated sign-ins remain stable across fresh server restarts.
15. Verify local setup reference values still match the implemented database strategy.

## 3. Acceptance Criteria Coverage

### Passed

- `npm run lint` passed
- `npm run build` passed
- `/`, `/sign-in`, and `/preview` returned HTTP `200`
- unauthenticated `/workspace` returned HTTP `307`
- unauthenticated `/api/employees` returned HTTP `401`
- HR Admin sign-in succeeded with HTTP `200`
- authenticated `/preview` rendered backend mode markers for HR Admin and Employee
- HR Admin could read employee, leave, and attendance datasets
- HR Admin employee creation returned HTTP `201` and increased employee count from `4` to `5`
- pending leave approval returned HTTP `200` and updated the selected request to `APPROVED`
- Employee sign-in succeeded with HTTP `200`
- Employee access to `/api/employees` remained blocked with HTTP `403`
- Employee leave creation returned HTTP `201` and increased self-visible leave count from `2` to `3`
- Employee attendance upsert returned HTTP `200` and increased self-visible attendance count from `1` to `2`
- invalid credentials returned a `CredentialsSignin` error redirect instead of a `500`
- repeated fresh-boot sign-in checks passed on ports `3243` and `3244`, with successful workspace loads after each boot

### Partially Covered

- the richer `/preview` portal is clearly operating in backend mode when signed in, but this QA pass validated the persistence via HTTP/runtime checks rather than browser click automation on every centered modal
- attendance persistence exists at the API layer, but the richer preview attendance interaction is still documented as not fully backend-wired

### Failed or Not Met

- local setup reference file `.env.example` still points `DATABASE_URL` at the older Prisma proxy-style URL instead of the now-approved local PostgreSQL connection

## 4. Defects Found

### Defect 1

Type: Requirement Gap  
Severity: Medium  
Title: Preview attendance workflow is still not fully wired to backend persistence

Steps to reproduce:

1. Review the current module usage note and the preview portal attendance copy.
2. Open the authenticated `/preview` experience.
3. Compare the implemented attendance behavior with the documented backend-ready expectation for the richer preview workflow.

Expected result:

- the richer preview attendance action should post directly into the real attendance backend flow in the same way the employee and leave flows now do

Actual result:

- attendance persistence is available at the API layer and passed runtime validation, but the richer preview attendance experience is still documented as queued for a later implementation slice instead of fully wired now

Impact:

- the backend foundation is stronger, but the richer portal still has one visible workflow gap compared with the now-live employee and leave flows

### Defect 2

Type: Environment / Documentation Defect  
Severity: Medium  
Title: `.env.example` does not match the current local PostgreSQL setup

Steps to reproduce:

1. Open `C:\Users\Administrator\Documents\Projects\Project\hrms-portal\.env.example`.
2. Compare the sample `DATABASE_URL` with the documented local setup in implementation 004 and the module usage note.

Expected result:

- the sample environment file should reflect the current approved local database strategy so a new developer can bootstrap the project correctly

Actual result:

- `DIRECT_DATABASE_URL` and `SHADOW_DATABASE_URL` point to local PostgreSQL, but `DATABASE_URL` still points to the older `prisma+postgres://...` proxy-style value

Impact:

- a new developer could copy the sample file and end up with a broken or confusing local database configuration

## 5. Severity / Impact

- Medium: backend stabilization now appears successful, but the richer preview attendance workflow is still incomplete
- Medium: the sample environment file can mislead local setup even though the actual working `.env` is correct

## 6. Retest Status

- Build verification: Passed
- Unauthenticated protection checks: Passed
- HR Admin auth and dataset checks: Passed
- Employee auth and role restriction checks: Passed
- Employee and HR Admin backend write checks: Passed
- Invalid credentials behavior: Passed
- Repeated auth stability across fresh server boots: Passed

Runtime verification executed:

- `npm run lint` passed
- `npm run build` passed
- production server on port `3242` returned:
  - `/` -> `200`
  - `/sign-in` -> `200`
  - `/preview` -> `200`
  - `/workspace` unauthenticated -> `307`
  - `/api/employees` unauthenticated -> `401`
- authenticated runtime checks produced:
  - HR Admin employees before create -> `4`
  - HR Admin employees after create -> `5`
  - HR Admin leave count -> `3`
  - HR Admin attendance count -> `3`
  - HR Admin approval update -> `APPROVED`
  - Employee `/api/employees` -> `403`
  - Employee leave before submit -> `2`
  - Employee leave after submit -> `3`
  - Employee attendance before upsert -> `1`
  - Employee attendance after upsert -> `2`
- fresh-boot auth stability checks produced:
  - port `3243` sign-in -> `200`, workspace -> `200`
  - port `3244` sign-in -> `200`, workspace -> `200`

Execution note:

- runtime testing used direct HTTP requests and authenticated sessions, not browser automation
- this was sufficient to validate the prior auth instability blocker and the newly claimed backend persistence paths

## 7. Release Risk

Release risk for this slice: Medium

Reason:

- the blocker from QA 003, intermittent auth/database instability, did not reproduce in this retest
- the backend write flows validated successfully
- remaining issues are important but no longer in the same blocker class as the previous `500` auth failures

## 8. Recommendation

Mark this developer slice as conditionally QA-approved for progression, but not as final MVP-ready completion.

Recommended next action:

1. Return to the Orchestrator.
2. Hand off to the Full-Stack Developer.
3. Finish the richer preview attendance backend wiring.
4. Correct `.env.example` so the documented local setup matches the implemented stack.
