# Plano: Pulse - Sistema de Monitoramento

## Visão Geral

Criar o **Pulse**, um serviço centralizado de monitoramento no backbone com:
- Probes de saúde (db, redis, llm, ollama, knowledge)
- Métricas e estatísticas
- Sistema de alertas (UI, email, WhatsApp)

### Arquitetura

```
Frontend → /api/system/pulse/[...path] → /backbone/pulse/...
                                              │
                                              ├── /probes      → Status dos serviços
                                              ├── /metrics     → Métricas e estatísticas
                                              ├── /alerts      → Configuração de alertas
                                              └── /llm         → LLM providers (OpenRouter + Ollama)
```

**Regras:**
- `/health/live` e `/health/ready` permanecem para k8s
- BFF é proxy genérico (sem whitelist)
- Pulse é o único ponto de monitoramento para UI

---

## Checklist

### Fase 1: Backend - Estrutura Pulse
- [ ] 1.1 Criar módulo `src/pulse/`
- [ ] 1.2 Atualizar `config.ts` (vars Ollama + OpenRouter)
- [ ] 1.3 Criar rotas `src/routes/pulse.ts`
- [ ] 1.4 Registrar rotas em `src/index.ts`

### Fase 2: Backend - Probes
- [ ] 2.1 Criar `ollama.probe.ts`
- [ ] 2.2 Estender `llm.probe.ts` (credits/usage)
- [ ] 2.3 Migrar probes existentes (db, redis, knowledge)

### Fase 3: Backend - Alertas
- [ ] 3.1 Criar tipos de alerta
- [ ] 3.2 Criar canais (ui, email, whatsapp)
- [ ] 3.3 Criar emitter

### Fase 4: BFF
- [ ] 4.1 Criar `/api/system/pulse/[...path]/route.ts`
- [ ] 4.2 Simplificar `/api/health/backbone/route.ts`

### Fase 5: Limpeza
- [ ] 5.1 Atualizar `/health` (manter só k8s)
- [ ] 5.2 Remover código duplicado

### Fase 6: Frontend
- [ ] 6.1 Atualizar páginas health para usar Pulse

---

## Estrutura de Arquivos

```
src/pulse/
├── index.ts              # Exporta tudo
├── types.ts              # Tipos e schemas
├── probes/               # Health probes
│   ├── index.ts
│   ├── db.probe.ts
│   ├── redis.probe.ts
│   ├── llm.probe.ts
│   ├── ollama.probe.ts
│   └── knowledge.probe.ts
├── metrics/
│   ├── collector.ts
│   └── storage.ts
└── alerts/
    ├── types.ts
    ├── emitter.ts
    └── channels/
        ├── ui.channel.ts
        ├── email.channel.ts
        └── whatsapp.channel.ts
```

---

## Endpoints

```
GET  /pulse                    → Overview geral
GET  /pulse/probes             → Todos os probes (shallow)
GET  /pulse/probes/deep        → Todos os probes (deep)
GET  /pulse/probes/:name       → Probe específico
GET  /pulse/llm                → LLM overview
GET  /pulse/llm/openrouter     → Detalhes OpenRouter
GET  /pulse/llm/ollama         → Detalhes Ollama
GET  /pulse/metrics            → Snapshot
GET  /pulse/metrics/history    → Histórico
GET  /pulse/alerts             → Lista alertas
POST /pulse/alerts             → Criar alerta
PUT  /pulse/alerts/:id         → Atualizar
DEL  /pulse/alerts/:id         → Remover
GET  /pulse/events             → SSE real-time
```

---

## Verificação

```bash
# Backend
curl http://localhost:8002/backbone/pulse
curl http://localhost:8002/backbone/pulse/llm
curl http://localhost:8002/backbone/pulse/probes/deep

# BFF
curl http://localhost:8000/api/system/pulse
curl http://localhost:8000/api/system/pulse/llm

# K8s (deve continuar funcionando)
curl http://localhost:8002/backbone/health/live
curl http://localhost:8002/backbone/health/ready
```
