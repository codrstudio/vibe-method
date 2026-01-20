// Export types
export * from './types.js';

// Export executor registry
export { registerExecutor, unregisterExecutor, hasExecutor, getExecutorTargets } from './executor.js';

// Export service functions
export {
  createJob,
  getJob,
  getJobBySlug,
  listJobs,
  updateJob,
  deleteJob,
  pauseJob,
  resumeJob,
  runJobNow,
  getJobRuns,
  getRun,
  cleanupRuns,
  syncAllJobs,
  getQueueStats,
} from './service.js';

// Export queue functions
export { getQueue, closeQueue } from './queue.js';

// Export worker functions
export { startWorker, stopWorker, getWorker } from './worker.js';

// ============ Initialization ============

import { startWorker } from './worker.js';
import { syncAllJobs } from './service.js';

let initialized = false;

/**
 * Initialize the scheduler service
 * Call this on application startup
 */
export async function initScheduler(): Promise<void> {
  if (initialized) {
    console.log('[Scheduler] Already initialized');
    return;
  }

  console.log('[Scheduler] Initializing...');

  // Start the worker
  startWorker();

  // Sync all enabled jobs to the queue
  await syncAllJobs();

  initialized = true;
  console.log('[Scheduler] Ready!');
}

/**
 * Shutdown the scheduler service
 * Call this on application shutdown
 */
export async function shutdownScheduler(): Promise<void> {
  if (!initialized) {
    return;
  }

  console.log('[Scheduler] Shutting down...');

  const { stopWorker } = await import('./worker.js');
  const { closeQueue } = await import('./queue.js');

  await stopWorker();
  await closeQueue();

  initialized = false;
  console.log('[Scheduler] Shutdown complete');
}
