# Platform Backport

Artefatos criados no fork (cia-dashboard-vibe) que devem voltar para a plataforma (vibe-method).

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
| `generate-agent.md` | criado | `scaffold/.claude/commands/generate-agent.md` |

---

## Fica Apenas no Fork

| Arquivo | Motivo |
|---------|--------|
| `specs/AI-INSTRUCTIONS.local.md` | Especifico do projeto |
| `specs/company/profile.md` | Contexto do cliente |
| `specs/agents/writer.md` | Agente de negocio |
| `specs/agents/reviewer.md` | Agente de negocio |
| `specs/entities/report.yaml` | Entidade de negocio |

---

## Checklist de Backport

Antes de copiar para plataforma:

- [ ] Remover referencias especificas do cliente
- [ ] Generalizar exemplos
- [ ] Validar que funciona no scaffold limpo
