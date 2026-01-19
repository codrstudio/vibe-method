import { Pool, PoolClient } from 'pg'

const pool = new Pool({
  host: process.env.POSTGRES_MAIN_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_MAIN_PORT || '8050'),
  user: process.env.POSTGRES_MAIN_USER || 'admin',
  password: process.env.POSTGRES_MAIN_PASSWORD || 'Admin123',
  database: process.env.POSTGRES_MAIN_DB || 'cia_main',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
})

export async function query<T>(text: string, params?: unknown[]): Promise<T[]> {
  const result = await pool.query(text, params)
  return result.rows as T[]
}

export async function queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
  const rows = await query<T>(text, params)
  return rows[0] || null
}

export async function getClient(): Promise<PoolClient> {
  return pool.connect()
}

export default pool
