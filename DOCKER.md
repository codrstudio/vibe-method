# Padrao de Deploy - Docker Compose

Padrao completo para deploy de aplicacoes com Docker Compose e Traefik externo.

---

## Visao Geral

```
┌───────────────────────────────────────────────────────────────────────────────┐
│                              DOCKER HOST                                       │
│                                                                                │
│  ┌─────────────────────┐  ┌─────────────────────┐  ┌─────────────────────┐   │
│  │   Development       │  │     Staging         │  │    Production       │   │
│  │   branch: local     │  │   branch: develop   │  │   branch: main      │   │
│  └──────────┬──────────┘  └──────────┬──────────┘  └──────────┬──────────┘   │
│             │                        │                        │               │
│             ▼                        ▼                        ▼               │
│  docker-compose.dev.yml    docker-compose.staging.yml    docker-compose.yml   │
│  (infra apenas)            (infra + apps)                (infra + apps)       │
│  Apps rodam localmente     Stack completa                Stack completa       │
│                                     │                        │               │
│                                     ▼                        ▼               │
│                              ┌───────────────┐        ┌───────────────┐      │
│                              │    TRAEFIK    │        │    TRAEFIK    │      │
│                              │ h.${DOMAIN}   │        │  ${DOMAIN}    │      │
│                              └───────────────┘        └───────────────┘      │
└───────────────────────────────────────────────────────────────────────────────┘
```

## Matriz de Ambientes

