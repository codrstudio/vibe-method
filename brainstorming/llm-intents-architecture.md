# Arquitetura LLM Intents

> Brainstorming sobre sistema de intenções para uso de LLM, seguindo o padrão Operations/Channels do WhatsApp.

---

## Contexto

O sistema já possui:
- **Operations**: Configuração do Evolution instance (WhatsApp)
- **Channels**: Instâncias conectadas

A mesma lógica será aplicada para LLM:
- **Intents**: Declaração de necessidade de LLM
- **Bindings**: Configuração de provider + modelo

---

## O Padrão

```
WhatsApp:  Operation (slug, name, nature)  ←→  Channel (instance)
LLM:       Intent (slug, title, profile)   ←→  Binding (provider + model)
```

---

## Conceitos Fundamentais

| Pergunta | Conceito | Nome |
|----------|----------|------|
| O que o código precisa? | A necessidade | **Intent** |
| O que a necessidade exige? | Os requisitos | **Profile** |
| Quem pode atender? | A fonte | **Provider** |
| O que atende de fato? | O modelo | **Model** |
| Como liga necessidade a modelo? | A configuração | **Binding** |

---

## A Verdade: Intent é o Contrato

O **Intent** é o ponto de desacoplamento. Ele é:

1. **Um label** - `classify`, `generate`, `extract`, `plan`, `decide`
2. **Um contrato** - declara o que precisa, não como fazer
3. **Um artefato** - pode ser versionado, alterado sem mudar código

```typescript
// O código declara INTENT, não modelo
async function classifyNode(state) {
  const llm = await resolveLLM('classify'); // ← Intent, não modelo
  // ...
}
```

---

## Profile: O Filtro Natural

Cada intent carrega um **Profile** - os requisitos que filtram modelos cabíveis:

```typescript
interface IntentProfile {
  // Capacidade
  minParams?: '7b' | '13b' | '70b';
  maxParams?: '7b' | '13b' | '70b';

  // Features
  requiresJSON?: boolean;      // structured output
  requiresVision?: boolean;    // multimodal
  requiresTools?: boolean;     // function calling

  // Trade-offs
  priority?: 'speed' | 'quality' | 'cost';
}
```

Exemplo:
- **classify**: `{ maxParams: '13b', requiresJSON: true, priority: 'speed' }`
- **generate**: `{ minParams: '13b', priority: 'quality' }`

---

## Estrutura Completa

```
┌─────────────────────────────────────────────────────────────────┐
│                        WORKFLOW                                 │
│  ┌─────────┐    ┌─────────┐    ┌─────────┐                     │
│  │  Node   │───▶│  Node   │───▶│  Node   │                     │
│  │         │    │ intent: │    │         │                     │
│  └─────────┘    │"classify"│   └─────────┘                     │
│                 └────┬─────┘                                    │
└──────────────────────┼──────────────────────────────────────────┘
                       │
                       ▼ resolve("classify")
┌─────────────────────────────────────────────────────────────────┐
│                    INTENT REGISTRY                              │
│                                                                 │
│  classify ─────▶ { profile: { maxParams: '13b', json: true } } │
│  generate ─────▶ { profile: { minParams: '13b' } }             │
│  extract  ─────▶ { profile: { json: true, speed: true } }      │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ lookup binding
┌─────────────────────────────────────────────────────────────────┐
│                    BINDING (configuração UI)                    │
│                                                                 │
│  classify ───▶ { provider: 'ollama', model: 'llama3:8b' }      │
│  generate ───▶ { provider: 'openrouter', model: 'claude-3.5' } │
└────────────────────────┬────────────────────────────────────────┘
                         │
                         ▼ instantiate
┌─────────────────────────────────────────────────────────────────┐
│                    PROVIDER                                     │
│                                                                 │
│  ┌──────────────┐          ┌──────────────┐                    │
│  │  OpenRouter  │          │    Ollama    │                    │
│  │   (cloud)    │          │  (embedded)  │                    │
│  │              │          │              │                    │
│  │ claude-3.5   │          │ llama3:8b    │                    │
│  │ gpt-4o       │          │ mistral:7b   │                    │
│  │ ...          │          │ ...          │                    │
│  └──────────────┘          └──────────────┘                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## Workflow Agêntico vs Simples

A diferença não é estrutural, é **semântica dos intents**:

| Workflow | Intents típicos | Característica |
|----------|-----------------|----------------|
| **Simples** | `extract`, `format`, `validate` | Transforma dados |
| **Agêntico** | `classify`, `plan`, `decide`, `reflect` | Toma decisões |

Um workflow "vira" agente quando seus intents **decidem o fluxo**, não apenas transformam dados.

---

## Estrutura de Dados

### Intent (declarado em seeds - estático)

```sql
-- database/main/migrations/0XX_llm_intents.sql

