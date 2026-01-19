# LLM Resolver

O resolver transforma intent em LLM configurado e pronto para uso.

---

## Funcao Principal

```typescript
import { resolveLLM } from '@/lib/llm';

// Retorna LLM configurado baseado no binding ativo
const llm = await resolveLLM('generate');

// Usa normalmente
const response = await llm.invoke(messages);
```

---

## Fluxo de Resolucao

```
resolveLLM('generate')
    ↓
1. Consulta bindings ativos para 'generate'
2. Ordena por prioridade
3. Tenta conectar ao primeiro (ollama)
4. Se falha, tenta proximo (openrouter)
5. Retorna instancia LLM ou erro
```

---

## Retorno

```typescript
type ResolvedLLM = ChatOllama | ChatOpenRouter | ChatOpenAI;

// O tipo exato depende do binding, mas interface eh uniforme
const llm = await resolveLLM('classify');
await llm.invoke([{ role: 'user', content: '...' }]);
```

---

## Erros

```typescript
try {
  const llm = await resolveLLM('generate');
} catch (error) {
  if (error.code === 'NO_BINDING') {
    // Nenhum binding configurado para o intent
  }
  if (error.code === 'ALL_PROVIDERS_FAILED') {
    // Todos os providers falharam
  }
}
```

---

## Cache

Conexoes sao cacheadas por sessao:

```typescript
// Primeira chamada: cria conexao
const llm1 = await resolveLLM('generate');

// Segunda chamada: reutiliza conexao
const llm2 = await resolveLLM('generate');

// llm1 === llm2 (mesma instancia)
```

---

## Arquivos

| Arquivo | Conteudo |
|---------|----------|
| `apps/backbone/src/llm/resolver.ts` | Implementacao |
| `apps/backbone/src/llm/providers/` | Adapters por provider |
