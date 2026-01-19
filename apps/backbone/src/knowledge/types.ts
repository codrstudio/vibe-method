import { z } from 'zod';

export interface Document {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  metadata: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  id: string;
  title: string;
  content: string;
  snippet: string;
  score: number;
  type: string;
  tags: string[];
}

export interface SearchOptions {
  limit?: number;
  offset?: number;
  type?: string;
  tags?: string[];
}

export const IndexDocumentSchema = z.object({
  id: z.string(),
  title: z.string(),
  content: z.string(),
  type: z.string(),
  tags: z.array(z.string()).default([]),
  metadata: z.record(z.unknown()).default({}),
});

export type IndexDocumentInput = z.infer<typeof IndexDocumentSchema>;
