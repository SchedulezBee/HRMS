# QA Report 012

Date: 2026-04-17
Status: Completed for release sign-off visual pass
Primary inputs:

- `C:\Users\Administrator\Documents\Projects\Project\QA_REPORT_011.md`
- `C:\Users\Administrator\Documents\Projects\Project\DEVOPS_SECURITY_READINESS_001.md`
- `C:\Users\Administrator\Documents\Projects\Project\OPERATIONS_USAGE_RELEASE_READINESS_001.md`
- working build from `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`

## 1. Test Scope

This QA pass focuses only on the remaining release-signoff risk area:

- browser-driven visual verification of centered modal positioning
- browser-driven visual verification of centered popup positioning
- `/preview` interaction coverage for the newest modal-based flows
- authenticated HR Admin preview behavior for:
  - employee edit modal
  - attendance review modal
  - leave policy modal
  - approval decision modal

Covered in execution:

- seeded HR Admin sign-in through the browser
- authenticated `/workspace` redirect success
- authenticated `/preview` browser rendering
- visual modal-open behavior on the latest preview flows
- validation popup behavior from the approval decision flow
- bounding-box verification of modal and popup centering

Not fully covered in execution:

- cross-browser verification outside Chromium
- manual non-headless visual review by a human observer
- visual coverage for every older popup path in the product
- Docker runtime validation
- production deployment behavior

## 2. Test Scenarios

1. Open `/sign-in` in a real browser session.
2. Sign in as seeded `HR Admin`.
3. Confirm navigation into the authenticated backend workspace.
4. Open authenticated `/preview`.
5. Open `Employees` and launch the first `Edit record` modal.
6. Open `Attendance` and launch the first `Review entry` modal.
7. Open `Leave` and launch the `Add policy` modal.
8. Open `Approvals` and launch the first `Reject` modal.
9. In the approval modal, trigger the validation path by saving a rejection without remarks.
10. Verify the resulting feedback popup appears and remains centered.
11. Capture visual artifacts for the modal and popup states.

## 3. Acceptance Criteria Coverage

### Passed

- seeded `HR Admin` browser sign-in succeeded
- authenticated `/preview` loaded successfully in the browser
- `Edit employee` modal opened from `/preview`
- `Review attendance entry` modal opened from `/preview`
- `Add leave policy` modal opened from `/preview`
- `Reject leave request` modal opened from `/preview`
- `Approval decision blocked` feedback popup opened from `/preview`
- all four target modals rendered centered within the viewport
- the tested feedback popup rendered centered within the viewport
- the tested popup showed the expected debug reference:
  - `DEBUG-APPROVAL-REMARKS-01`

Centering measurements recorded in browser automation:

- `Edit employee` modal:
  - deltaX -> `0`
  - deltaY -> `0`
- `Review attendance entry` modal:
  - deltaX -> `0`
  - deltaY -> `0`
- `Add leave policy` modal:
  - deltaX -> `0`
  - deltaY -> `0`
- `Reject leave request` modal:
  - deltaX -> `0`
  - deltaY -> `0`
- `Approval decision blocked` popup:
  - deltaX -> `0`
  - deltaY -> `0`

Visual artifacts captured:

- `C:\Users\Administrator\AppData\Local\Temp\qa-playwright\artifacts\modal-edit-employee.png`
- `C:\Users\Administrator\AppData\Local\Temp\qa-playwright\artifacts\modal-attendance-review.png`
- `C:\Users\Administrator\AppData\Local\Temp\qa-playwright\artifacts\modal-add-leave-policy.png`
- `C:\Users\Administrator\AppData\Local\Temp\qa-playwright\artifacts\modal-reject-approval.png`
- `C:\Users\Administrator\AppData\Local\Temp\qa-playwright\artifacts\popup-approval-validation.png`

### Partially Covered

- this pass validated the newest modal-heavy HR Admin preview flows only
- the popup verification used the approval validation path rather than every popup variant in the application
- the release sign-off browser check used headless Chromium, not a full multi-browser matrix

### Failed or Not Met

- none in the tested browser-visible scope

## 4. Defects Found

No confirmed release-blocking UI defects found in the tested browser-visible scope.

No centering regression reproduced for:

- employee edit modal
- attendance review modal
- leave policy modal
- approval decision modal
- validation feedback popup

Coverage note:

- `CenteredModal` does not currently expose an explicit `role="dialog"` attribute, so this QA pass validated visual behavior by rendered heading and bounding-box position instead of ARIA-dialog querying

## 5. Severity / Impact

- Confirmed defects: none
- Remaining impact: low
- Residual risk is limited to:
  - lack of multi-browser visual coverage
  - lack of manual human visual review outside headless automation

## 6. Retest Status

- Browser sign-in regression: Passed
- Authenticated preview rendering: Passed
- Employee modal visual retest: Passed
- Attendance review modal visual retest: Passed
- Leave policy modal visual retest: Passed
- Approval decision modal visual retest: Passed
- Centered popup visual retest: Passed

Execution notes:

- browser automation used Playwright with Chromium in a local QA tool directory
- the run used the live local app at `http://localhost:3000`
- the signed-in role remained locked to the authenticated HR Admin account in preview, which was acceptable because the latest release-risk modals are all exposed in that role scope

## 7. Release Risk

Release risk for this sign-off pass: Low

Reason:

- the last known residual UI risk from earlier QA reports was centered modal and popup confirmation
- that browser-driven visual risk has now been exercised directly and passed
- no release-blocking UI regression was observed in the newest modal-based preview flows

Operational note:

- Docker runtime validation and production hosting readiness remain DevOps concerns, not UI blockers in this QA pass

## 8. Recommendation

Mark the current MVP foundation as QA-approved for staging-style release packaging from the UI sign-off perspective.

Recommended next action:

1. Return control to the Orchestrator.
2. Move to final release checklist or staging deployment preparation.
3. Keep broader cross-browser or UAT visual review as optional confidence-building work, not a current blocker.
