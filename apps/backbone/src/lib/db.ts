import pg from 'pg';
import { getDatabaseUrl } from '../config.js';
import { metrics } from '../pulse/index.js';

const { Pool } = pg;

const dbUrl = getDatabaseUrl();
export const pool = dbUrl
  ? new Pool({ connectionString: dbUrl })
  : (null as unknown as pg.Pool); // Pool será null se não houver DB configurado

// Update pool gauges periodically
if (pool) {
  setInterval(() => {
    metrics.setGauge('db.connections.active', pool.totalCount - pool.idleCount);
    metrics.setGauge('db.connections.idle', pool.idleCount);
    metrics.setGauge('db.connections.waiting', pool.waitingCount);
    metrics.setGauge('db.pool.size', pool.totalCount);
  }, 1000);
}

export const db = {
  async query<T = unknown>(text: string, params?: unknown[]): Promise<T[]> {
    if (!pool) throw new Error('Database not configured');

    const stopTimer = metrics.startTimer('db.query.latency');
    metrics.incCounter('db.query.count');

    try {
      const result = await pool.query(text, params);
      stopTimer();
      return result.rows as T[];
    } catch (error) {
      stopTimer();
      metrics.incCounter('db.query.errors');
      throw error;
    }
  },

  async queryOne<T = unknown>(text: string, params?: unknown[]): Promise<T | null> {
    if (!pool) throw new Error('Database not configured');

    const stopTimer = metrics.startTimer('db.query.latency');
    metrics.incCounter('db.query.count');

    try {
      const result = await pool.query(text, params);
      stopTimer();
      return (result.rows[0] as T) ?? null;
    } catch (error) {
      stopTimer();
      metrics.incCounter('db.query.errors');
      throw error;
    }
  },

  async execute(text: string, params?: unknown[]): Promise<number> {
    if (!pool) throw new Error('Database not configured');

    const stopTimer = metrics.startTimer('db.query.latency');
    metrics.incCounter('db.query.count');

    try {
      const result = await pool.query(text, params);
      stopTimer();
      return result.rowCount ?? 0;
    } catch (error) {
      stopTimer();
      metrics.incCounter('db.query.errors');
      throw error;
    }
  },

  async transaction<T>(fn: (client: pg.PoolClient) => Promise<T>): Promise<T> {
    if (!pool) throw new Error('Database not configured');
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await fn(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  },
};
