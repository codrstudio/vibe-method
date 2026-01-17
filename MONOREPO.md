# Monorepo

Estrutura de monorepo com pnpm workspaces para projetos multi-serviço.

---

## Princípios

| Princípio | Descrição |
|-----------|-----------|
| **apps/** | Serviços deployáveis (rodam, têm porta, processo) |
| **packages/** | Código compartilhado (importado, não roda sozinho) |
| **pnpm workspaces** | Gerenciamento de dependências sem ferramentas extras |
| **Sem Turbo/Nx** | Simplicidade sobre otimização prematura |
| **concurrently** | Dev paralelo sem mágica |

---

## Estrutura

```
projeto/
├── apps/
│   ├── app/                # Next.js (frontend)
│   │   ├── src/
│   │   └── package.json
│   ├── sockets/            # WebSocket server
│   │   ├── src/
│   │   └── package.json
│   ├── backbone/           # Servicos gerais (notifications, scheduling)
│   │   ├── src/
│   │   └── package.json
│   ├── agents/             # LangGraph + Fastify (IA)
│   │   ├── src/
│   │   └── package.json
│   └── actions/            # Mutations service
│       ├── src/
│       └── package.json
├── packages/
│   └── types/              # Schemas Zod compartilhados
│       ├── src/
│       └── package.json
├── specs/
├── brainstorming/
├── plans/
├── package.json            # Workspaces config
├── pnpm-workspace.yaml
├── docker-compose.yml
└── .env.*
```

---

## Serviços (apps/)

Cada app é um serviço independente com porta própria.

| App | Responsabilidade | Framework | Porta (dev) |
|-----|------------------|-----------|-------------|
| **app** | Frontend, UI, SSR | Next.js | XX00 |
| **sockets** | WebSocket, real-time | Socket.io | XX01 |
| **backbone** | Servicos gerais (notifications, scheduling) | Fastify | XX02 |
| **agents** | Agentes IA, LangGraph | Fastify | XX03 |
| **actions** | Mutations, catálogo de ações | Fastify | XX04 |

**Nota**: XX = prefixo do projeto (ex: 22 para Coletivos → 2200, 2201, 2202, 2203, 2204). Ver [ECOSYSTEM.md](./ECOSYSTEM.md) para padrão completo.

### Quando criar novo app

- Precisa de porta própria
- Escala independente
- Processo separado no Docker

---

## Packages Compartilhados (packages/)

### types/

Schemas Zod e tipos TypeScript compartilhados entre apps.

```
packages/types/
├── src/
│   ├── index.ts            # Re-exports
│   ├── schemas/
│   │   ├── thread.ts       # ThreadSchema, CommentSchema
│   │   ├── user.ts         # UserSchema, RoleSchema
│   │   ├── action.ts       # ActionInput, ActionOutput
│   │   └── ...
│   └── constants/
│       └── states.ts       # Estados das FSMs
└── package.json
```

**Por que Zod**:

```typescript
// Um schema, dois usos
import { z } from 'zod';

export const ThreadSchema = z.object({
  id: z.string().uuid(),
  status: z.enum(['open', 'closed']),
  labels: z.array(z.string()),
});

// 1. Tipo TypeScript (compile-time)
export type Thread = z.infer<typeof ThreadSchema>;

// 2. Validação runtime
const validated = ThreadSchema.parse(input);
```

### Quando criar novo package

- Código usado por 2+ apps
- Types/schemas compartilhados
- Utils genéricos (não regras de negócio)

---

## Configuração

### pnpm-workspace.yaml

```yaml
packages:
  - 'apps/*'
  - 'packages/*'
```

### package.json (raiz)

```json
{
  "name": "projeto",
  "private": true,
  "scripts": {
    "dev": "concurrently -n app,agents,actions,sockets -c blue,green,yellow,magenta \"pnpm -F @projeto/app dev\" \"pnpm -F @projeto/agents dev\" \"pnpm -F @projeto/actions dev\" \"pnpm -F @projeto/sockets dev\"",
    "dev:app": "pnpm -F @projeto/app dev",
    "dev:agents": "pnpm -F @projeto/agents dev",
    "dev:actions": "pnpm -F @projeto/actions dev",
    "dev:sockets": "pnpm -F @projeto/sockets dev",
    "build": "pnpm -r build",
    "docker:up": "docker compose -f docker-compose.dev.yml up -d",
    "docker:down": "docker compose -f docker-compose.dev.yml down"
  },
  "devDependencies": {
    "concurrently": "^8.0.0"
  }
}
```

### Package interno (ex: packages/types/package.json)

```json
{
  "name": "@projeto/types",
  "version": "0.0.0",
  "private": true,
  "main": "./src/index.ts",
  "types": "./src/index.ts",
  "dependencies": {
    "zod": "^3.23.0"
  }
}
```

### App (ex: apps/app/package.json)

```json
{
  "name": "@projeto/app",
  "version": "0.0.0",
  "private": true,
  "scripts": {
    "dev": "next dev -p 2000",
    "build": "next build",
    "start": "next start -p 2000"
  },
  "dependencies": {
    "@projeto/types": "workspace:*",
    "next": "^15.0.0"
  }
}
```

---

## Import entre packages

```typescript
// apps/app/src/...
import { ThreadSchema, type Thread } from '@projeto/types';

// apps/actions/src/...
import { ActionInputSchema } from '@projeto/types';
```

**Regra**: Apps importam de packages. Packages nunca importam de apps.

```
packages/types  ←──  apps/app
                ←──  apps/agents
                ←──  apps/actions
                ←──  apps/sockets
```

---

## Comandos

### Desenvolvimento

```bash
# Subir infra (PostgreSQL, Redis, MongoDB)
pnpm docker:up

# Rodar todos os apps em paralelo
pnpm dev

# Rodar app específico
pnpm dev:app
pnpm dev:agents
```

### Instalação

```bash
# Instalar tudo (raiz + apps + packages)
pnpm install

# Adicionar dependência a um app
pnpm -F @projeto/app add axios

# Adicionar dependência a um package
pnpm -F @projeto/types add zod
```

### Build

```bash
# Build de todos os apps
pnpm build

# Build específico
pnpm -F @projeto/app build
```

---

## Docker Compose

### docker-compose.dev.yml (infra apenas)

```yaml
services:
  postgres:
    image: postgres:16
    ports:
      - "${BASE}032:5432"
    volumes:
      - ./data/postgres:/var/lib/postgresql/data
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres

  redis:
    image: redis:7-alpine
    ports:
      - "${BASE}079:6379"
    volumes:
      - ./data/redis:/data

  mongodb:
    image: mongo:7
    ports:
      - "${BASE}017:27017"
    volumes:
      - ./data/mongodb:/data/db
```

### docker-compose.yml (produção)

```yaml
services:
  app:
    build: ./apps/app
    ports:
      - "${BASE}000:3000"
    depends_on:
      - postgres

  agents:
    build: ./apps/agents
    ports:
      - "${BASE}070:3000"

  actions:
    build: ./apps/actions
    ports:
      - "${BASE}080:3000"

  sockets:
    build: ./apps/sockets
    ports:
      - "${BASE}001:3000"

  # ... infra services
```

---

## Workflow de Desenvolvimento

```
1. pnpm docker:up          # Sobe infra
2. pnpm dev                # Sobe todos os apps
3. (desenvolve)
4. Ctrl+C                  # Para apps
5. pnpm docker:down        # Para infra (opcional)
```

### Novo app

```bash
# 1. Criar diretório
mkdir -p apps/novo-app/src

# 2. Criar package.json
# 3. Adicionar ao script dev na raiz
# 4. Adicionar ao docker-compose.yml
```

### Novo package

```bash
# 1. Criar diretório
mkdir -p packages/novo-pkg/src

# 2. Criar package.json com name @projeto/novo-pkg
# 3. pnpm install (atualiza lockfile)
```

---

## Boas Práticas

### DO

- Manter packages pequenos e focados
- Usar `workspace:*` para dependências internas
- Rodar `pnpm install` após criar novo package
- Nomear apps/packages com prefixo `@projeto/`

### DON'T

- Criar dependências circulares entre packages
- Importar de apps em packages
- Usar versões fixas para dependências internas
- Criar packages para código usado em apenas 1 app

---

## Troubleshooting

### "Module not found: @projeto/types"

```bash
# Reinstalar dependências
pnpm install
```

### "Port already in use"

Verificar se outro processo está usando a porta. **NUNCA** alterar a porta para forçar funcionamento.

### "pnpm: command not found"

```bash
npm install -g pnpm
```

### Dependência não atualiza

```bash
# Limpar cache e reinstalar
rm -rf node_modules pnpm-lock.yaml
pnpm install
```
