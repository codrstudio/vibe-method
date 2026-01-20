# Business Operations System

Este documento descreve o sistema de operacoes de negocio implementado nas TASK-5 e TASK-6.

## Visao Geral

O sistema de operacoes de negocio consiste em:

1. **Sistema de Revisao Humana (TASK-5)**: Fluxo para revisao manual de relatorios
2. **Sistema de Producao (TASK-6)**: Pipeline automatizado com metricas e alertas

## Arquitetura

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Frontend      │────▶│   Backbone API  │────▶│   PostgreSQL    │
│   (Next.js)     │     │   (Fastify)     │     │   (biz schema)  │
└─────────────────┘     └─────────────────┘     └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   Scheduler     │
                        │   (BullMQ)      │
                        └─────────────────┘
                               │
                               ▼
                        ┌─────────────────┐
                        │   WhatsApp      │
                        │   Service       │
                        └─────────────────┘
```

---

## TASK-5: Sistema de Revisao Humana

### Tabelas

- `biz.reports`: Relatorios pendentes de revisao
- `biz.review_history`: Historico de acoes de revisao

### Status de Relatorio

| Status | Descricao |
|--------|-----------|
| `pending` | Aguardando revisao |
| `approved` | Aprovado pelo revisor |
| `rejected` | Rejeitado pelo revisor |
| `fallback` | Texto alternativo aplicado |
| `timeout` | Prazo de revisao expirado |
| `processing` | Em processamento |

### API Endpoints

**Base URL**: `/backbone/biz/review`

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/pending` | GET | Lista relatorios pendentes |
| `/stats` | GET | Estatisticas de revisao |
| `/:id` | GET | Detalhes de um relatorio |
| `/:id/approve` | POST | Aprovar relatorio |
| `/:id/reject` | POST | Rejeitar relatorio (requer `reason`) |
| `/:id/fallback` | POST | Aplicar fallback (requer `fallback_text`) |

### Executores

#### `biz:notify-review`
Envia notificacoes WhatsApp para revisores quando ha relatorios pendentes.

- **Cron**: `*/30 8-20 * * 1-5` (cada 30min, horario comercial)
- **Variaveis**: `BIZ_REVIEW_PHONE`, `BIZ_WHATSAPP_OPERATION`

#### `biz:review-timeout`
Marca relatorios como timeout quando excedem o prazo.

- **Cron**: `*/5 * * * *` (cada 5min)
- **Variaveis**: `BIZ_REVIEW_TIMEOUT_MINUTES`

### Dashboard

**URL**: `/app/revisao`

Funcionalidades:
- Cards com estatisticas do dia
- Lista de relatorios pendentes
- Acoes: aprovar, rejeitar, fallback
- Indicador de prazo vencido
- Sugestao de IA

---

## TASK-6: Sistema de Producao

### Tabelas

- `biz.pipeline_runs`: Historico de execucoes do pipeline
- `biz.daily_metrics`: Metricas diarias agregadas
- `biz.alerts`: Alertas do sistema

### Pipeline Principal

O pipeline `biz:pipeline` executa em 4 etapas:

1. **Sync**: Sincroniza dados de fontes externas
2. **Process**: Analisa e categoriza relatorios
3. **Notify**: Identifica relatorios que precisam de notificacao
4. **Send**: Despacha itens aprovados

### API Endpoints

**Base URL**: `/backbone/biz/metrics`

| Endpoint | Metodo | Descricao |
|----------|--------|-----------|
| `/today` | GET | Metricas de hoje + padroes detectados |
| `/history` | GET | Historico de metricas (param: `days`) |
| `/pipeline-runs` | GET | Execucoes do pipeline (param: `recent`, `limit`) |
| `/alerts` | GET | Alertas ativos |
| `/alerts/:id/acknowledge` | POST | Reconhecer alerta |
| `/alerts/:id/resolve` | POST | Resolver alerta |

### Executores

#### `biz:pipeline`
Pipeline principal de processamento.

- **Cron**: `0 12,18,20 * * *` (12h, 18h, 20h)
- **Timeout**: 5 minutos
- **Variaveis**: `BIZ_PIPELINE_TIMEOUT_MS`

#### `biz:check-alerts`
Analisa metricas e cria alertas para anomalias.

- **Cron**: `*/15 * * * *` (cada 15min)
- **Variaveis**: `BIZ_ALERT_PHONE`, `BIZ_APPROVAL_THRESHOLD`, `BIZ_FALLBACK_THRESHOLD`

#### `biz:daily-metrics`
Agrega metricas do dia anterior.

- **Cron**: `0 0 * * *` (meia-noite)

### Deteccao de Padroes

O sistema detecta automaticamente:

