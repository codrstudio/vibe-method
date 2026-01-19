# Integracao LLM via OpenRouter

Padrao para integracao de LLMs usando OpenRouter como provider unificado.

---

## Indice

1. [Configuracao Base](#configuracao-base) - Variaveis e validacao
2. [Padrao de Cliente](#padrao-de-cliente) - Lazy singleton
3. [Arquitetura de Prompts](#arquitetura-de-prompts) - Estrutura e RAG
4. [Estrategias de Otimizacao](#estrategias-de-otimizacao) - Custo e performance
5. [Outputs Estruturados](#outputs-estruturados) - Zod + structured output
6. [Tratamento de Erros](#tratamento-de-erros) - Retry e fallback
7. [Dependencias](#dependencias) - Pacotes necessarios
8. [Selecao de Modelos](#selecao-de-modelos) - Por tarefa
9. [Checklist](#checklist) - Implementacao

---

## Configuracao Base

### Variaveis de Ambiente

```bash
# .env (commitado)
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=<modelo-escolhido>

# .env.secrets (NAO commitado)
OPENROUTER_API_KEY=sk-or-...
```

### Validacao Obrigatoria

Usar Zod para validar configuracao no startup:

```typescript
import { z } from 'zod';

const configSchema = z.object({
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_DEFAULT_MODEL: z.string(),
});

export function validateConfig() {
  const result = configSchema.safeParse(process.env);

  if (!result.success) {
    console.error('Configuracao LLM invalida:', result.error.message);
    process.exit(1);
  }

  return result.data;
}

export const config = validateConfig();
```

A aplicacao deve falhar no startup se `OPENROUTER_API_KEY` estiver ausente.

---

## Padrao de Cliente

### Lazy Singleton

Criar instancia uma vez e reutilizar:

```typescript
import { ChatOpenAI } from '@langchain/openai';

let _llm: ChatOpenAI | null = null;

export function getLLM(): ChatOpenAI {
  if (!_llm) {
    _llm = new ChatOpenAI({
      model: config.OPENROUTER_DEFAULT_MODEL,
      temperature: 0.7,
      configuration: {
        baseURL: config.OPENROUTER_BASE_URL,
        apiKey: config.OPENROUTER_API_KEY,
        defaultHeaders: {
          'HTTP-Referer': config.APP_URL,
          'X-Title': config.APP_NAME,
        },
      },
    });
  }
  return _llm;
}
```

### Headers Obrigatorios

| Header | Descricao |
|--------|-----------|
| `HTTP-Referer` | URL da aplicacao (obrigatorio pelo OpenRouter) |
| `X-Title` | Nome da aplicacao (identificacao no dashboard) |

### Multiplos Clientes

Para diferentes configuracoes (modelos, temperature):

```typescript
const llmRegistry: Record<string, ChatOpenAI> = {};

export function getLLM(profile: 'default' | 'cheap' | 'capable' = 'default'): ChatOpenAI {
  if (!llmRegistry[profile]) {
    const configs = {
      default: {
        model: config.OPENROUTER_DEFAULT_MODEL,
        temperature: 0.7,
      },
      cheap: {
        model: 'google/gemini-2.0-flash-001',
        temperature: 0.3,
      },
      capable: {
        model: 'anthropic/claude-3.5-sonnet',
        temperature: 0.5,
      },
    };

    llmRegistry[profile] = new ChatOpenAI({
      ...configs[profile],
      configuration: {
        baseURL: config.OPENROUTER_BASE_URL,
        apiKey: config.OPENROUTER_API_KEY,
        defaultHeaders: {
          'HTTP-Referer': config.APP_URL,
          'X-Title': config.APP_NAME,
        },
      },
    });
  }
  return llmRegistry[profile];
}
```

---

## Arquitetura de Prompts

### Estrutura de Diretorio

```
/agents/prompts/
  system.md          # Comportamento base do agente
  classify.md        # Classificacao de intencoes
  generate.md        # Geracao de respostas
```

Prompts em Markdown facilitam edicao e versionamento.

### Cache de Prompts

```typescript
import { readFileSync } from 'fs';
import { join } from 'path';

const PROMPTS_DIR = join(__dirname, '../prompts');
const cache: Record<string, string> = {};

export function loadPrompt(name: string): string {
  if (!cache[name]) {
    cache[name] = readFileSync(join(PROMPTS_DIR, `${name}.md`), 'utf-8');
  }
  return cache[name];
}
```

### Padrao RAG

Dados dinamicos vao **dentro do system prompt**, nao como mensagens separadas:

```typescript
const messages = [
  {
    role: 'system',
    content: `${SYSTEM_PROMPT}

## Dados Disponiveis
${RAG_DATA}`
  },
  { role: 'user', content: 'mensagem anterior' },
  { role: 'assistant', content: 'resposta anterior' },
  { role: 'user', content: 'MENSAGEM ATUAL' },  // Ultima sempre é a atual
];
```

### Builder de Contexto

```typescript
export function buildSystemPrompt(context: PromptContext): string {
  const sections: string[] = [];

  // Sempre incluir data/hora como primeira informacao
  sections.push(`Data atual: ${formatDateTime()}`);

  // Template base
  sections.push(loadPrompt('system.md'));

  // Contexto dinamico
  if (context.ragData) {
    sections.push(`## Contexto\n${context.ragData}`);
  }

  // Acoes disponiveis
  if (context.actions?.length) {
    sections.push(`## Acoes Disponiveis\n${context.actions.map(a =>
      `- ${a.name}: ${a.description}`
    ).join('\n')}`);
  }

  return sections.join('\n\n');
}
```

---

## Estrategias de Otimizacao

### Quick Detection

Usar regex/padroes antes de chamar LLM para casos obvios:

```typescript
export function quickDetect(message: string): string | null {
  const lower = message.toLowerCase().trim();

  if (/^(oi|olá|bom dia|boa tarde)/i.test(lower)) return 'SAUDACAO';
  if (/cancela|desist/i.test(lower)) return 'CANCELAMENTO';
  if (/ajuda|help|como/i.test(lower)) return 'AJUDA';
  if (/obrigad/i.test(lower)) return 'AGRADECIMENTO';

  return null; // Precisa de LLM
}

// No fluxo principal
const quickIntent = quickDetect(message);
if (quickIntent) return { intent: quickIntent, confidence: 1, source: 'quick' };

// So chama LLM se necessario
return await classifyWithLLM(message);
```

**Vantagem:** Economiza ate 40% de chamadas LLM em cenarios tipicos.

### Arquitetura 2-Pass

Para fluxos complexos, separar classificacao de geracao:

| Pass | Proposito | Temperatura | Max Tokens |
|------|-----------|-------------|------------|
| Pass 1 | Classificacao de intent | 0 - 0.3 | 100-500 |
| Pass 2 | Geracao de resposta | 0.5 - 0.7 | 500-2000 |

```typescript
// Pass 1: Classificacao (deterministico)
const classification = await classifyIntent(message, {
  model: 'google/gemini-2.0-flash-001',
  temperature: 0.3,
  maxTokens: 200,
});

// Pass 2: Geracao (criativo)
const response = await generateResponse(context, {
  model: 'anthropic/claude-3-haiku',
  temperature: 0.7,
  maxTokens: 1000,
});
```

### Modelo Fallback

Configurar modelo alternativo mais barato para tarefas simples:

```bash
OPENROUTER_DEFAULT_MODEL=google/gemini-2.0-flash-001
OPENROUTER_FALLBACK_MODEL=openai/gpt-3.5-turbo
```

```typescript
export async function invokeWithFallback(prompt: string): Promise<string> {
  try {
    return await getLLM('default').invoke(prompt);
  } catch (error) {
    console.warn('Usando fallback model:', error.message);
    return await getLLM('fallback').invoke(prompt);
  }
}
```

---

## Outputs Estruturados

Usar `withStructuredOutput` com Zod para garantir JSON valido:

```typescript
import { z } from 'zod';

const ClassificationSchema = z.object({
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  entities: z.record(z.string()).optional(),
  reasoning: z.string().optional(),
});

type Classification = z.infer<typeof ClassificationSchema>;

export async function classifyIntent(message: string): Promise<Classification> {
  const prompt = buildClassifyPrompt(message);

  const result = await getLLM()
    .withStructuredOutput(ClassificationSchema)
    .invoke(prompt);

  return result;
}
```

### Schemas Reutilizaveis

```typescript
// schemas/llm.ts

export const SentimentSchema = z.object({
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  confidence: z.number().min(0).max(1),
});

export const UrgencySchema = z.object({
  level: z.enum(['low', 'medium', 'high', 'critical']),
  reasoning: z.string(),
});

export const IntentSchema = z.object({
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  entities: z.record(z.string()).optional(),
});
```

---

## Tratamento de Erros

### Retry com Backoff Exponencial

```typescript
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: { maxRetries?: number; backoff?: number } = {}
): Promise<T> {
  const { maxRetries = 3, backoff = 1000 } = options;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      if (attempt === maxRetries) throw error;

      const delay = backoff * Math.pow(2, attempt - 1);
      console.warn(`LLM attempt ${attempt} failed, retrying in ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error('Unreachable');
}

// Uso
const result = await withRetry(() => getLLM().invoke(prompt));
```

### Fallback Graceful

Nunca quebrar o fluxo principal por erro de LLM:

```typescript
export async function classifyWithFallback(message: string): Promise<Classification> {
  try {
    return await withRetry(() => classifyIntent(message));
  } catch (error) {
    console.error('[LLM] Classification error:', error);
    return {
      intent: 'unknown',
      confidence: 0,
      reasoning: 'Erro na classificacao automatica',
    };
  }
}
```

### Verificacao de Disponibilidade

```typescript
export function isLLMAvailable(): boolean {
  return Boolean(config.OPENROUTER_API_KEY);
}

// No fluxo
if (!isLLMAvailable()) {
  console.warn('[LLM] API key nao configurada, usando fallback');
  return DEFAULT_RESPONSE;
}
```

### Timeout

```typescript
export async function invokeWithTimeout(
  prompt: string,
  timeoutMs: number = 30000
): Promise<string> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await getLLM().invoke(prompt, {
      signal: controller.signal,
    });
  } finally {
    clearTimeout(timeout);
  }
}
```

---

## Dependencias

```json
{
  "@langchain/openai": "^1.0.0",
  "@langchain/langgraph": "^0.3.0",
  "zod": "^3.24.0"
}
```

| Pacote | Proposito |
|--------|-----------|
| `@langchain/openai` | Cliente ChatOpenAI compativel com OpenRouter |
| `@langchain/langgraph` | Agents com estado e fluxos condicionais |
| `zod` | Validacao de config e outputs estruturados |

---

## Selecao de Modelos

### Recomendacoes por Tarefa

| Tarefa | Modelo Sugerido | Justificativa |
|--------|-----------------|---------------|
| Classificacao | `google/gemini-2.0-flash-001` | Rapido, barato, bom em JSON |
| Geracao | `anthropic/claude-3-haiku` | Equilibrio custo/qualidade |
| Tool Calling | `openai/gpt-4o-mini` | Mais confiavel para tools |
| Orquestracao | `anthropic/claude-3.5-sonnet` | Melhor raciocinio |
| Resumo longo | `google/gemini-1.5-flash-8b` | Janela grande, barato |

### Tabela de Custos (referencia)

| Modelo | Input/1M | Output/1M | Contexto |
|--------|----------|-----------|----------|
| gemini-2.0-flash | $0.075 | $0.30 | 1M |
| gpt-4o-mini | $0.15 | $0.60 | 128K |
| claude-3-haiku | $0.25 | $1.25 | 200K |
| claude-3.5-sonnet | $3.00 | $15.00 | 200K |

### Problemas Conhecidos

- **Gemini 2.0/2.5 Flash**: Pode alucinar tool calls ou retornar JSON como texto
- **Modelos open-source**: Menos confiaveis para outputs estruturados complexos
- **GPT-4o**: Custo alto, usar apenas quando necessario
- **Claude Opus**: Muito caro, reservar para tarefas criticas

---

## Monitoramento

### Logging de Chamadas

```typescript
export async function invokeWithLogging(
  prompt: string,
  context: { workflow: string; step: string }
): Promise<string> {
  const start = Date.now();

  try {
    const result = await getLLM().invoke(prompt);

    console.log('[LLM]', {
      workflow: context.workflow,
      step: context.step,
      model: config.OPENROUTER_DEFAULT_MODEL,
      inputTokens: estimateTokens(prompt),
      outputTokens: estimateTokens(result),
      durationMs: Date.now() - start,
      success: true,
    });

    return result;
  } catch (error) {
    console.error('[LLM]', {
      workflow: context.workflow,
      step: context.step,
      model: config.OPENROUTER_DEFAULT_MODEL,
      durationMs: Date.now() - start,
      success: false,
      error: error.message,
    });

    throw error;
  }
}

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4); // Estimativa simples
}
```

---

## Checklist

- [ ] Variaveis de ambiente configuradas
- [ ] Validacao Zod no startup
- [ ] Cliente lazy singleton criado
- [ ] Headers `HTTP-Referer` e `X-Title` configurados
- [ ] Prompts em arquivos Markdown separados
- [ ] Cache de prompts implementado
- [ ] RAG data injetado no system prompt
- [ ] Quick detection implementado (se aplicavel)
- [ ] Arquitetura 2-pass para fluxos complexos
- [ ] Retry com backoff configurado
- [ ] Fallback graceful para erros
- [ ] Timeout configurado
- [ ] Schemas Zod para outputs estruturados
- [ ] Logging de chamadas LLM
- [ ] Modelos selecionados por tarefa
