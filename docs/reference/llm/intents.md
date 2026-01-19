# LLM Intents

Intents declaram **o que** o sistema precisa de um LLM, sem especificar **como** (provider/model).

---

## Conceito

```
Intent (o que) → Binding (como) → LLM (execucao)
```

- **Intent**: "Preciso classificar texto" (`classify`)
- **Binding**: "Use Ollama llama3 com temperature 0.1"
- **Resolver**: Retorna LLM configurado

---

## Intents Base

| Slug | Uso | Profile |
|------|-----|---------|
| `classify` | Categorizacao, triagem | speed, JSON required |
| `generate` | Criacao de conteudo | quality, 13b+ |
| `extract` | Extracao estruturada | speed, JSON required |
| `plan` | Planejamento de acoes | JSON required |
| `decide` | Decisao binaria/multipla | 13b+, JSON required |

---

## Uso

```typescript
import { resolveLLM } from '@/lib/llm';

const llm = await resolveLLM('generate');
const response = await llm.invoke([
  { role: 'system', content: systemPrompt },
  { role: 'user', content: userInput }
]);
```

---

## Estrutura

```typescript
interface LLMIntent {
  slug: string;           // ID unico
  title: string;          // UI: "Classificar"
  subtitle: string;       // UI: "Analise de intencao"
  icon: string;           // Lucide icon name
  description: string;    // Tooltip/help
  profile: IntentProfile;
  declared_by: 'seed' | 'user';
}

interface IntentProfile {
  minParams?: '7b' | '13b' | '70b';
  maxParams?: '7b' | '13b' | '70b';
  requiresJSON?: boolean;
  requiresVision?: boolean;
  requiresTools?: boolean;
  priority?: 'speed' | 'quality' | 'cost';
}
```

---

## Intents de Negocio

Projetos podem criar intents com prefixo `biz-`:

```sql
INSERT INTO llm_intents (slug, title, ...)
VALUES ('biz-humanize', 'Humanizar Texto', ...);
```

**Quando criar**: Requisitos especificos que intents base nao cobrem.

**Quando nao criar**: `generate` e `decide` cobrem maioria dos casos.

---

## Arquivos

| Arquivo | Conteudo |
|---------|----------|
| `database/main/seeds/004_llm_intents.sql` | Intents base |
| `database/main/seeds/005_llm_bindings.sql` | Bindings padrao |
| `brainstorming/intents.md` | Template para novos |
