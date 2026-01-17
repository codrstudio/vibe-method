# Environment Pattern

Padrão de variáveis de ambiente com composição em 3 níveis.

> Para Docker e deploy, ver [DOCKER.md](./DOCKER.md)

---

## Princípio: Composição em Camadas

```
┌─────────────────────────────────────────────────────────────┐
│ ORDEM DE CARREGAMENTO (última sobrescreve)                   │
│                                                             │
│ 1. .env                 ← valores base (commitado)          │
│ 2. .env.{environment}   ← valores por ambiente (commitado)  │
│ 3. .env.secrets         ← secrets externos (NÃO commitado)  │
└─────────────────────────────────────────────────────────────┘
```

Cada camada sobrescreve valores da anterior. Isso permite:
- **DRY**: valores comuns ficam em `.env`, sem duplicação
- **Clareza**: fácil ver o que muda entre ambientes
- **Segurança**: secrets nunca vão para o git

---

## Arquivos Obrigatórios

**IMPORTANTE:** Todos os arquivos devem estar na **raiz do projeto**.

| Arquivo | Git | Descrição |
|---------|-----|-----------|
| `.env` | **Sim** | Configuração base compartilhada |
| `.env.development` | **Sim** | Sobrescreve para desenvolvimento |
| `.env.staging` | **Sim** | Sobrescreve para staging |
| `.env.production` | **Sim** | Sobrescreve para produção |
| `.env.secrets` | **Não** | Secrets externos (opcional) |
| `.env.secrets.example` | **Sim** | Template para secrets |

---

## Estrutura dos Arquivos

### .env (base)

Contém valores padrão que funcionam para todos os ambientes:

```bash
# ==============================================================================
# PROJETO - CONFIGURAÇÃO BASE
# ==============================================================================
# Valores compartilhados entre todos os ambientes.
# Sobrescritos por .env.{environment} e .env.secrets

# Identificação
PROJECT=meuapp

# Database (credenciais internas - seguras por isolamento Docker)
POSTGRES_USER=admin
POSTGRES_PASSWORD=Admin123
POSTGRES_DB=main

# URLs internas (padrão Docker)
DATABASE_URL=postgres://admin:Admin123@postgres.internal:5432/main
REDIS_URL=redis://redis.internal:6379

# Configs de app
LOG_LEVEL=info
TZ=America/Sao_Paulo
```

### .env.{environment} (sobrescreve)

Contém **apenas** os valores que diferem do base:

```bash
# ==============================================================================
# PROJETO - DEVELOPMENT
# ==============================================================================
# Sobrescreve .env para ambiente de desenvolvimento.
# App roda no host (localhost), infra roda no Docker.
# Portas seguem padrao ECOSYSTEM.md: XX50-XX99 para servicos externos

ENVIRONMENT=development
NODE_ENV=development

# Prefixo de portas (ver ECOSYSTEM.md)
PORT_PREFIX=22

# URLs apontam para localhost (app fora do Docker)
# Portas: PostgreSQL=XX50, Redis=XX51 (ex: 2250, 2251 para PREFIX=22)
DATABASE_URL=postgres://admin:Admin123@localhost:${PORT_PREFIX}50/main
REDIS_URL=redis://localhost:${PORT_PREFIX}51

# Portal (porta XX00)
PORTAL_DOMAIN=localhost
PORTAL_URL=http://localhost:${PORT_PREFIX}00
NEXTAUTH_URL=http://localhost:${PORT_PREFIX}00
```

```bash
# ==============================================================================
# PROJETO - PRODUCTION
# ==============================================================================
# Sobrescreve .env para ambiente de produção.
# Tudo roda em Docker, usa hostnames internos.

ENVIRONMENT=production
NODE_ENV=production

# URLs usam rede Docker interna (já definidas em .env, mas explícito aqui)
# DATABASE_URL=postgres://admin:Admin123@postgres.internal:5432/main

# Portal
PORTAL_DOMAIN=meuapp.com.br
PORTAL_URL=https://meuapp.com.br
NEXTAUTH_URL=https://meuapp.com.br
```

### .env.secrets (NÃO commitar)

Contém **apenas** credenciais de serviços externos:

