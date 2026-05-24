# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 template with React 19, TypeScript 5.9, PostgreSQL/Drizzle ORM, Better Auth, Tailwind CSS v4/shadcn/ui, and next-intl for i18n.

## Commands

```bash
# Development
pnpm dev                  # Start dev server (port 3000)
pnpm build                # Production build

# Code quality
pnpm checks               # format:check + lint + types + test (scripts/checks.sh)
pnpm pipeline             # format:check + lint + types + audit + build (scripts/pipeline.sh)
pnpm format               # Prettier format
pnpm format:check         # Verify formatting
pnpm lint                 # ESLint
pnpm types                # TypeScript type check (tsc --noEmit)

# Tests (Vitest, jsdom; passWithNoTests)
pnpm test                 # Run the full suite once
pnpm test path/to.test.ts # Run a single file
pnpm test -t "name"       # Run tests matching a name

# Database
pnpm db:generate          # Generate Drizzle migrations
pnpm db:migrate           # Run migrations
pnpm db:studio            # Open Drizzle Studio UI
```

## Architecture

**App Router with route groups:**

- `src/app/(app)/` — Protected application routes
- `src/app/(auth)/` — Authentication routes (login, register, logout)
- `src/app/api/auth/[...all]/` — Better Auth catch-all handler
- `src/app/api/health/` — Health check endpoint

**Key modules:**

- `src/auth/` — Better Auth config (server: `index.ts`, client: `client.ts`, helpers: `utils.ts`)
- `src/db/` — Drizzle ORM setup, schemas (`schema/auth.ts`, `schema/app.ts`, `schema/jobs.ts`), query functions (`functions/`)
- `src/jobs/` — Postgres-backed background job queue (see below)
- `src/actions/` — Server actions (e.g. `setLocaleAction` persists locale to a cookie)
- `src/env/` — Type-safe env validation via t3-oss/env-nextjs with Zod
- `src/components/ui/` — shadcn/ui components
- `src/i18n/` — next-intl config; locale resolved from the `app_locale` cookie, translations in `src/messages/<locale>.json`
- `src/utils/` — Shared utilities (`cn()` for Tailwind class merging, cookie helpers, types)

**Auth helpers** (`src/auth/utils.ts`):

- `getMaybeSession()` — nullable session
- `getValidSession()` — session or redirect
- `getUser()` — full user from session

**Database:** PostgreSQL with Drizzle ORM using snake_case DB columns. Three Postgres schemas: `auth`, `app`, and `jobs` (each via `pgSchema(...)`). Connection configured in `src/db/index.ts`, Drizzle config in `src/db/drizzle.config.ts`.

**Background jobs** (`src/jobs/`): A self-contained queue backed by the `jobs.job` table, driven by Postgres `LISTEN/NOTIFY` (`job_available` channel) with a 60s polling fallback.

- Define a job with `defineJob({ type, handler, maxAttempts?, timeoutMs?, onComplete?, onDead? })`. Add the `type` to `jobTypeSchema` in `registry.ts`, then register the handler via a side-effect import in `src/jobs/definitions/index.ts`.
- Enqueue with `enqueueJob(type, payload, options?)` — inserts a row and fires `NOTIFY`.
- `startWorker()` (`src/jobs/index.ts`) boots a `JobWorker` in a long-running process: claims one job at a time with `FOR UPDATE SKIP LOCKED`, enforces `timeoutMs`, retries with exponential backoff, marks exhausted jobs `dead`, and recovers stale `running` jobs on startup. No worker process is wired into `package.json` — invoke `startWorker()` from your own entrypoint.

## Conventions

- Path alias: `@/*` → `src/*`
- TypeScript strict mode with `noUncheckedIndexedAccess`
- Forms: React Hook Form + Zod + @hookform/resolvers
- Styling: Tailwind CSS v4 with CSS variables for theming; use `cn()` from `@/utils/tailwind`
- Env vars: access via `env` object from `@/env`, never `process.env` directly in app code
- Prettier config: `@jackjakarta/prettier-config` with Next.js preset
- DB Delete Queries: No cascades on db tables. We do a `db.transaction()` where we execute the necessary queries.
- DB Enums: Only type enums at code level with a `text().$type<Type>()` column instead of a `pgEnum`.

## Environment Variables

Required (see `.env.example`):

- `DATABASE_URL` — PostgreSQL connection string
- `BETTER_AUTH_URL` — App URL for auth callbacks
- `BETTER_AUTH_SECRET` — Secret for session signing

## Local Setup

```bash
fnm use                              # Node v24 (from .nvmrc)
corepack enable && corepack prepare  # Setup pnpm
pnpm i
cp .env.example .env
docker compose up -d postgres        # Start PostgreSQL
pnpm db:generate && pnpm db:migrate
pnpm dev
```

## Libraries

When working with libraries always use the context7 mcp tools, never guess APIs from memory.
