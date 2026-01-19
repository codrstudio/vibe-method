export { search, getDocument, getRelated } from './search.js';
export { indexDocument, removeDocument, bulkIndex, getStats } from './indexer.js';
export { retrieveForRAG, formatAsContext, chunkText, getRelevanceThreshold } from './rag.js';
export { IndexDocumentSchema } from './types.js';
export type {
  Document,
  SearchResult,
  SearchOptions,
  IndexDocumentInput,
} from './types.js';
