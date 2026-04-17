# Module Usage - Platform Foundation 008

Date: 2026-04-16
Module status: Usable in local development

## 1. What this slice adds

- tenant profile visibility and update support
- department structure and department lead management
- tenant-scoped HR Admin provisioning for existing employee records
- organization admin surfaces in both `/preview` and `/workspace`

## 2. Local setup

From `C:\Users\Administrator\Documents\Projects\Project\hrms-portal`:

- run `npm install`
- run `npm run db:prepare-local`
- run `npx prisma db push`
- run `npx prisma generate`
- run `npm run db:seed`
- run `npm run dev`

## 3. How to verify the tenant and organization flow

1. Open `/sign-in`
2. Sign in as `Tenant Admin` using `tenant.admin@corevision.local` and password `Password123!`
3. Open `/preview`
4. Open the `Organization` module
5. Use `Edit tenant` to review tenant profile fields
6. Use `Add department` to create a department and assign a department lead
7. Use `Provision HR Admin` to create HR Admin access for an existing employee record
8. Confirm success and error feedback appears in centered popup modals
9. Open `/workspace`
10. Confirm tenant profile, departments, and HR Admin access are visible in the authenticated
    backend workspace
11. Sign out
12. Sign in as `HR Admin` using `alya.rahman@corevision.local` and password `Password123!`
13. Open `/preview`
14. Confirm the `Organization` module is visible for structure support, but HR Admin cannot manage
    HR Admin access
15. Open `/workspace`
16. Confirm organization visibility is present without Tenant Admin provisioning power

## 4. Current limitations

- HR Admin provisioning in MVP is limited to existing employee records with a temporary password
- no email invite, password reset email, or external IAM flow is included in this slice
- preview route still benefits from additional browser-driven QA coverage for the new organization
  modals and interaction states
