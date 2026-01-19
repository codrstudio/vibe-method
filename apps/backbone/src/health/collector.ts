/**
 * @deprecated Use '../pulse/index.js' instead
 * Este arquivo existe apenas para compatibilidade retroativa.
 * Todos os novos imports devem usar pulse diretamente.
 */

// Re-exporta tudo do pulse para manter compatibilidade
export { metrics } from '../pulse/index.js';

// Convenience exports (legado)
import { metrics } from '../pulse/index.js';

export const incCounter = metrics.incCounter.bind(metrics);
export const setGauge = metrics.setGauge.bind(metrics);
export const incGauge = metrics.incGauge.bind(metrics);
export const decGauge = metrics.decGauge.bind(metrics);
export const observeHistogram = metrics.observeHistogram.bind(metrics);
export const timeAsync = metrics.time.bind(metrics);
export const startTimer = metrics.startTimer.bind(metrics);