| Padrao | Severidade | Condicao |
|--------|------------|----------|
| `low_approval_rate` | warning/critical | Taxa abaixo do threshold |
| `high_fallback_rate` | warning/critical | Taxa acima do threshold |
| `high_timeout_rate` | warning/critical | Taxa acima de 10% |
| `declining_approval_trend` | warning/critical | Queda > 10% em 7 dias |
| `high_pipeline_failure_rate` | warning/critical | Taxa de falha > 20% |
| `slow_review_time` | warning/critical | Tempo > 30min |
| `consecutive_failures` | warning/critical | >= 3 dias com falhas |
| `stuck_pipeline` | critical | Pipeline rodando > 30min |
| `many_overdue_reviews` | warning/critical | > 10 relatorios vencidos |

### Dashboard

**URL**: `/app/biz`

Funcionalidades:
- Alertas ativos com acoes
- Padroes detectados
- Taxa de aprovacao e falha
- Execucoes do pipeline (ultimas 24h)
- Refresh automatico

---

## Configuracao de Ambiente

Adicione ao `.env`:

```env
# Review
BIZ_REVIEW_PHONE=+5511999999999
BIZ_REVIEW_TIMEOUT_MINUTES=30
DASHBOARD_URL=https://dashboard.exemplo.com

# Alerts
BIZ_ALERT_PHONE=+5511999999999
BIZ_APPROVAL_THRESHOLD=70
BIZ_FALLBACK_THRESHOLD=20
BIZ_PIPELINE_TIMEOUT_MS=300000

# WhatsApp Operation
BIZ_WHATSAPP_OPERATION=alerts
```

---

## Migrations

Execute as migrations na ordem:

```bash
# Migration 105: Sistema de revisao
psql -d main < database/main/migrations/105_biz_reports_review.sql

# Migration 106: Metricas do pipeline
psql -d main < database/main/migrations/106_biz_pipeline_metrics.sql

# Seed: Jobs do scheduler
psql -d main < database/main/seeds/biz-scheduler-jobs.sql
```

---

## Fluxo de Trabalho

### Fluxo de Revisao

```
┌─────────┐    ┌─────────┐    ┌─────────┐    ┌─────────┐
│ Criacao │───▶│ Pending │───▶│ Revisao │───▶│ Decisao │
└─────────┘    └─────────┘    └─────────┘    └─────────┘
                    │                              │
                    │ timeout                      ▼
                    └─────────▶┌─────────────────────┐
                               │ approved/rejected/  │
                               │ fallback/timeout    │
                               └─────────────────────┘
```

### Fluxo do Pipeline

```
┌──────┐    ┌─────────┐    ┌────────┐    ┌──────┐
│ Sync │───▶│ Process │───▶│ Notify │───▶│ Send │
└──────┘    └─────────┘    └────────┘    └──────┘
    │            │              │            │
    └────────────┴──────────────┴────────────┘
                         │
                         ▼
                 ┌───────────────┐
                 │ Metricas +    │
                 │ Alertas       │
                 └───────────────┘
```

---

## Arquivos Criados

### Backend (backbone)

```
apps/backbone/src/
├── lib/
│   └── biz-patterns.ts           # Deteccao de padroes
├── routes/biz/
│   ├── index.ts                  # Agregador de rotas
│   ├── review.ts                 # API de revisao
│   └── metrics.ts                # API de metricas
└── services/scheduler/executors/
    ├── index.ts                  # Carrega todos executores
    ├── biz-notify-review.ts      # Notificacao de revisao
    ├── biz-review-timeout.ts     # Timeout de revisao
    ├── biz-pipeline.ts           # Pipeline principal
    ├── biz-check-alerts.ts       # Verificacao de alertas
    └── biz-daily-metrics.ts      # Agregacao diaria
```

### Frontend (app)

```
apps/app/
├── app/api/biz/
│   ├── review/
│   │   ├── route.ts              # Lista e stats
│   │   └── [id]/
│   │       ├── route.ts          # Detalhes
│   │       └── [action]/route.ts # Acoes
│   └── metrics/
│       ├── route.ts              # Metricas
│       └── alerts/[id]/[action]/route.ts
└── app/app/(dashboard)/
    ├── revisao/page.tsx          # Dashboard de revisao
    └── biz/page.tsx              # Dashboard de operacoes
```

### Database

```
database/main/
├── migrations/
│   ├── 105_biz_reports_review.sql
│   └── 106_biz_pipeline_metrics.sql
└── seeds/
    └── biz-scheduler-jobs.sql
```

---

## Verificacao

### TASK-5 (Revisao)
- [ ] Migration 105 aplicada
- [ ] API `/backbone/biz/review/*` funciona
- [ ] Executor `biz:notify-review` registrado
- [ ] Executor `biz:review-timeout` registrado
- [ ] Dashboard `/app/revisao` funciona
- [ ] Fluxo completo testado

### TASK-6 (Producao)
- [ ] Migration 106 aplicada
- [ ] API `/backbone/biz/metrics/*` funciona
- [ ] Executor `biz:pipeline` registrado
- [ ] Executor `biz:check-alerts` registrado
- [ ] Executor `biz:daily-metrics` registrado
- [ ] Jobs criados no scheduler
- [ ] Dashboard `/app/biz` funciona
- [ ] Sistema completo testado
