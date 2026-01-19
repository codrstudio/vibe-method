# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Repository Purpose

This is the **Vibe Method** documentation repository - a methodology for AI-assisted development with context engineering. It contains:

1. **Documentation** (`01-filosofia/` through `07-seguranca/`) - Methodology guides
2. **Scaffold** (`scaffold/`) - Template for new projects following this methodology

## Core Philosophy

**Code is infrastructure, not product.** Code creates capability; behavior comes from artifacts it consumes.

```
SYSTEM <-> motor <-> ARTIFACT <-> tool <-> BUSINESS
```

- **Motor**: Code that reads, validates, executes (stable)
- **Artifact**: Declarative behavior definition (changes frequently)
- **Tool**: Produces valid artifacts

## Documentation Structure

| Folder | Content |
|--------|---------|
| `01-filosofia/` | Principles, mindset, workflows |
| `02-metodo/` | Workflow phases, artifacts, layout |
| `03-arquitetura/` | Monorepo, infrastructure |
| `04-frontend/` | Next.js, routing, brand |
| `05-backend/` | Backbone hub, real-time |
| `06-ia/` | Agents, actions, copilot, OpenRouter |
| `07-seguranca/` | Auth and permissions |

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

### Refs vs Snippets

- **Refs** (`specs/refs/`): Consult BEFORE implementing - external patterns
- **Snippets** (`specs/snippets/`): Register AFTER implementing - project decisions

---

## Scaffold Template

The `scaffold/` directory contains a starter template. For scaffold-specific rules, see `scaffold/CLAUDE.md`.

### Scaffold Commands

```bash
cd scaffold
npm install
npm run dev              # All apps via concurrently
npm run dev:app          # Next.js only
npm run docker:up        # Start infrastructure
```

### UI Rule: Component-First

**shadcn is mandatory for UI elements. Native HTML is prohibited.**

| Element | Prohibited | Required |
|---------|------------|----------|
| Button | `<button>` | `<Button>` |
| Input | `<input>` | `<Input>` |
| Card | `<div className="border...">` | `<Card>` |

Layout uses `div` + Tailwind. UI uses shadcn components.

---

## Database Commands

```bash
npm run migrate:main       # Roda migrations + seeds no banco principal
npm run migrate:analytics  # Roda migrations no banco analytics
```

**Importante**: As migrations em `database/main/migrations/` devem conter apenas estrutura genérica do motor. Tabelas e regras específicas de negócio devem ser definidas em artefatos (`specs/`) e carregadas via seeds do projeto.

---

## dotenv-cli

Sempre usar flag `-o`: `dotenv -o -e .env ...`

Sem `-o`, variáveis do sistema têm prioridade sobre os arquivos `.env`.

---

## Mobile-first

Sempre planeja as paginas responsivas.
Este app deve ser 100% utilizável no mobile.

--

## Plans

Planos de implementação devem ser salvos e mantidos atualizados para referência.
Estrutura:

/plans/{nome do plano}/PLAN.md

**Regras**:

- O nome da pasta deve claramente identificar o plano.
- O nome do plano deve ser obrigatoriamente PLAN.md.
- A pasta pode conter recursos adicionais relevantes para o plano.

Antes da implementação o plano deve ser criado ou atualizado, se ja existir um para mesma finalidade.

---

## Usuarios de teste

Usamos um modelo previsivel de usuarios de teste:
- {role}@mail.com
- Senha: 12345678

Por exemplo:
- admin@mail.com
- 12345678

---

## Critical Rules

- **UTF-8 encoding always**
- **Temporary files only in `.tmp/` — jamais crie testes rápidos e arquivos temporários na estrutura do projeto**
- **Testes de playwright devem ser feitos em .tmp\playwright**
- **Never use `kill`/`taskkill` to terminate Node.js processes**
- **Never change ports** - report if occupied
- **Never use destructive git commands on main** (`reset --hard`, `push --force`)
- **Diagnostic mode**: When asked to diagnose, only read and analyze - do NOT modify code
- **Lembre-se: a interface é shadcn component first — use HTML customizado apenas quando estritamente necessário.**

## Available Skills

| Skill | Trigger Keywords |
|-------|------------------|
| | |