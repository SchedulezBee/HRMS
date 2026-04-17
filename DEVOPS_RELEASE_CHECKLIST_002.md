# DevOps Release Checklist 002

Date: 2026-04-17
Role: DevOps & Security Engineer
Status: Completed for staging-style release preparation

## 1. Environment Setup

Environment separation prepared:

- local reference: `C:\Users\Administrator\Documents\Projects\Project\hrms-portal\.env.example`
- staging reference: `C:\Users\Administrator\Documents\Projects\Project\hrms-portal\.env.staging.example`
- production reference: `C:\Users\Administrator\Documents\Projects\Project\hrms-portal\.env.production.example`

Required before staging deployment:

1. choose the actual staging host or platform
2. provision PostgreSQL for staging
3. create separate application and migration credentials
4. inject staging secrets securely
5. set the real staging public URL in `AUTH_URL`

Required before production deployment:

1. choose the production host or platform
2. provision production PostgreSQL and backup policy
3. create least-privilege production database users
4. inject production secrets securely
5. confirm HTTPS and public app URL

## 2. Deployment Flow

Recommended controlled flow:

1. check that the current build is QA-approved
2. confirm environment secrets are populated from the correct template
3. run CI verification
4. build the application artifact or container
5. run database deployment command against the target environment
6. start the application with runtime secrets
7. verify `GET /api/health`
8. verify sign-in and one role-scoped smoke check
9. record deployment timestamp and operator

Go or no-go gates:

- `npm run lint` must pass
- `npm run build` must pass
- health endpoint must return healthy
- target environment secrets must be present
- rollback target must be known before promotion

## 3. Access / Secrets Rules

- never reuse local development secrets in staging or production
- keep separate credentials for:
  - application runtime
  - migration execution
  - CI
- restrict production secret visibility to approved operators only
- rotate `AUTH_SECRET` and database passwords when environment ownership changes
- do not store real secrets in markdown, source control, or screenshots

## 4. Monitoring / Logs

Minimum staging release checks:

- application boot success
- `GET /api/health` returns healthy
- sign-in route loads
- one authenticated route loads
- container or process restart visibility exists

Minimum production baseline:

- health endpoint monitoring
- database availability monitoring
- failed sign-in trend visibility
- deployment event logging
- retention of application logs long enough for incident review

## 5. Backup / Rollback Plan

Before promotion:

1. capture a database backup or provider snapshot
2. keep the previous application artifact available
3. note the exact release version or build identifier

Rollback path:

1. stop or drain traffic from the failing release
2. redeploy the prior known-good application artifact
3. restore the database only if the deployed schema or data change is destructive and not forward-compatible

## 6. Security Controls

- production should run behind HTTPS only
- keep security headers enabled through the app config
- use least-privilege database users
- protect CI secrets and deployment credentials
- ensure debug-friendly detail remains development-only where user-facing exposure would be unsafe
- avoid manual hotfix deployment that bypasses the defined checklist

## 7. Release Risks

Current open release dependencies:

- staging hosting target is still not selected
- production hosting target is still not selected
- Docker runtime was prepared but not validated on this machine because Docker CLI is unavailable here
- migration discipline in shared environments still needs to move from local-style `db push` habits to controlled deployment execution

## 8. Operational Readiness Status

Current status:

- functional MVP foundation is QA-approved for staging-style packaging
- release-readiness docs exist
- environment templates now exist for staging and production
- final hosting, secret injection, and operator ownership decisions are still pending

Recommendation:

- ready for staging deployment preparation
- not yet ready for production release approval until hosting, backups, secrets handling, and rollback ownership are finalized