CREATE TABLE IF NOT EXISTS llm_intents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificação (interno)
  slug VARCHAR(100) NOT NULL UNIQUE,

  -- UI (pt-BR)
  title VARCHAR(100) NOT NULL,
  subtitle VARCHAR(200),
  description TEXT,
  icon VARCHAR(50) DEFAULT 'brain',  -- lucide icon name

  -- Profile (requisitos)
  profile JSONB DEFAULT '{}',

  -- Origem
  declared_by VARCHAR(100),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

COMMENT ON TABLE llm_intents IS 'Intenções de uso de LLM declaradas pelo sistema';
COMMENT ON COLUMN llm_intents.slug IS 'ID interno: classify, generate, extract, plan';
COMMENT ON COLUMN llm_intents.profile IS '{"minParams":"7b","maxParams":"70b","requiresJSON":true}';
```

### Binding (configurado na UI - dinâmico)

```sql
CREATE TABLE IF NOT EXISTS llm_bindings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  intent_id UUID NOT NULL REFERENCES llm_intents(id) ON DELETE CASCADE,

  -- Provider + Model
  provider VARCHAR(50) NOT NULL,  -- 'openrouter', 'ollama'
  model VARCHAR(100) NOT NULL,

  -- Overrides (opcional)
  temperature DECIMAL(3,2),
  max_tokens INT,

  -- Status
  is_active BOOLEAN DEFAULT true,
  priority INT DEFAULT 0,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(intent_id) WHERE is_active = true  -- só um binding ativo por intent
);
```

---

## Catálogo de Modelos (Hot Reload)

Artefato editável em runtime, sem necessidade de restart.

### Estrutura do Artefato

```json
// apps/backbone/src/llm/models-catalog.json (ou .yaml)
{
  "version": "1.0",
  "updatedAt": "2026-01-19T10:00:00Z",
  "providers": {
    "openrouter": {
      "name": "OpenRouter",
      "type": "cloud",
      "baseUrl": "https://openrouter.ai/api/v1",
      "models": [
        {
          "id": "anthropic/claude-3.5-sonnet",
          "name": "Claude 3.5 Sonnet",
          "params": "175b",
          "capabilities": ["json", "tools", "vision"],
          "costTier": "premium"
        },
        {
          "id": "anthropic/claude-3-haiku",
          "name": "Claude 3 Haiku",
          "params": "20b",
          "capabilities": ["json", "tools"],
          "costTier": "economy"
        }
      ]
    },
    "ollama": {
      "name": "Ollama (Local)",
      "type": "embedded",
      "baseUrl": "http://localhost:11434",
      "models": [
        {
          "id": "llama3:8b",
          "name": "Llama 3 8B",
          "params": "8b",
          "capabilities": ["json"]
        },
        {
          "id": "mistral:7b",
          "name": "Mistral 7B",
          "params": "7b",
          "capabilities": ["json"]
        }
      ]
    }
  }
}
```

### Loader com Watch (Hot Reload)

```typescript
// apps/backbone/src/llm/catalog-loader.ts

import { watch } from 'fs';
import { readFile } from 'fs/promises';
import { EventEmitter } from 'events';

interface ModelsCatalog {
  version: string;
  updatedAt: string;
  providers: Record<string, Provider>;
}

interface Provider {
  name: string;
  type: 'cloud' | 'embedded';
  baseUrl: string;
  models: Model[];
}

interface Model {
  id: string;
  name: string;
  params: string;
  capabilities: string[];
  costTier?: string;
}

class CatalogLoader extends EventEmitter {
  private catalog: ModelsCatalog | null = null;
  private catalogPath: string;

  constructor(catalogPath: string) {
    super();
    this.catalogPath = catalogPath;
  }

