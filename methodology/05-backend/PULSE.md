# Pulse (Observabilidade)

Modulo de monitoramento e alertas integrado ao Backbone.

---

## Indice

1. [Visao Geral](#visao-geral) - O que eh Pulse
2. [Arquitetura](#arquitetura) - Componentes internos
3. [Estrutura](#estrutura) - Organizacao de pastas
4. [Probes](#probes) - Health checks
5. [Metricas](#metricas) - Coleta e armazenamento
6. [Alertas](#alertas) - Configuracao e canais
7. [API REST](#api-rest) - Endpoints
8. [Boas Praticas](#boas-praticas) - DO e DON'T

---

## Visao Geral

**Pulse** eh o modulo de observabilidade do Backbone. Fornece:

- **Probes**: Health checks de infraestrutura (DB, Redis, LLM, etc)
- **Metricas**: Coleta e historico de performance
- **Alertas**: Notificacoes em multiplos canais (UI, Email, WhatsApp)

```
┌──────────────────────────────────────────────────────────────┐
│                        BACKBONE                              │
│                                                              │
│   ┌────────┐  ┌─────────┐  ┌─────────┐  ┌──────────┐        │
│   │Services│  │ Agents  │  │ Actions │  │Knowledge │        │
│   └────┬───┘  └────┬────┘  └────┬────┘  └────┬─────┘        │
│        │           │            │             │              │
│        └───────────┴─────┬──────┴─────────────┘              │
│                          │                                   │
│                          ▼                                   │
│                    ┌──────────┐                              │
│                    │  PULSE   │ ◀── observa tudo             │
│                    │          │                              │
│                    │ probes   │                              │
│                    │ metrics  │                              │
│                    │ alerts   │                              │
│                    └──────────┘                              │
│                          │                                   │
│                          ▼                                   │
│                    ┌──────────┐                              │
│                    │  Redis   │ ◀── armazena metricas        │
│                    └──────────┘                              │
└──────────────────────────────────────────────────────────────┘
```

| Aspecto | Valor |
|---------|-------|
| Localizacao | `apps/backbone/src/pulse/` |
| Parte de | Backbone (mesmo processo) |
| Storage | Redis (com fallback em memoria) |

---

## Arquitetura

Pulse tem 3 subsistemas principais:

| Subsistema | Responsabilidade |
|------------|------------------|
| **Probes** | Health checks de componentes |
| **Metrics** | Coleta, agregacao, historico |
| **Alerts** | Avaliacao de condicoes, roteamento |

### Fluxo de Dados

```
PROBES                 METRICAS               ALERTAS
  │                       │                      │
  │ checa DB, Redis,      │ counter, gauge,      │ avalia condicoes
  │ LLM, Ollama, KB       │ histogram            │ respeita cooldown
  │                       │                      │
  └───────────┬───────────┴──────────┬───────────┘
              │                      │
              ▼                      ▼
         ┌─────────┐           ┌──────────┐
         │ Storage │           │ Channels │
         │ (Redis) │           │ UI/Email │
         └─────────┘           │ WhatsApp │
                               └──────────┘
```

---

## Estrutura

```
apps/backbone/src/pulse/
├── index.ts                 # Exports publicos
├── types.ts                 # Tipos e schemas Zod
├── service.ts               # Funcoes de servico
│
├── probes/                  # Health checks
│   ├── index.ts             # Runner de probes
│   ├── database.ts          # PostgreSQL
│   ├── redis.ts             # Redis
│   ├── llm.ts               # OpenRouter
│   ├── ollama.ts            # Ollama local
│   └── knowledge.ts         # Knowledge base
│
├── metrics/                 # Sistema de metricas
│   ├── collector.ts         # MetricsCollector singleton
│   └── storage.ts           # Persistencia Redis
│
└── alerts/                  # Sistema de alertas
    ├── repository.ts        # CRUD de alertas
    └── channels/            # Canais de notificacao
        ├── ui.ts            # SSE broadcast
        ├── email.ts         # SMTP
        └── whatsapp.ts      # Evolution API
```

---

## Probes

Probes verificam saude de componentes. Cada probe tem dois modos:

| Modo | Velocidade | Profundidade |
|------|------------|--------------|
| **Shallow** | Rapido (~10ms) | Verifica configuracao/conexao |
| **Deep** | Lento (~100ms+) | Executa operacao real |

### Probes Disponiveis

| Probe | Shallow | Deep |
|-------|---------|------|
| **database** | Pool status (idle/waiting) | Executa `SELECT 1` |
| **redis** | Connection status | PING + memory info |
| **llm** | API key configurada | Fetch models + credits |
| **ollama** | URL configurada | Version + models list |
| **knowledge** | Tabela existe | Count + FTS test |

### Resultado de Probe

```typescript
interface ProbeResult {
  name: string;
  healthy: boolean;
  latency: number;      // ms
  message?: string;     // erro se unhealthy
  details?: Record<string, unknown>;
}
```

### Exemplo de Details

```typescript
// database (deep)
{
  queryTime: 12.5,
  pool: { total: 10, idle: 8, waiting: 0 }
}

// llm (deep)
{
  baseUrl: "https://openrouter.ai/api/v1",
  defaultModel: "anthropic/claude-3",
  credits: { remaining: 5.23, limit: 10.00 }
}

// ollama (deep)
{
  version: "0.1.29",
  modelsInstalled: 3,
  modelsLoaded: 1,
  models: ["llama2", "mistral", "codellama"]
}
```

---

## Metricas

### Tipos de Metricas

| Tipo | Uso | Exemplo |
|------|-----|---------|
| **Counter** | Acumulativo, so cresce | Requests totais |
| **Gauge** | Valor pontual | Conexoes ativas |
| **Histogram** | Distribuicao | Latencia (p50/p90/p99) |

### Collector

Singleton que coleta metricas de toda aplicacao:

```typescript
import { metricsCollector } from './pulse/metrics';

// Counter
metricsCollector.incCounter('requests.total', 1, { endpoint: '/api' });

// Gauge
metricsCollector.setGauge('connections.active', 42);

// Histogram (latencia)
metricsCollector.observeHistogram('request.latency', 125);

// Timer automatico
const result = await metricsCollector.timeAsync(
  'db.query',
  () => db.query('SELECT * FROM users')
);
```

### Modulos Monitorados

| Modulo | Metricas |
|--------|----------|
| **infrastructure** | db.connections, db.query.latency, redis.ping, llm.latency |
| **services** | notifications.created, notifications.delivered |
| **agents** | agent.triager.invocations, agent.copilot.latency |
| **actions** | actions.executed, actions.errors, actions.latency |
| **knowledge** | knowledge.search.queries, knowledge.documents.total |

### Storage

Redis com fallback em memoria:

| Dados | Retencao |
|-------|----------|
| Time-series (pontos) | 1 hora |
| Snapshots 1m | 1 hora |
| Snapshots 5m | 6 horas |
| Snapshots 1h | 7 dias |
| Snapshots 24h | 30 dias |
| Erros por modulo | 24 horas |

---

## Alertas

### Configuracao

```typescript
interface AlertConfig {
  id: string;
  name: string;
  description?: string;
  condition: AlertCondition;
  channels: ('ui' | 'email' | 'whatsapp')[];
  recipients?: string[];    // emails ou telefones
  cooldown: number;         // segundos entre alertas (default: 300)
  enabled: boolean;
}
```

### Condicoes

| Tipo | Quando Dispara |
|------|----------------|
| `probe.unhealthy` | Probe retorna unhealthy |
| `probe.degraded` | Probe retorna degraded ou unhealthy |
| `metric.threshold` | Metrica ultrapassa valor |
| `metric.change` | Metrica muda em periodo |

```typescript
// Exemplo: alerta quando DB fica lento
{
  name: "Database Lento",
  condition: {
    type: "metric.threshold",
    target: "db.query.latency",
    operator: "gt",
    value: 500
  },
  channels: ["ui", "email"],
  cooldown: 300
}
```

### Canais

| Canal | Implementacao | Config Necessaria |
|-------|---------------|-------------------|
| **UI** | SSE broadcast | Nenhuma |
| **Email** | Nodemailer SMTP | SMTP_HOST, SMTP_USER, SMTP_PASS |
| **WhatsApp** | Evolution API | EVOLUTION_API_URL, EVOLUTION_API_KEY |

### Eventos

```typescript
interface AlertEvent {
  id: string;
  alertId: string;
  alertName: string;
  triggeredAt: string;
  resolvedAt?: string;
  status: 'triggered' | 'resolved' | 'acknowledged';
  channels: string[];
}
```

---

## API REST

### Overview

```http
GET /backbone/pulse
```

Retorna snapshot geral: status, uptime, probes summary, alertas ativos.

### Probes

```http
GET /backbone/pulse/probes           # Todos (shallow)
GET /backbone/pulse/probes/deep      # Todos (deep)
GET /backbone/pulse/probes/:name     # Um probe (?deep=true)
```

### LLM

```http
GET /backbone/pulse/llm              # OpenRouter + Ollama
GET /backbone/pulse/llm/openrouter   # Credits, usage
GET /backbone/pulse/llm/ollama       # Version, models
```

### Metricas

```http
GET /backbone/pulse/metrics          # Snapshot atual
GET /backbone/pulse/metrics/history  # Historico
    ?metric=db.query.latency
    &period=1h
    &from=2024-01-01T00:00:00Z
    &to=2024-01-01T01:00:00Z
```

### Alertas

```http
GET    /backbone/pulse/alerts        # Lista configs + eventos
GET    /backbone/pulse/alerts/:id    # Detalhe
POST   /backbone/pulse/alerts        # Criar
PUT    /backbone/pulse/alerts/:id    # Atualizar
DELETE /backbone/pulse/alerts/:id    # Remover
```

### Real-time (SSE)

```http
GET /backbone/pulse/events
```

Stream de eventos em tempo real. Envia snapshot inicial e atualiza a cada 5s.

---

## Boas Praticas

### DO

- Usar probes shallow para dashboards (polling rapido)
- Usar probes deep para diagnostico (sob demanda)
- Configurar cooldown adequado (evita spam de alertas)
- Monitorar metricas de negocio, nao so infra
- Usar labels para segmentar metricas
- Graceful degradation (memoria se Redis falhar)

### DON'T

- Fazer deep probes em polling frequente (sobrecarrega)
- Alertar sem cooldown (alert fatigue)
- Guardar metricas indefinidamente (usar retencao)
- Depender apenas de UI para alertas criticos
- Misturar metricas de diferentes granularidades

---

## Checklist - Novo Probe

- [ ] Criar arquivo em `pulse/probes/<nome>.ts`
- [ ] Implementar `check(deep: boolean): Promise<ProbeResult>`
- [ ] Registrar em `pulse/probes/index.ts`
- [ ] Definir thresholds de latencia
- [ ] Documentar em CLAUDE.md

## Checklist - Nova Metrica

- [ ] Definir nome padronizado (`modulo.entidade.acao`)
- [ ] Escolher tipo (counter/gauge/histogram)
- [ ] Adicionar coleta no ponto correto
- [ ] Verificar se precisa de labels
- [ ] Criar alerta se for critica

## Checklist - Novo Alerta

- [ ] Definir condicao clara
- [ ] Escolher canais apropriados
- [ ] Definir cooldown (default: 5min)
- [ ] Testar disparo e resolucao
- [ ] Documentar recipients necessarios
