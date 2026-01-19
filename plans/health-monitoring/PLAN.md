# Health Monitoring Module - /system/health

## Objetivo
Criar sistema de monitoramento de saude do backbone com KPIs por modulo, instrumentacao e dashboard no app.

---

## 1. KPIs por Modulo

### Infrastructure (lib/)
| KPI | Tipo | Threshold |
|-----|------|-----------|
| `db.connections.active` | Gauge | >80% max |
| `db.query.latency` | Histogram | p95 >500ms |
| `db.query.errors` | Counter | >0/min |
| `redis.ping.latency` | Histogram | p95 >50ms |
| `redis.memory.used` | Gauge | >80% max |
| `llm.request.latency` | Histogram | p95 >5000ms |
| `llm.request.errors` | Counter | >5% rate |
| `llm.tokens.input/output` | Counter | - |

### Services (notifications)
| KPI | Tipo | Threshold |
|-----|------|-----------|
| `notifications.created` | Counter | - |
| `notifications.delivered` | Counter | - |
| `notifications.latency.create` | Histogram | p95 >200ms |
| `notifications.errors` | Counter | >0/min |

### Agents (triager, copilot)
| KPI | Tipo | Threshold |
|-----|------|-----------|
| `agent.{name}.invocations` | Counter | - |
| `agent.{name}.latency` | Histogram | p95 >10s |
| `agent.{name}.errors` | Counter | >10% rate |
| `agent.{name}.node.{node}.latency` | Histogram | - |
| `agent.triager.confidence.avg` | Gauge | <0.7 |

### Actions (registry)
| KPI | Tipo | Threshold |
|-----|------|-----------|
| `actions.registered` | Gauge | - |
| `actions.executed` | Counter | - |
| `actions.errors` | Counter | >5% rate |
| `actions.permission_denied` | Counter | - |
| `actions.by_action.{name}.latency` | Histogram | p95 >1s |

### Knowledge (search, indexer)
| KPI | Tipo | Threshold |
|-----|------|-----------|
| `knowledge.search.latency` | Histogram | p95 >500ms |
| `knowledge.search.empty` | Counter | >30% queries |
| `knowledge.documents.total` | Gauge | - |
| `knowledge.index.latency` | Histogram | p95 >1s |

---

## 2. Estrutura do Backbone (health module)

```
apps/backbone/src/health/
├── index.ts              # Exports
├── types.ts              # Tipos: Metric, Probe, HealthStatus
├── collector.ts          # MetricsCollector singleton
├── service.ts            # Logica de consulta
├── scheduler.ts          # Jobs periodicos
├── events.ts             # Emissao de alertas
├── probes/
│   ├── index.ts          # Agregador de probes
│   ├── db.probe.ts       # Shallow + Deep
│   ├── redis.probe.ts    # Shallow + Deep
│   ├── llm.probe.ts      # Shallow + Deep
│   └── knowledge.probe.ts
├── storage/
│   ├── index.ts
│   ├── redis.storage.ts  # Persistencia Redis
│   └── memory.storage.ts # Fallback in-memory
└── validators/
    └── actions.ts        # Validacao de actions
```

---

## 3. Endpoints da API

```
# Kubernetes Probes
GET /backbone/health/live          # Liveness
GET /backbone/health/ready         # Readiness (shallow)

# Overview
GET /backbone/health               # Status geral + componentes
GET /backbone/health/deep          # Deep check (mais caro)

# Modulos
GET /backbone/health/modules       # Todos os modulos
GET /backbone/health/modules/:mod  # Detalhes de um modulo

# Metricas
GET /backbone/health/metrics       # Snapshot atual
GET /backbone/health/metrics/history?period=1h&metric=db.query.latency

# Actions
GET /backbone/health/actions/validate   # Dry-run validation
POST /backbone/health/actions/test      # Execute test inputs

# Real-time
GET /backbone/health/events        # SSE stream
```

---

## 4. Estrutura do App (frontend)

```
apps/app/app/system/
├── layout.tsx            # Layout com sidebar
└── health/
    ├── page.tsx          # Dashboard principal
    ├── components/
    │   ├── health-overview.tsx    # Cards de status
    │   ├── module-card.tsx        # Card por modulo
    │   ├── metric-chart.tsx       # Graficos historicos
    │   ├── probe-status.tsx       # Indicadores de probe
    │   └── action-validator.tsx   # Validador de actions
    └── hooks/
        └── use-health.ts          # Fetch + SSE subscription
```

