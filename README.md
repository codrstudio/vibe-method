# CRAFT - Code-Ready AI Framework Template

Metodologia para desenvolvimento de software 100% assistido por IA.

## O que é

**CRAFT** define estrutura, padrões e instruções que permitem à IA ser produtiva em qualquer projeto de software. Não é específico de domínio - funciona para qualquer tipo de aplicação.

## Princípios

1. **Contexto é Rei** - A IA precisa de contexto estruturado para tomar boas decisões
2. **Rastreabilidade** - Tudo é referenciável por ID (US001, REQ014, DES030)
3. **Documentação como Código** - Specs, prompts e padrões são versionados junto com o código
4. **Separação de Fases** - Cada fase do projeto tem seu lugar definido

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

**Fase 1: Brainstorming → Specs** - Extrair specs rastreáveis. Ver [SPECS-FORMAT.md](./SPECS-FORMAT.md).

**Fase 2: Specs → PLAN.md** - Criar checklist com referências. Ver [PLAN-FORMAT.md](./PLAN-FORMAT.md).

## Documentos do Método

| Documento | Descrição |
|-----------|-----------|
| [PROJECT-LAYOUT.md](./PROJECT-LAYOUT.md) | Estrutura de diretórios e propósito de cada pasta |
| [SPECS-FORMAT.md](./SPECS-FORMAT.md) | Formato de User Stories e Requirements |
| [DESIGN-DOCS.md](./DESIGN-DOCS.md) | Vocabulário conceitual por área (design-*.md) |
| [PLAN-FORMAT.md](./PLAN-FORMAT.md) | Formato do checklist de execução |
| [REFS-SNIPPETS.md](./REFS-SNIPPETS.md) | Sistema de conhecimento (refs + snippets) |
| [AI-INSTRUCTIONS.md](./AI-INSTRUCTIONS.md) | Formato do CLAUDE.md e instruções para IA |
| [BRAND-SYSTEM.md](./BRAND-SYSTEM.md) | Sistema de branding com temas e 4 cores |
| [USER-AREA.md](./USER-AREA.md) | Sistema de usuario: login multi-etapas, avatar, seguranca |
| [ENV-PATTERN.md](./ENV-PATTERN.md) | Padrão de variáveis de ambiente (3 níveis) |
| [DEPLOY-PATTERN.md](./DEPLOY-PATTERN.md) | Padrão de deploy com Docker + Coolify |

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
│
├── brainstorming/         # Fase 1: Ideação
├── specs/                 # Fase 2: Especificação
├── prompts/               # Fase 3: Instruções LLM
├── app/                   # Fase 4: Implementação
├── database/              # Schemas e migrations
├── workflows/             # Automações (n8n, etc)
├── scripts/               # Utilitários e automação
│
├── brand/                 # Assets visuais
├── refs/                  # Referências de pesquisa (entrada)
├── snippets/              # Aprendizado da IA (saída)
└── docs/                  # Documentação gerada
```

Ver [PROJECT-LAYOUT.md](./PROJECT-LAYOUT.md) para detalhes de cada diretório.
