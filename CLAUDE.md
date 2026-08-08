# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Next.js 16 template (App Router, React 19, TypeScript 5.9) with PostgreSQL/Drizzle ORM, Better Auth, a Hono API layer, TanStack React Query, Tailwind CSS v4 + shadcn/ui, next-intl for i18n, and a Postgres-backed background job queue.

## Commands

```bash
# Development
pnpm dev                  # Dev server on port 3000
pnpm build                # Production build (output: 'standalone')

# Code quality
pnpm checks               # format:check + lint + types + test (scripts/checks.sh)
pnpm pipeline             # checks + pnpm audit --audit-level=critical + build (scripts/pipeline.sh)
pnpm format               # Prettier write
pnpm format:check         # Prettier check
pnpm lint                 # ESLint
pnpm types                # tsc --noEmit

# Tests (Vitest, jsdom env, passWithNoTests)
pnpm test                 # Full suite, single run
pnpm test path/to.test.ts # Single file
pnpm test -t "name"       # Tests matching a name

# Database (drizzle-kit, config at src/db/drizzle.config.ts)
pnpm db:generate          # Generate migrations into src/db/migrations
pnpm db:migrate           # Apply migrations
pnpm db:studio            # Drizzle Studio
```

Local Postgres: `docker compose up -d postgres`. Node version is pinned in `.nvmrc` (`fnm use`), package manager via `corepack`.

CI (`.github/workflows/static-checks.yml`) runs the same gates as `pnpm checks` plus the audit.

## Architecture

**Route groups (`src/app/`)**

- `(app)/` — protected routes; its `layout.tsx` calls `getValidSession()` (redirects to `/login`) and mounts `ClientProvider` (the React Query provider) — it is _not_ mounted in the root layout
- `(auth)/` — `login`, `register`, `logout`
- `api/auth/[...all]/` — Better Auth catch-all
- `api/[[...route]]/` — Hono catch-all (all REST endpoints, including `/api/health`)

Root `layout.tsx` wires fonts, `ThemeProvider` (next-themes), and `NextIntlClientProvider`.

**API layer (Hono).** REST endpoints go through one Hono app, not per-folder Next.js route handlers:

- `src/app/api/hono-app.ts` — `app` at `basePath('/api')`; mount groups with `.route('/', group)` on the chained `routes` value and export `AppType = typeof routes` (the chain is what gives the client its types)
- `src/app/api/[[...route]]/route.ts` — adapts `app` via `hono/vercel`'s `handle`, re-exporting every verb
- `src/app/api/routes/<name>/` — one group per resource: `index.ts` defines routes (`new Hono().basePath('/<name>').use(authMiddleware)…`), `handler.ts` holds handlers. Validate bodies with Zod `safeParse` inside the handler and return `{ success, data | error }` JSON.
- `src/app/api/middleware/auth.ts` — `authMiddleware` resolves the Better Auth session and sets `userId`/`userName`/`userEmail` on the context (typed as `AuthEnv`); read via `ctx.var.userId`
- `src/app/api/hono-client.ts` — `honoClient` (`hc<AppType>`) for end-to-end typed calls from the client, e.g. `honoClient.api.example.$get()`

**No server actions.** Every mutation goes through a real Hono endpoint (`POST`/`PUT`/`DELETE` in a route group) called via `honoClient` — do not add `'use server'` functions for writes. The only existing action, `setLocaleCookieAction` in `src/actions/cookies.ts`, is a cookie write that needs Next.js' `cookies()` request context, not a data mutation.

**Data fetching.** Client components use React Query hooks in `src/hooks/query/` that wrap `honoClient`. Each hook co-locates its `*_QUERY_KEY` const and `queryFn`; options type is `CustomUseQueryOptions<T>` (omits `queryKey`/`queryFn`). See `use-example-query.ts`.

