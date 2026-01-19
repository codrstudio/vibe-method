import { db } from '../lib/index.js';
import { incCounter, startTimer, observeHistogram } from '../health/collector.js';
import type { SearchResult, SearchOptions } from './types.js';

/**
 * Full-text search using PostgreSQL
 * TODO: Migrate to Meilisearch for better performance
 */
export async function search(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  const stopTimer = startTimer('knowledge.search.latency');
  incCounter('knowledge.search.queries');

  const { limit = 10, offset = 0, type, tags } = options ?? {};

  let sql = `
    SELECT
      id,
      title,
      content,
      LEFT(content, 200) as snippet,
      ts_rank(search_vector, plainto_tsquery('english', $1)) as score,
      type,
      tags
    FROM knowledge_documents
    WHERE search_vector @@ plainto_tsquery('english', $1)
  `;

  const params: unknown[] = [query];

  if (type) {
    params.push(type);
    sql += ` AND type = $${params.length}`;
  }

  if (tags?.length) {
    params.push(tags);
    sql += ` AND tags && $${params.length}`;
  }

  sql += ` ORDER BY score DESC LIMIT $${params.length + 1} OFFSET $${params.length + 2}`;
  params.push(limit, offset);

  try {
    const results = await db.query<SearchResult>(sql, params);

    // Track result metrics
    observeHistogram('knowledge.search.results', results.length);
    if (results.length === 0) {
      incCounter('knowledge.search.empty');
    } else {
      const avgScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
      observeHistogram('knowledge.search.avg_score', avgScore);
    }

    stopTimer();
    return results;
  } catch (error) {
    stopTimer();
    incCounter('knowledge.search.errors');
    throw error;
  }
}

/**
 * Get document by ID
 */
export async function getDocument(id: string): Promise<SearchResult | null> {
  return db.queryOne<SearchResult>(
    `SELECT
      id,
      title,
      content,
      LEFT(content, 200) as snippet,
      1.0 as score,
      type,
      tags
    FROM knowledge_documents
    WHERE id = $1`,
    [id]
  );
}

/**
 * Get related documents
 */
export async function getRelated(
  documentId: string,
  limit = 5
): Promise<SearchResult[]> {
  // Get the document first
  const doc = await getDocument(documentId);
  if (!doc) return [];

  // Find similar by tags and content
  return db.query<SearchResult>(
    `SELECT
      id,
      title,
      content,
      LEFT(content, 200) as snippet,
      (
        CARDINALITY(tags & $2::text[]) * 0.5 +
        ts_rank(search_vector, plainto_tsquery('english', $3)) * 0.5
      ) as score,
      type,
      tags
    FROM knowledge_documents
    WHERE id != $1
    ORDER BY score DESC
    LIMIT $4`,
    [documentId, doc.tags, doc.title, limit]
  );
}
