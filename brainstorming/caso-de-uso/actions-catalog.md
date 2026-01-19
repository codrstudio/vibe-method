# Feature: Actions Catalog

Catalogo de mutations para agentes inteligentes e UI.

**Prefixo:** ACT

---

## Design

### DES-ACT-001: Single Point of Mutation

Toda mutation passa pela camada Actions.

**Implementacao:**
- Servico Fastify dedicado (`apps/actions/`, porta XX04)
- Unico ponto onde IA e UI podem descobrir e executar operacoes
- Mutations fora de Actions sao **invisiveis** para agentes
- Garante auditoria e permissoes em todas operacoes

**Trade-offs:**
- Indireção adicional para operacoes simples
- Mas visibilidade total para IA e auditoria completa

**Refs:** vibe-method/ACTIONS.md

---

### DES-ACT-002: Action Registry

Registry singleton que expoe catalogo de actions.

**Implementacao:**
- Cada action registrada expoe:
  - `name`: Identificador unico (`dominio.acao`)
  - `description`: Descricao legivel
  - `keywords`: Palavras-chave (min. 3) para busca semantica
  - `inputSchema`: JSON Schema (de Zod)
  - `outputSchema`: JSON Schema (de Zod)
  - `permissions`: Array de permissoes necessarias
- Actions auto-registradas ao importar

**Trade-offs:**
- Boilerplate para cada action
- Mas IA consegue descobrir e usar actions automaticamente

---

### DES-ACT-003: Action Definition Template

Template padrao para definir actions.

**Implementacao:**
```typescript
export const createLibrary = defineAction({
  name: 'kb.createLibrary',
  description: 'Cria nova biblioteca no Knowledge Base',
  keywords: ['criar', 'nova', 'biblioteca', 'kb'],
  inputSchema: z.object({ ... }),
  outputSchema: z.object({ ... }),
  permissions: ['kb.write'],
  async execute(ctx, params) { ... },
});
```

**Trade-offs:**
- Verbosidade do template
- Mas consistencia e autodocumentacao

---

### DES-ACT-004: Action Naming Convention

Convencao de nomes para actions.

**Implementacao:**
- Formato: `dominio.acao` (camelCase)
- Exemplos: `thread.addComment`, `kb.createLibrary`, `approval.approve`
- Keywords em portugues (idioma do projeto)
- Minimo 3 keywords por action

**Trade-offs:**
- Restricao na nomenclatura
- Mas facilita descoberta e organizacao

---

### DES-ACT-005: REST API Endpoints

Endpoints REST para interacao com Actions.

**Implementacao:**
- `POST /act/execute`: Executa action com parametros
- `GET /act/catalog`: Retorna actions disponiveis para usuario
- Catalogo filtrado por permissoes do usuario
- Resposta padronizada: `{ success, result, error }`

**Trade-offs:**
- Dois endpoints para manter
- Mas interface simples e consistente

---

### DES-ACT-006: Permission Filtering

Filtragem de actions por permissoes do usuario.

**Implementacao:**
- Catalogo retorna apenas actions que usuario pode executar
- Verificacao de permissao antes de executar action
- Erro 403 se usuario tenta executar action sem permissao
- Cache de permissoes para performance

**Trade-offs:**
- Verificacao em cada request
- Mas seguranca garantida em todas operacoes

**Depends:** DES-AUTH-007

---

### DES-ACT-007: Audit Logging

Registro automatico de toda execucao.

**Implementacao:**
- Log em MongoDB com:
  - `action`: Nome da action
  - `params`: Parametros (sanitizados)
  - `result`: Resultado da execucao
  - `success`: Boolean
  - `context`: userId, userRole, source, requestId
  - `executedAt`: Timestamp
  - `durationMs`: Tempo de execucao
- Source tracking: UI, Copilot, Agent, API externa

**Trade-offs:**
- Storage para logs
- Mas auditoria completa para compliance

---

### DES-ACT-008: Folder Structure

Organizacao de pastas para actions.

**Implementacao:**
```
apps/actions/src/
├── index.ts              # Fastify server
├── registry.ts           # Singleton registry
├── types.ts              # ActionDef, ActionContext
├── routes/
│   ├── execute.ts        # POST /act/execute
│   └── catalog.ts        # GET /act/catalog
└── actions/
    ├── index.ts          # Re-exports (auto-registro)
    ├── thread/
    │   ├── create.ts
    │   └── addComment.ts
    ├── approval/
    │   ├── approve.ts
    │   └── reject.ts
    └── kb/
        └── createLibrary.ts
```

**Trade-offs:**
- Muitos arquivos pequenos
- Mas organizacao clara por dominio

---

## Dependencias

**Libs:**
- `fastify` - Servidor HTTP
- `zod` - Validacao de schemas
- `zod-to-json-schema` - Conversao para JSON Schema

**Infraestrutura:**
- MongoDB (logs de auditoria)
- PostgreSQL Main (dados de negocio)

**Depends:**
- DES-AUTH-007 (permissoes)
- DES-DATA-002 (acesso ao banco)

**Refs:**
- vibe-method/ACTIONS.md