---

## 5. Tarefas de Implementacao

### Fase 1: Core do Health Module (backbone)
- [ ] Criar `health/types.ts` com definicoes
- [ ] Criar `health/collector.ts` (MetricsCollector singleton)
- [ ] Criar `health/storage/memory.storage.ts`
- [ ] Criar `health/storage/redis.storage.ts`

### Fase 2: Probes
- [ ] Criar `health/probes/db.probe.ts` (shallow + deep)
- [ ] Criar `health/probes/redis.probe.ts` (shallow + deep)
- [ ] Criar `health/probes/llm.probe.ts` (shallow + deep)
- [ ] Criar `health/probes/knowledge.probe.ts`
- [ ] Criar `health/probes/index.ts` (agregador)

### Fase 3: Instrumentacao dos Modulos Existentes
- [ ] Instrumentar `lib/db.ts` (query metrics)
- [ ] Instrumentar `lib/redis.ts` (command metrics)
- [ ] Instrumentar `lib/llm.ts` (request/token metrics)
- [ ] Instrumentar `actions/registry.ts` (execution metrics)
- [ ] Instrumentar `agents/triager/index.ts` (node latency)
- [ ] Instrumentar `agents/copilot/index.ts` (node latency)
- [ ] Instrumentar `services/notifications/service.ts`
- [ ] Instrumentar `knowledge/search.ts` e `indexer.ts`

### Fase 4: Service e Endpoints
- [ ] Criar `health/service.ts` (getModuleHealth, getHistoricalMetrics)
- [ ] Criar `health/events.ts` (emitHealthEvent, checkThreshold)
- [ ] Criar `health/scheduler.ts` (startHealthMonitoring)
- [ ] Criar `health/validators/actions.ts` (validateAllActions)
- [ ] Expandir `routes/health.ts` com todos endpoints
- [ ] Criar `health/index.ts` (exports)

### Fase 5: Frontend (app)
- [ ] Criar `app/system/layout.tsx`
- [ ] Criar `app/system/health/page.tsx`
- [ ] Criar `components/health-overview.tsx`
- [ ] Criar `components/module-card.tsx`
- [ ] Criar `components/probe-status.tsx`
- [ ] Criar `hooks/use-health.ts` (fetch + SSE)
- [ ] Criar `components/metric-chart.tsx` (opcional)
- [ ] Criar `components/action-validator.tsx` (opcional)

---

## 6. Arquivos Criticos

### Backbone (criar)
- `apps/backbone/src/health/collector.ts` - Core singleton
- `apps/backbone/src/health/types.ts` - Tipos
- `apps/backbone/src/health/probes/*.ts` - Health probes
- `apps/backbone/src/health/service.ts` - Business logic

### Backbone (modificar)
- `apps/backbone/src/lib/db.ts` - Adicionar metricas
- `apps/backbone/src/lib/llm.ts` - Adicionar metricas
- `apps/backbone/src/actions/registry.ts` - Adicionar metricas
- `apps/backbone/src/routes/health.ts` - Expandir endpoints
- `apps/backbone/src/index.ts` - Iniciar health monitoring

### App (criar)
- `apps/app/app/system/health/page.tsx` - Dashboard
- `apps/app/app/system/health/hooks/use-health.ts` - Data fetching

---

## 7. Verificacao

1. **Backbone Health Endpoints**
   ```bash
   curl http://localhost:3002/backbone/health
   curl http://localhost:3002/backbone/health/deep
   curl http://localhost:3002/backbone/health/modules
   curl http://localhost:3002/backbone/health/metrics
   ```

2. **Metricas sendo coletadas**
   - Executar algumas queries no DB
   - Invocar um agent
   - Executar uma action
   - Verificar `/backbone/health/metrics` incrementando

3. **Frontend Dashboard**
   - Acessar `/system/health`
   - Verificar cards de status dos componentes
   - Verificar atualizacao em tempo real via SSE

4. **Action Validation**
   ```bash
   curl http://localhost:3002/backbone/health/actions/validate
   ```
