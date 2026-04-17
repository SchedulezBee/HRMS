# Module Usage - Platform Foundation 001

Date: 2026-04-16
Status: Active
Module: HRMS Portal Foundation
Application path: `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`

## What This Module Does

This module provides the first working HRMS portal shell for the MVP.

It gives the project:

- a modern application layout
- role preview switching
- shared module navigation
- centered popup feedback for success, warning, and error actions
- mock workflow screens for employee, leave, attendance, approvals, and reports
- visible debug references for development review

## Who Uses It

- internal product and delivery team for early review
- UI and QA review during MVP foundation validation
- future HR Admin, Manager, Employee, and Tenant Admin flows once backend wiring is added

## How To Access It

1. Open a terminal in `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`
2. Run `npm install` if dependencies are not already installed
3. Run `npm run dev`
4. Open the local Next.js URL shown in the terminal

## Main Workflow

1. Use the left navigation to switch between MVP modules
2. Use the role selector in the sidebar to preview different user contexts
3. Use the top search field to filter employee records by name, id, or team
4. Click action buttons inside each module to trigger success, warning, or error popup feedback
5. Review the debug reference in each popup for traceable development feedback

## Important Validations and Behaviors

- popup feedback appears in the middle of the screen
- popup feedback includes a debug reference
- employee search filters the visible employee list
- dashboard and module views remain responsive across smaller layouts
- actions are currently mock interactions and do not persist data yet

## Known Limitations

- no real authentication
- no real authorization enforcement
- no backend or database persistence
- no real audit log storage yet
- no real notification delivery yet
