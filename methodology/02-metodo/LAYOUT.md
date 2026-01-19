# Project Layout

Estrutura de diretorios padrao para projetos com desenvolvimento assistido por IA.

---

## Indice

1. [Arquivos na Raiz](#arquivos-na-raiz) - CLAUDE.md, PLAN.md, .env, docker-compose
2. [Diretorios de Fases](#diretorios-de-fases) - brainstorming, specs, apps
3. [Diretorios de Infraestrutura](#diretorios-de-infraestrutura) - database, workflows, scripts
4. [Diretorios de Assets](#diretorios-de-assets) - brand, refs, snippets
5. [Diretorios Especiais](#diretorios-especiais) - .tmp, data
6. [Resumo Visual](#resumo-visual) - Arvore completa

---

## Arquivos na Raiz

### CLAUDE.md

**Proposito**: Instrucao completa para a IA sobre o projeto.

Contem:
- Comandos de desenvolvimento
- Arquitetura do sistema
- Convencoes e regras criticas
- Variaveis de ambiente
- Troubleshooting comum

Este arquivo e o "cerebro" do contexto. Quanto mais completo, melhor a IA performa.

```markdown
# CLAUDE.md

## Desenvolvimento Local
## Comandos
## Arquitetura
## Regras Criticas
## Variaveis de Ambiente
## Troubleshooting
```

### PLAN.md (opcional)

**Proposito**: Plano de execucao da tarefa atual.

Usado quando ha uma implementacao complexa em andamento. Contem:
- Tarefas com checkbox `- [ ]` / `- [x]`
- Referencias a specs (US-AUTH-001, REQ-AUTH-001)
- Ordem de execucao

```markdown
# PLAN.md

## Objetivo
Implementar autenticacao multi-step

## Tarefas

### Fase 1: Setup
- [x] Configurar NextAuth - REQ-AUTH-001
- [ ] Criar tabelas de sessao - DES-AUTH-001

### Fase 2: Implementacao
- [ ] Tela de login - US-AUTH-001
- [ ] Fluxo OTP - US-AUTH-002
```

### Arquivos de Ambiente (.env*)

**Proposito**: Configuracao por ambiente.

```
.env                  # Base (commitado, valores padrao/dev)
.env.development      # Overrides para dev
.env.staging          # Overrides para staging
.env.production       # Overrides para producao
.env.secrets          # Valores sensiveis (NAO commitado)
.env.secrets.example  # Template para .env.secrets
```

**Ordem de carregamento**: Base → Ambiente → Secrets (ultimos sobrescrevem)

Ver [INFRAESTRUTURA.md](../03-arquitetura/INFRAESTRUTURA.md) para detalhes completos.

### Docker Compose Files

**Proposito**: Definicao de infraestrutura por ambiente.

```
docker-compose.yml          # Production (stack completa)
docker-compose.staging.yml  # Staging (servico exposto apenas)
docker-compose.dev.yml      # Development (infra apenas, app roda local)
```

### DEPLOY.md / DOCKER.md

**Proposito**: Documentacao de deploy.

- `DOCKER.md` - Padrao generico (pode ser reusado entre projetos)
- `DEPLOY.md` - Parametros especificos deste projeto

---

## Diretorios de Fases

### brainstorming/

**Fase**: Ideacao
**Proposito**: Material bruto da concepcao do projeto.

Contem:
- Notas de reunioes com cliente
- Briefings iniciais
- Analises exploratorias
- Planilhas e documentos do cliente
- Material de referencia recebido

```
brainstorming/
├── reuniao-01.txt           # Transcricao/notas de reuniao
├── BRIEFING.md              # Briefing estruturado
├── ANALISE-UX.md            # Analise exploratoria
├── material_cliente/        # Arquivos recebidos do cliente
│   ├── planilha.xlsx
│   └── apresentacao.pdf
└── ARQUITETURA.md           # Rascunho inicial de arquitetura
```

**Regra**: Este diretorio e de entrada. O conteudo aqui e transformado em specs formais.

---

### specs/

**Fase**: Especificacao
**Proposito**: Especificacoes formais e rastreaveis.

```
specs/
├── features/              # User Stories + Requirements + Design
│   ├── _template.md       # Template para novas features
│   ├── authentication.md  # US-AUTH-*, REQ-AUTH-*, DES-AUTH-*
│   ├── settings.md        # US-SETT-*, REQ-SETT-*
│   └── {feature}.md
│
├── refs/                  # Padroes para consultar ANTES de implementar
│   ├── _index.md          # Indice de referencias
│   ├── forms.md           # Como fazer formularios
│   ├── tables.md          # Como fazer tabelas
│   └── {padrao}.md
│
├── snippets/              # Decisoes registradas DEPOIS de implementar
│   ├── _index.md          # Indice de snippets
│   ├── password-input.md  # Como fizemos input de senha
│   └── {componente}.md
│
├── brand/                 # Identidade visual
│   ├── brand.json         # Configuracao de cores e fonte
│   ├── logotype.svg       # Logo principal
│   └── ...
│
└── research/              # Investigacoes tecnicas
    └── {topico}.md
```

#### Formato de Feature

```markdown
### US-AUTH-001: User Login

**Como** usuario,
**Quero** fazer login com email e senha,
**Para** acessar o sistema de forma segura.

**Criterios de Aceite:**
- [ ] Criterio 1
- [ ] Criterio 2

**Refs:** REQ-AUTH-001
**Impl:** DES-AUTH-001
```

---

### apps/

**Fase**: Implementacao
**Proposito**: Servicos deployaveis do sistema.

Estrutura de monorepo. Cada app e um servico independente com porta propria.

```
apps/
├── app/              # Next.js (frontend)
│   ├── src/
│   │   ├── app/      # App Router
│   │   ├── components/
│   │   └── lib/
│   ├── public/
│   └── package.json
│
├── socket/           # WebSocket server
│   ├── src/
│   └── package.json
│
├── backbone/         # Servicos gerais (notifications, scheduling)
│   ├── src/
│   └── package.json
│
├── agents/           # LangGraph + Fastify (IA)
│   ├── src/
│   │   ├── agents/   # Grafos LangGraph
│   │   └── prompts/  # Prompts em Markdown
│   └── package.json
│
├── actions/          # Mutations service
│   ├── src/
│   │   ├── actions/  # Definicoes de actions
│   │   └── routes/   # Endpoints REST
│   └── package.json
│
└── docs/             # Knowledge Base
    ├── src/
    └── package.json
```

**Nota**: Ver [MONOREPO.md](../03-arquitetura/MONOREPO.md) para detalhes da estrutura.

---

### packages/

**Proposito**: Codigo compartilhado entre apps.

```
packages/
└── types/            # Schemas Zod compartilhados
    ├── src/
    │   ├── index.ts  # Re-exports
    │   ├── schemas/
    │   │   ├── thread.ts
    │   │   ├── user.ts
    │   │   └── action.ts
    │   └── constants/
    │       └── states.ts
    └── package.json
```

**Regra**: Apps importam de packages. Packages nunca importam de apps.

```
packages/types  <--  apps/app
                <--  apps/agents
                <--  apps/actions
                <--  apps/socket
```

---

## Diretorios de Infraestrutura

### database/

**Proposito**: Schemas, migrations e seeds.

```
database/
├── migrations/              # SQL versionado
│   ├── 001_initial.sql
│   ├── 002_users.sql
│   ├── 003_threads.sql
│   └── ...
├── seeds/                   # Dados iniciais
│   ├── base.sql             # Dados de producao
│   └── dev.sql              # Dados de teste
├── init-db.sql              # Setup inicial PostgreSQL
└── schema.prisma            # Schema Prisma (se usar)
```

**Convencao**: Migrations numeradas sequencialmente (001_, 002_...).

**Regra**: Executar migration imediatamente apos criar.

---

### workflows/

**Proposito**: Automacoes versionadas (n8n, Zapier, etc).

```
workflows/
├── message-handler.json     # Processamento de mensagens
├── appointment-flow.json    # Fluxo de agendamento
├── reminder-scheduler.json  # Lembretes automaticos
└── health-check.json        # Health check do sistema
```

**Regra**: Workflows sao exportados como JSON e versionados no git.

**Importante**: Workflows n8n sao automacoes do **usuario final**, nao do sistema. Logica de sistema vai em codigo (agents, backbone).

---

### scripts/

**Proposito**: Automacao e utilitarios de desenvolvimento.

```
scripts/
├── db-migrate.mjs           # Executor de migrations
├── db-seed.mjs              # Executor de seeds
├── db-reset.mjs             # Reset completo (dev only)
├── init-n8n.mjs             # Inicializacao do n8n
├── init-evolution.mjs       # Inicializacao do Evolution
├── backup.sh                # Script de backup
└── test-*.mjs               # Scripts de teste
```

---

## Diretorios de Assets

### brand/

**Proposito**: Identidade visual com sistema de 4 cores e temas (light/dark/system).

```
brand/
├── brand.json               # Configuracao: cores, nome, temas
├── brand.svg                # FONTE: projeto editavel (nao usado diretamente)
├── logotype.svg             # Logo horizontal para headers
├── logotype-dark.svg        # Versao para dark mode
├── icon-16.svg              # Favicon 16x16
├── icon-32.svg              # Favicon 32x32
├── icon-64.svg              # Favicon 64x64
├── icon-128.svg             # Icone grande
├── icon-192.svg             # PWA Android
├── icon-512.svg             # PWA splash
└── favicon.ico              # Favicon compilado
```

**Sistema de cores:** primary, secondary, tertiary, accent + background, surface, text, textMuted.

Ver [BRAND.md](../04-frontend/BRAND.md) para documentacao completa.

---

### refs/

**Proposito**: Padroes para consultar ANTES de implementar.

Localizacao: `specs/refs/`

```
specs/refs/
├── _index.md                # Indice de todas as referencias
├── forms.md                 # Padrao de formularios
├── tables.md                # Padrao de tabelas
├── modals.md                # Padrao de modais
├── toasts.md                # Padrao de notificacoes
└── {padrao}.md              # Outros padroes
```

**Uso**: IA consulta refs/ ANTES de implementar qualquer componente para manter consistencia.

---

### snippets/

**Proposito**: Decisoes de projeto registradas DEPOIS de implementar.

Localizacao: `specs/snippets/`

```
specs/snippets/
├── _index.md                # Indice de todos os snippets
├── password-input.md        # Como implementamos input de senha
├── segmented-control.md     # Como implementamos controle segmentado
└── {componente}.md          # Outras decisoes
```

**Formato de cada snippet**:

```markdown
# Nome do Padrao

**Name**: identificador-unico
**Tags**: palavras, chave, para, deteccao

## Quando usar
## Quando NAO usar
## Visual
## Codigo de exemplo
## Props/API
```

**Uso**: IA cria snippet quando toma decisao reutilizavel para manter memoria do projeto.

---

### docs/

**Proposito**: Documentacao tecnica gerada/detalhada.

```
docs/
├── docker-architecture.md   # Arquitetura Docker detalhada
├── performance.md           # Documentacao de performance
├── security.md              # Praticas de seguranca
└── workflows.md             # Documentacao de workflows
```

**Diferenca de specs/**: Specs sao requisitos/design (antes). Docs sao documentacao tecnica (depois).

---

## Diretorios Especiais

### .tmp/

**Proposito**: Arquivos temporarios de desenvolvimento.

- Gitignored
- Seguro para experimentos
- Scripts de investigacao
- Outputs de debug

```
.tmp/
├── test-output.json         # Resultado de testes
├── debug.log                # Logs de debug
└── scratch.ts               # Codigo experimental
```

**Regra**: NUNCA criar arquivos temporarios fora de `.tmp/`.

---

### data/

**Proposito**: Dados persistentes de containers Docker.

- Gitignored
- Volumes bind-mounted
- Backup separado (rsync/restic)

```
data/
├── postgres/                # Volume PostgreSQL
├── redis/                   # Volume Redis
├── mongodb/                 # Volume MongoDB
├── meilisearch/             # Volume Meilisearch
├── n8n/                     # Volume n8n
└── evolution/               # Volume Evolution
```

**Regra**: Nunca commitar. Fazer backup via scripts.

---

## Resumo Visual

```
projeto/
│
├── [RAIZ]
│   ├── CLAUDE.md            # Contexto para IA
│   ├── PLAN.md              # Plano atual
│   ├── .env*                # Configuracoes
│   └── docker-compose*.yml  # Deploy
│
├── [FASES]
│   ├── brainstorming/       # 1. Ideacao
│   ├── specs/               # 2. Especificacao
│   │   ├── features/        #    US + REQ + DES
│   │   ├── refs/            #    Consultar ANTES
│   │   ├── snippets/        #    Registrar DEPOIS
│   │   ├── brand/           #    Identidade visual
│   │   └── research/        #    Investigacoes
│   │
│   └── apps/                # 3. Implementacao (monorepo)
│       ├── app/             #    Frontend
│       ├── socket/          #    WebSocket
│       ├── backbone/        #    Servicos gerais
│       ├── agents/          #    IA (LangGraph)
│       ├── actions/         #    Mutations
│       └── docs/            #    Knowledge Base
│
├── [PACKAGES]
│   └── packages/
│       └── types/           # Schemas compartilhados
│
├── [INFRAESTRUTURA]
│   ├── database/            # Schemas/Migrations
│   ├── workflows/           # Automacoes n8n
│   └── scripts/             # Utilitarios
│
├── [OUTPUT]
│   └── docs/                # Documentacao gerada
│
└── [IGNORADOS]
    ├── .tmp/                # Temporarios
    └── data/                # Dados Docker
```

---

## Checklist - Novo Projeto

### Estrutura Base

- [ ] CLAUDE.md criado com comandos e regras
- [ ] .env e .env.{environment} configurados
- [ ] .env.secrets.example criado
- [ ] docker-compose*.yml (dev, staging, prod)
- [ ] .gitignore com .tmp/, data/, .env.secrets

### Diretorios de Fases

- [ ] brainstorming/ com material inicial
- [ ] specs/features/ com template
- [ ] specs/refs/ com padroes base
- [ ] specs/snippets/ com _index.md
- [ ] specs/brand/ com brand.json

### Monorepo

- [ ] workspaces configurado no package.json raiz
- [ ] package.json raiz com scripts
- [ ] apps/ com estrutura inicial
- [ ] packages/types/ com schemas base

### Infraestrutura

- [ ] database/migrations/ com 001_initial.sql
- [ ] scripts/ com db-migrate.mjs

---

## Referencias

- [MONOREPO.md](../03-arquitetura/MONOREPO.md) - Estrutura de monorepo
- [INFRAESTRUTURA.md](../03-arquitetura/INFRAESTRUTURA.md) - Variaveis e Docker
- [ARTEFATOS.md](./ARTEFATOS.md) - Features, Refs, Snippets
- [BRAND.md](../04-frontend/BRAND.md) - Sistema de identidade visual
