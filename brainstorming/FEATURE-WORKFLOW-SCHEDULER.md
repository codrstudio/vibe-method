# Feature: Workflow Orchestration & Scheduling

## Visao Geral

Sistema de orquestracao de workflows com agendamento, calendario visual e execucao duravel.

**Filosofia Motor:** Workflows sao artefatos declarativos (YAML) consumidos pelo motor de execucao.

---

## Estado da Arte (2025)

### Tendencias Principais

| Tendencia | Descricao | Fonte |
|-----------|-----------|-------|
| **Database-Backed** | PostgreSQL como camada de orquestracao, nao apenas storage | [DBOS @ QCon SF 2025](https://www.infoq.com/news/2025/11/database-backed-workflow/) |
| **Declarativo** | Workflows definidos em YAML, nao codigo | [Kestra](https://kestra.io/) |
| **Event-Driven** | Triggers por eventos, nao apenas cron | [Temporal](https://temporal.io/) |
| **Durable Execution** | Checkpoints garantem exactly-once semantics | [DBOS Docs](https://docs.dbos.dev/why-dbos) |

### Ferramentas de Referencia

| Ferramenta | Abordagem | Destaque |
|------------|-----------|----------|
| [DBOS](https://www.dbos.dev/blog/why-postgres-durable-execution) | Biblioteca + Postgres | Simples, sem servidor externo |
| [Kestra](https://kestra.io/features) | YAML + UI | 600+ plugins, event-driven |
| [Temporal](https://temporal.io/) | Server dedicado | Fault-tolerant, enterprise |
| [Prefect](https://www.prefect.io/) | Python-first | Dynamic workflows |
| [Airflow](https://airflow.apache.org/) | DAGs Python | Batch-oriented, maduro |

### Decisao Arquitetural

**Recomendacao: Abordagem DBOS-like + YAML declarativo**

- **Por que nao Temporal/Airflow?** Requer servidor separado, complexidade operacional
- **Por que DBOS-like?** Usa Postgres existente, biblioteca leve, sem dependencias externas
- **Por que YAML declarativo?** Alinhado com filosofia motor (artefatos), facil de versionar

---

## Arquitetura Proposta

### Modelo Conceitual

```
┌─────────────────────────────────────────────────────────────────────┐
│                         ARTEFATOS (specs/)                          │
├─────────────────────────────────────────────────────────────────────┤
│  specs/workflows/                                                   │
│  ├── biz-report-pipeline.yaml    # Definicao do workflow            │
│  ├── daily-backup.yaml                                              │
│  └── analytics-sync.yaml                                            │
│                                                                     │
│  specs/schedules/                                                   │
│  ├── biz-reports.yaml            # Agendamento do workflow          │
│  └── maintenance.yaml                                               │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Motor le e executa
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         MOTOR (backbone)                            │
├─────────────────────────────────────────────────────────────────────┤
│  Workflow Engine                                                    │
│  ├── Workflow Registry (carrega YAMLs)                              │
│  ├── Schedule Manager (cron + events)                               │
│  ├── Execution Engine (roda steps)                                  │
│  └── Checkpoint Manager (durabilidade)                              │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Persiste estado
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         POSTGRES                                    │
├─────────────────────────────────────────────────────────────────────┤
│  workflows          # Registro de workflows                         │
│  workflow_schedules # Agendamentos                                  │
│  workflow_runs      # Execucoes (com checkpoints)                   │
│  workflow_steps     # Steps de cada execucao                        │
└─────────────────────────────────────────────────────────────────────┘
                              │
                              │ Visualiza
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         UI (app)                                    │
├─────────────────────────────────────────────────────────────────────┤
│  /workflows          # Lista de workflows                           │
│  /workflows/:id      # Detalhe + historico                          │
│  /schedules          # Calendario com agendamentos                  │
│  /runs               # Execucoes em andamento/historico             │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Componentes

### 1. Workflow Definition (Artefato YAML)

```yaml
# specs/workflows/biz-report-pipeline.yaml
id: biz-report-pipeline
name: Pipeline de Relatorios BIZ
description: Sincroniza, processa e envia relatorios humanizados
version: 1.0.0

# Classificacao (para filtros no calendario)
metadata:
  category: biz           # biz, system, analytics, maintenance
  priority: high          # critical, high, normal, low
  owner: operacoes
  tags: [reports, whatsapp, primecare]

# Inputs do workflow
inputs:
  - name: turno
    type: enum
    values: [diurno, noturno]
    required: false
  - name: limit
    type: number
    default: 10

# Steps do workflow
steps:
  - id: sync
    name: Sincronizar PrimeCare
    type: script
    script: biz-sync-primecare
    timeout: 60000
    retry:
      maxAttempts: 3
      backoff: exponential

  - id: process
    name: Processar Relatorios
    type: script
    script: biz-process-reports
    dependsOn: [sync]
    timeout: 300000
    retry:
      maxAttempts: 2

  - id: notify
    name: Notificar Revisao
    type: script
    script: biz-notify-review
    dependsOn: [process]
    condition: "{{ steps.process.output.failed > 0 }}"

  - id: send
    name: Enviar Relatorios
    type: script
    script: biz-send-reports
    dependsOn: [process]
    timeout: 120000

# Outputs do workflow
outputs:
  synced: "{{ steps.sync.output.count }}"
  approved: "{{ steps.process.output.approved }}"
  failed: "{{ steps.process.output.failed }}"
  sent: "{{ steps.send.output.sent }}"
```

### 2. Schedule Definition (Artefato YAML)

```yaml
# specs/schedules/biz-reports.yaml
id: biz-reports-schedule
name: Agendamento Relatorios BIZ
workflow: biz-report-pipeline

# Classificacao (para filtros no calendario)
metadata:
  category: biz
  color: "#4CAF50"        # Cor no calendario
  icon: document

# Triggers
triggers:
  # Cron schedules
  - type: cron
    name: Turno Diurno Manha
    cron: "0 12 * * *"    # 12h todos os dias
    timezone: America/Sao_Paulo
    inputs:
      turno: diurno

  - type: cron
    name: Turno Diurno Tarde
    cron: "0 18 * * *"    # 18h todos os dias
    timezone: America/Sao_Paulo
    inputs:
      turno: diurno

  - type: cron
    name: Turno Noturno
    cron: "0 20 * * *"    # 20h todos os dias
    timezone: America/Sao_Paulo
    inputs:
      turno: noturno

  # Event trigger (opcional)
  - type: event
    name: Manual via API
    event: biz.reports.trigger
    enabled: true

# Configuracoes
config:
  concurrency: 1          # Apenas 1 execucao por vez
  catchUp: false          # Nao executar schedules perdidos
  timeout: 600000         # 10 minutos max
```

### 3. Tabelas PostgreSQL

```sql
-- =============================================================================
-- Workflow Registry
-- =============================================================================
CREATE TABLE workflows (
  id VARCHAR(100) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  version VARCHAR(20) NOT NULL,
  definition JSONB NOT NULL,       -- YAML parseado
  metadata JSONB DEFAULT '{}',

  -- Classificacao
  category VARCHAR(50),            -- biz, system, analytics
  priority VARCHAR(20),            -- critical, high, normal, low

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users
);

-- =============================================================================
-- Schedules
-- =============================================================================
CREATE TABLE workflow_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id VARCHAR(100) REFERENCES workflows(id),
  name VARCHAR(255) NOT NULL,

  -- Trigger config
  trigger_type VARCHAR(20) NOT NULL,  -- cron, event, manual
  cron_expression VARCHAR(100),
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',
  event_name VARCHAR(100),

  -- Inputs padrao
  default_inputs JSONB DEFAULT '{}',

  -- Configuracoes
  enabled BOOLEAN DEFAULT TRUE,
  concurrency INT DEFAULT 1,
  catch_up BOOLEAN DEFAULT FALSE,
  timeout_ms INT DEFAULT 300000,

  -- Visual (calendario)
  color VARCHAR(20),
  icon VARCHAR(50),

  -- Proxima execucao (pre-calculada)
  next_run_at TIMESTAMPTZ,
  last_run_at TIMESTAMPTZ,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indice para buscar proximas execucoes
CREATE INDEX idx_schedules_next_run ON workflow_schedules(next_run_at)
  WHERE enabled = TRUE;

-- =============================================================================
-- Workflow Runs (Execucoes)
-- =============================================================================
CREATE TABLE workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id VARCHAR(100) REFERENCES workflows(id),
  schedule_id UUID REFERENCES workflow_schedules(id),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending, running, completed, failed, cancelled, timeout

  -- Timing
  scheduled_at TIMESTAMPTZ,        -- Quando deveria rodar
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT,

  -- Inputs/Outputs
  inputs JSONB DEFAULT '{}',
  outputs JSONB DEFAULT '{}',

  -- Trigger info
  trigger_type VARCHAR(20),        -- scheduled, manual, event
  triggered_by UUID REFERENCES auth.users,

  -- Error handling
  error_message TEXT,
  error_step VARCHAR(100),
  retry_count INT DEFAULT 0,

  -- Checkpoint (para recovery)
  checkpoint JSONB DEFAULT '{}',
  last_checkpoint_at TIMESTAMPTZ,

  -- Metadata
  metadata JSONB DEFAULT '{}'
);

-- Indices
CREATE INDEX idx_runs_workflow ON workflow_runs(workflow_id, started_at DESC);
CREATE INDEX idx_runs_status ON workflow_runs(status) WHERE status = 'running';
CREATE INDEX idx_runs_scheduled ON workflow_runs(scheduled_at) WHERE status = 'pending';

-- =============================================================================
-- Workflow Steps (Steps de cada execucao)
-- =============================================================================
CREATE TABLE workflow_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID REFERENCES workflow_runs(id) ON DELETE CASCADE,
  step_id VARCHAR(100) NOT NULL,

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'pending',
    -- pending, running, completed, failed, skipped

  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  duration_ms INT,

  -- Data
  input JSONB DEFAULT '{}',
  output JSONB DEFAULT '{}',

  -- Error
  error_message TEXT,
  retry_count INT DEFAULT 0,

  -- Checkpoint
  checkpoint JSONB DEFAULT '{}'
);

CREATE INDEX idx_steps_run ON workflow_steps(run_id);
```

### 4. Workflow Engine (Motor)

```typescript
// apps/backbone/src/workflow/engine.ts

interface WorkflowEngine {
  // Registry
  loadWorkflows(): Promise<void>;           // Carrega YAMLs de specs/
  getWorkflow(id: string): Workflow;

  // Scheduling
  loadSchedules(): Promise<void>;           // Carrega schedules
  calculateNextRuns(): Promise<void>;       // Atualiza next_run_at

  // Execution
  executeWorkflow(id: string, inputs?: object): Promise<WorkflowRun>;
  executeStep(run: WorkflowRun, step: WorkflowStep): Promise<StepResult>;

  // Durability (DBOS-style)
  checkpoint(runId: string, data: object): Promise<void>;
  recover(runId: string): Promise<WorkflowRun>;

  // Control
  cancelRun(runId: string): Promise<void>;
  retryRun(runId: string): Promise<WorkflowRun>;
}
```

### 5. Scheduler Service

```typescript
// apps/backbone/src/workflow/scheduler.ts

interface SchedulerService {
  // Lifecycle
  start(): Promise<void>;                   // Inicia scheduler
  stop(): Promise<void>;

  // Core loop (DBOS-style decentralized)
  tick(): Promise<void>;                    // Verifica e executa due schedules

  // Management
  enableSchedule(id: string): Promise<void>;
  disableSchedule(id: string): Promise<void>;
  triggerNow(scheduleId: string): Promise<WorkflowRun>;
}

// Implementacao usa "FOR UPDATE SKIP LOCKED" para evitar lock contention
// Aplica jitter para evitar thundering herd
```

---

## UI: Calendario de Agendamentos

### Layout Principal

```
┌─────────────────────────────────────────────────────────────────────┐
│  Agendamentos                                          [+ Novo]     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Filtros:  [x] BIZ  [x] System  [ ] Analytics  [ ] Maintenance      │
│            [x] Critical  [x] High  [x] Normal  [ ] Low              │
│                                                                     │
│  Visualizacao:  (•) Calendario  ( ) Timeline  ( ) Lista             │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│     ◀  Janeiro 2026  ▶                                              │
│                                                                     │
│  Dom    Seg    Ter    Qua    Qui    Sex    Sab                      │
│  ─────────────────────────────────────────────────                  │
│                             1      2      3      4                  │
│                            ●●●    ●●●    ●●●                        │
│                                                                     │
│   5      6      7      8      9     10     11                       │
│         ●●●    ●●●    ●●●    ●●●    ●●●                             │
│                                                                     │
│  12     13     14     15     16     17     18                       │
│  ●●●    ●●●    ●●●    ●●●    ●●●    ●●●    ●●●                      │
│         ▲                                                           │
│         └─ Hoje                                                     │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Dia 13 - Segunda-feira                                             │
│  ─────────────────────────────────────────                          │
│  12:00  ● Pipeline Relatorios BIZ (Diurno)         [▶] [⋮]         │
│  18:00  ● Pipeline Relatorios BIZ (Tarde)          [▶] [⋮]         │
│  20:00  ● Pipeline Relatorios BIZ (Noturno)        [▶] [⋮]         │
│  00:00  ○ Backup Diario                            [▶] [⋮]         │
│                                                                     │
│  ● = BIZ    ○ = System    ◆ = Analytics                            │
└─────────────────────────────────────────────────────────────────────┘
```

### Visualizacao Timeline (Gantt-style)

```
┌─────────────────────────────────────────────────────────────────────┐
│  Timeline - Semana 13-19 Jan                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Workflow              Seg   Ter   Qua   Qui   Sex   Sab   Dom      │
│  ──────────────────────────────────────────────────────────────     │
│  BIZ Reports           ●●●   ●●●   ●●●   ●●●   ●●●   ●●●   ●●●     │
│  Review Timeout        ▪▪▪   ▪▪▪   ▪▪▪   ▪▪▪   ▪▪▪   ▪▪▪   ▪▪▪     │
│  Daily Backup          ○     ○     ○     ○     ○     ○     ○       │
│  Analytics Sync              ◆           ◆           ◆             │
│                                                                     │
│  ● 12:00  ● 18:00  ● 20:00  (detalhes ao passar mouse)             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Detalhe do Workflow

```
┌─────────────────────────────────────────────────────────────────────┐
│  Pipeline Relatorios BIZ                              [Editar]      │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Categoria: BIZ          Prioridade: Alta                           │
│  Owner: operacoes        Versao: 1.0.0                              │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │  Steps do Workflow                                           │   │
│  │                                                              │   │
│  │  [1] Sync PrimeCare ──► [2] Processar ──┬─► [4] Enviar      │   │
│  │                                          │                    │   │
│  │                                          └─► [3] Notificar   │   │
│  │                                              (se failed > 0)  │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  Agendamentos Ativos                                                │
│  ─────────────────────────────────────────                          │
│  ● Turno Diurno Manha    12:00  America/Sao_Paulo  [Ativo]         │
│  ● Turno Diurno Tarde    18:00  America/Sao_Paulo  [Ativo]         │
│  ● Turno Noturno         20:00  America/Sao_Paulo  [Ativo]         │
│                                                                     │
│  [Executar Agora]  [Ver Historico]  [Editar Agendamentos]          │
│                                                                     │
├─────────────────────────────────────────────────────────────────────┤
│  Ultimas Execucoes                                                  │
│  ─────────────────────────────────────────                          │
│  Hoje 12:00    ✓ Completed    45s    sync:12 proc:10 sent:8        │
│  Ontem 20:00   ✓ Completed    38s    sync:8  proc:8  sent:7        │
│  Ontem 18:00   ✗ Failed       12s    Erro no step: send            │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Classificacao de Workflows

### Categorias

| Categoria | Descricao | Cor | Exemplos |
|-----------|-----------|-----|----------|
| `biz` | Processos de negocio | Verde | Relatorios, notificacoes |
| `system` | Manutencao do sistema | Azul | Backup, cleanup, health |
| `analytics` | Processamento de dados | Roxo | ETL, agregacoes |
| `maintenance` | Tarefas de suporte | Cinza | Logs, arquivamento |

### Prioridades

| Prioridade | Descricao | Comportamento |
|------------|-----------|---------------|
| `critical` | Essencial para operacao | Retry agressivo, alerta imediato |
| `high` | Importante | Retry normal, alerta se falhar |
| `normal` | Padrao | Retry conservador |
| `low` | Pode falhar | Sem retry automatico |

---

## Fluxo de Implementacao

### Fase 1: Core Engine
1. Schema PostgreSQL (tabelas base)
2. Workflow Registry (carrega YAMLs)
3. Execution Engine (roda steps)
4. Checkpoint/Recovery (durabilidade)

### Fase 2: Scheduling
1. Schedule Manager (CRUD schedules)
2. Scheduler Service (tick loop)
3. Cron parser
4. Event triggers

### Fase 3: UI
1. Lista de workflows
2. Detalhe do workflow
3. Calendario de agendamentos
4. Filtros por categoria/prioridade

### Fase 4: Operacoes
1. Metricas e historico
2. Alertas
3. Logs estruturados
4. API para integracao

---

## Comparacao com Alternativas

| Aspecto | Nossa Abordagem | Temporal | Airflow | Kestra |
|---------|-----------------|----------|---------|--------|
| Dependencias | Apenas Postgres | Cluster Temporal | Cluster Airflow | Servidor Kestra |
| Definicao | YAML (artefatos) | Codigo | Python DAGs | YAML |
| Complexidade | Baixa | Alta | Media | Media |
| Durabilidade | Checkpoints Postgres | Nativo | Limitado | Nativo |
| UI | Custom (nossa) | Temporal UI | Airflow UI | Kestra UI |
| Filosofia | Motor + Artefatos | Workflow-as-Code | DAG-centric | Declarativo |

**Vantagens da nossa abordagem:**
- Alinhado com filosofia motor (artefatos YAML)
- Sem dependencias externas (usa Postgres existente)
- UI integrada ao dashboard existente
- Flexibilidade para customizacao

**Trade-offs:**
- Menos features out-of-the-box que Temporal/Kestra
- Precisa implementar durabilidade
- Sem ecossistema de plugins

---

## Referencias

- [QCon SF 2025: Database-Backed Workflow Orchestration](https://www.infoq.com/news/2025/11/database-backed-workflow/)
- [DBOS: Why Postgres for Durable Execution](https://www.dbos.dev/blog/why-postgres-durable-execution)
- [Kestra: Declarative Data Orchestration](https://kestra.io/features/declarative-data-orchestration)
- [State of Workflow Orchestration 2025](https://www.pracdata.io/p/state-of-workflow-orchestration-ecosystem-2025)
- [DayPilot: Calendar/Scheduler Components](https://www.daypilot.org/)

---

## Proximos Passos

1. **Validar escopo** - Confirmar se esta abordagem atende as necessidades
2. **Criar TASK-WORKFLOW.md** - Quebrar em tarefas para implementacao
3. **Priorizar** - Decidir se implementa antes ou depois do TASK-5/TASK-6
4. **POC** - Implementar core minimo para validar arquitetura
