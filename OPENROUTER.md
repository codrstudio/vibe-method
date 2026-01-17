# Integração LLM via OpenRouter

Este documento define o padrão para integração de LLMs usando OpenRouter como provider unificado.

## Configuração Base

### Variáveis de Ambiente

```bash
# .env (commitado)
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_DEFAULT_MODEL=<modelo-escolhido>

# .env.secrets (NÃO commitado)
OPENROUTER_API_KEY=sk-or-...
```

### Validação Obrigatória

Usar Zod para validar configuração no startup:

```typescript
const configSchema = z.object({
  OPENROUTER_BASE_URL: z.string().url().default('https://openrouter.ai/api/v1'),
  OPENROUTER_API_KEY: z.string().min(1),
  OPENROUTER_DEFAULT_MODEL: z.string(),
});
```

A aplicação deve falhar no startup se `OPENROUTER_API_KEY` estiver ausente.

---

## Padrão de Cliente

### Lazy Singleton

Criar instância uma vez e reutilizar:

```typescript
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

### Headers Obrigatórios

| Header | Descrição |
|--------|-----------|
| `HTTP-Referer` | URL da aplicação (obrigatório pelo OpenRouter) |
| `X-Title` | Nome da aplicação (identificação no dashboard) |

---

## Arquitetura de Prompts

### Estrutura de Diretório

```
/agents/prompts/
  system.md          # Comportamento base do agente
  classify.md        # Classificação de intenções
  generate.md        # Geração de respostas
```

Prompts em Markdown facilitam edição e versionamento.

### Padrão RAG

Dados dinâmicos vão **dentro do system prompt**, não como mensagens separadas:

```typescript
const messages = [
  {
    role: 'system',
    content: `${SYSTEM_PROMPT}

## Dados Disponíveis
${RAG_DATA}`
  },
  { role: 'user', content: 'mensagem anterior' },
  { role: 'assistant', content: 'resposta anterior' },
  { role: 'user', content: 'MENSAGEM ATUAL' },  // Última sempre é a atual
];
```

### Builder de Contexto

```typescript
export function buildSystemPrompt(context: PromptContext): string {
  const sections: string[] = [];

  sections.push(`Data atual: ${formatDateTime()}`);
  sections.push(loadPromptTemplate('system.md'));

  if (context.ragData) {
    sections.push(`## Contexto\n${context.ragData}`);
  }

  return sections.join('\n\n');
}
```

---

## Estratégias de Otimização de Custo

### Quick Detection

Usar regex/padrões antes de chamar LLM para casos óbvios:

```typescript
export function quickDetect(message: string): string | null {
  if (/^(oi|olá|bom dia|boa tarde)/i.test(message)) return 'SAUDACAO';
  if (/cancela|desist/i.test(message)) return 'CANCELAMENTO';
  return null; // Precisa de LLM
}

// No fluxo principal
const quickIntent = quickDetect(message);
if (quickIntent) return { intent: quickIntent, confidence: 1 };

// Só chama LLM se necessário
return await classifyWithLLM(message);
```

### Arquitetura 2-Pass

Para fluxos complexos, separar classificação de geração:

| Pass | Propósito | Temperatura | Max Tokens |
|------|-----------|-------------|------------|
| Pass 1 | Classificação de intent | 0 - 0.3 | 100-500 |
| Pass 2 | Geração de resposta | 0.5 - 0.7 | 500-2000 |

```typescript
// Pass 1: Classificação (determinístico)
const classification = await classifyIntent(message, { temperature: 0.3 });

// Pass 2: Geração (criativo)
const response = await generateResponse(context, { temperature: 0.7 });
```

### Modelo Fallback

Configurar modelo alternativo mais barato para tarefas simples:

```typescript
OPENROUTER_DEFAULT_MODEL=google/gemini-2.0-flash-001
OPENROUTER_FALLBACK_MODEL=openai/gpt-3.5-turbo
```

---

## Outputs Estruturados

Usar `withStructuredOutput` com Zod para garantir JSON válido:

```typescript
const ClassificationSchema = z.object({
  intent: z.string(),
  confidence: z.number().min(0).max(1),
  entities: z.record(z.string()).optional(),
  reasoning: z.string().optional(),
});

const result = await getLLM()
  .withStructuredOutput(ClassificationSchema)
  .invoke(prompt);
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

      console.error(`LLM attempt ${attempt} failed, retrying in ${backoff * attempt}ms...`);
      await new Promise(resolve => setTimeout(resolve, backoff * attempt));
    }
  }
  throw new Error('Unreachable');
}
```

### Fallback Graceful

Nunca quebrar o fluxo principal por erro de LLM:

```typescript
try {
  return await classifyIntent(message);
} catch (error) {
  console.error('[LLM] Classification error:', error);
  return {
    intent: 'unknown',
    confidence: 0,
    reasoning: 'Erro na classificação automática',
  };
}
```

### Verificação de Disponibilidade

```typescript
export function isLLMAvailable(): boolean {
  return Boolean(config.OPENROUTER_API_KEY);
}

// No fluxo
if (!isLLMAvailable()) {
  console.warn('[LLM] API key não configurada, usando fallback');
  return DEFAULT_RESPONSE;
}
```

---

## Dependências

```json
{
  "@langchain/openai": "^1.0.0",
  "@langchain/langgraph": "^0.3.0",
  "zod": "^3.24.0"
}
```

| Pacote | Propósito |
|--------|-----------|
| `@langchain/openai` | Cliente ChatOpenAI compatível com OpenRouter |
| `@langchain/langgraph` | Agents com estado e fluxos condicionais |
| `zod` | Validação de config e outputs estruturados |

---

## Seleção de Modelos

### Recomendações por Tarefa

| Tarefa | Modelo Sugerido | Justificativa |
|--------|-----------------|---------------|
| Classificação | `google/gemini-2.0-flash-001` | Rápido, barato, bom em JSON |
| Geração | `anthropic/claude-3-haiku` | Equilibrio custo/qualidade |
| Tool Calling | `openai/gpt-4o-mini` | Mais confiável para tools |
| Orquestração | `anthropic/claude-3.5-sonnet` | Melhor raciocínio |

### Problemas Conhecidos

- **Gemini 2.0/2.5 Flash**: Pode alucinar tool calls ou retornar JSON como texto
- **Modelos open-source**: Menos confiáveis para outputs estruturados complexos

---

## Checklist de Implementação

- [ ] Variáveis de ambiente configuradas
- [ ] Validação Zod no startup
- [ ] Cliente lazy singleton criado
- [ ] Headers `HTTP-Referer` e `X-Title` configurados
- [ ] Prompts em arquivos Markdown separados
- [ ] RAG data injetado no system prompt
- [ ] Quick detection implementado (se aplicável)
- [ ] Retry com backoff configurado
- [ ] Fallback graceful para erros
- [ ] Schemas Zod para outputs estruturados