```bash
# ==============================================================================
# SECRETS - NÃO COMMITAR
# ==============================================================================
# Credenciais de serviços externos.
# Em produção, podem ser injetados via CI/CD.

NEXTAUTH_SECRET=sua-chave-secreta-aqui
OPENROUTER_API_KEY=sk-or-xxx
GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=xxx
SMTP_PASSWORD=xxx
```

---

## Arquivos Proibidos

| Arquivo | Problema | Alternativa |
|---------|----------|-------------|
| `.env.local` | Confunde com padrões de frameworks | Use `.env.secrets` |
| `.env.dev` | Nomenclatura não padronizada | Use `.env.development` |
| `.env.development.local` | Muito específico | Use `.env.secrets` |
| `.env` em subpastas | Bagunça de configuração | Apenas na raiz |

---

## Ordem de Carregamento (Docker Compose)

O Docker Compose carrega os arquivos na ordem definida em `env_file:`. O último valor vence.

```yaml
# docker-compose.yml (production)
env_file:
  - .env                          # 1. Base
  - .env.production               # 2. Sobrescreve para prod
  - path: .env.secrets            # 3. Secrets (opcional)
    required: false

# docker-compose.staging.yml
env_file:
  - .env                          # 1. Base
  - .env.staging                  # 2. Sobrescreve para staging
  - path: .env.secrets            # 3. Secrets (opcional)
    required: false

# docker-compose.dev.yml (development)
env_file:
  - .env                          # 1. Base
  - .env.development              # 2. Sobrescreve para dev
  - path: .env.secrets            # 3. Secrets (opcional)
    required: false
```

### Por que `.env.secrets` é opcional?

Em deploys de produção (CI/CD, Kubernetes), os secrets frequentemente são:
- Injetados via variáveis de ambiente na linha de comando
- Gerenciados por secrets managers (Vault, AWS Secrets Manager)
- Configurados diretamente na plataforma de deploy

O arquivo `.env.secrets` existe para facilitar desenvolvimento local, mas não é obrigatório em produção.

---

## Credenciais Internas vs Externas

### Internas (commitáveis)

Serviços que só existem dentro do Docker Compose:

```bash
# .env.{environment} (commitado)
DATABASE_URL=postgres://admin:Admin123@postgres.internal:5432/main
REDIS_URL=redis://redis.internal:6379
INTERNAL_API_KEY=internal-key-12345
```

**Por que é seguro?** A rede Docker é isolada. `postgres.internal:5432` só é acessível dentro do compose.

### Externas (nunca commitar)

Serviços externos ao compose:

```bash
# .env.secrets (NÃO commitado)
OPENROUTER_API_KEY=sk-or-real-key
STRIPE_SECRET_KEY=sk_live_xxx
GOOGLE_CLIENT_SECRET=xxx
```

---

## PostgreSQL: Padrão Dual-User

PostgreSQL requer um **superuser** para criar databases e um **application user** para a aplicação.

### Estrutura

```
┌─────────────────────────────────────────────────────────────┐
│ POSTGRESQL DUAL-USER PATTERN                                │
│                                                             │
│ postgres / postgres    ← superuser (cria databases/users)   │
│ admin / Admin123       ← app user (usado pela aplicação)    │
└─────────────────────────────────────────────────────────────┘
```

### Credenciais

| User | Password | Papel |
|------|----------|-------|
| `postgres` | `postgres` | Superuser (root do PostgreSQL) |
| `admin` | `Admin123` | Usuário de aplicação |

### init-db.sql

O arquivo `init-db.sql` é executado automaticamente na primeira inicialização do PostgreSQL. Ele cria o usuário de aplicação:

```sql
-- init-db.sql
-- Executado automaticamente na primeira inicialização do PostgreSQL
-- Cria o usuário de aplicação (admin) usado pelo sistema

-- Criar usuário admin se não existir
DO $$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = 'admin') THEN
    CREATE USER admin WITH PASSWORD 'Admin123';
  END IF;
END
$$;

-- Conceder privilégios no banco
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
    - ./app/init-db.sql:/docker-entrypoint-initdb.d/init-db.sql:ro  # cria admin
```

### URLs

```bash
# .env (base) - usado em Docker
DATABASE_URL=postgresql://admin:Admin123@postgres.internal:5432/main

# .env.development - usado localmente (porta XX50, ver ECOSYSTEM.md)
DATABASE_URL=postgresql://admin:Admin123@localhost:${PORT_PREFIX}50/main
```

