# Project Layout

Estrutura de diretórios padrão para projetos com desenvolvimento assistido por IA.

---

## Arquivos na Raiz

### CLAUDE.md

**Propósito**: Instrução completa para a IA sobre o projeto.

Contém:
- Comandos de desenvolvimento
- Arquitetura do sistema
- Convenções e regras críticas
- Variáveis de ambiente
- Troubleshooting comum

Este arquivo é o "cérebro" do contexto. Quanto mais completo, melhor a IA performa.

```markdown
# CLAUDE.md

## Desenvolvimento Local
## Comandos
## Arquitetura
## Regras Críticas
## Variáveis de Ambiente
## Troubleshooting
```

### PLAN.md (opcional)

**Propósito**: Plano de execução da tarefa atual.

Usado quando há uma implementação complexa em andamento. Contém:
- Tarefas com checkbox `- [ ]` / `- [x]`
- Referências a specs (US-AUTH-001, REQ-AUTH-001)
- Ordem de execução

### Arquivos de Ambiente (.env*)

**Propósito**: Configuração por ambiente.

```
.env                  # Base (commitado, valores padrão/dev)
.env.development      # Overrides para dev
.env.staging          # Overrides para staging
.env.production       # Overrides para produção
.env.secrets          # Valores sensíveis (NÃO commitado)
.env.secrets.example  # Template para .env.secrets
```

**Ordem de carregamento**: Base → Ambiente → Secrets (últimos sobrescrevem)

### Docker Compose Files

**Propósito**: Definição de infraestrutura por ambiente.

```
docker-compose.yml          # Production (stack completa)
docker-compose.staging.yml  # Staging (serviço exposto apenas)
docker-compose.dev.yml      # Development (infra apenas, app roda local)
```

### DEPLOY.md / DOCKER.md

**Propósito**: Documentação de deploy.

- `DOCKER.md` - Padrão genérico (pode ser reusado entre projetos)
- `DEPLOY.md` - Parâmetros específicos deste projeto

---

## Diretórios

### brainstorming/

**Fase**: Ideação
**Propósito**: Material bruto da concepção do projeto.

Contém:
- Notas de reuniões com cliente
- Briefings iniciais
- Análises exploratórias
- Planilhas e documentos do cliente
- Material de referência recebido

```
brainstorming/
├── reuniao-01.txt           # Transcrição/notas de reunião
├── BRIEFING.md              # Briefing estruturado
├── ANALISE-UX.md            # Análise exploratória
├── material_cliente/        # Arquivos recebidos do cliente
│   ├── planilha.xlsx
│   └── apresentacao.pdf
└── ARQUITETURA.md           # Rascunho inicial de arquitetura
```

**Regra**: Este diretório é de entrada. O conteúdo aqui é transformado em specs formais.

---

### specs/

**Fase**: Especificação
**Propósito**: Especificações formais e rastreáveis.

Contém features com IDs referenciáveis:
- User Stories (US-{FEAT}-001, US-{FEAT}-002...)
- Requirements (REQ-{FEAT}-001, REQ-{FEAT}-002...)
- Design (DES-{FEAT}-001, DES-{FEAT}-002...)

```
specs/
└── features/
    ├── _template.md           # Template para novas features
    ├── authentication.md      # US-AUTH-*, REQ-AUTH-*, DES-AUTH-*
    ├── settings.md            # US-SETT-*, REQ-SETT-*
    ├── stack-patterns.md      # DES-STACK-* (design only)
    └── {feature}.md
```

**Formato de referência**:
```markdown
### US-AUTH-001: User Login

**Como** usuário,
**Quero** fazer login com email e senha,
**Para** acessar o sistema de forma segura.

**Critérios de Aceite:**
- [ ] Critério 1
- [ ] Critério 2

**Refs:** REQ-AUTH-001
**Impl:** DES-AUTH-001
```

---

### apps/

**Fase**: Implementação
**Propósito**: Serviços deployáveis do sistema.

Estrutura de monorepo. Cada app é um serviço independente com porta própria.

```
apps/
├── app/              # Next.js (frontend)
├── agents/           # LangGraph + Fastify (IA)
├── actions/          # Mutations service
├── docs/             # Knowledge Base (documentacao)
└── sockets/          # WebSocket server
```

**Nota**: Ver [MONOREPO.md](./MONOREPO.md) para detalhes da estrutura.
Ver [AGENTS.md](./AGENTS.md) para a camada de agentes (inclui `prompts/` internos).
Ver [KB.md](./KB.md) para a camada de Knowledge Base.

---

### packages/

**Propósito**: Código compartilhado entre apps.

```
packages/
└── types/            # Schemas Zod compartilhados
```

**Nota**: Ver [MONOREPO.md](./MONOREPO.md) para detalhes.

---

### app/ (legado, ou portal/, api/, web/, etc.)

**Fase**: Implementação
**Propósito**: Código fonte da aplicação.

Estrutura interna depende do framework/stack escolhido.

