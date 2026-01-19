# Monorepo

Estrutura de monorepo com npm workspaces.

---

## Principios

| Principio | Descricao |
|-----------|-----------|
| **apps/** | Servicos deployaveis (rodam, tem porta) |
| **packages/** | Codigo compartilhado (importado) |
| **npm workspaces** | Gerenciamento sem ferramentas extras |
| **concurrently** | Dev paralelo sem magia |

---

## Estrutura

```
projeto/
├── apps/
│   ├── app/                # Next.js (frontend)
│   ├── socket/             # WebSocket server
│   └── backbone/           # Hub de servicos backend
│       ├── src/
│       │   ├── index.ts    # Fastify server
│       │   ├── services/   # Notifications, scheduling, billing
│       │   ├── agents/     # Agentes IA (LangGraph)
│       │   ├── actions/    # Catalogo de mutations
│       │   └── knowledge/  # Knowledge Base (RAG)
│       └── package.json
├── packages/
│   └── types/              # Schemas Zod compartilhados
├── specs/
├── brainstorming/
├── package.json            # Workspaces config
└── docker-compose*.yml
```

---

## Servicos (apps/)

Cada app e um servico independente com porta propria.

| App | Responsabilidade | Framework | Porta |
|-----|------------------|-----------|-------|
| app | Frontend, UI, SSR | Next.js | XX00 |
| socket | WebSocket, real-time | Socket.io | XX01 |
| backbone | Hub de servicos backend | Fastify | XX02 |

**XX** = prefixo do projeto (ex: 22 = 2200, 2201, ...)

### Backbone Hub

O backbone unifica todos os servicos backend em um unico projeto:

| Modulo | Responsabilidade | Localizacao |
|--------|------------------|-------------|
| services | Notifications, scheduling, billing | `backbone/src/services/` |
| agents | Agentes IA, LangGraph | `backbone/src/agents/` |
| actions | Catalogo de mutations | `backbone/src/actions/` |
| knowledge | Knowledge Base, RAG | `backbone/src/knowledge/` |

**Vantagens:**
- Deploy simplificado (um container)
- Comunicacao direta entre modulos (sem HTTP)
- Contexto compartilhado (config, db, cache)
- Menos overhead de rede

### Quando criar novo app

- Precisa de porta propria
- Escala independente
- Linguagem/runtime diferente

---

## Packages (packages/)

### types/

Schemas Zod e tipos compartilhados entre apps.

```
packages/types/
├── src/
│   ├── index.ts            # Re-exports
│   ├── schemas/
│   │   ├── thread.ts
│   │   ├── user.ts
│   │   └── action.ts
│   └── constants/
│       └── states.ts
└── package.json
```

**Por que Zod:**

```typescript
// Um schema, dois usos
export const ThreadSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'closed']),
});

// 1. Tipo TypeScript (compile-time)
export type Thread = z.infer<typeof ThreadSchema>;

// 2. Validacao runtime
const validated = ThreadSchema.parse(input);
```

### Quando criar novo package

- Codigo usado por 2+ apps
- Types/schemas compartilhados
- Utils genericos (nao regras de negocio)

---

## Configuracao

### package.json (raiz)

```json
{
  "name": "projeto",
  "private": true,
  "workspaces": [
    "apps/*",
    "packages/*"
  ],
  "scripts": {
    "dev": "concurrently -n app,backbone,socket \"npm run dev -w @projeto/app\" \"npm run dev -w @projeto/backbone\" \"npm run dev -w @projeto/socket\"",
    "dev:app": "npm run dev -w @projeto/app",
    "dev:backbone": "npm run dev -w @projeto/backbone",
    "dev:socket": "npm run dev -w @projeto/socket",
    "build": "npm run build --workspaces --if-present",
    "docker:up": "docker compose -f docker-compose.dev.yml up -d"
  }
}
```

### Package interno

```json
{
  "name": "@projeto/types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
```

### App

```json
{
  "name": "@projeto/app",
  "dependencies": {
    "@projeto/types": "*"
  }
}
```

---

## Import entre packages

```typescript
// apps/app/src/...
import { ThreadSchema, type Thread } from '@projeto/types';

// apps/backbone/src/actions/...
import { ActionInputSchema } from '@projeto/types';
```

**Regra:** Apps importam de packages. Packages nunca importam de apps.

```
packages/types  <--  apps/app
                <--  apps/backbone
                <--  apps/socket
```

---

## Comandos

### Desenvolvimento

```bash
# Subir infra
npm run docker:up

# Rodar todos os apps
npm run dev

# Rodar app especifico
npm run dev:app
npm run dev:backbone
npm run dev:socket
```

### Instalacao

```bash
# Instalar tudo
npm install

# Adicionar dependencia a um app
npm install axios -w @projeto/app

# Adicionar a um package
npm install zod -w @projeto/types
```

### Build

```bash
# Build de todos
npm run build

# Build especifico
npm run build -w @projeto/app
```

---

## Docker Compose

### docker-compose.dev.yml (infra apenas)

Em desenvolvimento, apenas servicos externos rodam no Docker:

```yaml
services:
  ${PROJECT}-init-dev:
    image: busybox:latest
    command: sh -c "mkdir -p /data/postgres /data/redis && chmod -R 777 /data"
    volumes: ["./data:/data"]
    restart: "no"

  ${PROJECT}-postgres-dev:
    image: postgres:16-alpine
    container_name: ${PROJECT}-postgres-dev
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
      POSTGRES_DB: ${POSTGRES_DB}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER}"]
      interval: 5s
      timeout: 5s
      retries: 5

  ${PROJECT}-redis-dev:
    image: redis:7-alpine
    container_name: ${PROJECT}-redis-dev
    ports:
      - "${PORT_PREFIX}51:6379"
    volumes:
      - ./data/redis:/data

  ${PROJECT}-mongodb-dev:
    image: mongo:7
    container_name: ${PROJECT}-mongodb-dev
    ports:
      - "${PORT_PREFIX}52:27017"
    volumes:
      - ./data/mongodb:/data/db
```

### docker-compose.yml (producao)

Em producao, todos os servicos rodam no Docker com Traefik:

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
    image: postgres:16-alpine
    depends_on:
      init:
        condition: service_completed_successfully
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: ${POSTGRES_DB}
    networks:
      - internal

  redis:
    image: redis:7-alpine
    volumes:
      - ./data/redis:/data
    networks:
      - internal

  app:
    build: ./apps/app
    depends_on:
      - postgres
      - redis
    env_file:
      - .env
      - .env.production
      - path: .env.secrets
        required: false
    labels:
      - traefik.enable=true
      - traefik.http.routers.${PROJECT}.rule=Host(`${DOMAIN}`)
      - traefik.http.routers.${PROJECT}.entrypoints=websecure
      - traefik.http.routers.${PROJECT}.tls.certresolver=letsencrypt
    networks:
      - internal
      - codr-net

  backbone:
    build: ./apps/backbone
    depends_on:
      - postgres
      - redis
    env_file:
      - .env
      - .env.production
      - path: .env.secrets
        required: false
    networks:
      - internal

  socket:
    build: ./apps/socket
    depends_on:
      - redis
    env_file:
      - .env
      - .env.production
      - path: .env.secrets
        required: false
    networks:
      - internal

networks:
  internal:
    driver: bridge
  codr-net:
    external: true
```

---

## Workflow

```
1. npm run docker:up       # Sobe infra
2. npm run dev             # Sobe todos os apps
3. (desenvolve)
4. Ctrl+C                  # Para apps
5. npm run docker:down     # Para infra (opcional)
```

### Novo app

```bash
# 1. Criar diretorio
mkdir -p apps/novo-app/src

# 2. Criar package.json com name @projeto/novo-app
cat > apps/novo-app/package.json << 'EOF'
{
  "name": "@projeto/novo-app",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc"
  },
  "dependencies": {
    "@projeto/types": "*"
  }
}
EOF

# 3. Adicionar ao script dev no package.json raiz
# 4. Adicionar ao docker-compose.yml
# 5. Adicionar porta ao .env (XX0X)
```

### Novo package

```bash
# 1. Criar diretorio
mkdir -p packages/novo-pkg/src

# 2. Criar package.json
cat > packages/novo-pkg/package.json << 'EOF'
{
  "name": "@projeto/novo-pkg",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts"
}
EOF

# 3. Criar index.ts
echo "export {};" > packages/novo-pkg/src/index.ts

# 4. npm install (atualiza lockfile)
npm install
```

---

## Boas Praticas

### DO

- Manter packages pequenos e focados
- Usar `*` para dependencias internas
- Rodar `npm install` apos criar novo package
- Nomear apps/packages com prefixo `@projeto/`

### DON'T

- Criar dependencias circulares entre packages
- Importar de apps em packages
- Usar versoes fixas para dependencias internas
- Criar packages para codigo usado em apenas 1 app

---

## Troubleshooting

### "Module not found"

```bash
npm install
```

### "Port already in use"

Verificar processo. **NUNCA** alterar a porta.

### Dependencia nao atualiza

```bash
rm -rf node_modules package-lock.json
npm install
```
