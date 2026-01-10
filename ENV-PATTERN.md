# Environment Pattern

Padrão de variáveis de ambiente com composição em 3 níveis.

> Para Docker e deploy, ver [DEPLOY_PATTERN.md](./DEPLOY_PATTERN.md)

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

ENVIRONMENT=development
NODE_ENV=development

# URLs apontam para localhost (app fora do Docker)
DATABASE_URL=postgres://admin:Admin123@localhost:9032/main
REDIS_URL=redis://localhost:9079

# Portal
PORTAL_DOMAIN=localhost
PORTAL_URL=http://localhost:9000
NEXTAUTH_URL=http://localhost:9000
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
# Em produção, podem ser injetados via CI/CD ou Coolify.

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

Em deploys de produção (CI/CD, Kubernetes, Coolify), os secrets frequentemente são:
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

## Coolify - Variáveis de Ambiente

**REGRA CRÍTICA:** No Coolify, cadastrar **APENAS** as variáveis do `.env.secrets`.

### Por quê?

O docker-compose já carrega `.env.{environment}` via `env_file:`. Se você cadastrar essas variáveis no Coolify, elas **sobrescrevem** os valores do arquivo - inclusive com valores vazios.

```
┌─────────────────────────────────────────────────────────────┐
│ ORDEM DE PRECEDÊNCIA (última vence)                         │
│                                                             │
│ 1. env_file: .env.{environment}  ← valores commitados       │
│ 2. env_file: .env.secrets        ← secrets locais           │
│ 3. Coolify env vars              ← SOBRESCREVE TUDO!        │
└─────────────────────────────────────────────────────────────┘
```

### Exemplo do problema

```bash
# .env.production (commitado)
DATABASE_URL=postgres://admin:Admin123@postgres.internal:5432/main

# Coolify (cadastrado com valor vazio)
DATABASE_URL=

# Resultado: app não conecta no banco!
```

### O que cadastrar no Coolify

| Cadastrar | Não cadastrar |
|-----------|---------------|
| `NEXTAUTH_SECRET` | `DATABASE_URL` |
| `OPENROUTER_API_KEY` | `NODE_ENV` |
| `GOOGLE_CLIENT_*` | `PORTAL_DOMAIN` |
| `SMTP_*` | `REDIS_URL` |
| `VAPID_*` | Qualquer var do `.env.{environment}` |

### Como verificar

```bash
# Listar vars do Coolify
curl -s "https://$COOLIFY_HOST/api/v1/applications/$APP_UUID/envs" \
  -H "Authorization: Bearer $TOKEN" | jq '.[].key'

# Comparar com .env.secrets
grep -E "^[A-Z_]+=" .env.secrets | cut -d= -f1

# Se houver vars no Coolify que NÃO estão em .env.secrets, REMOVER!
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

### Deploy (Coolify/CI)

- [ ] **Coolify tem APENAS vars do `.env.secrets`** (nunca duplicar vars do `.env.{environment}`)