  async load(): Promise<ModelsCatalog> {
    const content = await readFile(this.catalogPath, 'utf-8');
    this.catalog = JSON.parse(content);
    console.log(`[CatalogLoader] Loaded catalog v${this.catalog.version}`);
    return this.catalog;
  }

  watch(): void {
    watch(this.catalogPath, async (eventType) => {
      if (eventType === 'change') {
        console.log('[CatalogLoader] Catalog file changed, reloading...');
        await this.load();
        this.emit('reload', this.catalog);
      }
    });
    console.log(`[CatalogLoader] Watching ${this.catalogPath}`);
  }

  getCatalog(): ModelsCatalog | null {
    return this.catalog;
  }

  getModelsForProfile(profile: IntentProfile): Model[] {
    if (!this.catalog) return [];

    const allModels: Array<Model & { provider: string }> = [];

    for (const [providerId, provider] of Object.entries(this.catalog.providers)) {
      for (const model of provider.models) {
        allModels.push({ ...model, provider: providerId });
      }
    }

    return allModels.filter((model) => {
      // Filtra por params
      if (profile.minParams && !this.meetsMinParams(model.params, profile.minParams)) {
        return false;
      }
      if (profile.maxParams && !this.meetsMaxParams(model.params, profile.maxParams)) {
        return false;
      }

      // Filtra por capabilities
      if (profile.requiresJSON && !model.capabilities.includes('json')) {
        return false;
      }
      if (profile.requiresVision && !model.capabilities.includes('vision')) {
        return false;
      }
      if (profile.requiresTools && !model.capabilities.includes('tools')) {
        return false;
      }

      return true;
    });
  }

  private meetsMinParams(modelParams: string, minParams: string): boolean {
    return this.parseParams(modelParams) >= this.parseParams(minParams);
  }

  private meetsMaxParams(modelParams: string, maxParams: string): boolean {
    return this.parseParams(modelParams) <= this.parseParams(maxParams);
  }

  private parseParams(params: string): number {
    const match = params.match(/(\d+)b/i);
    return match ? parseInt(match[1], 10) : 0;
  }
}

export const catalogLoader = new CatalogLoader(
  process.env.LLM_CATALOG_PATH ?? './src/llm/models-catalog.json'
);
```

---

## Seeds de Intents

```sql
-- database/main/seeds/004_llm_intents.sql

INSERT INTO llm_intents (slug, title, subtitle, icon, description, profile, declared_by)
VALUES
  (
    'classify',
    'Classificar',
    'Análise de intenção e urgência',
    'tag',
    'Classifica mensagens por intenção, urgência e contexto. Usado pelo triager.',
    '{"maxParams": "13b", "requiresJSON": true, "priority": "speed"}',
    'seed'
  ),
  (
    'generate',
    'Gerar Resposta',
    'Geração de texto contextualizado',
    'message-square',
    'Gera respostas baseadas em contexto recuperado. Usado pelo copilot.',
    '{"minParams": "13b", "priority": "quality"}',
    'seed'
  ),
  (
    'extract',
    'Extrair Dados',
    'Extração estruturada de informações',
    'database',
    'Extrai entidades e dados estruturados de texto livre.',
    '{"maxParams": "13b", "requiresJSON": true, "priority": "speed"}',
    'seed'
  ),
  (
    'plan',
    'Planejar Ações',
    'Planejamento de próximos passos',
    'list-todo',
    'Planeja sequência de ações baseado em contexto. Usado pelo triager.',
    '{"minParams": "7b", "maxParams": "70b", "requiresJSON": true}',
    'seed'
  ),
  (
    'decide',
    'Decidir',
    'Tomada de decisão com justificativa',
    'git-branch',
    'Toma decisões explicáveis entre opções disponíveis.',
    '{"minParams": "13b", "requiresJSON": true}',
    'seed'
  )
ON CONFLICT (slug) DO UPDATE SET
  title = EXCLUDED.title,
  subtitle = EXCLUDED.subtitle,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  profile = EXCLUDED.profile;
