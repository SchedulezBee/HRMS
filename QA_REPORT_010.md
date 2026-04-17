# QA Report 010

Date: 2026-04-16
Status: Completed for current slice
Primary inputs:

- `C:\Users\Administrator\Documents\Projects\Project\QA_REPORT_009.md`
- `C:\Users\Administrator\Documents\Projects\Project\FULL_STACK_DEVELOPER_IMPLEMENTATION_010.md`
- `C:\Users\Administrator\Documents\Projects\Project\MODULE_USAGE_PLATFORM_FOUNDATION_010.md`
- working build from `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`

## 1. Test Scope

This QA pass validates the employee-maintenance and attendance-review slice introduced in developer
implementation 010.

Covered areas:

- lint and production build verification
- unauthenticated protection for employee and attendance APIs
- invalid credential regression
- seeded `Tenant Admin`, `HR Admin`, `Manager`, and `Employee` sign-in regression
- `Tenant Admin` employee update success path, revert path, and validation-failure path
- `HR Admin` employee update success path and revert path
- `HR Admin` attendance review success path, revert path, and validation-failure path
- manager scope visibility for employee and attendance lists
- forbidden patch attempts for `Manager` and `Employee`
- authenticated `/workspace` and `/preview` availability for tested roles

Not fully covered in execution:

- browser click automation of the centered employee-edit and attendance-review modals
- visual confirmation of centered popup positioning in the browser
- production deployment behavior outside the local runtime

## 2. Test Scenarios

1. Verify `npm run lint` still passes.
2. Verify `npm run build` still passes.
3. Verify unauthenticated `/preview` and `/sign-in` return `200`.
4. Verify unauthenticated `/workspace` still redirects with `307`.
5. Verify unauthenticated `/api/employees` and `/api/attendance` return `401`.
6. Verify invalid credentials do not establish a session.
7. Verify seeded `Tenant Admin` sign-in succeeds.
8. Verify `Tenant Admin` can update an employee record and then revert it.
9. Verify invalid employee update payload returns validation failure.
10. Verify audit activity reflects employee updates.
11. Verify seeded `HR Admin` sign-in succeeds.
12. Verify `HR Admin` can update an employee record and then revert it.
13. Verify `HR Admin` can review an attendance record and then revert it.
14. Verify invalid attendance review payload returns validation failure.
15. Verify audit activity reflects attendance review.
16. Verify seeded `Manager` sign-in succeeds.
17. Verify `Manager` scope stays limited to self plus direct-report visibility.
18. Verify `Manager` receives `403` for employee patch attempts.
19. Verify `Manager` receives `403` for attendance review patch attempts.
20. Verify seeded `Employee` sign-in succeeds.
21. Verify `Employee` receives `403` for employee patch attempts.
22. Verify `Employee` receives `403` for attendance review patch attempts.
23. Verify authenticated `/workspace` and `/preview` return `200` for the tested roles.

## 3. Acceptance Criteria Coverage

### Passed

- `npm run lint` passed
- `npm run build` passed
- unauthenticated `/preview` returned HTTP `200`
- unauthenticated `/sign-in` returned HTTP `200`
- unauthenticated `/workspace` returned HTTP `307`
- unauthenticated `/api/employees` returned HTTP `401`
- unauthenticated `/api/attendance` returned HTTP `401`
- invalid credentials did not create a session
- seeded `Tenant Admin`, `HR Admin`, `Manager`, and `Employee` sign-in succeeded
- `Tenant Admin` `/workspace` and `/preview` both returned `200`
- `Tenant Admin` updated `Marcus Lee` successfully and the refreshed list reflected:
  - `jobTitle` -> `Admin Officer QA`
  - `workLocation` -> `QA Review Hub`
- `Tenant Admin` employee revert succeeded
- invalid employee update payload returned `400` with title `Validation failed`
- `Tenant Admin` audit entries showed `Employee:UPDATE`
- `HR Admin` `/workspace` and `/preview` both returned `200`
- `HR Admin` employee update succeeded and revert succeeded
- `HR Admin` attendance review succeeded
- refreshed attendance data reflected:
  - `status` -> `FLAGGED`
  - `remarks` -> `QA review pass marker`
  - `reviewedBy` -> `alya.rahman@corevision.local`