```
app/
├── src/
│   ├── components/
│   ├── pages/
│   ├── lib/
│   └── ...
├── Dockerfile
├── package.json
└── ...
```

**Nota**: Pode haver múltiplos diretórios de app (ex: `portal/`, `api/`, `worker/`).

---

### database/

**Propósito**: Schemas, migrations e seeds.

```
database/
├── portal/                  # Migrations do serviço portal
│   └── migrations/
│       ├── 001_initial.sql
│       ├── 002_users.sql
│       └── ...
├── n8n/                     # Configs do n8n (se usar)
└── schema.prisma            # Schema Prisma (se usar)
```

**Convenção**: Migrations numeradas sequencialmente (001_, 002_...).

---

### workflows/

**Propósito**: Automações versionadas (n8n, Zapier, etc).

```
workflows/
├── message-handler.json     # Processamento de mensagens
├── appointment-flow.json    # Fluxo de agendamento
├── reminder-scheduler.json  # Lembretes automáticos
└── health-check.json        # Health check do sistema
```

**Regra**: Workflows são exportados como JSON e versionados no git.

---

### scripts/

**Propósito**: Automação e utilitários de desenvolvimento.

```
scripts/
├── db-migrate.mjs           # Executor de migrations
├── db-seed-staging.mjs      # Seed para staging
├── seed-test-users.mjs      # Seed de usuários de teste
├── init-n8n.mjs             # Inicialização do n8n
├── init-evolution.mjs       # Inicialização do Evolution
├── backup.sh                # Script de backup
└── test-*.mjs               # Scripts de teste
```

---

### brand/

**Propósito**: Identidade visual com sistema de 4 cores e temas (light/dark/system).

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

Ver [BRAND.md](./BRAND.md) para documentacao completa.

---

### refs/

**Propósito**: Referências externas e inspirações.

```
refs/
├── ux/                      # Referências de UX/UI
│   ├── competitor-1.png
│   └── inspiration.pdf
├── architecture/            # Referências de arquitetura
└── docs/                    # Documentação externa relevante
```

**Regra**: Material de terceiros para consulta, não para commit de conteúdo protegido.

---

### snippets/

**Propósito**: Padrões de UI documentados para consistência.

```
snippets/
├── README.md                # Índice e instruções
├── password-input.md        # Padrão de input de senha
└── segmented-control.md     # Padrão de controle segmentado
```

**Formato de cada snippet**:
```markdown
# Nome do Padrão

**Name**: identificador-unico
**Tags**: palavras, chave, para, detecção

## Quando usar
## Quando NÃO usar
## Visual
## Código de exemplo
## Props/API
```

**Uso**: IA consulta antes de criar novos componentes para garantir consistência.

---

### docs/

**Propósito**: Documentação técnica gerada/detalhada.

```
docs/
├── docker-architecture.md   # Arquitetura Docker detalhada
├── performance.md           # Documentação de performance
├── security.md              # Práticas de segurança
└── workflows.md             # Documentação completa de workflows
```

**Diferença de specs/**: Specs são requisitos/design. Docs são documentação técnica detalhada gerada durante ou após implementação.

---

## Diretórios Especiais

### .tmp/

**Propósito**: Arquivos temporários de desenvolvimento.

- Gitignored
- Seguro para experimentos
- Scripts de investigação
- Outputs de debug

**Regra**: NUNCA criar arquivos temporários fora de `.tmp/`.

### data/

**Propósito**: Dados persistentes de containers Docker.

- Gitignored
- Volumes bind-mounted
- Backup separado (rsync/restic)

```
data/
├── postgres/
├── redis/
├── n8n/
├── docs/             # Knowledge Base (volume /docs)
└── ...
```

---

## Resumo Visual

```
projeto/
│
├── [RAIZ]
│   ├── CLAUDE.md            # Contexto para IA
│   ├── PLAN.md              # Plano atual
│   ├── .env*                # Configurações
│   └── docker-compose*.yml  # Deploy
│
├── [FASES]
│   ├── brainstorming/       # 1. Ideação
│   ├── specs/               # 2. Especificação
│   └── apps/                # 3. Implementação (monorepo)
│       ├── app/             #    Frontend
│       ├── agents/          #    IA (inclui prompts/)
│       ├── actions/         #    Mutations
│       ├── docs/            #    Knowledge Base
│       └── sockets/         #    WebSocket
│
├── [PACKAGES]
│   └── packages/types/      # Schemas compartilhados
│
├── [INFRAESTRUTURA]
│   ├── database/            # Schemas/Migrations
│   ├── workflows/           # Automações n8n do Usuário
│   └── scripts/             # Utilitários
│
├── [ASSETS]
│   ├── brand/               # Marca
│   ├── refs/                # Referências
│   └── snippets/            # Padrões UI
│
├── [OUTPUT]
│   └── docs/                # Documentação gerada
│
└── [IGNORADOS]
    ├── .tmp/                # Temporários
    └── data/                # Dados Docker
```