| Aspecto | **dev** | **staging** | **production** |
|---------|---------|-------------|----------------|
| **Infraestrutura** | ✅ Roda no Docker | ✅ Roda no Docker | ✅ Roda no Docker |
| **Apps/Servicos** | ❌ Rodam localmente (`pnpm dev`) | ✅ Rodam no Docker | ✅ Rodam no Docker |
| **Init permissions** | `chmod 777` (Windows) | `chown UID:GID` (Linux) | `chown UID:GID` (Linux) |
| **Rede** | `internal` apenas | `internal` + `codr-net` | `internal` + `codr-net` |
| **Traefik labels** | ❌ Nao | ✅ Sim | ✅ Sim |
| **Dominio** | `localhost:XXxx` | `h.${DOMAIN}` | `${DOMAIN}` |
| **./data/** | ✅ Sim | ✅ Sim | ✅ Sim |
| **Branch** | local | develop | main |

**Resumo:**
- **dev** = infraestrutura apenas (apps rodam local com hot-reload)
- **staging** = stack completa (infra + apps) em `h.${DOMAIN}`
- **production** = stack completa (infra + apps) em `${DOMAIN}`

---

## Principio Fundamental

**Todo dado persistente DEVE estar em `./data/`**

---

## Regra de Ouro: Parametros em .env, NAO em docker-compose

> **docker-compose NAO e local de definir parametros.**
> **Parametros vao na estrutura .env.**

O configurador (pessoa que faz deploy) **NAO TEM AUTORIZACAO** para mexer em docker-compose.
Se nao for possivel configurar via `.env`, o projeto **falhara em modo deploy**.

### Formas Permitidas de Parametrizacao

**1. Import de .env files**

Todo container DEVE importar os 3 arquivos .env:

```yaml
services:
  app:
    env_file:
      - .env                      # 1. Base (valores padrao)
      - .env.${ENVIRONMENT}       # 2. Sobrescritas do ambiente
      - path: .env.secrets        # 3. Secrets (opcional)
        required: false
```

**2. Environment com referencia a variavel**

Quando necessario passar variavel especifica, usar referencia:

```yaml
services:
  postgres:
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
```

### Formas PROIBIDAS

```yaml
# ERRADO - Valor hardcoded
environment:
  POSTGRES_PASSWORD: Admin123

# ERRADO - Valor inline sem referencia
environment:
  - DATABASE_URL=postgresql://admin:Admin123@localhost:5432/main

# ERRADO - Porta hardcoded
ports:
  - "5432:5432"
```

### Formas CORRETAS

```yaml
# CERTO - Referencia a variavel
environment:
  POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}

# CERTO - Import de .env
env_file:
  - .env
  - .env.${ENVIRONMENT}

# CERTO - Porta via variavel
ports:
  - "${POSTGRES_PORT}:5432"
```

### Por que essa regra?

1. **Seguranca:** Configurador nao precisa ver/editar codigo
2. **Flexibilidade:** Mesmo compose funciona em qualquer ambiente
3. **Auditoria:** Todas as configs em um lugar (.env files)
4. **CI/CD:** Deploy automatizado le variaveis de ambiente, nao edita arquivos

---

## Regra de Ouro: Consistencia entre docker-compose

> **Alteracoes em docker-compose DEVEM ser refletidas nos 3 arquivos.**
> **NAO e permitido modificar um sem considerar os demais.**

Os 3 arquivos docker-compose (dev, staging, production) DEVEM ter os mesmos servicos de infraestrutura.
Quebrar essa regra causa falhas em deploy que so aparecem em ambientes especificos.

### O que DEVE ser identico

- Lista de servicos de infraestrutura (postgres, redis, mongo, etc.)
- Estrutura de pastas em ./data/
- Variaveis de ambiente referenciadas
- Healthchecks
- Networks internas

### O que PODE diferir

| Aspecto | dev | staging | production |
|---------|-----|---------|------------|
| Container names | `${PROJECT}-dev-*` | `${PROJECT}-staging-*` | `${PROJECT}-*` |
| Init permissions | `chmod 777` | `chown UID:GID` | `chown UID:GID` |
| Servicos de app | ❌ (rodam local) | ✅ | ✅ |
| Labels Traefik | ❌ | ✅ (`h.${DOMAIN}`) | ✅ (`${DOMAIN}`) |
| Rede externa | ❌ | `codr-net` | `codr-net` |
| Portas expostas | Sim (localhost) | Nao (via Traefik) | Nao (via Traefik) |

> **Padrões relacionados:** Para credenciais (PostgreSQL dual-user), seeds idempotentes e usuários de teste, ver [ENV.md](./ENV.md#postgresql-padrão-dual-user).

Em caso de desastre, o restore consiste em:
1. Clonar o repositorio
2. Restaurar `./data/` do backup
3. `docker compose up -d`

Se faltar qualquer informacao apos esse processo, o padrao falhou.

---

## Estrutura de Arquivos

```
/projeto/
├── docker-compose.yml            # Production (stack completa: infra + apps)
├── docker-compose.staging.yml    # Staging (stack completa: infra + apps)
├── docker-compose.dev.yml        # Development (infra apenas, apps rodam local)
├── DEPLOY.md                     # Parametros especificos do projeto
├── .env                          # Config base compartilhada (commitado)
├── .env.development              # Sobrescritas para dev (commitado)
├── .env.staging                  # Sobrescritas para staging (commitado)
├── .env.production               # Sobrescritas para prod (commitado)
├── .env.secrets                  # Secrets externos (NAO commitado, opcional)
├── .env.secrets.example          # Template para secrets
├── .gitignore                    # Deve incluir data/ e .env.secrets
├── data/                         # <-- BACKUP AQUI (NAO COMMITADO)
│   ├── postgres/
│   ├── redis/
│   └── ...
└── <app>/
    └── Dockerfile
```

**Importante:** O `.gitignore` deve incluir:
```gitignore
# Dados persistentes (backup separado)
data/

# Secrets locais
.env.secrets
```

Os dados sao backupeados via rsync/restic, nao via git.

---

## Fluxo de Inicializacao (Production)

```
docker compose up -d
    │
    ▼
┌──────────────────────────────────────────┐
│ init (busybox)                           │
│ - Cria estrutura de pastas em ./data/    │
│ - Ajusta permissoes por servico          │
│ - Exit 0                                 │
└──────────────────────────────────────────┘
    │ service_completed_successfully
    ▼
┌──────────────────────────────────────────┐
│ Servicos de infraestrutura               │
│ (postgres, redis...)                     │
│ depends_on: init                         │
└──────────────────────────────────────────┘
    │ service_healthy
    ▼
┌──────────────────────────────────────────┐
│ Servicos de aplicacao                    │
│ (api, worker, frontend...)               │
└──────────────────────────────────────────┘
```

### Permissoes: Linux vs Windows

O servico `init` precisa de comandos diferentes dependendo do ambiente:

**Linux (Producao)** - usar `chown` com UIDs especificos:
```yaml
command: |
  sh -c "
    mkdir -p /data/postgres /data/redis /data/n8n &&
    chown -R 999:999 /data/postgres &&
    chown -R 999:999 /data/redis &&
    chown -R 1000:1000 /data/n8n &&
    echo 'Init complete'
  "
```

**Windows/NTFS (Desenvolvimento)** - usar `chmod 777`:
```yaml
command: |
  sh -c "
    mkdir -p /data/postgres /data/redis /data/n8n &&
    chmod -R 777 /data &&
    echo 'Init complete'
  "
```

> **Por que?** NTFS nao suporta UIDs/GIDs do Linux. O `chown` executa sem erro mas nao tem efeito. Containers como PostgreSQL falham com "Permission denied" ao tentar acessar os arquivos.

---

## Docker Compose - Production

Stack completa com servico `init` e volumes em `./data/`:

```yaml
services:
  # Cria estrutura de pastas com permissoes
  init:
    image: busybox:latest
    container_name: ${PROJECT}-init
    command: |
      sh -c "
        mkdir -p /data/postgres /data/redis /data/n8n ... &&
        chown -R 1000:1000 /data/n8n &&
        echo 'Init complete'
      "
    volumes:
      - ./data:/data
    restart: "no"

  # Infraestrutura depende do init
  postgres:
    depends_on:
      init:
        condition: service_completed_successfully
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    # ...

  # Servico exposto com labels Traefik
  app:
    container_name: ${PROJECT}-app
    labels:
      - traefik.enable=true
      - traefik.docker.network=codr-net
      - traefik.http.routers.${PROJECT}.rule=Host(`${DOMAIN}`)
      - traefik.http.routers.${PROJECT}.entrypoints=websecure
      - traefik.http.routers.${PROJECT}.tls.certresolver=letsencrypt
      - traefik.http.services.${PROJECT}.loadbalancer.server.port=${PORT}
    networks:
      - codr-net

networks:
  codr-net:
    external: true
```

---

## Docker Compose - Staging

Stack completa com infraestrutura propria e servicos de aplicacao.
Identico ao production, mas com prefixo `-staging` nos nomes e dominio `h.${DOMAIN}`.

```yaml
services:
  # =============================================================================
  # Init - Cria estrutura de pastas com permissoes (Linux)
  # =============================================================================
  init:
    image: busybox:latest
    container_name: ${PROJECT}-staging-init
    command: |
      sh -c "
        mkdir -p /data/postgres /data/redis /data/... &&
        chown -R 999:999 /data/postgres &&
        chown -R 999:999 /data/redis &&
        echo 'Init complete'
      "
    volumes:
      - ./data:/data
    restart: "no"

  # =============================================================================
  # Infraestrutura (mesma do production)
  # =============================================================================
  postgres:
    image: postgres:16-alpine
    container_name: ${PROJECT}-staging-postgres
    depends_on:
      init:
        condition: service_completed_successfully
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    networks:
      internal:
        aliases:
          - postgres.internal
    # ... (healthcheck, environment)

  redis:
    # ... (mesmo padrao)

  # =============================================================================
  # Servicos de aplicacao (com labels Traefik)
  # =============================================================================
  app:
    build:
      context: ./app
      dockerfile: Dockerfile
    image: ${PROJECT}-staging-app:latest
    container_name: ${PROJECT}-staging-app
    env_file:
      - .env                      # 1. Base
      - .env.staging              # 2. Sobrescritas staging
      - path: .env.secrets        # 3. Secrets (opcional)
        required: false
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    labels:
      - traefik.enable=true
      - traefik.docker.network=codr-net
      - traefik.http.routers.${PROJECT}-staging.rule=Host(`h.${DOMAIN}`)
      - traefik.http.routers.${PROJECT}-staging.entrypoints=websecure
      - traefik.http.routers.${PROJECT}-staging.tls.certresolver=letsencrypt
      - traefik.http.services.${PROJECT}-staging.loadbalancer.server.port=${PORT}
    networks:
      internal:
        aliases:
          - app.internal
      codr-net:

networks:
  internal:
    driver: bridge
  codr-net:
    external: true
```

**Diferencas do Production:**
- Prefixo `-staging` em todos os container names
- Dominio `h.${DOMAIN}` ao inves de `${DOMAIN}`
- Router names com `-staging` (ex: `${PROJECT}-staging` ao inves de `${PROJECT}`)
- Usa `.env.staging` ao inves de `.env.production`

---

## Referencia de UIDs/Paths

| Servico | Path interno | Usuario | O que contem |
|---------|--------------|---------|--------------|
| PostgreSQL | `/var/lib/postgresql/data` | 999:999 | Database files |
| MySQL | `/var/lib/mysql` | 999:999 | Database files |
| Redis | `/data` | 999:999 | AOF + RDB |
| MongoDB | `/data/db` | 999:999 | Database files |
| n8n | `/home/node/.n8n` | 1000:1000 | Workflows + credentials |
| MinIO | `/data` | 1000:1000 | Object storage |
| Grafana | `/var/lib/grafana` | 472:472 | Dashboards + configs |
| Prometheus | `/prometheus` | 65534:65534 | Metrics |
| Evolution | `/evolution/instances` + `/evolution/store` | root | WhatsApp sessions |
| Keycloak | `/opt/keycloak/data` | 1000:1000 | Realm configs |
| Elasticsearch | `/usr/share/elasticsearch/data` | 1000:1000 | Indices |
| InfluxDB | `/var/lib/influxdb2` | 1000:1000 | Time series |
| Meilisearch | `/meili_data` | root | Search indices |
| Ollama | `/root/.ollama` | root | LLM models |

---

## Ollama - LLMs Locais

Ollama permite rodar modelos de linguagem localmente sem GPU. Configuracao via variaveis de ambiente com prefixo `OLLAMA_`.

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
| `OLLAMA_CPU_CORES` | Cores disponiveis |
| `OLLAMA_MAX_PARAMS_B` | Maximo de bilhoes de parametros (ex: 7 = 7B max) |
| `OLLAMA_MAX_CTX` | Contexto maximo permitido |
| `OLLAMA_MIN_QUANT` | Quantizacao minima (Q4, Q5, Q8) |
| `OLLAMA_MAX_CONCURRENCY` | Requests simultaneos |
| `OLLAMA_MAX_OUTPUT_TOKENS` | Tokens de saida por request |

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

### Portas

> Ver [ECOSYSTEM.md](./ECOSYSTEM.md#padrao-de-portas) para o padrao completo.

| Ambiente | Porta |
|----------|-------|
| Internal | 11434 |
| Dev | XX56 (ex: 2256 para PREFIX=22) |

---

## Convencoes

### Nomes

```
Containers:   <projeto>-<servico>           (prod)
              <projeto>-staging-<servico>   (staging)

Routers:      <projeto>-<servico>           (prod)
              <projeto>-staging-<servico>   (staging)

Dominios:     <dominio>                     (prod)
              h.<dominio>                   (staging)
```

### Volumes

```yaml
# ERRADO - Volume nomeado
volumes:
  - postgres_data:/var/lib/postgresql/data

# CERTO - Bind mount relativo
volumes:
  - ./data/postgres:/var/lib/postgresql/data
```

---

## Backup/Restore

```bash
# Backup
rsync -av ./data/ /backup/PROJETO/

# Restore
rsync -av /backup/PROJETO/ ./data/
docker compose up -d
```

---

## Migracao de Named Volumes para Bind Mounts

Se o projeto ja usa named volumes e precisa migrar para `./data/`:

### 1. Exportar dados dos volumes existentes

```bash
# Parar containers
docker compose down

# Para cada volume, exportar para ./data/
docker run --rm -v postgres_data:/source -v $(pwd)/data/postgres:/dest busybox cp -a /source/. /dest/
docker run --rm -v redis_data:/source -v $(pwd)/data/redis:/dest busybox cp -a /source/. /dest/
docker run --rm -v n8n_data:/source -v $(pwd)/data/n8n:/dest busybox cp -a /source/. /dest/
```

### 2. Atualizar docker-compose.yml

Trocar volumes nomeados por bind mounts:
```yaml
# ANTES
volumes:
  - postgres_data:/var/lib/postgresql/data

# DEPOIS
volumes:
  - ./data/postgres:/var/lib/postgresql/data
```

Remover secao `volumes:` no final do arquivo.

### 3. Limpar e reiniciar

```bash
# Remover volumes antigos (opcional, apos confirmar que ./data/ funciona)
docker volume rm postgres_data redis_data n8n_data

# Subir com novos bind mounts
docker compose up -d
```

### Alternativa: Reset completo (dev/staging)

Se os dados podem ser perdidos:
```bash
docker compose down
rm -rf data/
docker compose up -d
# Seed vai repopular a base (ver ENV.md#seeds-padrão-por-ambiente)
```

---

## Checklist - Novo Projeto

### Arquivos de Configuração

- [ ] Criar `.env` com config base (commitado)
- [ ] Criar `.env.development` com sobrescritas para dev (commitado)
- [ ] Criar `.env.staging` com sobrescritas para staging (commitado)
- [ ] Criar `.env.production` com sobrescritas para prod (commitado)
- [ ] Criar `.env.secrets.example` com placeholders (commitado)
- [ ] Verificar `.gitignore` inclui `.env.secrets` e `data/`

### Docker Compose

- [ ] Criar `docker-compose.yml` (production) com init + infra + apps + ./data/
- [ ] Criar `docker-compose.staging.yml` (espelho de production com prefixo -staging)
- [ ] Criar `docker-compose.dev.yml` (infra apenas, apps rodam localmente)
- [ ] Todos os compose usam `env_file: [.env, .env.{env}, .env.secrets]`
- [ ] Mesmos servicos de infraestrutura em dev, staging e production
- [ ] Staging e production identicos (exceto nomes, dominio, env_file)

### Deploy

- [ ] Criar `DEPLOY.md` com parametros especificos
- [ ] Adicionar Deploy Key ao repositorio Git
- [ ] Configurar pipeline CI/CD (staging: branch develop, production: branch main)
- [ ] Adicionar variáveis de ambiente (**APENAS** do `.env.secrets`)
- [ ] Testar deploy staging
- [ ] Configurar deploy production

---

## Checklist - Analise de Servico

Para CADA servico no docker-compose:
- [ ] Este servico armazena dados que nao podem ser perdidos?
- [ ] Onde o container armazena esses dados internamente?
- [ ] Qual usuario/grupo o container usa (para permissoes)?

---

## Validacao Final

1. Se eu perder TUDO exceto o git repo e ./data/, consigo restaurar?
2. Ha algum dado em /var/lib/docker/volumes/ que deveria estar em ./data/?
3. Ha credentials, API keys, ou configs que nao estao no .env.{environment}/.env.secrets ou ./data/?

Se qualquer resposta for "nao" (1) ou "sim" (2 e 3), o padrao nao foi aplicado.

---

## Troubleshooting

### 404 no Traefik

```bash
# Container na rede?
docker network inspect codr-net

# Labels corretas?
docker inspect <container> | jq '.[0].Config.Labels'
```

### Deploy falha sem logs

1. Verificar se arquivo compose existe no branch
2. Verificar sintaxe YAML (sem acentos/caracteres especiais)
3. Verificar docker_compose_location

### Container nao inicia

1. Verificar depends_on com service_healthy
2. Para staging, remover dependencias de servicos locais
3. Verificar variaveis de ambiente obrigatorias

### PostgreSQL: "Permission denied" ou "could not open file"

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

### Migracao corrompida ou incompleta

**Sintoma:** Seed ou app falha com "column X does not exist" ou "relation Y does not exist"

**Solucao:** Resetar base e rodar migrations do zero:
```bash
docker compose down
rm -rf data/postgres
docker compose up -d
# Migrations rodam automaticamente no entrypoint
```

### Traefik 404 - Container nao conecta na rede externa

**Sintoma:**
- Traefik retorna 404
- Container nao aparece na rede `codr-net`

Ao verificar no servidor:
```bash
docker inspect <container> | grep -A10 Networks
```

**Causa:** Container nao esta conectado a rede externa `codr-net`.

**Solucao:**
1. Verificar se a rede esta declarada como externa no docker-compose
2. Verificar se o container esta associado a rede

**Workaround temporario:**
```bash
docker network connect codr-net <container-name>
```

---

## Anti-patterns

**NAO faca:**
- Volumes nomeados (`volume_name:/path`)
- Dados em paths absolutos (`/var/data/projeto:/path`)
- Configs hardcoded no container
- Secrets fora do .env.{environment}/.env.secrets ou ./data/
- Staging diferente de production (exceto nomes e dominio)
- Infraestrutura compartilhada entre staging e production

**FACA:**
- Bind mounts relativos (`./data/servico:/path`)
- Servico init para criar estrutura
- Staging como espelho de production (mesma infra, mesmos servicos)
- Tudo restauravel com git clone + restore de ./data/
- Consistencia total entre os 3 docker-compose (dev, staging, production)

---

## Docker Compose - Development

Ambiente local onde a **aplicacao roda fora do Docker** (ex: `npm run dev`) enquanto a **infraestrutura roda no Docker** (banco, cache, filas, etc).

### Principio

Separar o que precisa de hot-reload (codigo) do que e estatico (infra):

```
┌─────────────────────────────────────────────────────────┐
│  DOCKER (docker-compose.dev.yml)                        │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐                   │
│  │ postgres│ │  redis  │ │  etc... │                   │
│  │  :XX50  │ │  :XX51  │ │         │                   │
│  └─────────┘ └─────────┘ └─────────┘                   │
└────────────────────────┬────────────────────────────────┘
                         │ localhost:XX50-XX99
                         ▼
┌─────────────────────────────────────────────────────────┐
│  LOCAL (npm run dev)                                    │
│  ┌─────────────────────────────────────────────────┐   │
│  │  App (hot-reload)                    :XX00      │   │
│  └─────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────┘
```

### Nomenclatura

```
Containers: {projeto}-{servico}-dev
Exemplo:    myapp-postgres-dev, myapp-redis-dev
```

### Padrao de Portas

> **Fonte da verdade:** Ver [ECOSYSTEM.md](./ECOSYSTEM.md#padrao-de-portas) para o padrao completo de portas.

Resumo:
- **XX** = prefixo do projeto (definido em `.env` como `PORT_PREFIX`)
- **Servicos proprios:** XX00-XX49 (App=XX00, Socket=XX01, Backbone=XX02, ...)
- **Servicos externos:** XX50-XX99 (PostgreSQL=XX50, Redis=XX51, MongoDB=XX52, ...)

### Como Construir

1. **Definir `PORT_PREFIX`** no `.env` (ex: 22, 80, 90)
2. **Identificar servicos de infraestrutura** no docker-compose.yml de producao
3. **Copiar para docker-compose.dev.yml** sem servicos proprios (apenas externos)
4. **Renomear containers** para `-dev`
5. **Expor portas** seguindo o padrao XX50-XX99
6. **Usar chmod 777** no init (Windows/NTFS compativel)

### Estrutura Generica

```yaml
# docker-compose.dev.yml
services:
  ${PROJECT}-init-dev:
    image: busybox:latest
    command: sh -c "mkdir -p /data/... && chmod -R 777 /data"
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
    networks:
      - internal

  ${PROJECT}-redis-dev:
    image: redis:7-alpine
    ports:
      - "${PORT_PREFIX}51:6379"
    # ...

networks:
  internal:
    driver: bridge
```

### Scripts npm

```json
{
  "scripts": {
    "dev": "<comando para rodar app localmente>",
    "dev:infra": "docker compose -f docker-compose.dev.yml up -d",
    "dev:infra:down": "docker compose -f docker-compose.dev.yml down",
    "dev:infra:logs": "docker compose -f docker-compose.dev.yml logs -f"
  }
}
```

### Fluxo de Uso

```bash
# 1. Levantar infraestrutura
npm run dev:infra

# 2. Rodar app localmente (hot-reload)
npm run dev

# App conecta em localhost:XX50 (postgres), localhost:XX51 (redis), etc.
# Ex (PORT_PREFIX=22): DATABASE_URL=postgres://...@localhost:2250/main
```

### Checklist

- [ ] `PORT_PREFIX` definido no `.env`
- [ ] Todos os servicos externos do production estao no dev?
- [ ] Todas as portas seguem o padrao XX50-XX99?
- [ ] O app conecta via localhost nas portas expostas?
- [ ] O .env.development aponta para localhost:{portas}?
