# UI UX Design 001

Date: 2026-04-16
Status: Draft for handoff
Primary input: `C:\Users\Administrator\Documents\Projects\Project\BUSINESS_ANALYST_REQUIREMENTS_001.md`
Architecture input: `C:\Users\Administrator\Documents\Projects\Project\SOLUTION_ARCHITECTURE_001.md`
Related rules: `C:\Users\Administrator\Documents\Projects\Project\PROJECT_RULEBOOK.md`

## 1. User Journey

### Tenant Admin Journey

1. Sign in to the portal.
2. Access tenant setup and organization structure.
3. Create or manage departments and high-level admin assignments.
4. Review tenant-level dashboard summaries.
5. Exit with clear confirmation or error feedback through centered popup messages.

### HR Admin Journey

1. Sign in to the portal.
2. Land on HR dashboard with quick summaries for employees, leave, attendance, and pending actions.
3. Open employee management to create or update employee records.
4. Review leave requests and attendance exceptions when needed.
5. Use operational reports to monitor current activity.
6. Receive centered popup confirmation, validation, or error feedback for each create, update, or review action.

### Manager Journey

1. Sign in to the portal.
2. Land on team dashboard with pending approvals and attendance issues.
3. Open leave approval queue.
4. Review request details and approve or reject.
5. Open team attendance view to inspect missing or abnormal entries.
6. Receive immediate centered popup feedback after each action.

### Employee Journey

1. Sign in to the portal.
2. Land on self-service dashboard with attendance status, leave balance, and recent requests.
3. View personal profile.
4. Submit leave request.
5. Record attendance.
6. Review request history and attendance history.
7. Receive centered popup feedback after each action, including clear validation errors.

## 2. Screen List

### Shared Screens

- sign in
- forgot password or access recovery placeholder if included in MVP
- main dashboard shell
- centered popup feedback component
- unauthorized access state
- generic error state

### Tenant Admin Screens

- tenant profile settings
- organization structure management
- admin role assignment

### HR Admin Screens

- employee list
- create employee form
- employee detail view
- employee edit form
- leave management overview
- attendance management overview
- reports overview

### Manager Screens

- team dashboard
- leave approval queue
- leave request detail review
- team attendance review

### Employee Screens

- self-service dashboard
- my profile
- leave request form
- leave history
- attendance entry screen
- attendance history

## 3. Key Workflows

### Employee Creation Workflow

1. HR Admin opens employee list.
2. HR Admin clicks create employee.
3. Form opens with grouped sections for identity, contact, employment, reporting line, and status.
4. Submit triggers validation.
5. If valid, the system shows a centered success popup and returns to the employee list or detail view.
6. If invalid, the system shows a centered error or validation popup with field-specific guidance.

### Leave Submission Workflow

1. Employee opens leave request form.
2. Employee selects leave type and date range.
3. Leave balance summary is visible before submission.
4. Submit triggers validation and business-rule checks.
5. Success returns a centered popup confirming submission and updated status.
6. Failure returns a centered popup explaining the blocking issue.

### Leave Approval Workflow

1. Manager opens pending approval queue.
2. Manager selects a request.
3. Request detail screen shows requester, dates, reason, balance context, and decision options.
4. Manager approves or rejects with remarks if required.
5. Result appears as a centered popup and the queue updates.

### Attendance Entry Workflow

1. Employee opens attendance screen.
2. Employee sees current date, current status, and primary action button.
3. Employee records attendance event.
4. The system shows a centered popup for success or failure.
5. Attendance history updates after completion.

### Attendance Review Workflow

1. Manager or HR Admin opens attendance review.
2. List highlights missing, incomplete, or abnormal entries.
3. Reviewer opens record detail for context.
4. Reviewer completes allowed review action.
5. Result appears through centered popup feedback.

## 4. Wireframe Notes

### Design Direction

The UI should feel modern, clean, and operational rather than text-heavy or dated.

The visual approach should use:

- clear icons for module recognition
- limited emoji-style cues where they improve clarity and do not reduce professionalism
- high-contrast layout sections
- summary cards for fast scanning
- clean form grouping
- obvious primary and secondary actions

### Layout Notes

1. The main app should use a left navigation rail on desktop for module access.
2. The top bar should show tenant or company context, current user, and quick actions.
3. Dashboards should prioritize summary cards, pending items, and recent activity blocks.
4. Forms should be split into logical sections with simple progressive grouping, not long unstructured walls of fields.
5. Lists should support search, filters, and quick row actions where appropriate.

### Popup Notes

1. Success, error, warning, and validation feedback must appear in a centered popup or modal-style component.
2. The popup must contain a clear title, short message, and primary action such as close, retry, or review.
3. Error popups should include helpful debug-oriented context in development environments without confusing end users.

## 5. Interaction Rules

1. Every important user action must return visible feedback through the centered popup component.
2. Forms must show clear required fields before submission.
3. Role-based navigation should hide irrelevant modules while server-side access control still enforces rules.
4. Pending approvals should be visually prominent for managers and HR Admin users.
5. Filters and date selectors should be easy to access on leave and attendance list screens.
6. Actions that change records should require explicit confirmation where accidental changes would be risky.
7. Empty states should guide users toward the next useful action instead of showing blank tables.

## 6. States / Exceptions

### Shared States

- loading
- no data
- validation error
- permission denied
- action success
- action failure
- session expired

### Employee Management States

- no employees yet
- duplicate employee id validation
- missing required fields
- save failure

### Leave States

- insufficient balance
- invalid date range
- overlapping request if business rules later require it
- pending approval
- approved
- rejected with reason
- cancelled

### Attendance States

- no attendance recorded today
- attendance already recorded for the current step
- incomplete attendance entry
- abnormal record requiring review
- save failure

### Popup Behavior

1. Popups should open centered above the current screen with background dimming.
2. Popups should be dismissible unless the user must resolve an error first.
3. Error popups should avoid silently disappearing.
4. Success popups should not redirect users unexpectedly without a clear next action.

## 7. Responsive Considerations

1. Desktop is the primary operational layout for HR Admin and Tenant Admin users.
2. Tablet and mobile layouts should preserve core employee self-service flows.
3. Navigation should collapse into a drawer on smaller screens.
4. Dashboard cards should stack cleanly on tablet and mobile.
5. Centered popup components must stay readable and actionable on smaller screens.
6. Tables with many columns should switch to condensed or card-based layouts on narrow screens.

## 8. Handoff Notes

1. The centered popup component is a required shared UI pattern and should be implemented as a reusable platform component.
2. The developer should not replace popup feedback with inline-only banners for primary success or error actions.
3. The developer should preserve a modern operational interface style and avoid dated text-heavy screens.
4. The developer should use icons and lightweight visual cues consistently across navigation, dashboard cards, and workflow actions.
5. QA should verify popup placement, popup messaging, validation clarity, role-based navigation visibility, and responsive behavior.
