# Feature: Job Scheduler (BullMQ)

Sistema de agendamento de jobs com BullMQ + Redis.

---

## Arquitetura

```
┌──────────────────────────────────────────────────────────────────────┐
│                                                                      │
│   UI (/agendamentos)                                                 │
│   ┌────────────────┐                                                 │
│   │ Lista jobs     │                                                 │
│   │ Toggle on/off  │                                                 │
│   │ Editar cron    │                                                 │
│   │ Ver historico  │                                                 │
│   │ Executar agora │                                                 │
│   └───────┬────────┘                                                 │
│           │ API calls                                                │
│           ▼                                                          │
│   ┌────────────────────────────────────────────────────────────┐    │
│   │                      BACKBONE                               │    │
│   │  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │    │
│   │  │ Jobs API    │    │ BullMQ      │    │ Worker      │     │    │
│   │  │ /api/jobs   │───►│ Queue       │───►│ Processa    │     │    │
│   │  │ CRUD        │    │ scheduler   │    │ jobs        │     │    │
│   │  └─────────────┘    └──────┬──────┘    └─────────────┘     │    │
│   │                            │                                │    │
│   └────────────────────────────┼────────────────────────────────┘    │
│                                │                                      │
│           ┌────────────────────┼────────────────────┐                │
│           │                    │                    │                │
│           ▼                    ▼                    ▼                │
│   ┌─────────────┐      ┌─────────────┐      ┌─────────────┐         │
│   │  POSTGRES   │      │   REDIS     │      │ Bull Board  │         │
│   │  config +   │      │   filas +   │      │ UI admin    │         │
│   │  historico  │      │   estado    │      │ (opcional)  │         │
│   └─────────────┘      └─────────────┘      └─────────────┘         │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Por que BullMQ?

| Aspecto | BullMQ |
|---------|--------|
| Redis | Ja existe no stack ✓ |
| Confiabilidade | Redis persiste, jobs nao perdem |
| Repeat jobs | Nativo (cron syntax) |
| Retry | Nativo (backoff exponencial) |
| Concurrency | Configuravel por job |
| UI Admin | Bull Board (gratis) |
| Controle | 100% codigo nosso |
| Servico extra | Nenhum (roda no backbone) |

---

## Fluxo

```
1. Usuario configura job na UI
           │
           ▼
2. API salva em Postgres + adiciona no BullMQ
           │
           ▼
3. BullMQ agenda no Redis (repeat job)
           │
           ▼
4. Quando chega a hora, Worker recebe o job
           │
           ▼
5. Worker executa script e salva resultado no Postgres
           │
           ▼
6. Usuario ve historico na UI
```

---

## Componentes

### 1. Queue (BullMQ)

```typescript
// apps/backbone/src/scheduler/queue.ts
import { Queue } from 'bullmq';
import { redis } from '../lib/redis.js';

export const schedulerQueue = new Queue('scheduler', {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
    removeOnComplete: 100,  // manter ultimos 100
    removeOnFail: 200,      // manter ultimos 200 falhos
  },
});
```

### 2. Worker (BullMQ)

```typescript
// apps/backbone/src/scheduler/worker.ts
import { Worker, Job } from 'bullmq';
import { redis } from '../lib/redis.js';
import { db } from '../lib/db.js';
import { executeJobScript } from './executor.js';

export const schedulerWorker = new Worker(
  'scheduler',
  async (job: Job) => {
    const { jobId, script, params } = job.data;
    const startTime = Date.now();

    // Registrar inicio
    const runId = await db.queryOne(`
      INSERT INTO job_runs (job_id, trigger_type, bullmq_job_id)
      VALUES ($1, $2, $3)
      RETURNING id
    `, [jobId, job.opts.repeat ? 'scheduled' : 'manual', job.id]);

    try {
      // Executar
      const output = await executeJobScript(script, params);
      const duration = Date.now() - startTime;

      // Sucesso
      await db.query(`
        UPDATE job_runs
        SET status = 'success', completed_at = NOW(),
            duration_ms = $2, output = $3
        WHERE id = $1
      `, [runId.id, duration, output]);

      await updateJobStats(jobId, 'success', duration, runId.id);

      return output;

    } catch (error) {
      const duration = Date.now() - startTime;

      // Falha
      await db.query(`
        UPDATE job_runs
        SET status = 'failed', completed_at = NOW(),
            duration_ms = $2, error_message = $3
        WHERE id = $1
      `, [runId.id, duration, error.message]);

      await updateJobStats(jobId, 'failed', duration, runId.id, error.message);

      throw error; // BullMQ fara retry se configurado
    }
  },
  {
    connection: redis,
    concurrency: 5,  // max 5 jobs simultaneos
  }
);

