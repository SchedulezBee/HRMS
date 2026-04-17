# QA Report 007

Date: 2026-04-16
Status: Completed for current slice
Primary inputs:

- `C:\Users\Administrator\Documents\Projects\Project\QA_REPORT_006.md`
- `C:\Users\Administrator\Documents\Projects\Project\FULL_STACK_DEVELOPER_IMPLEMENTATION_007.md`
- `C:\Users\Administrator\Documents\Projects\Project\MODULE_USAGE_PLATFORM_FOUNDATION_007.md`
- working build from `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`

## 1. Test Scope

This QA pass validates the self-service and manager-scope visibility slice introduced in developer
implementation 007.

Covered areas:

- lint and production build verification
- unauthenticated route and API protection regression
- seeded manager and employee sign-in regression
- authenticated `/preview` route availability regression
- manager employee API scope for direct reports only
- manager leave and attendance API scope for self plus direct reports
- employee self profile, leave balance, leave history, and attendance scope
- authenticated `/workspace` rendering for manager and employee sessions
- manager pending approval summary behavior after adding a manager self-service pending leave
  request

Not fully covered in execution:

- browser automation of the `/preview` client-hydrated module content
- visual confirmation of centered popups through direct browser clicks
- production deployment behavior

## 2. Test Scenarios

1. Verify `npm run lint` still passes.
2. Verify `npm run build` still passes.
3. Verify `/`, `/sign-in`, and `/preview` still return `200`.
4. Verify unauthenticated `/workspace` still redirects with `307`.
5. Verify unauthenticated `/api/employees` still returns `401`.
6. Verify seeded Manager sign-in succeeds.
7. Verify seeded Employee sign-in succeeds.
8. Verify manager `/api/employees` returns direct reports only.
9. Verify manager `/api/leave-requests` returns self plus direct-report scope.
10. Verify manager `/api/attendance` returns self plus direct-report scope.
11. Verify employee `/api/me/profile` returns Marcus Lee.
12. Verify employee `/api/leave-balance` returns computed balances.
13. Verify employee `/api/leave-requests` and `/api/attendance` remain self-only.
14. Verify manager `/workspace` renders manager scope data without exposing Marcus Lee.
15. Verify employee `/workspace` renders self-service data and leave balance content.
16. Create a manager self-service pending leave request and verify manager pending approvals in
    `/workspace` remain limited to direct-report approvals.

## 3. Acceptance Criteria Coverage

### Passed

- `npm run lint` passed
- `npm run build` passed
- `/`, `/sign-in`, and `/preview` returned HTTP `200`
- unauthenticated `/workspace` returned HTTP `307`
- unauthenticated `/api/employees` returned HTTP `401`
- seeded Manager sign-in succeeded with authenticated runtime checks
- seeded Employee sign-in succeeded with authenticated runtime checks
- manager `/api/employees` returned `Alya Rahman` only
- manager `/api/leave-requests` returned self plus direct-report scope
- manager `/api/attendance` returned self plus direct-report scope
- employee `/api/me/profile` returned `Marcus Lee`
- employee `/api/leave-balance` returned computed values for `Annual Leave`, `Emergency Leave`,
  and `Medical Leave`
- employee leave and attendance APIs remained self-only
- manager `/workspace` rendered the new manager scope slice and did not expose `Marcus Lee`
- employee `/workspace` rendered self-service content including `My leave history` and leave
  balance content
- after creating a manager self-service pending leave request, manager `/workspace` pending
  approvals remained `1`, confirming self-service pending leave did not pollute the team approval
  summary

### Partially Covered

- authenticated `/preview` returned `200` for both Manager and Employee sessions, but the richer
  client-hydrated module content was not fully asserted through browser automation in this QA pass

### Failed or Not Met

- none in the tested runtime scope

## 4. Defects Found

No confirmed defects found in the tested runtime scope for this slice.

Residual test gap:

- direct browser-click verification of the `/preview` centered popups and client-hydrated self/team
  views remains unexecuted in this pass

## 5. Severity / Impact

- No confirmed functional defects in the tested scope
- Residual risk is limited to unexecuted browser-level interaction coverage for the preview route

## 6. Retest Status

- Build verification: Passed
- Unauthenticated protection checks: Passed
- Manager auth and runtime scope checks: Passed
- Employee auth and self-service scope checks: Passed
- Manager workspace summary regression after self-service leave submission: Passed

Runtime verification executed:

- `npm run lint` passed
- `npm run build` passed
- production server on port `3287` returned:
  - `/` -> `200`
  - `/sign-in` -> `200`
  - `/preview` -> `200`
  - `/workspace` unauthenticated -> `307`
  - `/api/employees` unauthenticated -> `401`
- authenticated Manager runtime checks produced:
  - `/api/employees` -> `Alya Rahman`
  - `/api/leave-requests` before QA mutation -> `Alya Rahman [PENDING]`
  - `/api/attendance` -> `Daniel Tan [MISSING_CLOCK_OUT], Alya Rahman [COMPLETE]`
  - `/workspace` -> `200`
  - manager self-service leave creation -> `Leave request submitted`
  - `/api/leave-requests` after QA mutation -> `Daniel Tan [PENDING], Alya Rahman [PENDING]`
  - manager pending approvals in `/workspace` after mutation -> `1`
- authenticated Employee runtime checks produced:
  - `/api/me/profile` -> `Marcus Lee`
  - `/api/leave-balance` -> `Annual Leave=13, Emergency Leave=3, Medical Leave=13`
  - `/api/leave-requests` -> self-only `Marcus Lee` records
  - `/api/attendance` -> self-only `Marcus Lee` records
  - `/workspace` -> `200`

Execution note:

- this QA pass intentionally created one additional manager self-service pending leave request in
  the local development database to validate the manager summary regression case
- preview behavior was validated for authenticated route availability, but not through full browser
  click automation

## 7. Release Risk

Release risk for this slice: Medium-Low

Reason:

- the new manager and employee scope rules behaved correctly in authenticated runtime checks
- the manager approval summary stayed correctly limited to direct-report approvals even after a
  manager self-service pending request was added
- remaining risk is primarily the lack of browser-driven validation for the preview route, not a
  known backend or scope defect

## 8. Recommendation

Mark this slice as QA-approved for progression within the current MVP foundation track.

Recommended next action:

1. Return to the Orchestrator.
2. Select the next planned MVP implementation area.
3. Keep the preview route in mind for a later browser-focused QA pass if visual interaction
   confidence becomes important before release.
