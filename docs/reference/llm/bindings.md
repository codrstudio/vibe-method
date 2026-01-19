# LLM Bindings

Bindings conectam intents a providers e models especificos.

---

## Conceito

```
Intent (o que)  →  Binding (como)  →  LLM (execucao)
   classify         ollama/llama3      ChatOllama
   generate         openrouter/gpt-4   ChatOpenRouter
```

---

## Estrutura

```typescript
interface LLMBinding {
  intent_slug: string;    // Referencia ao intent
  provider: string;       // ollama, openrouter, openai
  model: string;          // llama3, gpt-4o-mini, etc
  temperature?: number;
  max_tokens?: number;
  priority: number;       // Fallback order (1 = primario)
  active: boolean;
}
```

---

## Providers Suportados

| Provider | Uso | Config |
|----------|-----|--------|
| `ollama` | Local, dev, privacidade | `OLLAMA_BASE_URL` |
| `openrouter` | Multi-model, producao | `OPENROUTER_API_KEY` |
| `openai` | Direto OpenAI | `OPENAI_API_KEY` |

---

## Configuracao

**Via seed (dev/staging):**

```sql
-- database/main/seeds/005_llm_bindings.sql
INSERT INTO llm_bindings (intent_slug, provider, model, temperature, priority, active)
VALUES
  ('generate', 'ollama', 'llama3', 0.7, 1, true),
  ('generate', 'openrouter', 'anthropic/claude-3-haiku', 0.7, 2, true),
  ('decide', 'ollama', 'llama3', 0.1, 1, true);
```

**Via UI (producao):**

Admin configura em `/settings/llm` sem deploy.

---

## Fallback

Se binding primario falha, tenta proximo por prioridade:

```
resolveLLM('generate')
    ↓
1. ollama/llama3 (priority 1) → falha (offline)
2. openrouter/claude-3-haiku (priority 2) → sucesso
    ↓
Retorna ChatOpenRouter configurado
```

---

## Hot Reload

Bindings sao recarregados em tempo real:

```typescript
// Mudanca no banco reflete imediatamente
UPDATE llm_bindings SET model = 'llama3.1' WHERE intent_slug = 'generate';
// Proxima chamada a resolveLLM('generate') usa llama3.1
```

---

## Arquivos

| Arquivo | Conteudo |
|---------|----------|
| `database/main/seeds/005_llm_bindings.sql` | Bindings padrao |
| `apps/backbone/src/llm/resolver.ts` | Logica de resolucao |