- `HR Admin` attendance revert succeeded
- invalid attendance review payload returned `400` with title `Validation failed`
- `HR Admin` audit entries showed `Attendance:REVIEW`
- `Manager` `/workspace` and `/preview` both returned `200`
- `Manager` visible employee scope returned `EMP-1001` only
- `Manager` visible attendance scope returned `EMP-1021` and `EMP-1001`
- `Manager` employee patch attempt returned `403`
- `Manager` attendance review patch attempt returned `403`
- `Employee` `/workspace` and `/preview` both returned `200`
- `Employee` employee patch attempt returned `403`
- `Employee` attendance review patch attempt returned `403`

### Partially Covered

- authenticated `/preview` route availability passed for all tested roles, but the centered modal
  interactions themselves were not browser-click automated in this QA pass

### Failed or Not Met

- none in the tested runtime scope

## 4. Defects Found

No confirmed functional defects found in the tested runtime scope for this slice.

Residual test gap:

- direct browser-click verification of the employee-edit modal, attendance-review modal, and
  centered popup positioning remains unexecuted in this pass

## 5. Severity / Impact

- No confirmed functional defects in the tested scope
- Residual risk is limited to unexecuted browser-level interaction coverage for the new centered
  modals and popup positioning

## 6. Retest Status

- Build verification: Passed
- Unauthenticated protection checks: Passed
- Invalid credential regression: Passed
- Tenant Admin employee maintenance runtime checks: Passed
- HR Admin employee maintenance runtime checks: Passed
- HR Admin attendance review runtime checks: Passed
- Manager scope and forbidden patch runtime checks: Passed
- Employee forbidden patch runtime checks: Passed

Runtime verification executed:

- `npm run lint` passed
- `npm run build` passed
- local runtime checks confirmed:
  - `/preview` -> `200`
  - `/sign-in` -> `200`
  - `/workspace` unauthenticated -> `307`
  - `/api/employees` unauthenticated -> `401`
  - `/api/attendance` unauthenticated -> `401`
- invalid credential runtime check produced:
  - authenticated session -> `false`
- authenticated `Tenant Admin` runtime checks produced:
  - role -> `TENANT_ADMIN`
  - employee count -> `6`
  - employee patch -> `200`
  - employee revert -> `200`
  - invalid employee patch -> `400`
  - audit trace included `Employee:UPDATE`
- authenticated `HR Admin` runtime checks produced:
  - role -> `HR_ADMIN`
  - employee patch -> `200`
  - employee revert -> `200`
  - attendance review patch -> `200`
  - attendance revert -> `200`
  - invalid attendance patch -> `400`
  - audit trace included `Attendance:REVIEW`
- authenticated `Manager` runtime checks produced:
  - role -> `MANAGER`
  - visible employees -> `EMP-1001`
  - visible attendance employees -> `EMP-1021`, `EMP-1001`
  - employee patch -> `403`
  - attendance patch -> `403`
- authenticated `Employee` runtime checks produced:
  - role -> `EMPLOYEE`
  - employee patch -> `403`
  - attendance patch -> `403`

Execution note:

- runtime checks were executed in isolated per-role sessions to avoid false negatives from local
  auth-session timing during test harness setup

## 7. Release Risk

Release risk for this slice: Medium-Low

Reason:

- all tested backend paths for employee maintenance and attendance review behaved correctly
- validation and forbidden-role checks held under runtime verification
- the remaining risk is visual/browser-level interaction coverage for the new centered modal flows,
  not a confirmed backend or authorization defect

## 8. Recommendation

Mark this slice as QA-approved for progression within the current MVP foundation track.

Recommended next action:

1. Return to the Orchestrator.
2. Select the next planned MVP implementation area.
3. Keep a later browser-focused QA pass in mind before release if visual confirmation for centered
   modal behavior becomes necessary.
