import { db } from '../../lib/db.js';
import type { HealthProbe, ProbeResult } from '../types.js';

export const knowledgeShallowProbe: HealthProbe = {
  name: 'knowledge',
  isDeep: false,
  async check(): Promise<ProbeResult> {
    const start = performance.now();
    try {
      const result = await db.queryOne<{ exists: boolean }>(
        `SELECT EXISTS (
          SELECT FROM information_schema.tables
          WHERE table_name = 'knowledge_documents'
        ) as exists`
      );

      return {
        name: 'knowledge',
        healthy: result?.exists ?? false,
        latency: performance.now() - start,
        details: { tableExists: result?.exists },
      };
    } catch (error) {
      return {
        name: 'knowledge',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};

export const knowledgeDeepProbe: HealthProbe = {
  name: 'knowledge',
  isDeep: true,
  async check(): Promise<ProbeResult> {
    const start = performance.now();
    try {
      const [stats] = await db.query<{ count: string }>(
        `SELECT COUNT(*) as count FROM knowledge_documents`
      );

      // Verify FTS works
      await db.query(
        `SELECT id FROM knowledge_documents
         WHERE search_vector @@ plainto_tsquery('english', 'test')
         LIMIT 1`
      );

      const latency = performance.now() - start;

      return {
        name: 'knowledge',
        healthy: true,
        latency,
        details: {
          documentCount: parseInt(stats?.count ?? '0', 10),
          ftsOperational: true,
        },
      };
    } catch (error) {
      return {
        name: 'knowledge',
        healthy: false,
        latency: performance.now() - start,
        message: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  },
};
