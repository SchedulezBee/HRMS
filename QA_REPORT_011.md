# QA Report 011

Date: 2026-04-17
Status: Completed for current slice
Primary inputs:

- `C:\Users\Administrator\Documents\Projects\Project\QA_REPORT_010.md`
- `C:\Users\Administrator\Documents\Projects\Project\FULL_STACK_DEVELOPER_IMPLEMENTATION_011.md`
- `C:\Users\Administrator\Documents\Projects\Project\MODULE_USAGE_PLATFORM_FOUNDATION_011.md`
- working build from `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`

## 1. Test Scope

This QA pass validates the leave-policy and approval-completion slice introduced in developer
implementation 011.

Covered areas:

- lint and production build verification
- unauthenticated protection regression for the new leave-policy API
- invalid credential regression
- seeded `Tenant Admin`, `HR Admin`, `Manager`, and `Employee` sign-in regression
- `Tenant Admin` leave-policy create path
- `HR Admin` leave-policy update path
- employee visibility of enabled leave types only
- blocked employee submission for a disabled leave type
- successful employee submission for enabled leave types
- rejection validation requiring remarks
- approval and rejection remark persistence
- employee leave-balance refresh after approval
- forbidden leave-policy create attempts for `Manager` and `Employee`
- authenticated `/workspace` and `/preview` availability for all four seeded roles

Not fully covered in execution:

- browser click automation of the centered leave-policy modal
- browser click automation of the centered approval-decision modal
- visual confirmation of centered popup positioning in the browser
- production deployment behavior outside the local runtime

## 2. Test Scenarios

1. Verify `npm run lint` still passes.
2. Verify `npm run build` still passes.
3. Verify unauthenticated `/sign-in` and `/preview` return `200`.
4. Verify unauthenticated `/workspace` still redirects with `307`.
5. Verify unauthenticated `/api/leave-types` returns `401`.
6. Verify invalid credentials do not establish a session.
7. Verify seeded `Tenant Admin`, `HR Admin`, `Manager`, and `Employee` sign-in succeeds.
8. Verify authenticated `/workspace` and `/preview` return `200` for the tested roles.
9. Verify `Tenant Admin` can create a leave policy.
10. Verify `HR Admin` can update that leave policy.
11. Verify `HR Admin` can disable `Emergency Leave`.
12. Verify `Employee` no longer sees disabled `Emergency Leave` in `/api/leave-types`.
13. Verify employee submission for disabled `Emergency Leave` returns `400`.
14. Verify employee submission for enabled `Annual Leave` succeeds.
15. Verify employee submission for enabled `Medical Leave` succeeds.
16. Verify reject-without-remarks returns validation failure.
17. Verify approve-with-remarks succeeds and stores remarks.
18. Verify reject-with-remarks succeeds and stores remarks.
19. Verify employee leave-balance data reflects the updated approval state.
20. Verify `Manager` receives `403` for leave-policy create attempts.
21. Verify `Employee` receives `403` for leave-policy create attempts.
22. Verify `HR Admin` can re-enable `Emergency Leave` after the regression test.

## 3. Acceptance Criteria Coverage

### Passed

- `npm run lint` passed
- `npm run build` passed
- unauthenticated `/sign-in` returned HTTP `200`
- unauthenticated `/preview` returned HTTP `200`
- unauthenticated `/workspace` returned HTTP `307`
- unauthenticated `/api/leave-types` returned HTTP `401`
- invalid credentials did not create an authenticated session
- seeded `Tenant Admin`, `HR Admin`, `Manager`, and `Employee` sign-in succeeded
- authenticated `/workspace` and `/preview` returned `200` for all four seeded roles
- `Tenant Admin` leave-policy create returned `201` with title `Leave policy saved`
- authenticated tenant leave-policy list reflected the new policy row
- `HR Admin` leave-policy update returned `200` with title `Leave policy updated`
- updated leave-policy values were refreshed successfully:
  - `openingBalance` -> `2`
  - `entitlement` -> `5`
- `HR Admin` disabled `Emergency Leave` successfully
- employee leave-type visibility while disabled contained:
  - `Annual Leave`
  - `Medical Leave`
- employee visibility correctly excluded `Emergency Leave` while disabled
- employee submission for disabled `Emergency Leave` returned `400`
- disabled submission returned title `Leave type unavailable`
- employee submission for enabled `Annual Leave` returned `201`
- employee submission for enabled `Medical Leave` returned `201`
- reject-without-remarks returned `400` with title `Validation failed`
- approve-with-remarks returned `200`
- reject-with-remarks returned `200`
- refreshed leave data reflected:
  - approved request status -> `APPROVED`
  - approved request remarks -> `QA approval remark`
  - rejected request status -> `REJECTED`
  - rejected request remarks -> `QA rejection remark`
