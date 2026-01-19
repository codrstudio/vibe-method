import { db } from '../lib/index.js';
import { incCounter, startTimer, setGauge } from '../health/collector.js';
import type { IndexDocumentInput, Document } from './types.js';

/**
 * Index a document for search
 */
export async function indexDocument(input: IndexDocumentInput): Promise<Document> {
  const stopTimer = startTimer('knowledge.index.latency');
  incCounter('knowledge.index.documents', 1, { type: input.type });

  try {
    const [doc] = await db.query<Document>(
      `INSERT INTO knowledge_documents (id, title, content, type, tags, metadata)
       VALUES ($1, $2, $3, $4, $5, $6)
       ON CONFLICT (id) DO UPDATE SET
         title = EXCLUDED.title,
         content = EXCLUDED.content,
         type = EXCLUDED.type,
         tags = EXCLUDED.tags,
         metadata = EXCLUDED.metadata,
         updated_at = NOW()
       RETURNING
         id, title, content, type, tags, metadata,
         created_at as "createdAt",
         updated_at as "updatedAt"`,
      [
        input.id,
        input.title,
        input.content,
        input.type,
        input.tags,
        JSON.stringify(input.metadata),
      ]
    );

    stopTimer();
    return doc;
  } catch (error) {
    stopTimer();
    incCounter('knowledge.index.errors');
    throw error;
  }
}

/**
 * Remove a document from the index
 */
export async function removeDocument(id: string): Promise<boolean> {
  const count = await db.execute(
    `DELETE FROM knowledge_documents WHERE id = $1`,
    [id]
  );
  return count > 0;
}

/**
 * Bulk index documents
 */
export async function bulkIndex(documents: IndexDocumentInput[]): Promise<number> {
  const stopTimer = startTimer('knowledge.bulk_index.latency');
  incCounter('knowledge.bulk_index.batches');

  let indexed = 0;

  for (const doc of documents) {
    try {
      await indexDocument(doc);
      indexed++;
    } catch (error) {
      console.error(`Failed to index document ${doc.id}:`, error);
    }
  }

  incCounter('knowledge.bulk_index.documents', indexed);
  stopTimer();
  return indexed;
}

/**
 * Get indexing stats
 */
export async function getStats(): Promise<{
  totalDocuments: number;
  byType: Record<string, number>;
}> {
  const [total] = await db.query<{ count: string }>(
    `SELECT COUNT(*) as count FROM knowledge_documents`
  );

  const byType = await db.query<{ type: string; count: string }>(
    `SELECT type, COUNT(*) as count
     FROM knowledge_documents
     GROUP BY type`
  );

  const totalDocuments = parseInt(total?.count ?? '0', 10);

  // Update gauge for monitoring
  setGauge('knowledge.documents.total', totalDocuments);

  return {
    totalDocuments,
    byType: Object.fromEntries(
      byType.map((r) => [r.type, parseInt(r.count, 10)])
    ),
  };
}
