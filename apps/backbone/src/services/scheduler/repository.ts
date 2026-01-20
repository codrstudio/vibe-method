import { db } from '../../lib/index.js';
import type {
  ScheduledJob,
  ScheduledJobInput,
  ScheduledJobUpdate,
  JobRun,
  JobListOptions,
  JobRunListOptions,
  JobRunStatus,
  TriggerType,
} from './types.js';

// Column mappings for scheduled_jobs
const JOB_COLUMNS = `
  id, name, slug, description, category,
  job_target as "jobTarget",
  job_params as "jobParams",
  cron_expression as "cronExpression",
  repeat_every_ms as "repeatEveryMs",
  timezone,
  enabled,
  timeout_ms as "timeoutMs",
  retry_attempts as "retryAttempts",
  retry_delay_ms as "retryDelayMs",
  next_run_at as "nextRunAt",
  last_run_id as "lastRunId",
  last_run_at as "lastRunAt",
  last_status as "lastStatus",
  last_duration_ms as "lastDurationMs",
  last_error as "lastError",
  run_count as "runCount",
  success_count as "successCount",
  fail_count as "failCount",
  created_at as "createdAt",
  updated_at as "updatedAt",
  created_by as "createdBy"
`;

// Column mappings for job_runs
const RUN_COLUMNS = `
  id,
  job_id as "jobId",
  bullmq_job_id as "bullmqJobId",
  status,
  started_at as "startedAt",
  completed_at as "completedAt",
  duration_ms as "durationMs",
  trigger_type as "triggerType",
  triggered_by as "triggeredBy",
  output,
  error_message as "errorMessage",
  attempt
`;

