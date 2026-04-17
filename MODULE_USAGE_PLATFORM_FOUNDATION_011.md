# Module Usage - Platform Foundation 011

Date: 2026-04-16
Module status: Usable in local development

## 1. What this slice adds

- leave policy configuration for `Tenant Admin` and `HR Admin`
- enabled leave type enforcement during leave submission
- opening balance and entitlement-driven leave balance summaries
- centered approval decision modal with reviewer remarks
- workspace visibility for configured leave policy values

## 2. Local setup

From `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`:

- run `npm install`
- run `npm run db:prepare-local`
- run `npx prisma generate`
- run `npx prisma db push`
- run `npm run db:seed`
- run `npm run dev`

## 3. How to verify leave policy management

1. Open `/sign-in`
2. Sign in as `Tenant Admin` using `tenant.admin@corevision.local` and password `Password123!`
3. Open `/preview`
4. Open the `Leave` module
5. Select `Add policy`
6. Create a leave policy with code, name, opening balance, entitlement, and status
7. Save the centered modal
8. Confirm a centered success popup appears with a debug reference
9. Confirm the leave policy list refreshes with the new or updated policy values
10. Sign out and repeat the same flow as `HR Admin`

## 4. How to verify leave submission and approval remarks

1. Sign in as `Employee`
2. Open `/preview`
3. Open the `Leave` module
4. Select `Submit leave`
5. Confirm the leave type dropdown only shows enabled leave types
6. Submit a request and confirm the centered success popup appears
7. Sign out and sign in as `Manager` or `HR Admin`
8. Open the `Approvals` module
9. Select `Approve` or `Reject` on a pending request
10. Enter reviewer remarks in the centered modal and save
11. Confirm the centered popup appears with a debug reference
12. Confirm the request history now shows the stored reviewer remarks

## 5. API surfaces added in this slice

- `/api/leave-types`
- `/api/leave-types/[id]`

## 6. Current limitations

- leave request records still store leave type labels as strings
- leave balances are computed summaries, not a persisted ledger
- browser-driven QA is still needed for the new leave policy and approval decision modals
