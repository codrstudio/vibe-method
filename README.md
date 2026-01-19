# Vibe Method

A methodology for **AI-assisted development** with **context engineering**.

> **Code is infrastructure, not product.** Code creates capability; behavior comes from artifacts it consumes.

---

## Philosophy

The Vibe Method inverts the traditional relationship between code and business logic:

```
SYSTEM <-> motor <-> ARTIFACT <-> tool <-> BUSINESS
```

| Component | Role | Stability |
|-----------|------|-----------|
| **Motor** | Code that reads, validates, executes | Stable |
| **Artifact** | Declarative behavior definition | Evolves |
| **Tool** | Produces valid artifacts | Replaceable |

### 10 Fundamental Principles

1. **Code is infrastructure, not product** - Code creates capability; behavior comes from what it consumes
2. **Business decisions don't belong in code** - Every decision that defines behavior must exist as an artifact
3. **Artifacts are the source of truth** - Want to understand the system? Read the artifacts
4. **Tools exist to generate artifacts** - Tools don't enter the system; they produce what enters
5. **Distinct roles, single project** - Problem experts define solutions; system experts design tools
6. **Technical work creates means, not ends** - Ask "what tool allows this requirement to become an artifact?"
7. **Change is editing, not rewriting** - Evolution happens by modifying versioned artifacts
8. **Less code, more clarity** - Lean code consuming declarative artifacts is more testable and safer
9. **Artifacts are reformulable** - Can be analyzed, compared, migrated by humans or AI
10. **System emerges from combination** - Motor + Artifacts = Working system

---

## Workflow

```
BRAINSTORMING  -->  SPECS         -->  PLAN.md       -->  CODE
Raw material       User Stories      Checklist with    Guided
from client        Requirements      references        implementation
                   Design Decs
```

### Reference System

| Type | Pattern | Example |
|------|---------|---------|
| User Story | `US-{FEAT}-{NUM}` | US-AUTH-001 |
| Requirement | `REQ-{FEAT}-{NUM}` | REQ-AUTH-001 |
| Design Decision | `DES-{FEAT}-{NUM}` | DES-AUTH-001 |

---

## Project Structure

```
project/
├── CLAUDE.md              # AI instructions
├── PLAN.md                # Current execution plan
├── .env*                  # Environment configs
├── docker-compose*.yml    # Infrastructure
│
├── brainstorming/         # Raw input material
│
├── specs/                 # Context Engineering
│   ├── features/          # US + REQ + DES by domain
│   ├── refs/              # Consult BEFORE implementing
│   ├── snippets/          # Project decisions (AFTER)
│   ├── brand/             # Visual identity
│   └── messages/          # Message templates
│
├── apps/                  # Deployable services
│   ├── app/               # Frontend (Next.js)
│   ├── socket/            # WebSocket (Socket.io)
│   └── backbone/          # Backend hub (Fastify)
│
├── packages/              # Shared code
├── database/              # Schemas & migrations
├── plans/                 # Implementation plans
├── workflows/             # Automations (n8n)
└── scripts/               # Utilities
```

---

## Documentation

| Chapter | Content |
|---------|---------|
| **01-filosofia/** | Core principles & mindset |
| **02-metodo/** | Workflow phases & artifacts |
| **03-arquitetura/** | Monorepo & infrastructure |
| **04-frontend/** | Next.js & design system |
| **05-backend/** | Backbone hub & real-time |
| **06-ia/** | Agents, actions, copilot |
| **07-seguranca/** | Auth & permissions |

---

## Technology Stack

### Frontend (`apps/app`)

- **Next.js 16+** with App Router
- **React 19+**
- **Tailwind CSS 4**
- **shadcn/ui** (mandatory for UI components)
- **TanStack React Query 5+**
- **Zustand** (state management)
- **Serwist** (PWA support)

### Backend (`apps/backbone`)

- **Fastify 5+**
- **LangGraph** (AI agents)
- **PostgreSQL** + **Redis**
- **Zod** (validation)

### Real-time (`apps/socket`)

- **Socket.io 4.7+**
- **Redis adapter** (scalability)
- **JWT authentication**

### DevOps

- **Docker** & **Docker Compose**
- **npm workspaces** (monorepo)
- **dotenv-cli** (environment management)

---

## Quick Start

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- npm 10+

### Installation

```bash
# Clone the repository
git clone https://github.com/codr-studio/vibe-method.git
cd vibe-method

# Install dependencies
npm install

# Start infrastructure
npm run docker:up

# Run migrations
npm run migrate:main
npm run migrate:analytics

# Start development
npm run dev
```

### Available Commands

```bash
# Development
npm run dev                    # All apps concurrently
npm run dev -w @workspace/app  # Frontend only

# Infrastructure
npm run docker:up              # Start containers
npm run docker:down            # Stop containers

# Database
npm run migrate:main           # Main database
npm run migrate:analytics      # Analytics database

# Build
npm run build                  # Build all workspaces
```

---

## Service Ports

| Service | Port |
|---------|------|
| Frontend (Next.js) | XX00 |
| WebSocket | XX01 |
| Backbone (Fastify) | XX02 |

> XX = project prefix (e.g., 22 = 2200, 2201, 2202)

---

## Contributing

### Code Standards

- **UTF-8 encoding** mandatory
- **shadcn/ui component-first**: Native HTML prohibited for UI
- **Mobile-first**: 100% usable on mobile

### Development Rules

- Temporary files only in `.tmp/` directory
- Never change ports (report if occupied)
- Use `dotenv -o -e .env` flag

### Git Rules

- No destructive commands on main
- No force pushes to main/master

---

## Key Concepts

### Refs vs Snippets

| Type | When | Purpose |
|------|------|---------|
| **Refs** | BEFORE implementing | External patterns to follow |
| **Snippets** | AFTER implementing | Project decisions to remember |

### The Toolmaker Mindset

The Vibe Method practitioner thinks differently:

- Not "how do I code this rule?" → "how does this rule become an artifact?"
- Not "how do I solve this requirement?" → "what tool allows business to produce this alone?"
- Not "how does the system process this?" → "what motor allows the system to consume this?"

---

## License

This project is licensed under the **Creative Commons Attribution-ShareAlike 4.0 International (CC BY-SA 4.0)**.

See the [LICENSE](LICENSE) file for details.

---

## Acknowledgments

Developed by [Codr Studio](https://codr.studio) as part of a methodology for AI-assisted software development.

---

<p align="center">
  <strong>Motor + Artifacts = Working System</strong>
</p>
