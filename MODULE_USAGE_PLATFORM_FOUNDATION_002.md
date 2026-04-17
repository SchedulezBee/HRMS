# Module Usage - Platform Foundation 002

Date: 2026-04-16
Status: Active
Module: HRMS Portal Foundation
Application path: `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`

## What This Module Does

This updated foundation module now provides:

- role-based module visibility
- stored employee records in local browser state
- stored leave request records in local browser state
- approval queue updates for leave requests
- centered create and submit modals
- testable unauthorized and generic error state surfaces
- shared centered popup feedback with debug references

## Who Uses It

- internal product and delivery team for review
- QA for role, state, and feedback validation
- future HR Admin, Manager, Employee, and Tenant Admin flows once backend wiring is added

## How To Access It

1. Open a terminal in `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`
2. Run `npm install` if dependencies are not already installed
3. Run `npm run dev`
4. Open the local Next.js URL shown in the terminal

## Main Workflow

1. Use the role selector in the sidebar to change the active role preview
2. Confirm the sidebar module list changes with the active role
3. Open `Employees` and use `Add employee` to create a stored record
4. Open `Leave` and use `Submit leave` to create a stored request
5. Open `Approvals` and approve or reject pending leave requests
6. Use the debug action cards to open unauthorized or generic error surfaces
7. Review centered popup feedback and debug references after actions

## Important Validations and Behaviors

- role-based navigation now hides restricted modules
- new employee records are validated and stored locally
- duplicate employee ids are blocked
- new leave requests are validated and stored locally
- approval status changes update the pending queue and reports
- popup feedback appears in the middle of the screen
- unauthorized and generic error screens are available for QA testing

## Known Limitations

- no real authentication
- no backend authorization
- no server-side persistence
- no tenant-isolated backend enforcement yet
- attendance and audit workflows are not fully persisted yet
