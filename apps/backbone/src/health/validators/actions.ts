import { registry } from '../../actions/registry.js';
import { metrics } from '../collector.js';
import type { ActionValidationResult, ActionValidationReport } from '../types.js';

export async function validateAllActions(options?: {
  dryRun?: boolean;
  actions?: string[];
}): Promise<ActionValidationReport> {
  const { dryRun = true, actions: filterActions } = options ?? {};

  const catalog = registry.getCatalog();
  const results: ActionValidationResult[] = [];

  for (const action of catalog) {
    if (filterActions && !filterActions.includes(action.name)) {
      continue;
    }

    const latencyMetric = metrics.getHistogram('actions.latency', { action: action.name });
    const executedMetric = metrics.getCounter('actions.executed', { action: action.name });
    const errorsMetric = metrics.getCounter('actions.errors', { action: action.name });

    const result: ActionValidationResult = {
      name: action.name,
      valid: true,
      executionCount: executedMetric.value,
      errorCount: errorsMetric.value,
      avgLatency: latencyMetric.count > 0 ? latencyMetric.avg : undefined,
    };

    // Run test execution if not dry run
    if (!dryRun) {
      try {
        const start = performance.now();
        // Test with minimal valid input based on schema
        // For now, just verify the action exists and is callable
        const exists = registry.has(action.name);

        result.testResult = {
          success: exists,
          duration: performance.now() - start,
        };

        if (!exists) {
          result.valid = false;
          result.testResult.error = 'Action not found in registry';
        }
      } catch (error) {
        result.valid = false;
        result.testResult = {
          success: false,
          error: error instanceof Error ? error.message : 'Unknown error',
          duration: 0,
        };
      }
    }

    results.push(result);
  }

  return {
    timestamp: new Date().toISOString(),
    totalActions: catalog.length,
    validActions: results.filter((r) => r.valid).length,
    results,
  };
}