// Eventos para logging
schedulerWorker.on('completed', (job) => {
  console.log(`[Scheduler] Job ${job.name} completed`);
});

schedulerWorker.on('failed', (job, err) => {
  console.error(`[Scheduler] Job ${job?.name} failed:`, err.message);
});
```

### 3. Executor

```typescript
// apps/backbone/src/scheduler/executor.ts
import { spawn } from 'child_process';

const SCRIPTS: Record<string, () => Promise<any>> = {
  'biz:pipeline': async () => {
    const { runPipeline } = await import('../scripts/biz-pipeline.js');
    return runPipeline();
  },
  'biz:review-timeout': async () => {
    const { runReviewTimeout } = await import('../scripts/biz-review-timeout.js');
    return runReviewTimeout();
  },
  'biz:send-reports': async () => {
    const { runSendReports } = await import('../scripts/biz-send-reports.js');
    return runSendReports();
  },
};

export async function executeJobScript(
  script: string,
  params?: Record<string, any>
): Promise<any> {
  const executor = SCRIPTS[script];

  if (!executor) {
    throw new Error(`Script desconhecido: ${script}`);
  }

  return executor();
}
```

### 4. Service (gerencia jobs)

```typescript
// apps/backbone/src/scheduler/service.ts
import { schedulerQueue } from './queue.js';
import { db } from '../lib/db.js';
import cronParser from 'cron-parser';

export const schedulerService = {

  // Adicionar/atualizar job repetitivo
  async upsertRepeatJob(job: ScheduledJob): Promise<void> {
    // Remover repeat anterior se existir
    const repeatKey = `job:${job.id}`;
    const existing = await schedulerQueue.getRepeatableJobs();
    const old = existing.find(r => r.key.includes(repeatKey));
    if (old) {
      await schedulerQueue.removeRepeatableByKey(old.key);
    }

    if (!job.enabled) return;

    // Adicionar novo repeat
    await schedulerQueue.add(
      job.slug,
      {
        jobId: job.id,
        script: job.job_target,
        params: job.job_params,
      },
      {
        repeat: {
          pattern: job.cron_expression,
          tz: job.timezone,
        },
        jobId: repeatKey,
      }
    );

    // Atualizar next_run_at no Postgres
    const next = this.calculateNextRun(job.cron_expression, job.timezone);
    await db.query(`
      UPDATE scheduled_jobs SET next_run_at = $2 WHERE id = $1
    `, [job.id, next]);
  },

  // Executar job manualmente
  async runNow(jobId: string, triggeredBy?: string): Promise<string> {
    const job = await db.queryOne(`SELECT * FROM scheduled_jobs WHERE id = $1`, [jobId]);

    const bullJob = await schedulerQueue.add(
      job.slug,
      {
        jobId: job.id,
        script: job.job_target,
        params: job.job_params,
        triggeredBy,
      },
      { jobId: `manual:${job.id}:${Date.now()}` }
    );

    return bullJob.id;
  },

  // Pausar job
  async pause(jobId: string): Promise<void> {
    await db.query(`UPDATE scheduled_jobs SET enabled = FALSE WHERE id = $1`, [jobId]);
    await this.removeRepeatJob(jobId);
  },

  // Retomar job
  async resume(jobId: string): Promise<void> {
    const job = await db.queryOne(`
      UPDATE scheduled_jobs SET enabled = TRUE WHERE id = $1 RETURNING *
    `, [jobId]);
    await this.upsertRepeatJob(job);
  },

  // Remover repeat job
  async removeRepeatJob(jobId: string): Promise<void> {
    const repeatKey = `job:${jobId}`;
    const existing = await schedulerQueue.getRepeatableJobs();
    const old = existing.find(r => r.key.includes(repeatKey));
    if (old) {
      await schedulerQueue.removeRepeatableByKey(old.key);
    }
  },

  // Sincronizar todos os jobs do banco com BullMQ
  async syncAllJobs(): Promise<void> {
    const jobs = await db.query(`SELECT * FROM scheduled_jobs WHERE enabled = TRUE`);
    for (const job of jobs.rows) {
      await this.upsertRepeatJob(job);
    }
    console.log(`[Scheduler] Synced ${jobs.rows.length} jobs`);
  },

  // Calcular proxima execucao
  calculateNextRun(cron: string, tz: string): Date {
    const interval = cronParser.parseExpression(cron, { tz });
    return interval.next().toDate();
  },
};
```

---

## Schema Postgres

```sql
-- =============================================================================
-- scheduled_jobs - Configuracao dos jobs
-- =============================================================================
CREATE TABLE scheduled_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Identificacao
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,

  -- Categoria (filtros na UI)
  category VARCHAR(50) DEFAULT 'system',  -- biz, system, maintenance

  -- O que executar
  job_target VARCHAR(255) NOT NULL,       -- 'biz:pipeline'
  job_params JSONB DEFAULT '{}',

  -- Quando
  cron_expression VARCHAR(50) NOT NULL,   -- '0 12,18,20 * * *'
  timezone VARCHAR(50) DEFAULT 'America/Sao_Paulo',

  -- Controle
  enabled BOOLEAN DEFAULT TRUE,
  timeout_ms INT DEFAULT 300000,          -- 5 min

  -- BullMQ config
  retry_attempts INT DEFAULT 3,
  retry_delay_ms INT DEFAULT 5000,

  -- Estado (calculado)
  next_run_at TIMESTAMPTZ,

  -- Ultimo resultado
  last_run_id UUID,
  last_run_at TIMESTAMPTZ,
  last_status VARCHAR(20),
  last_duration_ms INT,
  last_error TEXT,

  -- Stats
  run_count INT DEFAULT 0,
  success_count INT DEFAULT 0,
  fail_count INT DEFAULT 0,

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES auth.users
);

