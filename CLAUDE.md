# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # prisma generate + next build
npm run start        # Production start
npm run lint         # ESLint
npx prisma generate  # Regenerate Prisma client after schema changes
npx prisma db push   # Push schema changes to database
npx prisma studio    # Open Prisma Studio GUI
```

No test suite is configured.

## Architecture Overview

**Policy Manager** is an enterprise policy decisioning platform for lending/insurance workflows. It combines policy CRUD with AI-assisted building, multi-level approval workflows, and simulation/testing.

### Deployment Context

The app is deployed at a sub-path: `basePath: '/policy'` and `assetPrefix: '/policy'` in `next.config.ts`. It is part of a larger system at `baikalsphere.com`. All routes are prefixed with `/policy`.

### Key Technologies

- **Next.js 16 App Router** — all pages under `app/`, all API routes under `app/api/`
- **Prisma 7 + PostgreSQL** — via `@prisma/adapter-pg` (native driver, not the default Prisma driver)
- **Redux Toolkit** — global UI/auth state (`store/slices/`)
- **TanStack Query** — server state, cached fetching (`hooks/`)
- **shadcn/ui + Radix UI** — component primitives in `components/ui/`
- **AWS Bedrock (Claude)** — AI features; backend proxied via `BACKEND_AI_URL`

### Policy Data Model

The core hierarchy (all cascade-delete):

```
PolicyEngine → Tab → SubTab → Field
PolicyEngine → AuditLog
PolicyEngine → PolicyVersion (snapshots as JSON)
PolicyEngine → ApprovalQueue → ExecutionLog
```

`PolicyEngine` holds the policy metadata and a `dynamicFields` JSON blob. `PolicyVersion.snapshotData` stores full policy JSON snapshots at key transitions.

Admin workflow routing tables are created dynamically via raw SQL in `lib/adminWorkflowStore.ts` (`ensureAdminWorkflowTables()`).

### Policy Lifecycle States

`DRAFT → PENDING_REVIEW → UNDER_REVIEW → APPROVED → PUBLISHED`
Also: `CHANGES_REQUESTED`, `REJECTED`

### Authentication

Auth info is injected via the `x-user-data` request header (set upstream by an API gateway/middleware — not managed in this repo). All API routes call `getUserFromRequest()` from `lib/adminAuth.ts` to extract `{ id, role, name, email }`.

Roles: `MAKER`, `CHECKER`, `ADMIN`, `IT_ADMIN`

The frontend uses JWT stored in localStorage. `lib/api.ts` is the Axios instance that attaches the token automatically.

### AI Features

Two distinct AI integration paths:

1. **Policy Structure Generation** (`controller/ai-generate.controller.ts`) — Tries `OPENAI_API_KEY` first, falls back to keyword heuristics. Returns `{ tabs: [...] }` JSON.

2. **Document Upload & Chat** (`app/api/chat/upload-document/route.ts`) — Proxies multipart form data to the external Python AI backend at `BACKEND_AI_URL`. The AI backend uses CrewAI + AWS Bedrock (Claude 3). Helper in `lib/backendAiUrl.ts` handles URL deduplication (avoids double `/policy-ai/api` segments).

### API Route Conventions

All routes follow this pattern:
```ts
const userData = getUserFromRequest(request);   // throws 401 if missing
// role check via assertIsAdmin(userData) etc.
const result = await someController.method(...);
return NextResponse.json({ success: true, data: result });
```

Error responses use `{ success: false, error: string }` shape.

### State Management

- **Redux** (`store/`): `authSlice` (user session), `policySlice` (active policy ID, builder step 1–6, active tab, policy JSON), `uiSlice` (modals, panels). Use typed hooks from `store/hooks.ts`.
- **TanStack Query** (`hooks/`): `usePolicies`, `usePolicyStats`, `useSimulation`, `useTabs`, `useChecker`, `useAdmin`, etc. for all server data.

## Frontend Design System

**All new frontend code must use the design tokens from `.cursorrules` — never raw Tailwind color classes.**

The design system is defined in `.cursorrules` and `FRONTEND_UI.md`. Key tokens:

- **Brand:** `brand-500` (#6366F1 indigo) for primary accents, FABs, selected states
- **Surfaces:** `surface-page` (#F8FAFC), `surface-card` (#FFFFFF), `surface-raised` (#F1F5F9)
- **Text:** `ink-900` (headings), `ink-700` (body), `ink-500` (secondary/labels), `ink-200` (borders)
- **Status badges:** use `status.draft`, `status.pending_review`, `status.approved`, etc. tokens
- **BRE results:** `bre.pass`, `bre.fail`, `bre.warn`, `bre.skipped`
- **Sidebar:** 260px expanded / 64px collapsed; top bar 56px

UI inspiration: Linear (sidebar/nav), Camunda (workflow rules), Retool (tables), Vercel (status badges/timelines).

## Environment Variables

```bash
DATABASE_URL                    # PostgreSQL connection string
MY_SECRET_KEY                   # JWT signing secret
ACCESS_TOKEN_EXPIRES_IN         # JWT expiry (e.g. "24h")
BACKEND_AI_URL                  # AI backend base URL (server-side)
NEXT_PUBLIC_BACKEND_AI_URL      # AI backend base URL (client-side)
NEXT_PUBLIC_API_URL             # This app's own base URL for Axios
OPENAI_API_KEY                  # Optional; enables OpenAI policy generation
AWS_ACCESS_KEY_ID               # AWS credentials for Bedrock
AWS_SECRET_ACCESS_KEY
AWS_REGION
AI_MODEL_ID                     # Bedrock model ID (default: claude-3-sonnet)
```
