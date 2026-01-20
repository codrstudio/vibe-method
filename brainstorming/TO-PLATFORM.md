# TO-PLATFORM

Artefatos criados no fork (cia-dashboard-vibe) que devem ser incorporados na plataforma (vibe-method).

---

## Incorporados

### specs/

| Arquivo | Status | Destino |
|---------|--------|---------|
| `AI-INSTRUCTIONS.md` | incorporado | `specs/AI-INSTRUCTIONS.md` |

### docs/reference/

| Arquivo | Status | Destino |
|---------|--------|---------|
| `llm/intents.md` | incorporado | `docs/reference/llm/intents.md` |
| `llm/bindings.md` | incorporado | `docs/reference/llm/bindings.md` |
| `llm/resolver.md` | incorporado | `docs/reference/llm/resolver.md` |
| `configuration/ai-instructions.md` | incorporado | `docs/reference/configuration/ai-instructions.md` |

### .claude/commands/

| Arquivo | Status | Destino |
|---------|--------|---------|
| `biz/generate-agent.md` | incorporado | `.claude/commands/biz/generate-agent.md` |

### Estruturas Criadas

| Item | Local |
|------|-------|
| Pasta platform-requests | `specs/platform-requests/` |

---

## Para Adicionar (Futuro)

### specs/

| Arquivo | Status | Destino |
|---------|--------|---------|
| - | - | - |

### docs/reference/

| Arquivo | Status | Destino |
|---------|--------|---------|
| - | - | - |

### .claude/commands/

| Arquivo | Status | Destino |
|---------|--------|---------|
| - | - | - |

---

## Fica Apenas no Fork

| Arquivo | Motivo |
|---------|--------|
| `specs/AI-INSTRUCTIONS.local.md` | Especifico do projeto |
| `specs/company/profile.md` | Contexto do cliente |
| `specs/agents/biz-*.md` | Agentes de negocio |
| `specs/entities/biz-*.yaml` | Entidades de negocio |

---

## Notas

- Regra Motor vs Negocio: `biz-*` = livre, `sem biz-` = requer aprovacao
- Pattern `specs/platform-requests/` para feedback loop com plataforma
- `llmService.createLLM(intent)` eh o pattern real (nao `resolveLLM`)
- **SEMPRE** iniciar prompts com: `Leia specs/AI-INSTRUCTIONS.md antes de comecar.`

## Convencao de Prefixo BIZ

Codigo de negocio (fork) SEMPRE usa prefixo `biz-`:

| Tipo | Prefixo | Exemplo |
|------|---------|---------|
| Arquivos TS | `biz-` | `biz-primecare-db.ts` |
| Scripts | `biz-` | `biz-sync-primecare.ts` |
| Tipos/Classes | `Biz` | `BizReport`, `BizWriterInput` |
| Tabelas | `biz.` | `biz.reports` (schema postgres) |
| Agentes | `biz-` | `biz-writer`, `biz-reviewer` |
| Specs | `biz-` | `specs/entities/biz-report.yaml` |

**Env vars:** Sugestao usar `BIZ_` mas integracoes externas podem usar nome proprio (ex: `PRIMECARE_MYSQL_HOST`).

Isso isola codigo de negocio do motor e facilita sync upstream.