export const repository = {
  // ============ Scheduled Jobs ============

  async createJob(data: ScheduledJobInput, createdBy?: string): Promise<ScheduledJob> {
    const [job] = await db.query<ScheduledJob>(
      `INSERT INTO scheduled_jobs (
        name, slug, description, category, job_target, job_params,
        cron_expression, repeat_every_ms, timezone, enabled, timeout_ms, retry_attempts,
        retry_delay_ms, created_by
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING ${JOB_COLUMNS}`,
      [
        data.name,
        data.slug,
        data.description ?? null,
        data.category,
        data.jobTarget,
        JSON.stringify(data.jobParams),
        data.cronExpression ?? null,
        data.repeatEveryMs ?? null,
        data.timezone,
        data.enabled,
        data.timeoutMs,
        data.retryAttempts,
        data.retryDelayMs,
        createdBy ?? null,
      ]
    );

    return job;
  },

  async findJobById(id: string): Promise<ScheduledJob | null> {
    return db.queryOne<ScheduledJob>(
      `SELECT ${JOB_COLUMNS} FROM scheduled_jobs WHERE id = $1`,
      [id]
    );
  },

  async findJobBySlug(slug: string): Promise<ScheduledJob | null> {
    return db.queryOne<ScheduledJob>(
      `SELECT ${JOB_COLUMNS} FROM scheduled_jobs WHERE slug = $1`,
      [slug]
    );
  },

  async findJobs(options: JobListOptions = {}): Promise<ScheduledJob[]> {
    const { category, enabled, limit = 100, offset = 0 } = options;

    let query = `SELECT ${JOB_COLUMNS} FROM scheduled_jobs WHERE 1=1`;
    const params: unknown[] = [];

    if (category) {
      params.push(category);
      query += ` AND category = $${params.length}`;
    }

    if (enabled !== undefined) {
      params.push(enabled);
      query += ` AND enabled = $${params.length}`;
    }

    query += ` ORDER BY name ASC`;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    return db.query<ScheduledJob>(query, params);
  },

  async findEnabledJobs(): Promise<ScheduledJob[]> {
    return db.query<ScheduledJob>(
      `SELECT ${JOB_COLUMNS} FROM scheduled_jobs WHERE enabled = TRUE ORDER BY name ASC`,
      []
    );
  },

  async updateJob(id: string, data: ScheduledJobUpdate): Promise<ScheduledJob | null> {
    const updates: string[] = [];
    const values: unknown[] = [];
    let paramIndex = 1;

    if (data.name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(data.description);
    }
    if (data.category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(data.category);
    }
    if (data.jobTarget !== undefined) {
      updates.push(`job_target = $${paramIndex++}`);
      values.push(data.jobTarget);
    }
    if (data.jobParams !== undefined) {
      updates.push(`job_params = $${paramIndex++}`);
      values.push(JSON.stringify(data.jobParams));
    }
    if (data.cronExpression !== undefined) {
      updates.push(`cron_expression = $${paramIndex++}`);
      values.push(data.cronExpression);
    }
    if (data.repeatEveryMs !== undefined) {
      updates.push(`repeat_every_ms = $${paramIndex++}`);
      values.push(data.repeatEveryMs);
    }
    if (data.timezone !== undefined) {
      updates.push(`timezone = $${paramIndex++}`);
      values.push(data.timezone);
    }
    if (data.enabled !== undefined) {
      updates.push(`enabled = $${paramIndex++}`);
      values.push(data.enabled);
    }
    if (data.timeoutMs !== undefined) {
      updates.push(`timeout_ms = $${paramIndex++}`);
      values.push(data.timeoutMs);
    }
    if (data.retryAttempts !== undefined) {
      updates.push(`retry_attempts = $${paramIndex++}`);
      values.push(data.retryAttempts);
    }
    if (data.retryDelayMs !== undefined) {
      updates.push(`retry_delay_ms = $${paramIndex++}`);
      values.push(data.retryDelayMs);
    }

    if (updates.length === 0) {
      return this.findJobById(id);
    }

    updates.push(`updated_at = NOW()`);
    values.push(id);

    const [job] = await db.query<ScheduledJob>(
      `UPDATE scheduled_jobs
       SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING ${JOB_COLUMNS}`,
      values
    );

    return job ?? null;
  },

  async setJobEnabled(id: string, enabled: boolean): Promise<ScheduledJob | null> {
    const [job] = await db.query<ScheduledJob>(
      `UPDATE scheduled_jobs
       SET enabled = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING ${JOB_COLUMNS}`,
      [enabled, id]
    );

    return job ?? null;
  },

  async updateJobNextRun(id: string, nextRunAt: Date | null): Promise<void> {
    await db.execute(
      `UPDATE scheduled_jobs SET next_run_at = $1, updated_at = NOW() WHERE id = $2`,
      [nextRunAt, id]
    );
  },

  async updateJobLastRun(
    id: string,
    runId: string,
    status: JobRunStatus,
    durationMs: number,
    error?: string
  ): Promise<void> {
    const isSuccess = status === 'completed';

    await db.execute(
      `UPDATE scheduled_jobs
       SET last_run_id = $1,
           last_run_at = NOW(),
           last_status = $2,
           last_duration_ms = $3,
           last_error = $4,
           run_count = run_count + 1,
           success_count = success_count + $5,
           fail_count = fail_count + $6,
           updated_at = NOW()
       WHERE id = $7`,
      [runId, status, durationMs, error ?? null, isSuccess ? 1 : 0, isSuccess ? 0 : 1, id]
    );
  },

  async deleteJob(id: string): Promise<boolean> {
    const count = await db.execute(
      `DELETE FROM scheduled_jobs WHERE id = $1`,
      [id]
    );
    return count > 0;
  },

  // ============ Job Runs ============

  async createRun(
    jobId: string,
    triggerType: TriggerType,
    triggeredBy?: string
  ): Promise<JobRun> {
    const [run] = await db.query<JobRun>(
      `INSERT INTO job_runs (job_id, trigger_type, triggered_by)
       VALUES ($1, $2, $3)
       RETURNING ${RUN_COLUMNS}`,
      [jobId, triggerType, triggeredBy ?? null]
    );

    return run;
  },

  async findRunById(id: string): Promise<JobRun | null> {
    return db.queryOne<JobRun>(
      `SELECT ${RUN_COLUMNS} FROM job_runs WHERE id = $1`,
      [id]
    );
  },

  async findRuns(options: JobRunListOptions = {}): Promise<JobRun[]> {
    const { jobId, status, limit = 50, offset = 0 } = options;

    let query = `SELECT ${RUN_COLUMNS} FROM job_runs WHERE 1=1`;
    const params: unknown[] = [];

    if (jobId) {
      params.push(jobId);
      query += ` AND job_id = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ` ORDER BY started_at DESC`;
    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    return db.query<JobRun>(query, params);
  },

  async updateRunStart(id: string, bullmqJobId: string): Promise<void> {
    await db.execute(
      `UPDATE job_runs SET bullmq_job_id = $1 WHERE id = $2`,
      [bullmqJobId, id]
    );
  },

  async updateRunComplete(
    id: string,
    status: JobRunStatus,
    durationMs: number,
    output?: Record<string, unknown>,
    errorMessage?: string,
    attempt?: number
  ): Promise<JobRun | null> {
    const [run] = await db.query<JobRun>(
      `UPDATE job_runs
       SET status = $1,
           completed_at = NOW(),
           duration_ms = $2,
           output = $3,
           error_message = $4,
           attempt = COALESCE($5, attempt)
       WHERE id = $6
       RETURNING ${RUN_COLUMNS}`,
      [status, durationMs, output ? JSON.stringify(output) : null, errorMessage ?? null, attempt ?? null, id]
    );

    return run ?? null;
  },

  async deleteOldRuns(jobId: string, keepCount: number = 100): Promise<number> {
    const count = await db.execute(
      `DELETE FROM job_runs
       WHERE job_id = $1
       AND id NOT IN (
         SELECT id FROM job_runs
         WHERE job_id = $1
         ORDER BY started_at DESC
         LIMIT $2
       )`,
      [jobId, keepCount]
    );

    return count;
  },
};
