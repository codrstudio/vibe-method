# Cadastro de LLM Intents

Preencha os intents abaixo. Cada intent representa uma **intenção de uso de LLM** no sistema.

---

## Estrutura de um Intent

```sql
INSERT INTO llm_intents (slug, title, subtitle, icon, description, profile, declared_by)
VALUES (
  'slug-do-intent',           -- ID interno (snake_case ou kebab-case)
  'Titulo',                   -- Exibido na UI (pt-BR)
  'Subtitulo curto',          -- Linha secundaria na UI
  'nome-icone-lucide',        -- Icone do Lucide (ex: tag, brain, message-square)
  'Descricao completa...',    -- Tooltip/ajuda na UI
  '{"minParams":"7b","maxParams":"70b","requiresJSON":true,"priority":"speed"}',
  'seed'
);
```

---

## Campos do Profile (JSON)

| Campo | Tipo | Descricao |
|-------|------|-----------|
| `minParams` | `"7b"` `"13b"` `"70b"` | Tamanho minimo do modelo |
| `maxParams` | `"7b"` `"13b"` `"70b"` | Tamanho maximo do modelo |
| `requiresJSON` | `boolean` | Precisa de structured output |
| `requiresVision` | `boolean` | Precisa de multimodal |
| `requiresTools` | `boolean` | Precisa de function calling |
| `priority` | `"speed"` `"quality"` `"cost"` | Trade-off principal |

---

## Icones Sugeridos (Lucide)

| Icone | Uso sugerido |
|-------|--------------|
| `tag` | Classificacao, categorizacao |
| `message-square` | Geracao de texto, chat |
| `database` | Extracao de dados |
| `list-todo` | Planejamento, listas |
| `git-branch` | Decisao, fluxo |
| `brain` | Raciocinio, analise |
| `search` | Busca semantica |
| `file-text` | Resumo, sumarizacao |
| `check-circle` | Validacao |
| `sparkles` | Criatividade, geracao |

---

## Intents para Cadastrar

Preencha abaixo. Copie o template e ajuste:

### Template

```sql
(
  'SLUG',
  'TITULO',
  'SUBTITULO',
  'ICONE',
  'DESCRICAO',
  '{"PROFILE_JSON"}',
  'seed'
),
```

---

### Intent 1: classify (ja definido)

```sql
(
  'classify',
  'Classificar',
  'Analise de intencao e urgencia',
  'tag',
  'Classifica mensagens por intencao, urgencia e contexto. Usado pelo triager.',
  '{"maxParams":"13b","requiresJSON":true,"priority":"speed"}',
  'seed'
),
```

### Intent 2: generate (ja definido)

```sql
(
  'generate',
  'Gerar Resposta',
  'Geracao de texto contextualizado',
  'message-square',
  'Gera respostas baseadas em contexto recuperado. Usado pelo copilot.',
  '{"minParams":"13b","priority":"quality"}',
  'seed'
),
```

### Intent 3: extract (ja definido)

```sql
(
  'extract',
  'Extrair Dados',
  'Extracao estruturada de informacoes',
  'database',
  'Extrai entidades e dados estruturados de texto livre.',
  '{"maxParams":"13b","requiresJSON":true,"priority":"speed"}',
  'seed'
),
```

### Intent 4: plan (ja definido)

```sql
(
  'plan',
  'Planejar Acoes',
  'Planejamento de proximos passos',
  'list-todo',
  'Planeja sequencia de acoes baseado em contexto. Usado pelo triager.',
  '{"minParams":"7b","maxParams":"70b","requiresJSON":true}',
  'seed'
),
```

### Intent 5: decide (ja definido)

```sql
(
  'decide',
  'Decidir',
  'Tomada de decisao com justificativa',
  'git-branch',
  'Toma decisoes explicaveis entre opcoes disponiveis.',
  '{"minParams":"13b","requiresJSON":true}',
  'seed'
),
```

---

## Seus Novos Intents

Adicione abaixo os intents que voce precisa:

### Intent 6: (seu intent)

```sql
(
  'SEU_SLUG',
  'Seu Titulo',
  'Seu subtitulo',
  'icone',
  'Descricao do intent',
  '{"profile":"aqui"}',
  'seed'
),
```

### Intent 7: (seu intent)

```sql
-- copie o template acima
```

---

## Quando Terminar

Avise que terminou. Vou incorporar seus intents no seed `database/main/seeds/004_llm_intents.sql`.
