# Análise: Módulos da Plataforma vs Caso de Uso

Data: 2026-01-19

## Contexto

Mapeamento de módulos da plataforma (motor) vs o que o caso de uso Report Humanization consome.

---

## Módulos da Plataforma (MOTOR)

| Módulo | Localização | O que oferece |
|--------|-------------|---------------|
| **Frontend** | `apps/app/` | Next.js, shadcn, layouts, rotas protegidas |
| **Agents** | `apps/backbone/agents/` | Infraestrutura LangGraph, execução de grafos |
| **Actions** | `apps/backbone/actions/` | Catálogo de mutations, fila de operações |
| **Services** | `apps/backbone/services/` | Notifications, scheduling, billing |
| **Pulse** | `apps/backbone/pulse/` | Observabilidade: probes, métricas, alertas |
| **LLM** | `apps/backbone/llm/` | Camada de abstração LLM (Ollama local + OpenRouter) - **pending** |
| **Socket** | `apps/sockets/` | Real-time, eventos, presence |
| **Types** | `packages/types/` | Schemas Zod compartilhados |
| **Database** | `database/` | Pool, migrations, queries |
| **Auth** | (no app) | NextAuth, JWT, roles |

---

## O que o Caso de Uso CONSOME

### Report Humanization precisa de:

| Necessidade | Módulo da Plataforma | Artefato a Criar |
|-------------|---------------------|------------------|
| Dois agentes IA | `backbone/agents/` | `prompts/writer.md`, `prompts/reviewer.md` |
| Chamadas LLM | `backbone/llm/` | config de models (Ollama/OpenRouter) |
| Envio WhatsApp/Email | `backbone/services/notifications` | config de canais |
| Fila de aprovação humana | `backbone/actions/` | action `report.review` |
| Scheduling (horários) | `backbone/services/scheduling` | regras de horário |
| Geração PDF | (lib adicional) | template HTML |
| Dashboard revisor | `apps/app/` | rotas em `(app)/review/` |
| Métricas de qualidade | `backbone/pulse/` | métricas de negócio (taxa aprovação, tempo) |
| Alertas de falha | `backbone/pulse/alerts` | alertas de negócio (rejeições, timeout) |
| Detecção padrões | `backbone/agents/` | `prompts/pattern-detector.md` |

### O que NÃO é da plataforma (externo):
- PrimeCare (fonte de dados do cliente)

---

## Layout de Diretórios Proposto

Para que a IA saiba onde construir cada coisa:

```
projeto/
│
├── [ARTEFATOS DECLARATIVOS] ────────────────────────
│
├── specs/
│   ├── entities/                 # Define entidades de negócio
│   │   ├── _schema.ts            # Interface EntitySpec
│   │   ├── report.yaml           # ← Relatório (business)
│   │   ├── assistido.yaml        # ← Paciente (business)
│   │   └── pattern-alert.yaml    # ← Alerta (business)
│   │
│   ├── permissions/              # Define RBAC
│   │   └── roles.yaml            # ← Quem pode revisar (business)
│   │
│   ├── workflows/                # Define fluxos
│   │   └── report-flow.yaml      # ← 9 etapas (business)
│   │
│   └── features/                 # US + REQ + DES
│       └── report-humanization.md
│
├── prompts/                      # Define comportamento de IA
│   ├── agents/
│   │   ├── writer.md             # ← Prompt do gerador
│   │   ├── reviewer.md           # ← Prompt do validador
│   │   └── pattern-detector.md   # ← Prompt do detector
│   └── templates/
│       └── tone-*.md             # ← Templates de tom
│
├── database/
│   └── migrations/
│       └── 010_reports.sql       # ← Schema de negócio
│
│
├── [MOTOR - NÃO MODIFICA] ──────────────────────────
│
├── apps/
│   ├── app/                      # Next.js (motor)
│   │   └── src/
│   │       ├── lib/              # Auth, DB, utils (motor)
│   │       ├── components/ui/    # shadcn (motor)
│   │       └── app/
│   │           ├── (auth)/       # Login (motor)
│   │           └── (app)/        # ← Rotas de negócio vão aqui
│   │               └── review/   # ← Gerado pela IA
│   │
│   ├── backbone/
│   │   └── src/
│   │       ├── index.ts          # Fastify server (motor)
│   │       ├── lib/              # DB, cache (motor)
│   │       ├── services/         # Notifications, scheduling (motor)
│   │       ├── agents/           # ← Grafos de negócio vão aqui
│   │       │   ├── _runner.ts    # Executor (motor)
│   │       │   └── report/       # ← Gerado pela IA
│   │       └── actions/          # ← Actions de negócio vão aqui
│   │           ├── _registry.ts  # Registry (motor)
│   │           └── report/       # ← Gerado pela IA
│   │
│   └── sockets/                  # (motor)
│
└── packages/
    └── types/
        └── src/
            ├── index.ts          # Re-exports (motor)
            └── schemas/
                └── report.ts     # ← Gerado a partir de specs/entities/
```

---

## Regra de Ouro

| Tipo | Onde fica | Quem cria |
|------|-----------|-----------|
| **Entidade** | `specs/entities/*.yaml` | Humano/IA define |
| **Schema Zod** | `packages/types/schemas/*.ts` | IA gera de entities |
| **Migration** | `database/migrations/*.sql` | IA gera de entities |
| **Prompt** | `prompts/agents/*.md` | Humano define |
| **Grafo LangGraph** | `apps/backbone/agents/{nome}/` | IA gera de prompt |
| **Action** | `apps/backbone/actions/{nome}/` | IA gera de workflow |
| **Rota API** | `apps/app/src/app/api/{nome}/` | IA gera de entities |
| **Página UI** | `apps/app/src/app/(app)/{nome}/` | IA gera de features |

---

## Fluxo de Geração

```
1. Humano define specs/entities/report.yaml
   ↓
2. IA gera packages/types/schemas/report.ts
   IA gera database/migrations/010_reports.sql
   IA gera apps/app/src/app/api/reports/route.ts
   ↓
3. Humano define prompts/agents/writer.md
   ↓
4. IA gera apps/backbone/agents/writer/graph.ts
   ↓
5. Humano define specs/workflows/report-flow.yaml
   ↓
6. IA gera apps/backbone/actions/report/process.ts
```

---

## Próximos Passos

- [ ] Definir schema formal para `specs/entities/*.yaml`
- [ ] Definir schema formal para `specs/workflows/*.yaml`
- [ ] Criar skill de IA para gerar código a partir de specs
- [ ] Documentar convenções de nomenclatura
