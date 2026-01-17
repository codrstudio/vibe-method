# Vibe Method

**Vibe-first Incremental Blueprint Engineering**

Context engineering para vibe coding progressivo.

---

## Fundamentos

O Vibe Method é construído sobre dois pilares filosóficos:

| Documento | Função |
|-----------|--------|
| [MANIFESTO](./MANIFESTO.md) | Cria o imaginário — o que acreditamos |
| [MINDSET](./MINDSET.md) | Ensina a pensar — como raciocinamos |

**Do Manifesto:** O sistema é o que ele consome. Código é infraestrutura. Artefato é o ponto de verdade.

**Do Mindset:** O artefato é o contrato entre sistema e negócio. O ferramenteiro entrega motor (para o sistema) e ferramenta (para o negócio).

---

## O que é

**Vibe Method** é uma metodologia que estrutura contexto para IA de forma incremental, permitindo desenvolvimento fluido (vibe coding) em qualquer projeto de software.

| Pilar | Significado |
|-------|-------------|
| **Vibe-first** | Desenvolvimento fluido assistido por IA, sem fricção |
| **Incremental** | Fases progressivas: brainstorm → specs → plan → código |
| **Blueprint** | Context engineering: specs, instruções e estrutura rastreáveis |
| **Engineering** | Documentação como código, versionada junto com o projeto |

## Princípios

Do **Manifesto** e do **Mindset**, derivamos os princípios práticos:

1. **Artefato é Verdade** - Quer entender o sistema? Leia os artefatos. Quer mudar? Mude os artefatos.
2. **Código é Motor** - Código consome artefatos, não carrega regras de negócio.
3. **Contexto é Rei** - A IA precisa de contexto estruturado para tomar boas decisões.
4. **Rastreabilidade** - Tudo é referenciável por ID (US-AUTH-001, REQ-AUTH-001, DES-AUTH-001).
5. **Ferramenteiro** - Entregar motor e ferramenta, não resolver o negócio diretamente.

## Fluxo Principal

```
┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐      ┌─────────────────┐
│  BRAINSTORMING  │ ───► │      SPECS      │ ───► │     PLAN.md     │ ───► │  IMPLEMENTAÇÃO  │
│                 │      │                 │      │                 │      │                 │
│  Material bruto │      │  User Stories   │      │  Checklist com  │      │  Código guiado  │
│  do cliente     │      │  Requirements   │      │  referências    │      │  por specs      │
│                 │      │  Design Decs    │      │                 │      │                 │
└─────────────────┘      └─────────────────┘      └─────────────────┘      └─────────────────┘
```

**Fase 1: Brainstorming → Specs** - Extrair specs rastreáveis. Ver [FEATURES.md](./FEATURES.md).

**Fase 2: Specs → PLAN.md** - Criar checklist com referências. Ver [PLAN.md](./PLAN.md).

## Documentos do Método

| Documento | Descrição |
|-----------|-----------|
| [LAYOUT.md](./LAYOUT.md) | Estrutura de diretórios e propósito de cada pasta |
| [FEATURES.md](./FEATURES.md) | Formato de Features (US + REQ + DES) |
| [PLAN.md](./PLAN.md) | Formato do checklist de execução |
| [REFS.md](./REFS.md) | Sistema de referências (entrada - consultar antes) |
| [SNIPPETS.md](./SNIPPETS.md) | Sistema de snippets (saída - memória do projeto) |
| [INSTRUCTIONS.md](./INSTRUCTIONS.md) | Formato do CLAUDE.md e instruções para IA |
| [BRAND.md](./BRAND.md) | Sistema de branding com temas e 4 cores |
| [USER.md](./USER.md) | Sistema de usuario: login multi-etapas, avatar, seguranca |
| [PERMISSIONS.md](./PERMISSIONS.md) | Controle de acesso RBAC e protecao de rotas |
| [ENV.md](./ENV.md) | Padrão de variáveis de ambiente (3 níveis) |
| [DOCKER.md](./DOCKER.md) | Padrão de deploy com Docker Compose |
| [MONOREPO.md](./MONOREPO.md) | Estrutura apps/packages com pnpm workspaces |
| [NEXTJS.md](./NEXTJS.md) | Stack Next.js: PWA, SEO, data fetching |
| [ROUTING.md](./ROUTING.md) | Roteamento URL-first: estrutura, filtros, modais |
| [ACTIONS.md](./ACTIONS.md) | Catálogo de mutations para agentes IA |
| [AGENTS.md](./AGENTS.md) | Orquestracao de agentes com LangGraph |
| [KB.md](./KB.md) | Knowledge Base: documentacao com retrieval inteligente |
| [BACKBONE.md](./BACKBONE.md) | Barramento de retaguarda para servicos gerais |
| [SOCKET.md](./SOCKET.md) | Comunicacao bidirecional em tempo real |

## Quick Start

```bash
# 1. Copiar scaffold para novo projeto
cp -r method/scaffold/ /path/to/new-project/

# 2. Personalizar CLAUDE.md com contexto do projeto
# 3. Iniciar fase de brainstorming
# 4. Seguir fluxo de fases documentado
```

## Estrutura Base

```
projeto/
├── CLAUDE.md              # Instruções para IA (contexto completo)
├── PLAN.md                # Plano de execução atual (opcional)
├── .env                   # Config base (commitado)
├── .env.{environment}     # Sobrescritas por ambiente (commitado)
├── .env.secrets           # Secrets externos (NÃO commitado)
├── docker-compose*.yml    # Deploy configs (dev, staging, prod)
├── pnpm-workspace.yaml    # Config de workspaces
│
├── brainstorming/         # Material bruto (entrada)
│
├── specs/                 # Context Engineering
│   ├── features/          # Conceitos: US + REQ + DES
│   ├── refs/              # Referências: consultar ANTES de implementar
│   ├── snippets/          # Memória: decisões tomadas no projeto
│   ├── brand/             # Identidade: assets visuais
│   └── research/          # Pesquisa: investigações técnicas
│
├── apps/                  # Serviços (monorepo)
│   ├── app/               # Frontend (Next.js)
│   ├── sockets/           # WebSocket
│   ├── backbone/          # Servicos gerais (notifications, scheduling)
│   ├── agents/            # IA (LangGraph) - inclui prompts/
│   └── actions/           # Mutations service
│
├── packages/              # Código compartilhado
│   └── types/             # Schemas Zod
│
├── database/              # Schemas e migrations
├── workflows/             # Automações (n8n, etc)
└── scripts/               # Utilitários e automação
```

Ver [LAYOUT.md](./LAYOUT.md) para detalhes de cada diretório.
Ver [MONOREPO.md](./MONOREPO.md) para estrutura de workspaces.
Ver [AGENTS.md](./AGENTS.md) para camada de agentes.