CREATE INDEX idx_jobs_enabled ON scheduled_jobs(enabled) WHERE enabled = TRUE;
CREATE INDEX idx_jobs_category ON scheduled_jobs(category);

-- =============================================================================
-- job_runs - Historico de execucoes
-- =============================================================================
CREATE TABLE job_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  job_id UUID REFERENCES scheduled_jobs(id) ON DELETE CASCADE,

  -- BullMQ reference
  bullmq_job_id VARCHAR(255),

  -- Status
  status VARCHAR(20) NOT NULL DEFAULT 'running',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  duration_ms INT,

  -- Trigger
  trigger_type VARCHAR(20) DEFAULT 'scheduled',  -- scheduled, manual
  triggered_by UUID REFERENCES auth.users,

  -- Resultado
  output JSONB,
  error_message TEXT,

  -- Retry
  attempt INT DEFAULT 1
);

CREATE INDEX idx_runs_job ON job_runs(job_id, started_at DESC);
CREATE INDEX idx_runs_status ON job_runs(status) WHERE status = 'running';
```

---

## API

```typescript
// apps/backbone/src/api/jobs.ts
import { FastifyInstance } from 'fastify';
import { db } from '../lib/db.js';
import { schedulerService } from '../scheduler/service.js';

export async function jobsRoutes(app: FastifyInstance) {

  // Listar jobs
  app.get('/api/jobs', async (req, reply) => {
    const { category } = req.query;
    let query = `SELECT * FROM scheduled_jobs`;
    const params = [];

    if (category) {
      query += ` WHERE category = $1`;
      params.push(category);
    }

    query += ` ORDER BY name`;
    const jobs = await db.query(query, params);
    return jobs.rows;
  });

  // Detalhe do job
  app.get('/api/jobs/:id', async (req, reply) => {
    const job = await db.queryOne(
      `SELECT * FROM scheduled_jobs WHERE id = $1`,
      [req.params.id]
    );
    if (!job) return reply.status(404).send({ error: 'Job not found' });
    return job;
  });

  // Criar job
  app.post('/api/jobs', async (req, reply) => {
    const { name, slug, description, category, job_target, job_params,
            cron_expression, timezone, enabled, timeout_ms } = req.body;

    const job = await db.queryOne(`
      INSERT INTO scheduled_jobs
        (name, slug, description, category, job_target, job_params,
         cron_expression, timezone, enabled, timeout_ms)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *
    `, [name, slug, description, category || 'system', job_target,
        job_params || {}, cron_expression, timezone || 'America/Sao_Paulo',
        enabled ?? true, timeout_ms || 300000]);

    await schedulerService.upsertRepeatJob(job);
    return job;
  });

  // Atualizar job
  app.patch('/api/jobs/:id', async (req, reply) => {
    const { id } = req.params;
    const updates = req.body;

    // Construir UPDATE dinamico
    const fields = [];
    const values = [];
    let i = 1;

    for (const [key, value] of Object.entries(updates)) {
      if (['name', 'description', 'category', 'job_target', 'job_params',
           'cron_expression', 'timezone', 'enabled', 'timeout_ms'].includes(key)) {
        fields.push(`${key} = $${i}`);
        values.push(value);
        i++;
      }
    }

    if (fields.length === 0) {
      return reply.status(400).send({ error: 'No valid fields to update' });
    }

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const job = await db.queryOne(`
      UPDATE scheduled_jobs SET ${fields.join(', ')}
      WHERE id = $${i} RETURNING *
    `, values);

    await schedulerService.upsertRepeatJob(job);
    return job;
  });

  // Deletar job
  app.delete('/api/jobs/:id', async (req, reply) => {
    await schedulerService.removeRepeatJob(req.params.id);
    await db.query(`DELETE FROM scheduled_jobs WHERE id = $1`, [req.params.id]);
    return { success: true };
  });

  // Executar agora
  app.post('/api/jobs/:id/run', async (req, reply) => {
    const bullJobId = await schedulerService.runNow(
      req.params.id,
      req.user?.id
    );
    return { bullJobId };
  });

  // Ativar job
  app.post('/api/jobs/:id/enable', async (req, reply) => {
    await schedulerService.resume(req.params.id);
    return { success: true };
  });

  // Desativar job
  app.post('/api/jobs/:id/disable', async (req, reply) => {
    await schedulerService.pause(req.params.id);
    return { success: true };
  });

  // Historico do job
  app.get('/api/jobs/:id/runs', async (req, reply) => {
    const { limit = 20, offset = 0 } = req.query;
    const runs = await db.query(`
      SELECT * FROM job_runs
      WHERE job_id = $1
      ORDER BY started_at DESC
      LIMIT $2 OFFSET $3
    `, [req.params.id, limit, offset]);
    return runs.rows;
  });
}
```

---

## Inicializacao

```typescript
// apps/backbone/src/scheduler/index.ts
import { schedulerQueue } from './queue.js';
import { schedulerWorker } from './worker.js';
import { schedulerService } from './service.js';

