# TO-PLATFORM

Artefatos criados no fork (cia-dashboard-vibe) que devem ser incorporados na plataforma (vibe-method).

---

## Para Adicionar na Plataforma

### specs/

| Arquivo | Status | Destino |
|---------|--------|---------|
| `AI-INSTRUCTIONS.md` | pendente | `scaffold/specs/AI-INSTRUCTIONS.md` |

### docs/reference/

| Arquivo | Status | Destino |
|---------|--------|---------|
| `llm/intents.md` | criado | `docs/reference/llm/intents.md` |
| `llm/bindings.md` | criado | `docs/reference/llm/bindings.md` |
| `llm/resolver.md` | criado | `docs/reference/llm/resolver.md` |
| `configuration/ai-instructions.md` | criado | `docs/reference/configuration/ai-instructions.md` |

### .claude/commands/

| Arquivo | Status | Destino |
|---------|--------|---------|
| `biz/generate-agent.md` | criado | `scaffold/.claude/commands/biz/generate-agent.md` |

---

## Fica Apenas no Fork

| Arquivo | Motivo |
|---------|--------|
| `specs/AI-INSTRUCTIONS.local.md` | Especifico do projeto |
| `specs/company/profile.md` | Contexto do cliente |
| `specs/agents/biz-writer.md` | Agente de negocio |
| `specs/agents/biz-reviewer.md` | Agente de negocio |
| `specs/entities/biz-report.yaml` | Entidade de negocio |

## Notas

- Puxar para a plataforma tudo em: .claude\commands\biz
- Regra Motor vs Negocio: `biz-*` = livre, `sem biz-` = requer aprovacao
- Pattern `specs/platform-requests/` para feedback loop com plataforma
- `llmService.createLLM(intent)` eh o pattern real (nao `resolveLLM`)

---

## Checklist

Antes de copiar para plataforma:

- [ ] Remover referencias especificas do cliente
- [ ] Generalizar exemplos
- [ ] Validar que funciona no scaffold limpo
