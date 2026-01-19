import { search } from './search.js';
import type { SearchResult, SearchOptions } from './types.js';

/**
 * Retrieve documents for RAG (Retrieval-Augmented Generation)
 */
export async function retrieveForRAG(
  query: string,
  options?: SearchOptions
): Promise<SearchResult[]> {
  return search(query, {
    limit: options?.limit ?? 5,
    ...options,
  });
}

/**
 * Format retrieved documents as context for LLM
 */
export function formatAsContext(documents: SearchResult[]): string {
  if (!documents.length) {
    return '';
  }

  return documents
    .map((doc, i) => {
      return `[Document ${i + 1}: ${doc.title}]
${doc.content}
---`;
    })
    .join('\n\n');
}

/**
 * Chunk text for indexing
 */
export function chunkText(
  text: string,
  options?: { chunkSize?: number; overlap?: number }
): string[] {
  const { chunkSize = 1000, overlap = 200 } = options ?? {};

  const chunks: string[] = [];
  let start = 0;

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length);
    chunks.push(text.slice(start, end));
    start += chunkSize - overlap;
  }

  return chunks;
}

/**
 * Calculate relevance threshold for filtering
 */
export function getRelevanceThreshold(scores: number[]): number {
  if (!scores.length) return 0;

  const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
  const std = Math.sqrt(
    scores.reduce((sum, s) => sum + (s - mean) ** 2, 0) / scores.length
  );

  // Return mean - 1 standard deviation as threshold
  return Math.max(0, mean - std);
}
