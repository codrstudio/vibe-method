# Infraestrutura

Variaveis de ambiente, Docker e ecossistema de servicos.

---

## Indice

1. [Variaveis de Ambiente](#variaveis-de-ambiente) - Composicao em camadas
2. [Padrao de Portas](#padrao-de-portas) - Mascara XX00-XX99
3. [Ecossistema de Servicos](#ecossistema-de-servicos) - Visao geral e definicoes
4. [Regras de Decisao](#regras-de-decisao) - Onde persistir, buscar, usar LLM
5. [Exposicao por Ambiente](#exposicao-por-ambiente) - Dev vs Staging vs Prod
6. [Docker Compose](#docker-compose) - Matriz de ambientes
7. [PostgreSQL Dual-User](#postgresql-dual-user) - Padrao de usuarios
8. [Seeds](#seeds) - Dados por ambiente
9. [Usuarios de Teste](#usuarios-de-teste) - Padrao {role}@mail.com
10. [UIDs de Servicos](#uids-de-servicos) - Referencia de permissoes
11. [Backup/Restore](#backuprestore) - Procedimentos

---

## Variaveis de Ambiente

### Principio: Composicao em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│ ORDEM DE CARREGAMENTO (ultima sobrescreve)                   │
│                                                             │
│ 1. .env                 <- valores base (commitado)          │
│ 2. .env.{environment}   <- valores por ambiente (commitado)  │
│ 3. .env.secrets         <- secrets externos (NAO commitado)  │
└─────────────────────────────────────────────────────────────┘
```

Cada camada sobrescreve valores da anterior. Isso permite:
- **DRY**: valores comuns ficam em `.env`, sem duplicacao
- **Clareza**: facil ver o que muda entre ambientes
- **Seguranca**: secrets nunca vao para o git

### Arquivos Obrigatorios

**IMPORTANTE:** Todos os arquivos devem estar na **raiz do projeto**.

| Arquivo | Git | Descricao |
|---------|-----|-----------|
| `.env` | **Sim** | Configuracao base compartilhada |
| `.env.development` | **Sim** | Sobrescreve para desenvolvimento |
| `.env.staging` | **Sim** | Sobrescreve para staging |
| `.env.production` | **Sim** | Sobrescreve para producao |
| `.env.secrets` | **Nao** | Secrets externos (opcional) |
| `.env.secrets.example` | **Sim** | Template para secrets |

### Arquivos Proibidos

| Arquivo | Problema | Alternativa |
|---------|----------|-------------|
| `.env.local` | Confunde com padroes de frameworks | Use `.env.secrets` |
| `.env.dev` | Nomenclatura nao padronizada | Use `.env.development` |
| `.env.development.local` | Muito especifico | Use `.env.secrets` |
| `.env` em subpastas | Bagunca de configuracao | Apenas na raiz |

### .env (base)

Contem valores padrao que funcionam para todos os ambientes:

```bash
# ==============================================================================
# PROJETO - CONFIGURACAO BASE
# ==============================================================================
# Valores compartilhados entre todos os ambientes.
# Sobrescritos por .env.{environment} e .env.secrets

# Identificacao
PROJECT=meuapp

# Database (credenciais internas - seguras por isolamento Docker)
POSTGRES_USER=admin
POSTGRES_PASSWORD=Admin123
POSTGRES_DB=main

# URLs internas (padrao Docker)
DATABASE_URL=postgres://admin:Admin123@postgres.internal:5432/main
REDIS_URL=redis://redis.internal:6379

# Configs de app
LOG_LEVEL=info
TZ=America/Sao_Paulo
```

### .env.{environment} (sobrescreve)

Contem **apenas** os valores que diferem do base:

```bash
# ==============================================================================
# PROJETO - DEVELOPMENT
# ==============================================================================
# Sobrescreve .env para ambiente de desenvolvimento.
# App roda no host (localhost), infra roda no Docker.

ENVIRONMENT=development
NODE_ENV=development

# Prefixo de portas
PORT_PREFIX=22

# URLs apontam para localhost (app fora do Docker)
# Portas: PostgreSQL=XX50, Redis=XX51
DATABASE_URL=postgres://admin:Admin123@localhost:${PORT_PREFIX}50/main
REDIS_URL=redis://localhost:${PORT_PREFIX}51

# Portal (porta XX00)
PORTAL_DOMAIN=localhost
PORTAL_URL=http://localhost:${PORT_PREFIX}00
NEXTAUTH_URL=http://localhost:${PORT_PREFIX}00
```

### .env.secrets (NAO commitar)

Contem **apenas** credenciais de servicos externos:

```bash
# ==============================================================================
# SECRETS - NAO COMMITAR
# ==============================================================================
# Credenciais de servicos externos.
# Em producao, podem ser injetados via CI/CD.

NEXTAUTH_SECRET=sua-chave-secreta-aqui
OPENROUTER_API_KEY=sk-or-xxx
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
SMTP_PASSWORD=xxx
```

### Credenciais Internas vs Externas

| Tipo | Local | Exemplo |
|------|-------|---------|
| **Internas** | `.env` | DATABASE_URL, REDIS_URL |
| **Externas** | `.env.secrets` | API keys, OAuth secrets |

**Internas sao seguras** porque a rede Docker e isolada.

### Docker Compose env_file

```yaml
# docker-compose.yml (production)
env_file:
  - .env                          # 1. Base
  - .env.production               # 2. Sobrescreve para prod
  - path: .env.secrets            # 3. Secrets (opcional)
    required: false
```

**Por que `.env.secrets` e opcional?**

Em deploys de producao (CI/CD, Kubernetes), os secrets frequentemente sao:
- Injetados via variaveis de ambiente na linha de comando
- Gerenciados por secrets managers (Vault, AWS Secrets Manager)
- Configurados diretamente na plataforma de deploy

---

## Padrao de Portas

### Mascara

```
XX = prefixo do projeto (PORT_PREFIX)

Proprios:  XX00 - XX49
Externos:  XX50 - XX99
```

### Tabela Completa

| Porta | Servico | Tipo |
|-------|---------|------|
| XX00 | App | proprio |
| XX01 | Socket | proprio |
| XX02 | Backbone | proprio |
| XX50 | PostgreSQL | externo |
| XX51 | Redis | externo |
| XX52 | MongoDB | externo |
| XX53 | Meilisearch | externo |
| XX54 | n8n | externo |
| XX55 | Evolution | externo |
| XX56 | Ollama | externo |
| XX57 | Adminer | externo |
| XX58 | PostgreSQL OLAP | externo |

**Nota:** Backbone unifica services, agents, actions e knowledge em um unico servico.

### Exemplo (XX=80)

| Porta | Servico |
|-------|---------|
| 8000 | App |
| 8001 | Socket |
| 8002 | Backbone (hub) |
| 8050 | PostgreSQL |
| 8051 | Redis |

---

## Ecossistema de Servicos

### Visao Geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVICOS PROPRIOS                              │
│                                                                          │
│  ┌─────────┐  ┌─────────┐  ┌──────────────────────────────────────────┐ │
│  │   App   │  │ Socket  │  │              Backbone Hub                │ │
│  │  XX00   │  │  XX01   │  │  XX02                                    │ │
│  │         │  │         │  │  ┌─────────┐ ┌────────┐ ┌─────────────┐ │ │
│  │         │  │         │  │  │Services │ │ Agents │ │   Actions   │ │ │
│  │         │  │         │  │  │         │ │        │ │             │ │ │
│  │         │  │         │  │  │notif    │ │triager │ │thread.*     │ │ │
│  │         │  │         │  │  │schedule │ │copilot │ │kb.*         │ │ │
│  │         │  │         │  │  │billing  │ │workers │ │user.*       │ │ │
│  │         │  │         │  │  └─────────┘ └────────┘ └─────────────┘ │ │
│  │         │  │         │  │  ┌─────────────────────────────────────┐ │ │
│  │         │  │         │  │  │           Knowledge (RAG)           │ │ │
│  │         │  │         │  │  └─────────────────────────────────────┘ │ │
│  └────┬────┘  └────┬────┘  └─────────────────┬──────────────────────┘ │
│       │            │                          │                         │
└───────┼────────────┼──────────────────────────┼─────────────────────────┘
        │            │                          │
        ▼            ▼                          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICOS EXTERNOS                               │
│  ┌──────────┐ ┌───────┐ ┌───────┐ ┌───────────┐ ┌─────┐ ┌─────────┐    │
│  │PostgreSQL│ │ Redis │ │MongoDB│ │Meilisearch│ │ n8n │ │Evolution│    │
│  │   XX50   │ │ XX51  │ │ XX52  │ │   XX53    │ │XX54 │ │  XX55   │    │
│  └──────────┘ └───────┘ └───────┘ └───────────┘ └─────┘ └─────────┘    │
│  ┌────────┐  ┌─────────┐                                               │
│  │ Ollama │  │ Adminer │                                               │
│  │  XX56  │  │  XX57   │                                               │
│  └────────┘  └─────────┘                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

### Servicos Proprios

Codigo desenvolvido internamente. Rodam fora do Docker em dev, dentro em prod/staging.

| Porta | Servico | Classificacao | Quando Usar | Doc |
|-------|---------|---------------|-------------|-----|
| XX00 | **App** | Interface | UI Next.js, API routes, auth | NEXTJS.md |
| XX01 | **Socket** | Real-time | Notificacoes push, presenca, live updates | REALTIME.md |
| XX02 | **Backbone** | Hub Backend | Services, agents, actions, knowledge | BACKBONE.md |

### Backbone Hub - Modulos

O backbone unifica todos os servicos backend em um unico processo:

| Modulo | Responsabilidade | Quando Usar | Doc |
|--------|------------------|-------------|-----|
| **services** | Notifications, scheduling, billing | Logica orquestrada, sistemas com ciclo de vida | BACKBONE.md |
| **agents** | Raciocinio LLM, decisoes, fluxos | Classificacao, copilot, workers autonomos | AGENTES.md |
| **actions** | Catalogo de mutations | Toda operacao que altera dados | ACTIONS.md |
| **knowledge** | Busca de documentos, RAG | Full-text search, contexto para agents | COPILOT.md |

### Definicoes para IA - Servicos Proprios

| Servico | Definicao Tecnica |
|---------|-------------------|
| **App** | Frontend Next.js com API routes. Ponto de entrada do usuario. Responsavel por UI, autenticacao (NextAuth), chamadas ao Backbone. |
| **Socket** | Servidor Socket.io para comunicacao bidirecional. Usa Redis pub/sub para escalar. Responsavel por presenca online, notificacoes real-time, live chat. |
| **Backbone** | Hub Fastify que unifica todos os servicos backend. Hospeda services (notifications, scheduling), agents (LangGraph), actions (catalogo de mutations) e knowledge (RAG). Comunicacao interna direta entre modulos. |

### Servicos Externos

Infraestrutura de terceiros. Rodam no Docker em todos os ambientes.

| Porta | Servico | Classificacao | Quando Usar | Quando NAO Usar |
|-------|---------|---------------|-------------|-----------------|
| XX50 | **PostgreSQL** | Persistencia critica | Dados ACID, relacionamentos, constraints | Logs alto volume, dados temporarios |
| XX51 | **Redis** | Estado volatil | Cache, filas, pub/sub, presenca, locks | Persistencia longo prazo, dados criticos |
| XX52 | **MongoDB** | Persistencia efemera | Logs auditoria, sessoes TTL, analytics | Dados criticos, relacionamentos |
| XX53 | **Meilisearch** | Busca textual | Full-text search, autocomplete, filtros | Queries relacionais, aggregations |
| XX54 | **n8n** | Automacao visual | Workflows no-code, integracoes simples | Logica complexa de IA |
| XX55 | **Evolution** | Canal WhatsApp | Enviar/receber mensagens WhatsApp, midia | Outros canais (email, SMS) |
| XX56 | **Ollama** | LLM local | Inferencia leve, classificacao, embeddings | Modelos >7B, contexto longo |
| XX57 | **Adminer** | DB Admin | Consultas manuais, debug | — |

### Definicoes para IA - Servicos Externos

| Servico | Definicao Tecnica |
|---------|-------------------|
| **PostgreSQL** | RDBMS para entidades de dominio com integridade referencial. Usar para: users, orders, conversations, configs. Tudo que precisa de FK, unique constraints ou transacoes. |
| **Redis** | In-memory store para estado compartilhado de curta duracao. Usar para: cache de queries, filas de processamento, presenca online, pub/sub entre servicos. Nunca como fonte de verdade. |
| **MongoDB** | Document store para dados schema-less com lifecycle curto. Usar para: operation_logs, session_cache, analytics_events. Sempre definir TTL index quando aplicavel. |
| **Meilisearch** | Search engine otimizado para typo-tolerance e relevancia. Usar para: busca de documentos KB, autocomplete. Indice derivado do PostgreSQL (nao eh fonte primaria). |
| **n8n** | Orquestrador visual de workflows. Usar para: integracoes simples, automacoes agendadas, prototipagem rapida. Migrar para codigo quando logica ficar complexa. |
| **Evolution** | Gateway REST para WhatsApp Business. Usar para: enviar mensagens (text/media), receber webhooks, consultar status. Nao usar para logica de negocio. |
| **Ollama** | Runtime de LLMs locais com limitacao de recursos. Usar para: inferencia leve sem custo, classificacao, NER, embeddings. Respeitar limites de RAM/params definidos em .env. |

---

## Regras de Decisao

### Onde Persistir Dados?

```
Dado critico para o negocio?
  SIM → PostgreSQL
  NAO ↓

Tem TTL ou eh log/analytics?
  SIM → MongoDB
  NAO ↓

Precisa de acesso < 10ms?
  SIM → Redis
  NAO → PostgreSQL
```

### Qual Servico de Busca?

```
Busca por texto livre (humano digitando)?
  SIM → Meilisearch
  NAO ↓

Filtro exato por campos estruturados?
  SIM → PostgreSQL (WHERE/JOIN)
```

### Qual LLM Usar?

```
Tarefa simples (classificar, extrair, embeddings)?
  SIM → Ollama (local)
  NAO ↓

Precisa de raciocinio complexo ou contexto > 4K?
  SIM → API externa (OpenRouter/OpenAI)
```

---

## Exposicao por Ambiente

| Ambiente | Arquivo | Servicos | Portas Expostas | Traefik |
|----------|---------|----------|-----------------|---------|
| **prod** | docker-compose.yml | proprios + externos | nenhuma | app, n8n via labels |
| **staging** | docker-compose.staging.yml | proprios + externos | nenhuma | app, n8n via labels |
| **dev** | docker-compose.dev.yml | so externos | todas (XX50-XX99) | nao usa |

### Development

- Servicos proprios rodam **fora do Docker** (`npm run dev`)
- Servicos externos rodam **no Docker** com portas expostas
- App conecta em `localhost:XX50` (postgres), `localhost:XX51` (redis), etc.

### Staging/Production

- Todos os servicos rodam **dentro do Docker**
- Comunicacao interna via aliases (`postgres.internal`, `redis.internal`)
- Apenas App e n8n expostos externamente via Traefik

### Configuracao .env

```env
# Prefixo de portas do projeto
PORT_PREFIX=22

# Servicos proprios (dev)
PORT=${PORT_PREFIX}00
SOCKET_PORT=${PORT_PREFIX}01
BACKBONE_PORT=${PORT_PREFIX}02

# Servicos externos (dev)
POSTGRES_PORT=${PORT_PREFIX}50
REDIS_PORT=${PORT_PREFIX}51
MONGO_PORT=${PORT_PREFIX}52
MEILISEARCH_PORT=${PORT_PREFIX}53
N8N_PORT=${PORT_PREFIX}54
EVOLUTION_PORT=${PORT_PREFIX}55
OLLAMA_PORT=${PORT_PREFIX}56
```

---

## Docker Compose

### Matriz de Ambientes

| Aspecto | dev | staging | production |
|---------|-----|---------|------------|
| Infra | Docker | Docker | Docker |
| Apps | Local | Docker | Docker |
| Init | chmod 777 | chown UID | chown UID |
| Traefik | Nao | Sim | Sim |
| Dominio | localhost | h.${DOMAIN} | ${DOMAIN} |

### Arquivos

```
docker-compose.yml            # Production
docker-compose.staging.yml    # Staging
docker-compose.dev.yml        # Development (infra apenas)
```

### Regra de Ouro

> Parametros em .env, NAO em docker-compose.

```yaml
# ERRADO
environment:
  POSTGRES_PASSWORD: Admin123

# CERTO
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

# CERTO
env_file:
  - .env
  - .env.${ENVIRONMENT}
  - path: .env.secrets
    required: false
```

### Consistencia entre Arquivos

Alteracoes DEVEM ser refletidas nos 3 docker-compose.

**Identico:**
- Servicos de infraestrutura
- Estrutura de ./data/
- Variaveis referenciadas
- Healthchecks

**Pode diferir:**
- Container names (-dev, -staging)
- Init permissions
- Labels Traefik
- Portas expostas

### Docker Compose - Development

Infra apenas, apps rodam localmente.

```yaml
services:
  ${PROJECT}-init-dev:
    image: busybox:latest
    command: sh -c "mkdir -p /data/postgres /data/redis && chmod -R 777 /data"
    volumes: ["./data:/data"]
    restart: "no"

  ${PROJECT}-postgres-dev:
    image: postgres:16-alpine
    depends_on:
      ${PROJECT}-init-dev:
        condition: service_completed_successfully
    ports:
      - "${PORT_PREFIX}50:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  ${PROJECT}-redis-dev:
    image: redis:7-alpine
    ports:
      - "${PORT_PREFIX}51:6379"
```

### Docker Compose - Production

Stack completa com Traefik.

```yaml
services:
  init:
    image: busybox:latest
    command: |
      sh -c "
        mkdir -p /data/postgres /data/redis &&
        chown -R 999:999 /data/postgres &&
        chown -R 999:999 /data/redis
      "
    volumes: ["./data:/data"]
    restart: "no"

  postgres:
    depends_on:
      init:
        condition: service_completed_successfully
    volumes:
      - ./data/postgres:/var/lib/postgresql/data

  app:
    labels:
      - traefik.enable=true
      - traefik.http.routers.${PROJECT}.rule=Host(`${DOMAIN}`)
      - traefik.http.routers.${PROJECT}.entrypoints=websecure
      - traefik.http.routers.${PROJECT}.tls.certresolver=letsencrypt
    networks:
      - internal
      - codr-net

networks:
  internal:
    driver: bridge
  codr-net:
    external: true
```

---

## PostgreSQL Dual-User

PostgreSQL requer um **superuser** para criar databases e um **application user** para a aplicacao.

### Estrutura

```
┌─────────────────────────────────────────────────────────────┐
│ POSTGRESQL DUAL-USER PATTERN                                │
│                                                             │
│ postgres / postgres    <- superuser (cria databases/users)   │
│ admin / Admin123       <- app user (usado pela aplicacao)    │
└─────────────────────────────────────────────────────────────┘
```

### Credenciais

| User | Password | Papel |
|------|----------|-------|
| `postgres` | `postgres` | Superuser (root do PostgreSQL) |
| `admin` | `Admin123` | Usuario de aplicacao |

### init-db.sql

O arquivo `init-db.sql` e executado automaticamente na primeira inicializacao do PostgreSQL:

```sql
-- init-db.sql
-- Executado automaticamente na primeira inicializacao do PostgreSQL
-- Cria o usuario de aplicacao (admin) usado pelo sistema

-- Criar usuario admin se nao existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN
    CREATE USER admin WITH PASSWORD 'Admin123';
  END IF;
END
$$;

-- Conceder privilegios no banco
GRANT ALL PRIVILEGES ON DATABASE main TO admin;

-- Quando conectar ao banco, conceder em schemas e tabelas
\c main
GRANT ALL ON SCHEMA public TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO admin;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO admin;
```

### Docker Compose

Monte o `init-db.sql` no PostgreSQL:

```yaml
hub-postgres:
  image: postgres:16-alpine
  environment:
    POSTGRES_USER: postgres       # superuser
    POSTGRES_PASSWORD: postgres
    POSTGRES_DB: main
  volumes:
    - ./data/postgres:/var/lib/postgresql/data
    - ./app/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro
```

### URLs

```bash
# .env (base) - usado em Docker
DATABASE_URL=postgresql://admin:Admin123@postgres.internal:5432/main

# .env.development - usado localmente (porta XX50)
DATABASE_URL=postgresql://admin:Admin123@localhost:${PORT_PREFIX}50/main
```

**Nota:** A URL usa o usuario `admin`, nao `postgres`. O superuser so e usado para setup inicial.

### Alternativa: Container Init Separado

O metodo `init-db.sql` no `docker-entrypoint-initdb.d` **so executa se o data directory estiver vazio**. Para um metodo mais robusto e idempotente, use um container init separado.

**Vantagens:**
- **Idempotente**: pode rodar multiplas vezes sem erro
- **Funciona sempre**: mesmo se `./data/postgres` ja existe
- **Migrations centralizadas**: executa migrations e seeds em um unico lugar

**Quando usar cada metodo:**

| Situacao | Metodo |
|----------|--------|
| Projeto simples, reset de banco aceitavel | `init-db.sql` |
| Projeto com migrations evolutivas | Container init |
| Precisa rodar seeds diferentes por ambiente | Container init |
| `./data/postgres` ja existe e precisa atualizar | Container init |

---

## Seeds

### Conceito

```
┌─────────────────────────────────────────────────────────────┐
│ SEED PATTERN                                                │
│                                                             │
│ dev/staging  -> seed base + seed dev (dados de teste)        │
│ production   -> seed base apenas (dados essenciais)          │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura

```
app/src/db/seed/
├── index.ts      # Orquestrador: detecta env e executa seeds apropriados
├── base.ts       # Seed base (prod): labels, settings padrao
├── dev.ts        # Seed dev/staging: usuarios, dados de teste
└── utils.ts      # Helpers: hashPassword, isSeeded, markSeeded
```

### Idempotencia

Use uma tabela de markers para garantir que seeds executem apenas uma vez:

```sql
-- migrations/0XX_seed_markers.sql
CREATE TABLE IF NOT EXISTS _seed_markers (
  marker VARCHAR(100) PRIMARY KEY,
  seeded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE _seed_markers IS 'Tracks which seeds have been executed';
```

### Utils

```typescript
// seed/utils.ts
import { scrypt, randomBytes } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scrypt);

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const hash = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${salt}:${hash.toString('hex')}`;
}

export async function isSeeded(marker: string): Promise<boolean> {
  const result = await queryOne(
    'SELECT 1 FROM _seed_markers WHERE marker = $1',
    [marker]
  );
  return !!result;
}

export async function markSeeded(marker: string): Promise<void> {
  await execute(
    'INSERT INTO _seed_markers (marker) VALUES ($1) ON CONFLICT DO NOTHING',
    [marker]
  );
}
```

### Orquestrador

```typescript
// seed/index.ts
import { config } from '../../config.js';
import { seedBase } from './base.js';
import { seedDev } from './dev.js';

export async function runSeeds(): Promise<void> {
  const env = config.NODE_ENV;
  console.log(`[SEED] Running seeds for environment: ${env}`);

  // Base sempre executa (labels, settings)
  await seedBase();

  // Dev/Staging adiciona dados de teste
  if (env === 'development' || env === 'staging') {
    await seedDev();
  }

  console.log('[SEED] Complete!');
}
```

### Integracao no Startup

```typescript
// index.ts (app entry point)
import { runSeeds } from './db/seed/index.js';

// No startup, apos conectar ao banco:
await runSeeds();
```

---

## Usuarios de Teste

### Padrao

```
┌─────────────────────────────────────────────────────────────┐
│ TEST USER PATTERN                                           │
│                                                             │
│ Email:    {role}@mail.com                                   │
│ Password: 12345678                                          │
│ Nome:     Nome realista (nao "Test User")                   │
└─────────────────────────────────────────────────────────────┘
```

### Usuarios Padrao

| Email | Senha | Role | Nome |
|-------|-------|------|------|
| `admin@mail.com` | `12345678` | admin | Carolina Mendes |
| `manager@mail.com` | `12345678` | manager | Rafael Oliveira |
| `attendant@mail.com` | `12345678` | attendant | Juliana Santos |

**Adicionar mais roles conforme necessario:** `viewer@mail.com`, `editor@mail.com`, etc.

### Implementacao

```typescript
// seed/dev.ts
const TEST_PASSWORD = '12345678';

const testUsers = [
  { email: 'admin@mail.com', name: 'Carolina Mendes', role: 'admin' },
  { email: 'manager@mail.com', name: 'Rafael Oliveira', role: 'manager' },
  { email: 'attendant@mail.com', name: 'Juliana Santos', role: 'attendant' },
];

export async function seedDevUsers(): Promise<void> {
  if (await isSeeded('dev-users')) return;

  const passwordHash = await hashPassword(TEST_PASSWORD);

  for (const user of testUsers) {
    await execute(`
      INSERT INTO users (id, email, name, password_hash, role)
      VALUES (gen_random_uuid(), $1, $2, $3, $4)
      ON CONFLICT (email) DO UPDATE SET
        name = EXCLUDED.name,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role
    `, [user.email, user.name, passwordHash, user.role]);
  }

  await markSeeded('dev-users');
  console.log('[SEED] Dev users created');
}
```

### Documentar no CLAUDE.md

Inclua os usuarios de teste no CLAUDE.md do projeto:

```markdown
## Usuarios de Teste (dev/staging)

| Email | Senha | Role |
|-------|-------|------|
| admin@mail.com | 12345678 | admin |
| manager@mail.com | 12345678 | manager |
| attendant@mail.com | 12345678 | attendant |
```

---

## Ollama - LLMs Locais

Ollama permite rodar modelos de linguagem localmente sem GPU.

### Variaveis de Ambiente

```env
# Hardware disponivel
OLLAMA_HAS_GPU=false
OLLAMA_RAM_MB=16384
OLLAMA_CPU_CORES=8

# Limites de modelo
OLLAMA_MAX_PARAMS_B=7
OLLAMA_MAX_CTX=4096
OLLAMA_MIN_QUANT=Q4

# Limites de execucao
OLLAMA_MAX_CONCURRENCY=1
OLLAMA_MAX_OUTPUT_TOKENS=512
```

### Proposito dos Limitadores

| Variavel | Proposito |
|----------|-----------|
| `OLLAMA_HAS_GPU` | Indica se GPU esta disponivel |
| `OLLAMA_RAM_MB` | RAM disponivel para filtrar modelos |
| `OLLAMA_MAX_PARAMS_B` | Maximo de bilhoes de parametros (ex: 7 = 7B max) |
| `OLLAMA_MAX_CTX` | Contexto maximo permitido |
| `OLLAMA_MAX_CONCURRENCY` | Requests simultaneos |

### Docker Compose

```yaml
ollama:
  image: ollama/ollama:latest
  container_name: ${PROJECT}-ollama
  restart: unless-stopped
  depends_on:
    init:
      condition: service_completed_successfully
  volumes:
    - ./data/ollama:/root/.ollama
  networks:
    internal:
      aliases:
        - ollama.internal
  healthcheck:
    test: ["CMD-SHELL", "curl -f http://localhost:11434/api/tags || exit 1"]
    interval: 30s
    timeout: 10s
    retries: 5
    start_period: 60s
```

---

## Troubleshooting

### 404 no Traefik

```bash
# Container na rede?
docker network inspect codr-net

# Labels corretas?
docker inspect <container> | jq '.[0].Config.Labels'
```

### PostgreSQL: "Permission denied"

**Sintoma:**
```
Error: could not open file "global/pg_filenode.map": Permission denied
```

**Causa:** Bind mount em `./data/postgres` com permissoes incompativeis.

**Solucoes:**

1. **Windows/NTFS:** Usar `chmod 777` no init em vez de `chown`
2. **Linux:** Verificar se o init esta usando UID correto (999:999 para postgres)
3. **Reset:** Se aceitavel perder dados:
   ```bash
   docker compose down
   rm -rf data/postgres
   docker compose up -d
   ```

### Container nao inicia

1. Verificar depends_on com service_healthy
2. Para staging, remover dependencias de servicos locais
3. Verificar variaveis de ambiente obrigatorias

### Migracao corrompida

**Sintoma:** Seed ou app falha com "column X does not exist"

**Solucao:** Resetar base e rodar migrations do zero:
```bash
docker compose down
rm -rf data/postgres
docker compose up -d
```

---

## Migracao de Named Volumes para Bind Mounts

Se o projeto ja usa named volumes e precisa migrar para `./data/`:

### 1. Exportar dados

```bash
docker compose down
docker run --rm -v postgres_data:/source -v $(pwd)/data/postgres:/dest busybox cp -a /source/. /dest/
docker run --rm -v redis_data:/source -v $(pwd)/data/redis:/dest busybox cp -a /source/. /dest/
```

### 2. Atualizar docker-compose.yml

```yaml
# ANTES
volumes:
  - postgres_data:/var/lib/postgresql/data

# DEPOIS
volumes:
  - ./data/postgres:/var/lib/postgresql/data
```

### 3. Limpar e reiniciar

```bash
docker volume rm postgres_data redis_data
docker compose up -d
```

---

## UIDs de Servicos

Referencia de UIDs para permissoes em volumes Docker.

| Servico | UID | Path interno |
|---------|-----|--------------|
| PostgreSQL | 999 | /var/lib/postgresql/data |
| Redis | 999 | /data |
| MongoDB | 999 | /data/db |
| n8n | 1000 | /home/node/.n8n |
| Grafana | 472 | /var/lib/grafana |
| Meilisearch | root | /meili_data |
| Ollama | root | /root/.ollama |

### Uso no Init Container

```yaml
init:
  command: |
    sh -c "
      mkdir -p /data/postgres /data/redis /data/mongo &&
      chown -R 999:999 /data/postgres &&
      chown -R 999:999 /data/redis &&
      chown -R 999:999 /data/mongo
    "
```

---

## Backup/Restore

### Backup

```bash
# Backup completo do data directory
rsync -av ./data/ /backup/PROJETO/$(date +%Y%m%d)/

# Backup apenas PostgreSQL
docker exec PROJETO-postgres pg_dump -U admin main > backup.sql
```

### Restore

```bash
# Restore completo
rsync -av /backup/PROJETO/20240115/ ./data/
docker compose up -d

# Restore apenas PostgreSQL
docker exec -i PROJETO-postgres psql -U admin main < backup.sql
```

---

## Setup Novo Dev

```bash
# 1. Clone (ja vem com .env.{environment})
git clone repo

# 2. Copiar template de secrets
cp .env.secrets.example .env.secrets

# 3. Preencher secrets (pedir valores ao time)
nano .env.secrets

# 4. Levantar infra
docker compose -f docker-compose.dev.yml up -d

# 5. Rodar app localmente
npm install
npm run dev
```

---

## Checklist

### Ambiente

- [ ] PORT_PREFIX definido no .env
- [ ] Todas as portas seguem padrao XX00-XX99
- [ ] .gitignore inclui .env.secrets e data/
- [ ] .gitignore NAO inclui .env.{environment}

### Docker

- [ ] docker-compose.yml (production)
- [ ] docker-compose.staging.yml
- [ ] docker-compose.dev.yml (infra apenas)
- [ ] Todos usam env_file com 3 camadas
- [ ] Consistencia entre os 3 arquivos

### PostgreSQL

- [ ] Superuser: postgres / postgres
- [ ] App user: admin / Admin123
- [ ] init-db.sql cria usuario admin
- [ ] init-db.sql montado em /docker-entrypoint-initdb.d/
- [ ] DATABASE_URL usa admin, nao postgres

### Seeds

- [ ] Tabela _seed_markers
- [ ] seed/base.ts (essenciais)
- [ ] seed/dev.ts (teste)
- [ ] Seeds sao idempotentes
- [ ] Orquestrador detecta NODE_ENV

### Usuarios de Teste

- [ ] Pattern: {role}@mail.com / 12345678
- [ ] Nomes realistas
- [ ] Documentados no CLAUDE.md
- [ ] Criados apenas em dev/staging
