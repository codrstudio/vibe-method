# PLAN: LLM Sanity Agent & Monitoring

> Agente de sanidade para testar inferência LLM + interface de monitoramento no backbone health.

---

## Contexto

O sistema de probes atual (`ollama.probe.ts`, `llm.probe.ts`) verifica:
- Configuração (API keys, URLs)
- Conectividade (fetch /api/version, /api/tags)
- Disponibilidade de modelos

**O que falta:** Teste real de inferência através do `llmService`.

Este plano cria:
1. **Sanity Agent** - Agente LangGraph que invoca LLM para teste de sanidade
2. **LLM-Sanity Probe** - Probe que usa o agente para verificar saúde da camada LLM
3. **UI de Monitoramento** - Seção no LLM Panel mostrando status de inferência e bindings

---

## Arquivos a Criar/Modificar

```
CRIAR:
apps/backbone/src/agents/sanity/
├── index.ts              # Graph LangGraph + invokeSanity()
├── types.ts              # SanityResult, SanityInput
└── prompt.ts             # buildSanityPrompt()

apps/backbone/src/pulse/probes/
└── llm-sanity.probe.ts   # Shallow + Deep probes

MODIFICAR:
apps/backbone/src/agents/index.ts           # Export sanity agent
apps/backbone/src/pulse/probes/index.ts     # Register llm-sanity probe
apps/backbone/src/pulse/types.ts            # Add LLMSanityDetails

apps/app/.../backbone/_components/llm-panel.tsx  # Add InferenceCard
apps/app/.../backbone/page.tsx                   # Pass sanityProbe to LLMPanel
```

---

## Tarefas

### Fase 1: Backend - Sanity Agent
- [ ] Criar `apps/backbone/src/agents/sanity/types.ts`
- [ ] Criar `apps/backbone/src/agents/sanity/prompt.ts`
- [ ] Criar `apps/backbone/src/agents/sanity/index.ts`
- [ ] Exportar em `apps/backbone/src/agents/index.ts`

### Fase 2: Backend - LLM-Sanity Probe
- [ ] Criar `apps/backbone/src/pulse/probes/llm-sanity.probe.ts`
- [ ] Adicionar `LLMSanityDetails` em `apps/backbone/src/pulse/types.ts`
- [ ] Registrar probes em `apps/backbone/src/pulse/probes/index.ts`

### Fase 3: Frontend - UI
- [ ] Adicionar `InferenceCard` em `llm-panel.tsx`
- [ ] Atualizar `LLMPanel` para receber `sanityProbe`
- [ ] Atualizar `page.tsx` para passar `sanityProbe`

---

## Verificação

1. `curl http://localhost:8002/pulse/probes/llm-sanity?deep=true`
2. Acessar `/app/system/health/backbone` → Tab LLM
3. Card de Inferência deve mostrar provider/model/latência