```

---

## Interface (UI)

```
┌────────────────────────────────────────────────────────────────────────────┐
│  Configuração de LLM                                                       │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🏷️  Classificar                                                      │  │
│  │     Análise de intenção e urgência                                   │  │
│  │                                                                      │  │
│  │     Provider          Modelo                                         │  │
│  │     [Ollama      ▼]   [llama3:8b        ▼]                          │  │
│  │                                                                      │  │
│  │     ℹ️ Modelos até 13B com suporte a JSON                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 💬  Gerar Resposta                                                   │  │
│  │     Geração de texto contextualizado                                 │  │
│  │                                                                      │  │
│  │     Provider          Modelo                                         │  │
│  │     [OpenRouter  ▼]   [claude-3.5-sonnet ▼]                         │  │
│  │                                                                      │  │
│  │     ℹ️ Modelos a partir de 13B                                       │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ 🗄️  Extrair Dados                                                    │  │
│  │     Extração estruturada de informações                              │  │
│  │                                                                      │  │
│  │     Provider          Modelo                                         │  │
│  │     [Ollama      ▼]   [mistral:7b       ▼]                          │  │
│  │                                                                      │  │
│  │     ℹ️ Modelos até 13B com suporte a JSON                            │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ ⚙️  Catálogo de Modelos                             [Atualizar]      │  │
│  │     Última atualização: 19/01/2026 10:00                            │  │
│  │     Providers: OpenRouter (4 modelos), Ollama (3 modelos)           │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

---

## Fluxo de Resolução

```typescript
// apps/backbone/src/llm/resolver.ts

import { db } from '../lib/index.js';
import { catalogLoader } from './catalog-loader.js';

interface ResolvedLLM {
  provider: string;
  model: string;
  config: {
    temperature?: number;
    maxTokens?: number;
  };
}

export async function resolveLLM(intentSlug: string): Promise<ResolvedLLM> {
  // 1. Busca binding ativo para o intent
  const binding = await db.queryOne<{
    provider: string;
    model: string;
    temperature: number | null;
    maxTokens: number | null;
  }>(
    `SELECT b.provider, b.model, b.temperature, b.max_tokens as "maxTokens"
     FROM llm_bindings b
     JOIN llm_intents i ON b.intent_id = i.id
     WHERE i.slug = $1 AND b.is_active = true
     ORDER BY b.priority DESC
     LIMIT 1`,
    [intentSlug]
  );

  // 2. Se não tem binding, usa fallback
  if (!binding) {
    console.warn(`[LLM] No binding for intent "${intentSlug}", using fallback`);
    return {
      provider: 'ollama',
      model: 'llama3:8b',
      config: {},
    };
  }

  return {
    provider: binding.provider,
    model: binding.model,
    config: {
      temperature: binding.temperature ?? undefined,
      maxTokens: binding.maxTokens ?? undefined,
    },
  };
}
```

---

## Resumo da Arquitetura

| Camada | Artefato | Hot Reload? | Quem define |
|--------|----------|-------------|-------------|
| **Intent** | `seeds/004_llm_intents.sql` | ❌ (migrate) | Dev (via seed) |
| **Catalog** | `models-catalog.json` | ✅ (watch) | DevOps |
| **Binding** | Tabela `llm_bindings` | ✅ (UI) | Admin |

**Fluxo:**
1. Intent declara necessidade + profile
2. Catalog lista modelos disponíveis
3. UI filtra modelos pelo profile
4. Admin cria binding
5. Runtime resolve intent → modelo

---

## Analogia Consolidada

```
WhatsApp                          LLM
─────────────────────────────────────────────────────
Operation (seed)      ←→      Intent (seed)
  - slug                        - slug
  - name                        - title, subtitle
  - nature                      - profile
  - eventInterests              - icon, description

Channel (runtime)     ←→      Catalog (hot reload)
  - Evolution instance          - Provider + Models

Assignment (UI)       ←→      Binding (UI)
  - operation ↔ channel         - intent ↔ model
  - priority                    - priority
  - is_active                   - is_active
```

---

## Providers Disponíveis

- **OpenRouter** (cloud): Acesso a múltiplos modelos via API unificada
- **Ollama** (embedded): Modelos locais, sem dependência de internet

---

## Próximos Passos

1. [ ] Criar migration `0XX_llm_intents.sql`
2. [ ] Criar seed `004_llm_intents.sql`
3. [ ] Implementar `catalog-loader.ts` com hot reload
4. [ ] Implementar `resolver.ts`
5. [ ] Criar rotas de API para CRUD de bindings
6. [ ] Criar página de configuração na UI
7. [ ] Refatorar agentes existentes para usar `resolveLLM(intent)`