**Auth** (`src/auth/`): `index.ts` (server config — email/password with required verification, `nextCookies()` must stay last in `plugins`), `client.ts` (`authClient` for React), `utils.ts` helpers:

- `getSessionOrNull()` — nullable session
- `getValidSession()` — session or redirect to `/login`
- `getUser()` — full `UserModel` row from the session

**Database** (`src/db/`): Drizzle over `node-postgres` with `casing: 'snake_case'` (define columns in camelCase, DB gets snake_case). The `Pool` is cached on `global` in development to survive hot reloads. Three Postgres schemas via `pgSchema(...)`: `auth` (`schema/auth.ts`), `app` (`schema/app.ts` — add app tables here), `jobs` (`schema/jobs.ts`). Each schema file exports `…Model`/`Insert…Model` types from `$inferSelect`/`$inferInsert`. Query functions live in `src/db/functions/` named `dbGetX`/`dbUpdateX`. New schema files must be added to the `schema` array in `src/db/drizzle.config.ts`.

**Background jobs** (`src/jobs/`): queue backed by the `jobs.job` table, driven by Postgres `LISTEN/NOTIFY` on the `job_available` channel with a 60s polling fallback. To add a job:

1. Add the type to `jobTypeSchema` in `registry.ts`
2. Create `definitions/<name>.ts` calling `defineJob<Payload>({ type, handler, maxAttempts?, timeoutMs?, onComplete?, onDead? })`
3. Add a side-effect `import './<name>'` to `definitions/index.ts` (that file is what registers handlers)

Enqueue with `enqueueJob(type, payload, options?)` — inserts the row and `NOTIFY`s in one transaction. `startWorker()` boots a `JobWorker` that claims one job at a time via `FOR UPDATE SKIP LOCKED`, enforces `timeoutMs`, retries with exponential backoff (`2^attempts * 5s`), marks exhausted jobs `dead`, and re-queues `running` jobs stale for >5min on startup. The worker starts automatically from `src/instrumentation.ts` when `NEXT_RUNTIME === 'nodejs'`, i.e. inside the Next.js server process.

**i18n** (`src/i18n/request.ts`): locale comes from the `user_pref.app_locale` cookie (`getLocaleFromCookies`, falls back to `en`); translations live in `messages/<locale>.json` at the repo root, not under `src/`. `setLocaleCookieAction` in `src/actions/cookies.ts` persists a change. Supported locales are the `appLocaleSchema` enum in `src/utils/types.ts`.

## Conventions

- Path alias `@/*` → `src/*`; TS strict with `noUncheckedIndexedAccess`
- `next.config.ts` sets `typescript.ignoreBuildErrors: true`, so **`pnpm build` does not catch type errors — `pnpm types` is the real gate**
- Env vars: validate/access through the `env` object from `@/env` (t3-oss + Zod, camelCase keys) rather than `process.env` in app code. Infrastructure-level files (`src/db/index.ts`, `src/jobs/worker.ts`, `instrumentation.ts`) intentionally read `process.env` directly to avoid the validation import at boot.
- Mutations never use server actions — always a Hono endpoint invoked through `honoClient` (see the API layer above)
- Forms: React Hook Form + Zod via `@hookform/resolvers`; submit handlers call `honoClient`, not an action
- Styling: Tailwind v4 with CSS variables; merge classes with `cn()` from `@/utils/tailwind`. shadcn/ui components go to `src/components/ui/` (new-york style, slate base, lucide icons)
- Deletes: no DB-level cascades — use `db.transaction()` and delete dependents explicitly
- Enums: type at the code level with `text().$type<Type>()` + a Zod enum, never `pgEnum`
- Any user-visible text is localized through next-intl (`getTranslations` server-side, `useTranslations` client-side) — never hardcoded. See `messages/en.json` and the `(auth)` route group.

## Environment Variables

See `.env.example` and `@/env`.

## Libraries

When working with libraries always use the context7 mcp tools, never guess APIs from memory.
