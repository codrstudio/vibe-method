---
up: brainstorming\PLAN.md
---
# Tarefas

Baseado em brainstorming\PLAN.md

# Iteração 1: Passo a Passo

## [x] Passo 1.1: Camada LLM mínima

**O que:** Uma função que recebe prompt e retorna resposta do LLM

**Onde:** `apps/backbone/src/llm/index.ts`

**Interface:**
```typescript
async function complete(prompt: string, options?: { model?: string }): Promise<string>
```

**Decisão necessária:** Ollama local ou OpenRouter primeiro?

---

## [x] Passo 1.2: biz-writer

**O que:** Agente que recebe relatório e retorna mensagem humanizada

**Onde:** `apps/backbone/src/agents/biz-writer/`

| Campo | Valor |
|-------|-------|
| Input | Texto do relatório original |
| Output | Mensagem humanizada (1-2 parágrafos) |
| Spec | `cia-dashboard-vibe/specs/agents/writer.md` |

---

## [x] Passo 1.3: biz-reviewer

**O que:** Agente que valida a mensagem do writer

**Onde:** `apps/backbone/src/agents/biz-reviewer/`

| Campo | Valor |
|-------|-------|
| Input | Mensagem do writer + relatório original |
| Output | `{ approved: boolean, reasons?: string[] }` |
| Spec | `cia-dashboard-vibe/specs/agents/reviewer.md` |

---

## [x] Passo 1.4: Script de teste

**O que:** Script que roda o fluxo completo

**Onde:** `scripts/test-biz-report.ts`

**Fluxo:**
1. Lê relatório de exemplo (hardcoded ou arquivo)
2. Chama biz-writer
3. Chama biz-reviewer
4. Imprime resultado

---

## Próximo Passo

Quer começar pelo **1.1 (LLM)**? Qual provider prefere:
- Ollama local
- OpenRouter