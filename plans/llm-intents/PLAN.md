# PLAN: LLM Intents

> Implementação do sistema de intenções para uso de LLM com bindings configuráveis.

**Referência**: [brainstorming/llm-intents-architecture.md](../../brainstorming/llm-intents-architecture.md)

---

## Fase 1: Database (Motor) ✅

### 1.1 Migration - Tabelas base
- [x] Criar `database/main/migrations/012_llm_intents.sql`
  - Tabela `llm_intents` (slug, title, subtitle, icon, description, profile)
  - Tabela `llm_bindings` (intent_id, provider, model, temperature, max_tokens, is_active, priority)
  - Índices e triggers de updated_at
  - Comentários nas tabelas

### 1.2 Seed - Intents iniciais
- [x] Criar `database/main/seeds/004_llm_intents.sql`
  - Intent `classify` - Classificar mensagem
  - Intent `generate` - Gerar resposta
  - Intent `extract` - Extrair dados estruturados
  - Intent `plan` - Planejar ações
  - Intent `decide` - Tomada de decisão

---

## Fase 2: Backend - Core (Motor) ✅

### 2.1 Types
- [x] Criar `apps/backbone/src/llm/types.ts`
  - Interface `LLMIntent`
  - Interface `LLMBinding`
  - Interface `IntentProfile`
  - Interface `Provider`
  - Interface `Model`
  - Interface `ModelsCatalog`
  - Interface `ResolvedLLM`

### 2.2 Catalog Loader (Hot Reload)
- [x] Criar `apps/backbone/src/llm/models-catalog.json`
  - Provider `openrouter` com modelos curados
  - Provider `ollama` com modelos locais
- [x] Criar `apps/backbone/src/llm/catalog-loader.ts`
  - Classe `CatalogLoader` com EventEmitter
  - Método `load()` - carrega catalog do arquivo
  - Método `watch()` - observa mudanças no arquivo
  - Método `getModelsForProfile()` - filtra modelos por profile
  - Export singleton `catalogLoader`

### 2.3 Repository
- [x] Criar `apps/backbone/src/llm/repository.ts`
  - `intentsRepository.findAll()`
  - `intentsRepository.findBySlug()`
  - `bindingsRepository.findByIntent()`
  - `bindingsRepository.create()`
  - `bindingsRepository.update()`
  - `bindingsRepository.delete()`
  - `bindingsRepository.setActive()`

### 2.4 Resolver
- [x] Criar `apps/backbone/src/llm/resolver.ts`
  - Função `resolveLLM(intentSlug)` - retorna provider + model + config
  - Fallback para modelo padrão se não houver binding
  - Cache em memória com invalidação

### 2.5 Provider Factory
- [x] Criar `apps/backbone/src/llm/providers/index.ts`
  - Export barrel
- [x] Criar `apps/backbone/src/llm/providers/openrouter.ts`
  - Função `createOpenRouterLLM(model, config)`
  - Usa `ChatOpenAI` do LangChain com baseURL customizado
- [x] Criar `apps/backbone/src/llm/providers/ollama.ts`
  - Função `createOllamaLLM(model, config)`
  - Usa `ChatOllama` do LangChain
- [x] Criar `apps/backbone/src/llm/providers/factory.ts`
  - Função `createLLM(provider, model, config)` - factory pattern

### 2.6 Service
- [x] Criar `apps/backbone/src/llm/service.ts`
  - `llmService.getIntents()` - lista intents com bindings
  - `llmService.getIntent(slug)` - detalhe de um intent
  - `llmService.getCatalog()` - retorna catalog atual
  - `llmService.getModelsForIntent(slug)` - modelos filtrados pelo profile
  - `llmService.createBinding()`
  - `llmService.updateBinding()`
  - `llmService.deleteBinding()`
  - `llmService.resolve(intentSlug)` - resolve e cria instância LLM

### 2.7 Index (Export barrel)
- [x] Criar `apps/backbone/src/llm/index.ts`
  - Exports públicos do módulo

---

## Fase 3: Backend - API (Actions) ✅

> Segue padrão existente: `ActionDefinition` com name, description, keywords (min 3), inputSchema, outputSchema, permissions, execute. Registra via `registry.register()`.

