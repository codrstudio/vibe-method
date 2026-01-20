/**
 * biz-patterns.ts
 * Pattern detection and analysis for business operations
 *
 * Provides:
 * - Pattern detection from historical data
 * - Anomaly identification
 * - Trend analysis
 */

export interface PatternResult {
  type: string;
  severity: 'info' | 'warning' | 'error' | 'critical';
  title: string;
  description: string;
  value: number;
  threshold: number;
  metadata?: Record<string, unknown>;
}

export interface HistoryEntry {
  date: string;
  reports_approved: number;
  reports_rejected: number;
  reports_fallback: number;
  reports_timeout: number;
  avg_review_time_ms: number | null;
  pipeline_successes: number;
  pipeline_failures: number;
}

export interface DailyStats {
  approved: number;
  rejected: number;
  fallback: number;
  timeout: number;
  total: number;
}

// ============ Configuration ============

interface PatternConfig {
  approvalThreshold: number;
  fallbackThreshold: number;
  timeoutThreshold: number;
  pipelineFailureThreshold: number;
  reviewTimeThresholdMs: number;
  trendDays: number;
}

const defaultConfig: PatternConfig = {
  approvalThreshold: parseFloat(process.env.BIZ_APPROVAL_THRESHOLD || '70'),
  fallbackThreshold: parseFloat(process.env.BIZ_FALLBACK_THRESHOLD || '20'),
  timeoutThreshold: 10,
  pipelineFailureThreshold: 20,
  reviewTimeThresholdMs: 30 * 60 * 1000, // 30 minutes
  trendDays: 7,
};

// ============ Pattern Detection ============

/**
 * Detect patterns from today's stats
 */
export function detectPatterns(
  stats: DailyStats,
  config: Partial<PatternConfig> = {}
): PatternResult[] {
  const cfg = { ...defaultConfig, ...config };
  const patterns: PatternResult[] = [];

  if (stats.total === 0) {
    return patterns;
  }

  const approvalRate = (stats.approved / stats.total) * 100;
  const fallbackRate = (stats.fallback / stats.total) * 100;
  const timeoutRate = (stats.timeout / stats.total) * 100;

  // Low approval rate
  if (approvalRate < cfg.approvalThreshold) {
    patterns.push({
      type: 'low_approval_rate',
      severity: approvalRate < cfg.approvalThreshold - 20 ? 'critical' : 'warning',
      title: 'Taxa de aprovacao baixa',
      description: `Taxa de aprovacao (${approvalRate.toFixed(1)}%) abaixo do limite (${cfg.approvalThreshold}%)`,
      value: approvalRate,
      threshold: cfg.approvalThreshold,
    });
  }

  // High fallback rate
  if (fallbackRate > cfg.fallbackThreshold) {
    patterns.push({
      type: 'high_fallback_rate',
      severity: fallbackRate > cfg.fallbackThreshold + 10 ? 'critical' : 'warning',
      title: 'Taxa de fallback alta',
      description: `Taxa de fallback (${fallbackRate.toFixed(1)}%) acima do limite (${cfg.fallbackThreshold}%)`,
      value: fallbackRate,
      threshold: cfg.fallbackThreshold,
    });
  }

  // High timeout rate
  if (timeoutRate > cfg.timeoutThreshold) {
    patterns.push({
      type: 'high_timeout_rate',
      severity: timeoutRate > cfg.timeoutThreshold + 5 ? 'critical' : 'warning',
      title: 'Taxa de timeout alta',
      description: `Taxa de timeout (${timeoutRate.toFixed(1)}%) acima do limite (${cfg.timeoutThreshold}%)`,
      value: timeoutRate,
      threshold: cfg.timeoutThreshold,
    });
  }

  return patterns;
}

// ============ History Analysis ============

/**
 * Analyze historical data for trends
 */