- employee leave-balance endpoint returned recomputed annual totals after approval:
  - `usedBalance` -> `3`
  - `remainingBalance` -> `11`
- `Manager` leave-policy create attempt returned `403`
- `Employee` leave-policy create attempt returned `403`
- `HR Admin` successfully re-enabled `Emergency Leave`
- audit visibility included recent `LeavePolicy` and `Approval` activity entries
- employee authenticated workspace response still contained `Leave policy`

### Partially Covered

- authenticated `/preview` route availability passed for all tested roles, but the leave-policy and
  approval-decision modal interactions were not browser-click automated in this QA pass

### Failed or Not Met

- none in the tested runtime scope

## 4. Defects Found

No confirmed functional defects found in the tested runtime scope for this slice.

Residual test gaps:

- direct browser-click verification of the leave-policy modal and approval-decision modal remains
  unexecuted in this pass
- visual confirmation of centered popup positioning remains unexecuted in this pass

Environment note:

- temporary QA leave-policy rows and QA leave requests were created during runtime verification and
  manually cleaned from the local development database after the pass because no product delete path
  exists for that test data

## 5. Severity / Impact

- No confirmed functional defects in the tested scope
- Residual risk is limited to unexecuted browser-level interaction coverage for the newest centered
  modals and popup positioning

## 6. Retest Status

- Build verification: Passed
- Unauthenticated protection checks: Passed
- Invalid credential regression: Passed
- Tenant Admin leave-policy create runtime checks: Passed
- HR Admin leave-policy update runtime checks: Passed
- Enabled or disabled employee leave-type visibility checks: Passed
- Disabled leave-type submission enforcement: Passed
- Approval remark validation and persistence checks: Passed
- Manager and Employee forbidden leave-policy checks: Passed

Runtime verification executed:

- `npm run lint` passed
- `npm run build` passed
- local runtime checks confirmed:
  - `/sign-in` -> `200`
  - `/preview` -> `200`
  - `/workspace` unauthenticated -> `307`
  - `/api/leave-types` unauthenticated -> `401`
- invalid credential runtime check produced:
  - authenticated session -> `false`
- authenticated `Tenant Admin` runtime checks produced:
  - role -> `TENANT_ADMIN`
  - leave-policy create -> `201`
  - tenant leave-type count during test -> `5`
  - `/workspace` -> `200`
  - `/preview` -> `200`
- authenticated `HR Admin` runtime checks produced:
  - role -> `HR_ADMIN`
  - temp policy patch -> `200`
  - temp policy values refreshed to opening `2`, entitlement `5`
  - `Emergency Leave` disable -> `200`
  - reject-without-remarks -> `400`
  - approve-with-remarks -> `200`
  - reject-with-remarks -> `200`
  - `Emergency Leave` re-enable -> `200`
  - audit traces included `LeavePolicy` and `Approval` activity
  - `/workspace` -> `200`
  - `/preview` -> `200`
- authenticated `Manager` runtime checks produced:
  - role -> `MANAGER`
  - forbidden leave-policy create -> `403`
  - `/workspace` -> `200`
  - `/preview` -> `200`
- authenticated `Employee` runtime checks produced:
  - role -> `EMPLOYEE`
  - visible leave types while `Emergency Leave` was disabled -> `Annual Leave`, `Medical Leave`
  - disabled leave submission -> `400`
  - enabled leave submissions -> `201`, `201`
  - forbidden leave-policy create -> `403`
  - annual leave balance after approval -> used `3`, remaining `11`
  - `/workspace` -> `200`
  - `/preview` -> `200`

Execution note:

- runtime checks were executed in isolated per-role sessions to avoid cross-session auth noise
- browser click automation was not used in this pass

## 7. Release Risk

Release risk for this slice: Medium-Low

Reason:

- the new leave-policy APIs, enabled-type enforcement, and approval-remarks behavior all passed in
  authenticated runtime verification
- unauthenticated protection and forbidden-role checks remained correct
- the remaining risk is visual and browser-level confirmation of the centered modal flows, not a
  known backend, permission, or workflow defect

## 8. Recommendation

Mark this slice as QA-approved for progression within the current MVP foundation track.

Recommended next action:

1. Return to the Orchestrator.
2. Select the next planned MVP implementation area.
3. Keep a later browser-focused QA pass in mind before release if visual confidence for centered
   leave-policy and approval-decision modals becomes necessary.
