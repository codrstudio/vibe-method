import type { FastifyPluginAsync } from 'fastify';
import {
  search,
  getDocument,
  getRelated,
  indexDocument,
  removeDocument,
  getStats,
  IndexDocumentSchema,
} from '../knowledge/index.js';

export const knowledgeRoutes: FastifyPluginAsync = async (fastify) => {
  // Search knowledge base
  fastify.get<{
    Querystring: {
      q: string;
      limit?: string;
      offset?: string;
      type?: string;
      tags?: string;
    };
  }>('/search', async (request, reply) => {
    const { q, limit, offset, type, tags } = request.query;

    if (!q) {
      return reply.badRequest('Query parameter "q" is required');
    }

    const results = await search(q, {
      limit: limit ? parseInt(limit, 10) : undefined,
      offset: offset ? parseInt(offset, 10) : undefined,
      type,
      tags: tags ? tags.split(',') : undefined,
    });

    return reply.send({ data: results });
  });

  // Get document by ID
  fastify.get<{ Params: { id: string } }>('/documents/:id', async (request, reply) => {
    const doc = await getDocument(request.params.id);

    if (!doc) {
      return reply.notFound('Document not found');
    }

    return reply.send({ data: doc });
  });

  // Get related documents
  fastify.get<{ Params: { id: string }; Querystring: { limit?: string } }>(
    '/documents/:id/related',
    async (request, reply) => {
      const { limit } = request.query;
      const related = await getRelated(
        request.params.id,
        limit ? parseInt(limit, 10) : undefined
      );

      return reply.send({ data: related });
    }
  );

  // Index a document
  fastify.post<{ Body: unknown }>('/index', async (request, reply) => {
    const result = IndexDocumentSchema.safeParse(request.body);

    if (!result.success) {
      return reply.badRequest(result.error.message);
    }

    const doc = await indexDocument(result.data);

    return reply.status(201).send({ data: doc });
  });

  // Remove document from index
  fastify.delete<{ Params: { id: string } }>(
    '/documents/:id',
    async (request, reply) => {
      const removed = await removeDocument(request.params.id);

      if (!removed) {
        return reply.notFound('Document not found');
      }

      return reply.send({ data: { success: true } });
    }
  );

  // Get indexing stats
  fastify.get('/stats', async (_request, reply) => {
    const stats = await getStats();
    return reply.send({ data: stats });
  });
};