export function analyzeHistory(
  history: HistoryEntry[],
  config: Partial<PatternConfig> = {}
): PatternResult[] {
  const cfg = { ...defaultConfig, ...config };
  const patterns: PatternResult[] = [];

  if (history.length < 3) {
    return patterns;
  }

  // Calculate trends
  const recentDays = history.slice(-cfg.trendDays);
  const olderDays = history.slice(-cfg.trendDays * 2, -cfg.trendDays);

  if (olderDays.length === 0) {
    return patterns;
  }

  // Approval rate trend
  const recentApprovalRate = calculateAverageApprovalRate(recentDays);
  const olderApprovalRate = calculateAverageApprovalRate(olderDays);

  if (recentApprovalRate !== null && olderApprovalRate !== null) {
    const approvalDelta = recentApprovalRate - olderApprovalRate;

    if (approvalDelta < -10) {
      patterns.push({
        type: 'declining_approval_trend',
        severity: approvalDelta < -20 ? 'critical' : 'warning',
        title: 'Tendencia de queda na aprovacao',
        description: `Taxa de aprovacao caiu ${Math.abs(approvalDelta).toFixed(1)}% nos ultimos ${cfg.trendDays} dias`,
        value: approvalDelta,
        threshold: -10,
        metadata: {
          recentRate: recentApprovalRate,
          previousRate: olderApprovalRate,
        },
      });
    }
  }

  // Pipeline failure trend
  const recentFailures = sum(recentDays.map((d) => d.pipeline_failures));
  const recentTotal = sum(recentDays.map((d) => d.pipeline_successes + d.pipeline_failures));
  const recentFailureRate = recentTotal > 0 ? (recentFailures / recentTotal) * 100 : 0;

  if (recentFailureRate > cfg.pipelineFailureThreshold) {
    patterns.push({
      type: 'high_pipeline_failure_rate',
      severity: recentFailureRate > cfg.pipelineFailureThreshold + 10 ? 'critical' : 'warning',
      title: 'Taxa de falha do pipeline alta',
      description: `${recentFailureRate.toFixed(1)}% das execucoes falharam nos ultimos ${cfg.trendDays} dias`,
      value: recentFailureRate,
      threshold: cfg.pipelineFailureThreshold,
    });
  }

  // Review time trend
  const recentReviewTimes = recentDays
    .map((d) => d.avg_review_time_ms)
    .filter((t): t is number => t !== null);

  if (recentReviewTimes.length > 0) {
    const avgReviewTime = sum(recentReviewTimes) / recentReviewTimes.length;

    if (avgReviewTime > cfg.reviewTimeThresholdMs) {
      patterns.push({
        type: 'slow_review_time',
        severity: avgReviewTime > cfg.reviewTimeThresholdMs * 1.5 ? 'critical' : 'warning',
        title: 'Tempo de revisao lento',
        description: `Tempo medio de revisao (${formatDuration(avgReviewTime)}) acima do limite (${formatDuration(cfg.reviewTimeThresholdMs)})`,
        value: avgReviewTime,
        threshold: cfg.reviewTimeThresholdMs,
      });
    }
  }

  // Consecutive failures detection
  const consecutiveFailures = countConsecutiveFailures(history);
  if (consecutiveFailures >= 3) {
    patterns.push({
      type: 'consecutive_failures',
      severity: consecutiveFailures >= 5 ? 'critical' : 'warning',
      title: 'Falhas consecutivas detectadas',
      description: `${consecutiveFailures} dias consecutivos com falhas no pipeline`,
      value: consecutiveFailures,
      threshold: 3,
    });
  }

  return patterns;
}

// ============ Anomaly Detection ============

/**
 * Detect anomalies compared to baseline
 */
export function detectAnomalies(
  current: DailyStats,
  baseline: DailyStats
): PatternResult[] {
  const patterns: PatternResult[] = [];

  if (baseline.total === 0) {
    return patterns;
  }

  // Volume anomaly
  const volumeRatio = current.total / baseline.total;
  if (volumeRatio < 0.5) {
    patterns.push({
      type: 'low_volume',
      severity: 'warning',
      title: 'Volume abaixo do esperado',
      description: `Volume atual (${current.total}) e ${((1 - volumeRatio) * 100).toFixed(0)}% menor que a media (${baseline.total})`,
      value: current.total,
      threshold: baseline.total * 0.5,
    });
  } else if (volumeRatio > 2) {
    patterns.push({
      type: 'high_volume',
      severity: 'info',
      title: 'Volume acima do esperado',
      description: `Volume atual (${current.total}) e ${((volumeRatio - 1) * 100).toFixed(0)}% maior que a media (${baseline.total})`,
      value: current.total,
      threshold: baseline.total * 2,
    });
  }

  return patterns;
}

// ============ Helpers ============

function calculateAverageApprovalRate(entries: HistoryEntry[]): number | null {
  const validEntries = entries.filter(
    (e) => e.reports_approved + e.reports_rejected + e.reports_fallback > 0
  );

  if (validEntries.length === 0) return null;

  const rates = validEntries.map((e) => {
    const total = e.reports_approved + e.reports_rejected + e.reports_fallback;
    return (e.reports_approved / total) * 100;
  });

  return sum(rates) / rates.length;
}

function countConsecutiveFailures(history: HistoryEntry[]): number {
  let count = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].pipeline_failures > 0 && history[i].pipeline_successes === 0) {
      count++;
    } else {
      break;
    }
  }
  return count;
}

function sum(numbers: number[]): number {
  return numbers.reduce((a, b) => a + b, 0);
}

function formatDuration(ms: number): string {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);

  if (minutes > 0) {
    return `${minutes}m ${seconds}s`;
  }
  return `${seconds}s`;
}

// ============ Exports ============

export const bizPatterns = {
  detectPatterns,
  analyzeHistory,
  detectAnomalies,
};

export default bizPatterns;
