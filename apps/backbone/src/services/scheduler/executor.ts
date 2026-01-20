import type { ExecutorFn, ExecutorResult } from './types.js';

// Registry of executor functions
const executors = new Map<string, ExecutorFn>();

/**
 * Register an executor function for a target
 */
export function registerExecutor(target: string, fn: ExecutorFn): void {
  executors.set(target, fn);
  console.log(`[Scheduler] Registered executor: ${target}`);
}

/**
 * Unregister an executor function
 */
export function unregisterExecutor(target: string): boolean {
  return executors.delete(target);
}

/**
 * Get an executor function by target
 */
export function getExecutor(target: string): ExecutorFn | undefined {
  return executors.get(target);
}

/**
 * Check if an executor exists for a target
 */
export function hasExecutor(target: string): boolean {
  return executors.has(target);
}

/**
 * Get all registered executor targets
 */
export function getExecutorTargets(): string[] {
  return Array.from(executors.keys());
}

/**
 * Execute a job target with params
 */
export async function executeTarget(
  target: string,
  params: Record<string, unknown>,
  context: { jobId: string; runId: string; attempt: number }
): Promise<ExecutorResult> {
  const executor = executors.get(target);

  if (!executor) {
    return {
      success: false,
      error: `Executor not found for target: ${target}`,
    };
  }

  try {
    return await executor(params, context);
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// ============ Built-in Executors ============

/**
 * No-op executor for testing
 */
registerExecutor('system:noop', async (params, context) => {
  console.log(`[Scheduler] NoOp executed`, { params, context });
  return { success: true, output: { message: 'NoOp completed', params } };
});

/**
 * Log executor for debugging
 */
registerExecutor('system:log', async (params, context) => {
  console.log(`[Scheduler] Log executor:`, {
    jobId: context.jobId,
    runId: context.runId,
    attempt: context.attempt,
    params,
  });
  return { success: true, output: { logged: true } };
});

/**
 * Executor that always fails (for testing retry logic)
 */
registerExecutor('system:fail', async () => {
  throw new Error('Intentional failure for testing');
});

/**
 * Executor that simulates slow execution
 */
registerExecutor('system:slow', async (params) => {
  const delayMs = (params.delayMs as number) ?? 5000;
  await new Promise((resolve) => setTimeout(resolve, delayMs));
  return { success: true, output: { delayed: delayMs } };
});

/**
 * Hello World executor for testing
 */
registerExecutor('system:hello-world', async (params, context) => {
  const message = (params.message as string) ?? 'Hello from Scheduler!';
  const timestamp = new Date().toISOString();

  console.log('');
  console.log('╔════════════════════════════════════════════════════════════╗');
  console.log('║            🎉 SCHEDULER HELLO WORLD TEST 🎉                ║');
  console.log('╠════════════════════════════════════════════════════════════╣');
  console.log(`║  Message:   ${message.padEnd(46)}║`);
  console.log(`║  Job ID:    ${context.jobId.padEnd(46)}║`);
  console.log(`║  Run ID:    ${context.runId.padEnd(46)}║`);
  console.log(`║  Attempt:   ${String(context.attempt).padEnd(46)}║`);
  console.log(`║  Timestamp: ${timestamp.padEnd(46)}║`);
  console.log('╚════════════════════════════════════════════════════════════╝');
  console.log('');

  return {
    success: true,
    output: {
      message,
      timestamp,
      jobId: context.jobId,
      runId: context.runId,
    },
  };
});