**Nota:** A URL usa o usuário `admin`, não `postgres`. O superuser só é usado para setup inicial.

### Alternativa: Container Init Separado

O método `init-db.sql` no `docker-entrypoint-initdb.d` **só executa se o data directory estiver vazio**. Para um método mais robusto e idempotente, use um container init separado.

**Vantagens:**
- **Idempotente**: pode rodar múltiplas vezes sem erro
- **Funciona sempre**: mesmo se `./data/postgres` já existe
- **Migrations centralizadas**: executa migrations e seeds em um único lugar

**Estrutura:**

```
project/
├── database/
│   ├── migrations/     # SQL ordenados (001_*.sql, 002_*.sql)
│   └── seeds/          # Dados iniciais (001_base.sql, 002_demo.sql)
├── docker/
│   └── postgres-init/
│       └── Dockerfile
└── scripts/
    └── init-postgres.mjs
```

**docker/postgres-init/Dockerfile:**

```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY scripts/init-postgres.mjs .
COPY database/migrations ./migrations
COPY database/seeds ./seeds
RUN npm install --no-save pg
CMD ["node", "init-postgres.mjs"]
```

**docker-compose.dev.yml:**

```yaml
services:
  hub-postgres-dev:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: postgres       # superuser
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: postgres
    ports:
      - "${PORT_PREFIX}50:5432"  # PostgreSQL = XX50 (ver ECOSYSTEM.md)
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
    networks:
      - internal

  hub-postgres-init-dev:
    build:
      context: .
      dockerfile: docker/postgres-init/Dockerfile
    depends_on:
      hub-postgres-dev:
        condition: service_healthy
    environment:
      - POSTGRES_HOST=hub-postgres-dev
      - POSTGRES_PORT=5432
      - POSTGRES_SUPERUSER=postgres
      - POSTGRES_SUPERUSER_PASSWORD=postgres
      - POSTGRES_USER=admin
      - POSTGRES_PASSWORD=Admin123
      - POSTGRES_DB=coletivos
      - ENVIRONMENT=development
    networks:
      - internal
    restart: "no"
```

**scripts/init-postgres.mjs:**

```javascript
// Conecta como superuser (postgres/postgres)
// Cria user admin se não existir
// Cria database se não existir
// Executa migrations
// Executa seeds
```

**Quando usar cada método:**

| Situação | Método |
|----------|--------|
| Projeto simples, reset de banco aceitável | `init-db.sql` |
| Projeto com migrations evolutivas | Container init |
| Precisa rodar seeds diferentes por ambiente | Container init |
| `./data/postgres` já existe e precisa atualizar | Container init |

---

## Seeds: Padrão por Ambiente

Sistema de seeds idempotente que diferencia dados por ambiente.

### Conceito

```
┌─────────────────────────────────────────────────────────────┐
│ SEED PATTERN                                                │
│                                                             │
│ dev/staging  → seed base + seed dev (dados de teste)        │
│ production   → seed base apenas (dados essenciais)          │
└─────────────────────────────────────────────────────────────┘
```

### Estrutura

```
app/src/db/seed/
├── index.ts      # Orquestrador: detecta env e executa seeds apropriados
├── base.ts       # Seed base (prod): labels, settings padrão
├── dev.ts        # Seed dev/staging: usuários, dados de teste
└── utils.ts      # Helpers: hashPassword, isSeeded, markSeeded
```

### Idempotência

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

### Integração no Startup

```typescript
// index.ts (app entry point)
import { runSeeds } from './db/seed/index.js';

// No startup, após conectar ao banco:
await runSeeds();
```

---

## Usuários de Teste: Padrão

Padrão para criar usuários de teste em dev/staging.

### Convenção

```
┌─────────────────────────────────────────────────────────────┐
│ TEST USER PATTERN                                           │
│                                                             │
│ Email:    {role}@mail.com                                   │
│ Password: 12345678                                          │
│ Nome:     Nome realista (não "Test User")                   │
└─────────────────────────────────────────────────────────────┘
```

### Usuários Padrão

| Email | Senha | Role | Nome |
|-------|-------|------|------|
| `admin@mail.com` | `12345678` | admin | Carolina Mendes |
| `manager@mail.com` | `12345678` | manager | Rafael Oliveira |
| `attendant@mail.com` | `12345678` | attendant | Juliana Santos |

