# HRMS Portal

Core Vision HRMS MVP portal built with Next.js, NextAuth, Prisma, and PostgreSQL.

## Stack

- Next.js 16
- React 19
- TypeScript
- Prisma 7 with PostgreSQL
- NextAuth credentials auth
- Tailwind CSS 4

## Local Development

1. Copy `.env.example` to `.env` and replace placeholder secrets.
2. Start PostgreSQL locally, or use `compose.local.yml`.
3. Run:

```powershell
npm ci
npm run db:prepare-local
npx prisma generate
npx prisma db push
npm run db:seed
npm run dev
```

4. Open `http://localhost:3000/sign-in`.

## Environment Templates

- local: `.env.example`
- staging: `.env.staging.example`
- production: `.env.production.example`
- Railway config: `railway.toml`
- Vercel ignore file: `.vercelignore`

## Local Container Flow

For a full local container stack:

```powershell
docker compose -f compose.local.yml up --build
```

Then run schema sync and seed from the app container or from a local terminal pointed at the same
database:

```powershell
npx prisma db push
npm run db:seed
```

## Health Check

The app exposes an operational health endpoint:

- `GET /api/health`

Healthy response returns:

- `status: healthy`
- `app: ok`
- `database: ok`

## CI

Baseline CI is defined in:

- `.github/workflows/ci.yml`

The pipeline installs dependencies, prepares PostgreSQL, pushes the Prisma schema, seeds the
database, then runs lint and build verification.

## Vercel Preview Notes

- this app can deploy to Vercel as a standard Next.js project
- if your repository root is above `hrms-portal`, set the Vercel Root Directory to `hrms-portal`
- on the free Vercel path, use `Preview` as the online test environment
- keep PostgreSQL external and provide the connection string through Vercel environment variables
- use `.vercelignore` to avoid uploading local-only files and deployment configs that are not needed on Vercel
- the build command now regenerates Prisma Client before `next build` so hosted deployments stay in sync with the Prisma schema

## Railway Staging Notes

- use `railway.toml` as config-as-code for the staging service
- prefer Railpack for the first staging deployment so the pre-deploy Prisma migration step can run cleanly
- if your repository root is above `hrms-portal`, set Railway root directory to `/hrms-portal`
- set `AUTH_URL` to the generated Railway staging domain

## Production Notes

- Use unique production secrets.
- Set `AUTH_URL` to the real public app URL.
- Do not reuse local `.env` values in shared environments.
- Run `npm run db:deploy` against production before starting the app.
- Use `npm run start:standalone` only after building the standalone output.
- Use the staging and production env templates as references, not as live credential files.

## Seeded Local Accounts

All seeded local accounts use the same development password:

- `tenant.admin@corevision.local`
- `alya.rahman@corevision.local`
- `daniel.tan@corevision.local`
- `marcus.lee@corevision.local`

Password:

- `Password123!`
