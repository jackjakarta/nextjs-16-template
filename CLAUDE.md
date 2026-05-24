# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 template with React 19, TypeScript 5.9, PostgreSQL/Drizzle ORM, Better Auth, a Hono API layer, TanStack React Query, Tailwind CSS v4/shadcn/ui, and next-intl for i18n.

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
- `src/app/api/[[...route]]/` — Hono catch-all handler (see API layer below); `/api/health` lives here

**Key modules:**

- `src/auth/` — Better Auth config (server: `index.ts`, client: `client.ts`, helpers: `utils.ts`)
- `src/db/` — Drizzle ORM setup, schemas (`schema/auth.ts`, `schema/app.ts`, `schema/jobs.ts`), query functions (`functions/`)
- `src/jobs/` — Postgres-backed background job queue (see below)
- `src/actions/` — Server actions (e.g. `setLocaleAction` persists locale to a cookie)
- `src/env/` — Type-safe env validation via t3-oss/env-nextjs with Zod
- `src/components/ui/` — shadcn/ui components
- `src/i18n/` — next-intl config; locale resolved from the `app_locale` cookie, translations in `messages/<locale>.json` (repo root, not under `src/`)
- `src/hooks/query/` — React Query hooks; co-locate a `*_QUERY_KEY` const and `queryFn` per hook (see `use-example-query.ts`)
- `src/utils/` — Shared utilities (`cn()` for Tailwind class merging, cookie helpers, types)

**Auth helpers** (`src/auth/utils.ts`):

- `getMaybeSession()` — nullable session
- `getValidSession()` — session or redirect
- `getUser()` — full user from session

**API layer (Hono):** REST endpoints run through a single Hono app, not per-folder Next.js route handlers.

- `src/app/api/hono-app.ts` — `app` mounted at `basePath('/api')`; mount route groups with `.route('/', group)` and export the chained `routes` value's type as `AppType` (required for the typed client).
- `src/app/api/[[...route]]/route.ts` — adapts `app` to Next.js via `hono/vercel`'s `handle`, re-exporting all HTTP verbs.
- `src/app/api/routes/<name>/` — one route group per resource: `index.ts` defines the Hono routes (`new Hono().basePath('/<name>').use(authMiddleware)...`), `handler.ts` holds the handlers. Validate request bodies with Zod `safeParse` inside handlers.
- `src/app/api/middleware/auth.ts` — `authMiddleware` resolves the Better Auth session and sets `userId`/`userName`/`userEmail` on the context (typed via `AuthEnv`); read them with `ctx.get('userId')`.
- `src/app/api/hono-client.ts` — `honoClient` is a typed `hc<AppType>` client; call endpoints from the frontend (e.g. `honoClient.api.example.$get()`) for end-to-end type safety.

**Data fetching (React Query):** Client components fetch via React Query hooks in `src/hooks/query/` that wrap `honoClient` calls. `CustomUseQueryOptions<T>` (`src/hooks/query/types.ts`) is the standard options type (omits `queryKey`/`queryFn`). Note: no `QueryClientProvider` is wired into the root layout yet — add one before these hooks will run.

**Database:** PostgreSQL with Drizzle ORM using snake_case DB columns. Three Postgres schemas: `auth`, `app`, and `jobs` (each via `pgSchema(...)`). Connection configured in `src/db/index.ts`, Drizzle config in `src/db/drizzle.config.ts`.

**Background jobs** (`src/jobs/`): A self-contained queue backed by the `jobs.job` table, driven by Postgres `LISTEN/NOTIFY` (`job_available` channel) with a 60s polling fallback.

- Define a job with `defineJob({ type, handler, maxAttempts?, timeoutMs?, onComplete?, onDead? })`. Add the `type` to `jobTypeSchema` in `registry.ts`, then register the handler via a side-effect import in `src/jobs/definitions/index.ts`.
- Enqueue with `enqueueJob(type, payload, options?)` — inserts a row and fires `NOTIFY`.
- `startWorker()` (`src/jobs/index.ts`) boots a `JobWorker` in a long-running process: claims one job at a time with `FOR UPDATE SKIP LOCKED`, enforces `timeoutMs`, retries with exponential backoff, marks exhausted jobs `dead`, and recovers stale `running` jobs on startup. The worker is auto-started by `src/instrumentation.ts` (calls `startWorker()` when `NEXT_RUNTIME === 'nodejs'`), so it boots with the Next.js server process.

## Conventions

- Path alias: `@/*` → `src/*`
- TypeScript strict mode with `noUncheckedIndexedAccess`
- `next.config.ts` sets `typescript.ignoreBuildErrors: true`, so `pnpm build` does **not** fail on type errors — `pnpm types` is the real type gate. Build also uses `output: 'standalone'` (for the Docker image).
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
