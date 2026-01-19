# Socket Health Monitoring Module

Dashboard em `/system/health/realtime` para monitoramento real-time do socket server.

> **Estrutura de rotas:**
> - `/system/health` - Overview geral (futuro)
> - `/system/health/realtime` - Monitoramento de sockets (este módulo)

---

## KPIs a Monitorar

### Conexões
| Métrica | Descrição |
|---------|-----------|
| `connections.total` | Total de conexões ativas |
| `connections.hub` | Conexões no namespace /hub |
| `connections.portal` | Conexões no namespace /portal |
| `connections.rate.1m` | Taxa de conexões/min |
| `disconnections.rate.1m` | Taxa de desconexões/min |

### Eventos
| Métrica | Descrição |
|---------|-----------|
| `events.inbound.count` | Total de eventos recebidos |
| `events.outbound.count` | Total de eventos emitidos |
| `events.throughput.1m` | Eventos/segundo (média 1 min) |
| `events.latency.avg` | Latência média de processamento |
| `events.by_type` | Contagem por tipo de evento |

### Rooms
| Métrica | Descrição |
|---------|-----------|
| `rooms.total` | Total de rooms ativas |
| `rooms.by_prefix` | Rooms por prefixo (thread:, user:, presence:) |
| `rooms.avg_size` | Tamanho médio das rooms |
| `rooms.largest` | Maior room |

### Presença
| Métrica | Descrição |
|---------|-----------|
| `presence.online` | Usuários online |
| `presence.away` | Usuários away |
| `presence.stale_clients` | Clientes sem heartbeat recente |

### Infraestrutura
| Métrica | Descrição |
|---------|-----------|
| `redis.connected` | Status da conexão Redis |
| `redis.latency` | Latência do Redis (ms) |
| `server.uptime` | Tempo de atividade |
| `server.memory.*` | Uso de memória (heap, rss) |

---

## Arquitetura

```
┌─────────────────┐     HTTP      ┌──────────────────┐
│   Dashboard     │◄────/metrics──│  Socket Server   │
│  /system/health │               │                  │
│                 │◄──WebSocket───│  /admin namespace│
│  (Next.js App)  │   real-time   │  (métricas 5s)   │
└─────────────────┘               └──────────────────┘
```

---

## Estrutura de Arquivos

### Socket Server (apps/sockets)

```
apps/sockets/src/
├── health/                       # [NEW] Módulo de health
│   ├── index.ts                  # Exports
│   ├── types.ts                  # Tipos de métricas
│   ├── collectors/
│   │   ├── index.ts              # Registry de collectors
│   │   ├── connections.ts        # Métricas de conexão
│   │   ├── events.ts             # Métricas de eventos
│   │   ├── rooms.ts              # Métricas de rooms
│   │   └── infrastructure.ts     # Redis/server metrics
│   └── routes.ts                 # HTTP endpoints
│
├── server/
│   └── middleware/
│       └── metrics.ts            # [NEW] Middleware de métricas
│
├── namespaces/
│   └── admin.ts                  # [NEW] Namespace /admin
│
└── index.ts                      # [MODIFY] Adicionar HTTP server
```

### Frontend (apps/app)

```
apps/app/
├── app/
│   └── system/
│       └── health/
│           └── realtime/
│               └── page.tsx      # [NEW] Página de monitoramento realtime
│
├── components/
│   └── health/                   # [NEW] Componentes
│       ├── health-overview.tsx   # Cards de status geral
│       ├── connection-stats.tsx  # Métricas de conexão
│       ├── event-chart.tsx       # Gráfico de throughput
│       ├── room-stats.tsx        # Métricas de rooms
│       ├── infrastructure.tsx    # Status Redis/server
│       ├── connections-table.tsx # Lista de conexões
│       └── diagnostic-panel.tsx  # Ferramentas de diagnóstico
│
├── hooks/
│   ├── use-socket.ts             # [NEW] Hook de socket
│   └── use-health-metrics.ts     # [NEW] Hook de métricas
│
└── lib/
    └── socket.ts                 # [NEW] Cliente socket
```

---

## Endpoints HTTP (Socket Server)

| Endpoint | Método | Descrição |
|----------|--------|-----------|
| `/health` | GET | Health check básico |
| `/health/ready` | GET | Readiness probe |
| `/health/live` | GET | Liveness probe |
| `/metrics` | GET | Métricas completas (JSON) |
| `/admin/connections` | GET | Lista de conexões ativas |
| `/admin/rooms` | GET | Lista de rooms |
| `/admin/disconnect/:id` | POST | Desconectar socket |

---

## Eventos WebSocket (/admin namespace)

| Evento | Direção | Descrição |
|--------|---------|-----------|
| `metrics:request` | C→S | Solicitar snapshot |
| `metrics:snapshot` | S→C | Resposta com métricas |
| `metrics:update` | S→C | Atualização periódica (5s) |

---

## Checklist de Implementação

### Fase 1: Instrumentação do Socket Server
- [x] Criar `apps/sockets/src/health/types.ts` - tipos de métricas
- [x] Criar `apps/sockets/src/health/collectors/index.ts` - registry
- [x] Criar `apps/sockets/src/health/collectors/connections.ts`
- [x] Criar `apps/sockets/src/health/collectors/events.ts`
- [x] Criar `apps/sockets/src/health/collectors/rooms.ts`
- [x] Criar `apps/sockets/src/health/collectors/infrastructure.ts`
- [x] Criar `apps/sockets/src/health/routes.ts` - endpoints HTTP
- [x] Criar `apps/sockets/src/server/middleware/metrics.ts`
- [x] Criar `apps/sockets/src/namespaces/admin.ts`
- [x] Modificar `apps/sockets/src/index.ts` - adicionar HTTP server

### Fase 2: Infraestrutura Frontend
- [x] Criar `apps/app/lib/socket.ts` - cliente socket
- [x] Criar `apps/app/hooks/use-socket.ts`
- [x] Criar `apps/app/hooks/use-health-metrics.ts`

### Fase 3: Componentes do Dashboard
- [x] Criar `apps/app/components/health/health-overview.tsx`
- [x] Criar `apps/app/components/health/connection-stats.tsx`
- [x] Criar `apps/app/components/health/room-stats.tsx` (substituiu event-chart)
- [x] Criar `apps/app/components/health/infrastructure-status.tsx`
- [x] Criar `apps/app/components/health/connections-table.tsx`
- [x] Criar `apps/app/components/health/rooms-table.tsx`
- [x] Criar `apps/app/components/health/diagnostic-panel.tsx`

### Fase 4: Página e Integração
- [x] Criar `apps/app/app/system/health/realtime/page.tsx`
- [x] Adicionar link no sidebar para /system/health/realtime
- [x] Configurar `NEXT_PUBLIC_SOCKET_URL` no .env

---

## Verificação

1. **Socket Server**: `curl http://localhost:8001/health` retorna `{ status: 'healthy' }`
2. **Métricas**: `curl http://localhost:8001/metrics` retorna JSON com todas as métricas
3. **Dashboard**: Acessar `/system/health/realtime` mostra métricas atualizando em tempo real
4. **Diagnóstico**: Botão de disconnect funciona e remove socket da lista

---

## Arquivos Críticos

- `apps/sockets/src/index.ts` - Entry point para adicionar HTTP server
- `apps/sockets/src/server/index.ts` - Onde collectors se conectam ao io
- `apps/app/app/dashboard/page.tsx` - Referência para estrutura da página
- `apps/app/components/app-sidebar.tsx` - Onde adicionar link do menu
