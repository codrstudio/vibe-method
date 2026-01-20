# Plano: Scheduler Metrics & Pulse Integration

Integração do Job Scheduler com o sistema de monitoramento Pulse.

---

## Arquitetura

```
Scheduler Service          Pulse System
     │                          │
     ├── metrics.ts ──────────► Health Collector
     │   (counters, gauges)     (prometheus-like)
     │                          │
     └── health-probe.ts ─────► Probe Registry
         (health check)         (status checks)
```

---

## Arquivos a Criar

### 1. Métricas
- `apps/backbone/src/services/scheduler/metrics.ts`

### 2. Health Probe
- `apps/backbone/src/services/scheduler/health-probe.ts`

---

## Arquivos a Modificar

- `apps/backbone/src/services/scheduler/index.ts` - Exportar métricas e registrar probe
- `apps/backbone/src/services/scheduler/worker.ts` - Instrumentar execuções
- `apps/backbone/src/services/scheduler/service.ts` - Instrumentar operações

---

## Métricas a Implementar

### Gauges (valores instantâneos)
| Métrica | Descrição |
|---------|-----------|
| `scheduler.jobs.total` | Total de jobs cadastrados |
| `scheduler.jobs.enabled` | Jobs ativos |
| `scheduler.jobs.paused` | Jobs pausados |
| `scheduler.queue.waiting` | Jobs aguardando |
| `scheduler.queue.active` | Jobs em execução |
| `scheduler.queue.failed` | Jobs falhados na fila |

### Counters (acumuladores)
| Métrica | Labels | Descrição |
|---------|--------|-----------|
| `scheduler.runs.total` | status, trigger | Total de execuções |
| `scheduler.runs.duration_ms` | job_slug | Duração das execuções |

---

## Health Probe

```typescript
{
  name: 'scheduler',
  check: async () => {
    // Verifica worker, redis, queue
    return { status: 'healthy' | 'degraded' | 'unhealthy', details }
  }
}
```

### Condições
- **healthy**: Worker rodando, queue < 50, success_rate > 95%
- **degraded**: Queue 50-100 ou success_rate 80-95%
- **unhealthy**: Worker parado ou queue > 100 ou success_rate < 80%

---

## Ordem de Implementação

1. [x] Ler referência do health collector existente
2. [x] Criar `metrics.ts` com funções de coleta
3. [x] Criar `scheduler.probe.ts` no folder de probes (`pulse/probes/`)
4. [x] Atualizar `worker.ts` para instrumentar execuções
5. [x] Registrar probe no `probes/index.ts`
6. [x] Testar via `/backbone/pulse`

---

## Verificação

1. [x] `GET /backbone/pulse` - Probe `scheduler` aparecendo (147.7ms latency)
2. [x] UI Health Dashboard - 7/7 probes healthy
3. [x] Scheduler probe reportando: "Queue degraded: 0 waiting, 45 failed"

### Arquivos Criados/Modificados

- `apps/backbone/src/services/scheduler/metrics.ts` - Métricas (counters, gauges, histograms)
- `apps/backbone/src/pulse/probes/scheduler.probe.ts` - Health probes (shallow + deep)
- `apps/backbone/src/pulse/probes/index.ts` - Registro dos probes
- `apps/backbone/src/services/scheduler/worker.ts` - Instrumentação com métricas