**Adicionar mais roles conforme necessário:** `viewer@mail.com`, `editor@mail.com`, etc.

### Implementação

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
      ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
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

Inclua os usuários de teste no CLAUDE.md do projeto:

```markdown
## Usuários de Teste (dev/staging)

| Email | Senha | Role |
|-------|-------|------|
| admin@mail.com | 12345678 | admin |
| manager@mail.com | 12345678 | manager |
| attendant@mail.com | 12345678 | attendant |
```

---

## .gitignore

```gitignore
# Apenas secrets
.env.secrets
```

**Não incluir** `.env.*` genérico - queremos commitar configs de ambiente.

---

## Setup Novo Dev

```bash
# 1. Clone (já vem com .env.{environment})
git clone repo

# 2. Copiar template de secrets
cp .env.secrets.example .env.secrets

# 3. Preencher secrets
# Pedir valores ao time

# 4. Rodar
docker compose -f docker-compose.dev.yml up
```

---

## Carregamento em Scripts (Local)

Para scripts que rodam fora do Docker, carregar na mesma ordem:

```javascript
import { existsSync, readFileSync } from 'fs';

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf-8');
  for (const line of content.split('\n')) {
    const match = line.match(/^([A-Z_][A-Z0-9_]*)=(.*)$/);
    if (match) {
      // Sempre sobrescreve - última camada vence
      process.env[match[1]] = match[2];
    }
  }
}

// Ordem: base → ambiente → secrets
const env = process.env.ENVIRONMENT || 'development';
loadEnvFile('.env');                // 1. Base
loadEnvFile(`.env.${env}`);         // 2. Ambiente
loadEnvFile('.env.secrets');        // 3. Secrets (opcional)
```

**Nota:** Diferente do exemplo anterior, aqui sempre sobrescrevemos (`process.env[match[1]] = ...`) para garantir que a ordem de precedência funcione corretamente.

---

## Checklist

### Arquivos

- [ ] `.env` com configuração base compartilhada
- [ ] `.env.development` com sobrescritas para dev
- [ ] `.env.staging` com sobrescritas para staging
- [ ] `.env.production` com sobrescritas para prod
- [ ] `.env.secrets.example` com placeholders para secrets
- [ ] Nenhum `.env` em subpastas

### Git

- [ ] `.gitignore` inclui `.env.secrets`
- [ ] `.gitignore` **NÃO** inclui `.env`, `.env.development`, `.env.staging`, `.env.production`
- [ ] Todos os arquivos `.env.*` (exceto `.env.secrets`) estão commitados

### Docker Compose

- [ ] Todos os docker-compose carregam `.env` → `.env.{environment}` → `.env.secrets`
- [ ] `.env.secrets` está marcado como `required: false`

### Conteúdo

- [ ] `.env` contém valores padrão que funcionam para Docker (hostnames internos)
- [ ] `.env.{environment}` contém **apenas** valores que diferem do base
- [ ] `.env.secrets` contém **apenas** credenciais de serviços externos
- [ ] Credenciais internas (postgres, redis) estão em `.env` (seguras por isolamento Docker)

### PostgreSQL

- [ ] Superuser: `postgres` / `postgres`
- [ ] App user: `admin` / `Admin123`
- [ ] `init-db.sql` cria usuário `admin` no primeiro boot
- [ ] `init-db.sql` montado em `/docker-entrypoint-initdb.d/`
- [ ] `DATABASE_URL` usa `admin`, não `postgres`

### Seeds

- [ ] Migration cria tabela `_seed_markers`
- [ ] `seed/base.ts` com dados essenciais (prod)
- [ ] `seed/dev.ts` com dados de teste (dev/staging)
- [ ] Seeds são idempotentes (verificam markers antes de executar)
- [ ] Orquestrador detecta `NODE_ENV` e executa seeds apropriados
- [ ] Startup do app chama `runSeeds()`

### Usuários de Teste

- [ ] Pattern: `{role}@mail.com` / `12345678`
- [ ] Nomes realistas (não "Test User")
- [ ] Documentados no CLAUDE.md do projeto
- [ ] Criados apenas em dev/staging (não em prod)

### Deploy (CI/CD)

- [ ] CI/CD tem **apenas** vars do `.env.secrets` (nunca duplicar vars do `.env.{environment}`)
