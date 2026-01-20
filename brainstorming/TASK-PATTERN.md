# TASK Pattern

Template para tarefas no Vibe Method.

---

## Estrutura

```markdown
# [ ] - {Nome da Tarefa}

**O que voce deve fazer:**

{Descricao do que o humano precisa criar/editar em specs}

**Arquivo:** `specs/{pasta}/{arquivo}`

**Conteudo esperado:**

{Exemplo do conteudo do spec}

---

**Prompt para IA:**

```
{Comando ou instrucao para a IA gerar codigo a partir do spec}
```
```

---

## Exemplo Real

```markdown
# [ ] - Schema biz-report no banco

**O que voce deve fazer:**

Criar spec da entidade biz-report definindo campos, tipos e indices.

**Arquivo:** `specs/entities/biz-report.yaml`

**Conteudo esperado:**

```yaml
name: biz-report
description: Relatorio de plantao humanizado

fields:
  - id: uuid
  - original_text: string, required
  - turno: enum(diurno, noturno, 24h)
  - status: enum(pending, processing, approved, rejected, failed)
  # ... demais campos

indexes:
  - status
  - created_at DESC
```

---

**Prompt para IA:**

```
Leia specs/entities/biz-report.yaml e gere:
1. Migration em database/main/migrations/100_biz_reports.sql
2. Schema Zod em packages/types/src/schemas/biz-report.ts
3. Atualize packages/types/src/index.ts com o export
```
```

---

## Fluxo

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  HUMANO         │     │  SPEC           │     │  IA             │
│  (voce)         │────▶│  (artefato)     │────▶│  (gera codigo)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
     │                        │                        │
     │ Cria/edita spec        │ Define comportamento   │ Le spec
     │ em specs/              │ de forma declarativa   │ Gera codigo
     │                        │                        │ Valida qualidade
```

---

## Tipos de Tarefa

### Entidade (banco + types)

```markdown
**O que voce deve fazer:** Criar spec da entidade

**Arquivo:** `specs/entities/{nome}.yaml`

**Prompt para IA:**
```
Leia specs/entities/{nome}.yaml e gere migration + schema Zod
```
```

### Feature (paginas + API)

```markdown
**O que voce deve fazer:** Criar spec da feature com user stories

**Arquivo:** `specs/features/{nome}.md`

**Prompt para IA:**
```
Leia specs/features/{nome}.md e gere rotas API + paginas conforme US
```
```

### Agente (LangGraph)

```markdown
**O que voce deve fazer:** Criar spec do agente com inputs/outputs/grafo

**Arquivo:** `specs/agents/{nome}.md`

**Prompt para IA:**
```
/biz:generate-agent {nome}
```
```

### Rota API (endpoint)

```markdown
**O que voce deve fazer:** Definir contrato da API

**Arquivo:** `specs/apis/{nome}.yaml` ou no proprio feature spec

**Prompt para IA:**
```
Leia specs/apis/{nome}.yaml e gere rota Fastify com validacao Zod
```
```

---

## Regras

1. **Spec primeiro** - Nunca pedir codigo sem spec
2. **Spec eh verdade** - Se precisa mudar comportamento, muda o spec
3. **IA valida** - IA deve rodar build e reportar erros
4. **Prompt claro** - Dizer exatamente o que gerar e onde
