# Module Usage - Platform Foundation 006

Date: 2026-04-16
Module status: Usable in local development

## 1. What this slice adds

- fixed preview attendance `Clock in` and `Refresh entry` behavior in backend mode
- same-day refreshed attendance entries now clear old `timeOut` values correctly before the next
  `Clock out`

## 2. Local setup

From `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`:

- run `npm install`
- run `npm run db:prepare-local`
- run `npx prisma db push`
- run `npx prisma generate`
- run `npm run db:seed`
- run `npm run dev`

## 3. How to verify the attendance flow

1. Open `/sign-in`
2. Sign in with `HR Admin`, `Manager`, or `Employee`
3. Open `/preview`
4. Open the `Attendance` module
5. Use `Clock in` to create or reset the same-day attendance entry
6. Confirm the centered popup reports success and the review list updates
7. Use `Clock out` to complete the same-day attendance entry
8. If a completed same-day record already exists, use `Refresh entry` and confirm the record reopens
   without the old `timeOut`
9. Use `Flag exception` if needed to mark the same-day record for follow-up

## 4. Current limitations

- QA still needs to confirm the full browser-click path directly
- the preview route remains an MVP integration surface rather than a final production UI
