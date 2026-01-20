/**
 * biz/index.ts
 * Business routes aggregator
 *
 * Registers all business-specific routes under /backbone/biz/*
 */

import type { FastifyPluginAsync } from 'fastify';
import { bizReviewRoutes } from './review.js';
import { bizMetricsRoutes } from './metrics.js';

export const bizRoutes: FastifyPluginAsync = async (fastify) => {
  // Review routes: /backbone/biz/review/*
  await fastify.register(bizReviewRoutes, { prefix: '/review' });

  // Metrics routes: /backbone/biz/metrics/*
  await fastify.register(bizMetricsRoutes, { prefix: '/metrics' });
};
