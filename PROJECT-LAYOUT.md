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
- Referências a specs (US001, REQ014)
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

### DEPLOY.md / DEPLOY_PATTERN.md

**Propósito**: Documentação de deploy.

- `DEPLOY_PATTERN.md` - Padrão genérico (pode ser reusado entre projetos)
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

Contém documentos com IDs referenciáveis:
- User Stories (US001, US002...)
- Requirements (REQ001, REQ002...)
- Non-Functional Requirements (NFR001...)
- Design Specs (DES001, DES002...)

```
specs/
├── user-stories.md          # US001..US050
├── requirements.md          # REQ001..REQ100, NFR001..NFR050
├── design.md                # DES001..DES100
├── api-response.md          # Padrões de API
├── environment.md           # Credenciais por ambiente
└── workflows/               # Specs de workflows específicos
    └── appointment-flow.md
```

**Formato de referência**:
```markdown
### US001 - Título da User Story

**Como** [persona]
**Quero** [ação]
**Para** [benefício]

**Critérios de Aceite:**
- [ ] Critério 1
- [ ] Critério 2

**Refs:** REQ014, DES030
```

---

### prompts/

**Fase**: Instruções LLM
**Propósito**: System prompts para agentes de IA do sistema.

Contém instruções para LLMs que fazem parte da aplicação (não para Claude Code).

```
prompts/
├── system-main.md           # Prompt principal do assistente
├── intent-classifier.md     # Classificador de intenção
├── entity-extractor.md      # Extrator de entidades
├── response-generator.md    # Gerador de respostas
├── faq-knowledge.md         # Base de conhecimento FAQ
└── models.md                # Documentação dos modelos usados
```

**Uso**: Workflows de automação (n8n) referenciam estes prompts.

---

### app/ (ou portal/, api/, web/, etc.)

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

Ver [BRAND-SYSTEM.md](./BRAND-SYSTEM.md) para documentacao completa.

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
│   ├── prompts/             # 3. Instruções LLM
│   └── app/                 # 4. Implementação
│
├── [INFRAESTRUTURA]
│   ├── database/            # Schemas/Migrations
│   ├── workflows/           # Automações
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