export async function initScheduler() {
  console.log('[Scheduler] Initializing BullMQ scheduler...');

  // Sincronizar jobs do banco com BullMQ
  await schedulerService.syncAllJobs();

  // Log de jobs ativos
  const repeatableJobs = await schedulerQueue.getRepeatableJobs();
  console.log(`[Scheduler] Active repeatable jobs: ${repeatableJobs.length}`);

  for (const job of repeatableJobs) {
    console.log(`  - ${job.name}: ${job.pattern}`);
  }

  console.log('[Scheduler] Ready!');
}

export { schedulerQueue, schedulerWorker, schedulerService };
```

```typescript
// apps/backbone/src/index.ts
import { initScheduler } from './scheduler/index.js';

async function main() {
  // ... outras inicializacoes ...

  // Iniciar scheduler
  await initScheduler();

  // ... iniciar servidor ...
}
```

---

## Bull Board (UI Admin)

```typescript
// apps/backbone/src/scheduler/board.ts
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { FastifyAdapter } from '@bull-board/fastify';
import { schedulerQueue } from './queue.js';

export function setupBullBoard(app: FastifyInstance) {
  const serverAdapter = new FastifyAdapter();
  serverAdapter.setBasePath('/admin/queues');

  createBullBoard({
    queues: [new BullMQAdapter(schedulerQueue)],
    serverAdapter,
  });

  app.register(serverAdapter.registerPlugin(), {
    prefix: '/admin/queues',
    basePath: '/admin/queues',
  });

  console.log('[Scheduler] Bull Board available at /admin/queues');
}
```

---

## UI

### Pagina /agendamentos

```
┌─────────────────────────────────────────────────────────────────────┐
│  Agendamentos                                    [+ Novo Job]       │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Filtros: [Todos ▼]  [x] BIZ  [x] System  [ ] Maintenance          │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  [✓]  Pipeline BIZ                                   BIZ    │   │
│  │       biz:pipeline                                          │   │
│  │       ⏰ 12:00, 18:00, 20:00              Proximo: 18:00    │   │
│  │       ✓ Ultima: 12:00 (45s)                                 │   │
│  │                                                              │   │
│  │       [Editar]  [Historico]  [▶ Executar Agora]             │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  [✓]  Timeout Revisao                                BIZ    │   │
│  │       biz:review-timeout                                    │   │
│  │       ⏰ A cada 5 minutos                 Proximo: 12:35    │   │
│  │       ✓ Ultima: 12:30 (2s)                                  │   │
│  │                                                              │   │
│  │       [Editar]  [Historico]  [▶ Executar Agora]             │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
│  ┌─────────────────────────────────────────────────────────────┐   │
│  │                                                              │   │
│  │  [ ]  Enviar Relatorios                     DESATIVADO      │   │
│  │       biz:send-reports                                      │   │
│  │       ⏰ 12:30, 18:30, 20:30              Nunca executou    │   │
│  │                                                              │   │
│  │       [Editar]  [Historico]  [▶ Executar Agora]             │   │
│  │                                                              │   │
│  └─────────────────────────────────────────────────────────────┘   │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Modal Editar