### 3.1 Actions - Leitura
- [x] Criar `apps/backbone/src/actions/catalog/llm/listIntents.ts`
  - name: `llm.listIntents`
  - Lista todos os intents com seus bindings ativos
  - permissions: `['llm:read']`
- [x] Criar `apps/backbone/src/actions/catalog/llm/getIntent.ts`
  - name: `llm.getIntent`
  - Retorna detalhe de um intent por slug
  - permissions: `['llm:read']`
- [x] Criar `apps/backbone/src/actions/catalog/llm/getCatalog.ts`
  - name: `llm.getCatalog`
  - Retorna catalog de modelos (providers + models)
  - permissions: `['llm:read']`
- [x] Criar `apps/backbone/src/actions/catalog/llm/getModelsForIntent.ts`
  - name: `llm.getModelsForIntent`
  - Retorna modelos compatíveis filtrados pelo profile do intent
  - permissions: `['llm:read']`

### 3.2 Actions - Escrita
- [x] Criar `apps/backbone/src/actions/catalog/llm/createBinding.ts`
  - name: `llm.createBinding`
  - Cria binding intent → provider/model
  - permissions: `['llm:write']`
- [x] Criar `apps/backbone/src/actions/catalog/llm/updateBinding.ts`
  - name: `llm.updateBinding`
  - Atualiza binding existente (model, temperature, etc)
  - permissions: `['llm:write']`
- [x] Criar `apps/backbone/src/actions/catalog/llm/deleteBinding.ts`
  - name: `llm.deleteBinding`
  - Remove binding
  - permissions: `['llm:write']`

### 3.3 Index e Registro
- [x] Criar `apps/backbone/src/actions/catalog/llm/index.ts`
  - Import de todas as actions
  - Re-export para acesso de tipos
- [x] Atualizar `apps/backbone/src/actions/catalog/index.ts`
  - Adicionar `import './llm/index.js';`
  - Adicionar `export * from './llm/index.js';`
- [x] Adicionar permissões `llm:read` e `llm:write` em `seeds/001_permissions.sql`

### 3.4 Routes (opcional, se necessário REST direto)
- [ ] Criar `apps/backbone/src/routes/llm.ts`
  - GET `/api/llm/intents` - lista intents
  - GET `/api/llm/intents/:slug` - detalhe intent
  - GET `/api/llm/catalog` - catalog de modelos
  - GET `/api/llm/intents/:slug/models` - modelos compatíveis
  - POST `/api/llm/bindings` - criar binding
  - PUT `/api/llm/bindings/:id` - atualizar binding
  - DELETE `/api/llm/bindings/:id` - remover binding
- [ ] Registrar rotas no `apps/backbone/src/routes/index.ts`

---

## Fase 4: Frontend - API Client

### 4.1 Types
- [ ] Criar `apps/app/lib/api/llm/types.ts`
  - Types espelhando backend

### 4.2 API Functions
- [ ] Criar `apps/app/lib/api/llm/index.ts`
  - `fetchIntents()`
  - `fetchIntent(slug)`
  - `fetchCatalog()`
  - `fetchModelsForIntent(slug)`
  - `createBinding()`
  - `updateBinding()`
  - `deleteBinding()`

---

## Fase 5: Frontend - UI

### 5.1 Página de Configuração
- [ ] Criar `apps/app/app/(app)/settings/llm/page.tsx`
  - Lista de intents como cards
  - Cada card mostra: icon, title, subtitle
  - Dropdown de provider e modelo
  - Indicador de binding ativo
  - Info do profile (filtros aplicados)

### 5.2 Componentes
- [ ] Criar `apps/app/components/llm/intent-card.tsx`
  - Card de intent com dropdowns de configuração
- [ ] Criar `apps/app/components/llm/catalog-status.tsx`
  - Status do catalog (versão, última atualização, contagem de modelos)
- [ ] Criar `apps/app/components/llm/model-selector.tsx`
  - Dropdown de seleção de modelo filtrado por provider

### 5.3 Hooks
- [ ] Criar `apps/app/hooks/use-llm-intents.ts`
  - Hook para gerenciar estado dos intents
