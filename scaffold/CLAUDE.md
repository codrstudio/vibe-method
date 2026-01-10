# CLAUDE.md

This file provides guidance to Claude Code when working with this repository.

## Desenvolvimento Local

```bash
# Iniciar projeto
npm run dev

# Parar
npm run dev:stop
```

### Portas

| Serviço | Porta |
|---------|-------|
| App | 3000 |

## Comandos

```bash
npm install          # Instalar dependências
npm run dev          # Desenvolvimento
npm run build        # Build produção
npm run test         # Testes
```

## Arquitetura

```
┌─────────────┐
│     APP     │
│  (Next.js)  │
└─────────────┘
```

| Componente | Tech | Descrição |
|------------|------|-----------|
| App | Next.js | Interface web |

## Regras Críticas

### Portas
**NUNCA** alterar as portas do projeto.

### Git
**PROIBIDO** usar comandos destrutivos:
- `git restore`
- `git clean`
- `git reset --hard`

## Variáveis de Ambiente

Composição em 3 níveis (último sobrescreve):

```
.env                 # Config base compartilhada (commitado)
.env.development     # Sobrescritas para dev (commitado)
.env.staging         # Sobrescritas para staging (commitado)
.env.production      # Sobrescritas para prod (commitado)
.env.secrets         # Secrets externos (NÃO commitado, opcional)
.env.secrets.example # Template para secrets (commitado)
```

**Conteúdo dos arquivos:**
- `.env` - Valores padrão que funcionam para Docker (hostnames internos, credenciais internas)
- `.env.{environment}` - **Apenas** valores que diferem do base
- `.env.secrets` - **Apenas** credenciais de serviços externos (API keys, etc.)

**Ordem de carregamento (Docker Compose):**
```yaml
env_file:
  - .env                      # 1. Base
  - .env.{environment}        # 2. Sobrescritas do ambiente
  - path: .env.secrets        # 3. Secrets (opcional)
    required: false
```

## Estrutura de Arquivos

```
/
├── .env                  # Config base (commitado)
├── .env.development      # Sobrescritas dev (commitado)
├── .env.staging          # Sobrescritas staging (commitado)
├── .env.production       # Sobrescritas prod (commitado)
├── .env.secrets          # Secrets externos (NÃO commitado)
├── .env.secrets.example  # Template para secrets (commitado)
├── docker-compose.yml           # Production
├── docker-compose.staging.yml   # Staging
├── docker-compose.dev.yml       # Development
├── CLAUDE.md             # Este arquivo
├── PLAN.md               # Plano de execução
├── brainstorming/        # Ideação
├── specs/                # Especificações
│   ├── user-stories.md
│   ├── requirements.md
│   └── design.md
├── app/                  # Código fonte
├── database/             # Migrations
└── data/                 # Volumes persistentes (NÃO commitado)
```

## Notas

- Arquivos temporários apenas em `.tmp/`
- Referências: `US001`, `REQ014`, `DES030`
- Sistema em pt-BR
