# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is the **Vibe Method Platform** - a fork-ready monorepo for AI-assisted development with context engineering. Fork this repository to start new projects following the Vibe Method methodology.

## Core Philosophy

**Code is infrastructure, not product.** Code creates capability; behavior comes from artifacts it consumes.

```
SYSTEM <-> motor <-> ARTIFACT <-> tool <-> BUSINESS
```

- **Motor**: Code that reads, validates, executes (stable, rarely changes)
- **Artifact**: Declarative behavior definition (changes frequently)
- **Tool**: Produces valid artifacts

---

## Localization

**This project targets Brazilian users. Internally, prefer English, but for user-facing data use pt-BR.**

---

## Development Commands

```bash
npm install                 # Install all workspace dependencies
npm run docker:up           # Start infrastructure (PostgreSQL, Redis, MongoDB, etc.)
npm run migrate:main        # Run migrations + seeds for main database
npm run migrate:analytics   # Run migrations for analytics database
npm run dev                 # Start all apps concurrently
```

**Individual Apps:**

```bash
npm run dev:wa-sim          # WhatsApp simulator backend only
npm run dev:wa-sim-ui       # WhatsApp simulator UI only
npm run tooling             # Internal tooling app
```

**Infrastructure:**

```bash
npm run docker:down         # Stop infrastructure
npm run docker:rebuild      # Stop + rebuild + start
```

## Architecture Overview

### Apps (Monorepo Workspaces)

| App | Tech | Port | Purpose |
|-----|------|------|---------|
| `apps/app` | Next.js 15, React 19 | 8000 | Main frontend |
| `apps/sockets` | Socket.io 4.7+ | 8001 | Real-time WebSocket layer |
| `apps/backbone` | Fastify 5 | 8002 | Backend API hub |
| `apps/wa-sim` | Fastify 4.26+ | 8003 | WhatsApp simulator backend |
| `apps/wa-sim-ui` | React + Vite | 8004 | WhatsApp simulator frontend |

### Infrastructure Ports (Docker)

| Service | Port |
|---------|------|
| PostgreSQL MAIN | 8050 |
| Redis | 8051 |
| MongoDB | 8052 |
| Meilisearch | 8053 |
| n8n | 8054 |
| Evolution API | 8055 |
| Ollama | 8056 |
| Adminer | 8057 |
| PostgreSQL ANALYTICS | 8058 |

### Key Directories

| Directory | Purpose |
|-----------|---------|
| `specs/` | Context engineering artifacts (business logic definitions) |
| `plans/` | Implementation plans (`/plans/{name}/PLAN.md`) |
| `brainstorming/` | Raw material and task tracking |
| `database/main/migrations/` | SQL migrations (0XX = motor, 1XX+ = business) |
| `methodology/` | Vibe Method documentation |

### Motor vs Business Separation

**Motor (platform core - rarely modify):**
- `apps/*/src/lib/`
- `apps/*/src/index.ts`
- `packages/`
- `database/migrations/00*.sql`

**Business (project-specific - modify freely):**
- `apps/*/src/agents/biz-*/`
- `apps/*/src/actions/biz-*/`
- `apps/app/src/app/(app)/biz-*/`
- `database/migrations/1XX+_biz*.sql`
- `specs/`

## Reference System

| Type | Pattern | Example |
|------|---------|---------|
| User Story | `US-{FEAT}-{NUM}` | US-AUTH-001 |
| Requirement | `REQ-{FEAT}-{NUM}` | REQ-AUTH-001 |
| Design Decision | `DES-{FEAT}-{NUM}` | DES-AUTH-001 |

## Workflow Phases

```
BRAINSTORMING  -->  SPECS         -->  PLAN.md       -->  CODE
Raw material       User Stories      Checklist with    Guided
from client        Requirements      references        implementation
                   Design Decs
```

### Plan States

| Symbol | State |
|--------|-------|
| `[ ]` | Pending |
| `[-]` | In Progress |
| `[x]` | Done |
| `[!]` | Blocked |

---

## UI Rule: Component-First

**shadcn is mandatory for UI elements. Native HTML is prohibited.**

| Element | Prohibited | Required |
|---------|------------|----------|
| Button | `<button>` | `<Button>` |
| Input | `<input>` | `<Input>` |
| Card | `<div className="border...">` | `<Card>` |

Layout uses `div` + Tailwind. UI uses shadcn components.

---

## Database

**Migrations numbering:**
- `0XX`: Motor (platform core structure)
- `1XX+`: Business entities

**Important**: Migrations in `database/main/migrations/` contain only generic motor structure. Business-specific tables should be defined in artifacts (`specs/`) and loaded via project seeds.

---

## Environment Configuration

**Hierarchy:**
1. `.env` - Base configuration
2. `.env.{environment}` - Environment overrides (development, staging, production)
3. `.env.secrets` - Sensitive data (gitignored, copy from `.env.secrets.example`)

**dotenv-cli:** Always use `-o` flag: `dotenv -o -e .env ...`

Without `-o`, system variables take precedence over `.env` files.

---

## Plans

Implementation plans are saved in `/plans/{plan-name}/PLAN.md`.

**Rules:**
- Folder name must clearly identify the plan
- Plan file must be named `PLAN.md`
- Folder may contain additional relevant resources
- Create or update plan before implementation

---

## Test Users

Predictable test user pattern:
- Email: `{role}@mail.com`
- Password: `12345678`

Example: `admin@mail.com` / `12345678`

---

## Playwright

- Tests must be created in `.tmp/playwright`
- Scan `.env` and `.env.development` files to discover routes before testing

---

## Mobile-first

Always design responsive pages.
This app must be 100% usable on mobile.

---

## Critical Rules

- **UTF-8 encoding always**
- **Temporary files only in `.tmp/`** — never create quick tests or temp files in project structure
- **Never use `kill`/`taskkill`** to terminate Node.js processes (use hot-reload)
- **Never change ports** — report if occupied
- **Never use destructive git commands on main** (`reset --hard`, `push --force`)
- **Diagnostic mode**: When asked to diagnose, only read and analyze - do NOT modify code
- **shadcn component-first** — use custom HTML only when strictly necessary