- [ ] Criar `apps/app/hooks/use-llm-catalog.ts`
  - Hook para catalog de modelos

---

## Fase 6: Refatoração dos Agentes

### 6.1 Atualizar getLLM
- [ ] Modificar `apps/backbone/src/lib/llm.ts`
  - Deprecar `getLLM()` atual
  - Redirecionar para `llmService.resolve()`

### 6.2 Atualizar Copilot
- [ ] Modificar `apps/backbone/src/agents/copilot/index.ts`
  - Trocar `getLLM()` por `llmService.resolve('generate')`

### 6.3 Atualizar Triager
- [ ] Modificar `apps/backbone/src/agents/triager/index.ts`
  - Trocar `getLLM()` por `llmService.resolve('classify')` no classifyNode
  - Trocar `getLLM()` por `llmService.resolve('plan')` no planNode

---

## Fase 7: Inicialização e Testes

### 7.1 Bootstrap
- [ ] Modificar `apps/backbone/src/index.ts`
  - Inicializar `catalogLoader.load()`
  - Inicializar `catalogLoader.watch()` em dev

### 7.2 Health Check
- [ ] Adicionar probe de saúde do catalog em `apps/backbone/src/health/`
  - Verificar se catalog está carregado
  - Verificar se providers estão acessíveis

### 7.3 Testes Manuais
- [ ] Testar hot reload do catalog
- [ ] Testar criação de binding via UI
- [ ] Testar resolução de intent
- [ ] Testar fallback quando não há binding
- [ ] Testar filtro de modelos por profile

---

## Fase 8: Documentação

### 8.1 Specs
- [ ] Criar `specs/refs/llm-intents.md`
  - Documentação de referência para uso do sistema

### 8.2 Atualizar CLAUDE.md
- [ ] Adicionar seção sobre LLM Intents
  - Como adicionar novo intent
  - Como configurar binding

---

## Dependências

```
Fase 1 (Database)
    ↓
Fase 2 (Backend Core)
    ↓
Fase 3 (Backend API)
    ↓
Fase 4 (Frontend API) ←──┐
    ↓                    │
Fase 5 (Frontend UI)     │
                         │
Fase 6 (Refatoração) ────┘
    ↓
Fase 7 (Testes)
    ↓
Fase 8 (Docs)
```

---

## Arquivos a Criar

```
database/main/
├── migrations/
│   └── 012_llm_intents.sql
└── seeds/
    └── 004_llm_intents.sql

apps/backbone/src/llm/
├── index.ts
├── types.ts
├── models-catalog.json
├── catalog-loader.ts
├── repository.ts
├── resolver.ts
├── service.ts
└── providers/
    ├── index.ts
    ├── factory.ts
    ├── openrouter.ts
    └── ollama.ts

apps/backbone/src/actions/catalog/llm/
├── index.ts
├── listIntents.ts
├── getIntent.ts
├── getCatalog.ts
├── getModelsForIntent.ts
├── createBinding.ts
├── updateBinding.ts
└── deleteBinding.ts

apps/backbone/src/routes/
└── llm.ts

apps/app/lib/api/llm/
├── index.ts
└── types.ts

apps/app/app/(app)/settings/llm/
└── page.tsx

apps/app/components/llm/
├── intent-card.tsx
├── catalog-status.tsx
└── model-selector.tsx

apps/app/hooks/
├── use-llm-intents.ts
└── use-llm-catalog.ts

specs/refs/
└── llm-intents.md
```

---

## Estimativa de Complexidade

| Fase | Itens | Complexidade |
|------|-------|--------------|
| 1. Database | 2 | Baixa |
| 2. Backend Core | 7 | Média |
| 3. Backend API | 9 | Média |
| 4. Frontend API | 2 | Baixa |
| 5. Frontend UI | 5 | Média |
| 6. Refatoração | 3 | Baixa |
| 7. Testes | 3 | Baixa |
| 8. Docs | 2 | Baixa |

---

## Critérios de Conclusão

- [ ] Intents cadastrados no banco via seed
- [ ] Catalog carregando e recarregando em hot reload
- [ ] Bindings criados/editados via UI
- [ ] Agentes usando `llmService.resolve()` em vez de `getLLM()` direto
- [ ] Documentação atualizada
