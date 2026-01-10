/**
 * DATABASE - PostgreSQL Client
 *
 * Pool de conexoes PostgreSQL com helpers para queries.
 * Singleton para reutilizacao em todo o backbone.
 */

import { Pool, PoolClient } from 'pg';
import { config } from '../config.js';

// Singleton do pool de conexoes
let pool: Pool | null = null;

/**
 * Obter pool de conexoes PostgreSQL
 */
export function getPool(): Pool {
  if (!pool) {
    // Determinar configuracao SSL
    const disableSsl = config.DATABASE_URL.includes('sslmode=disable');
    const sslConfig = disableSsl
      ? false
      : config.NODE_ENV === 'production'
        ? { rejectUnauthorized: false }
        : false;

    pool = new Pool({
      connectionString: config.DATABASE_URL,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
      ssl: sslConfig,
    });

    pool.on('error', (err) => {
      console.error('[DB] Pool error:', err);
    });

    console.log('[DB] Pool created');
  }

  return pool;
}

// =============================================================================
// QUERY HELPERS
// =============================================================================

/**
 * Executar query e retornar array de resultados
 */
export async function query<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T[]> {
  const p = getPool();
  const result = await p.query(text, params);
  return result.rows as T[];
}

/**
 * Executar query e retornar apenas o primeiro resultado
 */
export async function queryOne<T = Record<string, unknown>>(
  text: string,
  params?: unknown[]
): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows[0] || null;
}

/**
 * Executar query e retornar numero de linhas afetadas
 */
export async function execute(
  text: string,
  params?: unknown[]
): Promise<number> {
  const p = getPool();
  const result = await p.query(text, params);
  return result.rowCount || 0;
}

/**
 * Obter conexao do pool para transacoes
 */
export async function getClient(): Promise<PoolClient> {
  const p = getPool();
  return p.connect();
}

/**
 * Executar operacoes em uma transacao
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}

// =============================================================================
// CRUD HELPERS
// =============================================================================

/**
 * Inserir registro e retornar resultado
 */
export async function insert<T>(
  table: string,
  data: Record<string, unknown>
): Promise<T> {
  const keys = Object.keys(data);
  const values = Object.values(data);
  const placeholders = keys.map((_, i) => `$${i + 1}`).join(', ');
  const columns = keys.join(', ');

  const sql = `INSERT INTO ${table} (${columns}) VALUES (${placeholders}) RETURNING *`;
  const rows = await query<T>(sql, values);

  if (rows.length === 0) {
    throw new Error(`Insert failed: no rows returned`);
  }

  return rows[0];
}

/**
 * Atualizar registro por ID
 */
export async function updateById<T>(
  table: string,
  id: string,
  data: Record<string, unknown>
): Promise<T | null> {
  const keys = Object.keys(data);
  const values = Object.values(data);

  const setClause = keys.map((key, i) => `${key} = $${i + 1}`).join(', ');
  const sql = `UPDATE ${table} SET ${setClause}, updated_at = NOW() WHERE id = $${keys.length + 1} RETURNING *`;

  const rows = await query<T>(sql, [...values, id]);
  return rows[0] || null;
}

/**
 * Buscar registro por ID
 */
export async function findById<T>(table: string, id: string): Promise<T | null> {
  return queryOne<T>(`SELECT * FROM ${table} WHERE id = $1`, [id]);
}

/**
 * Deletar registro por ID
 */
export async function deleteById(table: string, id: string): Promise<boolean> {
  const count = await execute(`DELETE FROM ${table} WHERE id = $1`, [id]);
  return count > 0;
}

// =============================================================================
// HEALTH CHECK
// =============================================================================

/**
 * Health check do banco
 */
export async function healthCheck(): Promise<{
  ok: boolean;
  latencyMs: number;
  error?: string;
}> {
  const start = Date.now();

  try {
    await query('SELECT 1');
    return { ok: true, latencyMs: Date.now() - start };
  } catch (error) {
    return {
      ok: false,
      latencyMs: Date.now() - start,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fechar pool de conexoes
 */
export async function closePool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('[DB] Pool closed');
  }
}
