# Vibe Method

Metodologia de desenvolvimento assistido por IA com context engineering.

---

## Filosofia Central

**Codigo e infraestrutura, nao produto.** O codigo cria capacidade. O comportamento vem dos artefatos que ele consome.

```
SISTEMA <-> motor <-> ARTEFATO <-> ferramenta <-> NEGOCIO
```

| Conceito | Descricao |
|----------|-----------|
| **Motor** | Codigo que le, valida e executa |
| **Artefato** | Definicao declarativa de comportamento |
| **Ferramenta** | Produz artefatos validos |

---

## Estrutura da Documentacao

| Pasta | Conteudo |
|-------|----------|
| [01-filosofia](./01-filosofia/) | Principios e mentalidade |
| [02-metodo](./02-metodo/) | Fluxo de trabalho e artefatos |
| [03-arquitetura](./03-arquitetura/) | Monorepo e infraestrutura |
| [04-frontend](./04-frontend/) | Next.js e design system |
| [05-backend](./05-backend/) | Backbone hub e real-time |
| [06-ia](./06-ia/) | Agentes, actions e copilot |
| [07-seguranca](./07-seguranca/) | Autenticacao e permissoes |

---

## Fluxo Principal

```
BRAINSTORMING  -->  SPECS         -->  PLAN.md       -->  CODIGO
Material bruto     User Stories      Checklist com     Implementacao
do cliente         Requirements      referencias       guiada
                   Design Decs
```

### Fases

1. **Brainstorming → Specs** - Extrair specs rastreaveis de material bruto
2. **Specs → Plan** - Criar checklist referenciando specs
3. **Plan → Codigo** - Implementar seguindo o plano

---

## Sistema de Referencias

| Tipo | Padrao | Exemplo |
|------|--------|---------|
| User Story | `US-{FEAT}-{NUM}` | US-AUTH-001 |
| Requirement | `REQ-{FEAT}-{NUM}` | REQ-AUTH-001 |
| Design Decision | `DES-{FEAT}-{NUM}` | DES-AUTH-001 |

---

## Estrutura de Projeto

```
projeto/
├── CLAUDE.md              # Instrucoes para IA
├── PLAN.md                # Plano de execucao atual
├── .env*                  # Configuracoes de ambiente
│
├── brainstorming/         # Material bruto (entrada)
│
├── specs/                 # Context Engineering
│   ├── features/          # US + REQ + DES por feature
│   ├── refs/              # Consultar ANTES de implementar
│   ├── snippets/          # Memoria do projeto (decisoes)
│   └── brand/             # Identidade visual
│
├── apps/                  # Servicos (monorepo)
│   ├── app/               # Frontend (Next.js)
│   ├── socket/            # WebSocket server
│   └── backbone/          # Hub de servicos backend
│       ├── services/      # Notifications, scheduling, billing
│       ├── agents/        # Agentes IA (LangGraph)
│       ├── actions/       # Catalogo de mutations
│       └── knowledge/     # Knowledge Base
│
├── packages/              # Codigo compartilhado
└── database/              # Schemas e migrations
```

---

## Regras de Ouro

1. **Artefato e verdade** - Quer entender? Leia artefatos. Quer mudar? Mude artefatos.
2. **Codigo e motor** - Codigo consome artefatos, nao carrega regras de negocio.
3. **Contexto e rei** - IA precisa de contexto estruturado para decisoes corretas.
4. **Rastreabilidade** - Tudo referenciavel por ID.
5. **Ferramenteiro** - Entregar motor e ferramenta, nao resolver o negocio diretamente.

---

## Quick Start

```bash
# 1. Criar specs da feature
/vibe-feature AUTH

# 2. Consultar referencias antes de implementar
/vibe-refs autenticacao

# 3. Criar plano de execucao
/vibe-plan

# 4. Executar plano
/execute-plan
```