```
┌─────────────────────────────────────────────────────────────────────┐
│  Editar Job                                                  [X]   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Nome                                                               │
│  [Pipeline BIZ                                              ]       │
│                                                                     │
│  Descricao                                                          │
│  [Sincroniza, processa e envia relatorios humanizados      ]       │
│                                                                     │
│  Categoria                                                          │
│  [BIZ ▼]                                                            │
│                                                                     │
│  ─────────────────────────────────────────────────────────────      │
│                                                                     │
│  Agendamento                                                        │
│                                                                     │
│  Tipo: (•) Horarios  ( ) Intervalo  ( ) Cron                       │
│                                                                     │
│  Horarios:                                                          │
│  [12:00] [x]   [18:00] [x]   [20:00] [x]   [+ Adicionar]           │
│                                                                     │
│  Timezone: [America/Sao_Paulo ▼]                                    │
│                                                                     │
│  ─────────────────────────────────────────────────────────────      │
│                                                                     │
│  Configuracoes                                                      │
│                                                                     │
│  Timeout: [5] minutos                                               │
│  Tentativas em falha: [3]                                           │
│                                                                     │
│                                          [Cancelar]  [Salvar]       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Seeds

```sql
INSERT INTO scheduled_jobs (name, slug, category, job_target, cron_expression, description) VALUES
  ('Pipeline BIZ', 'biz-pipeline', 'biz', 'biz:pipeline', '0 12,18,20 * * *',
   'Sincroniza PrimeCare, processa com IA e envia relatorios'),

  ('Timeout Revisao', 'biz-review-timeout', 'biz', 'biz:review-timeout', '*/5 * * * *',
   'Aplica fallback em revisoes que passaram do timeout de 30min'),

  ('Enviar Relatorios', 'biz-send-reports', 'biz', 'biz:send-reports', '30 12,18,20 * * *',
   'Envia relatorios aprovados via WhatsApp');
```

---

## Dependencias

```bash
npm install bullmq @bull-board/api @bull-board/fastify cron-parser --workspace=@workspace/backbone
```

---

## Arquivos

| Arquivo | Descricao |
|---------|-----------|
| `src/scheduler/queue.ts` | Configuracao da Queue BullMQ |
| `src/scheduler/worker.ts` | Worker que processa jobs |
| `src/scheduler/service.ts` | Service para gerenciar jobs |
| `src/scheduler/executor.ts` | Executa scripts registrados |
| `src/scheduler/board.ts` | Bull Board (UI admin) |
| `src/scheduler/index.ts` | Inicializacao |
| `src/api/jobs.ts` | API REST para jobs |
| `migrations/XXX_scheduler.sql` | Schema Postgres |

---

## Vantagens

| Aspecto | Beneficio |
|---------|-----------|
| **Confiavel** | Redis persiste, BullMQ recupera jobs |
| **Retry** | Backoff exponencial automatico |
| **Controle** | 100% codigo nosso, 100% na nossa UI |
| **Visibilidade** | Bull Board + historico no Postgres |
| **Simples** | Roda no proprio backbone, sem servico extra |
| **Escalavel** | Pode adicionar mais workers depois |

---

## Proximos Passos

1. Migration Postgres (scheduled_jobs, job_runs)
2. Instalar dependencias BullMQ
3. Implementar scheduler/* (queue, worker, service, executor)
4. API /api/jobs
5. Bull Board
6. UI /agendamentos
7. Seeds dos jobs BIZ
