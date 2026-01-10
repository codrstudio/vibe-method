/**
 * SCHEDULER - Tarefas Agendadas
 *
 * Registra e gerencia jobs cron do backbone.
 *
 * ESTRUTURA:
 * - Este arquivo apenas AGENDA os jobs
 * - A logica de cada job fica em workflows/ ou services/
 *
 * PARA ADICIONAR NOVOS JOBS:
 * 1. Crie a logica em workflows/ ou services/
 * 2. Importe a funcao aqui
 * 3. Adicione o schedule em startScheduler()
 */

import cron from 'node-cron';

// Estado dos jobs para health check
let jobsRunning = false;

// =============================================================================
// EXAMPLE JOBS
// =============================================================================

/**
 * Exemplo: Job de limpeza (executar diariamente)
 */
async function runCleanupJob(): Promise<void> {
  console.log('[Scheduler] Running cleanup job...');

  try {
    // TODO: Implemente sua logica de limpeza
    // Exemplo:
    // await cleanOldSessions();
    // await cleanOldExecutions();

    console.log('[Scheduler] Cleanup job completed');
  } catch (error) {
    console.error('[Scheduler] Cleanup job failed:', error);
  }
}

/**
 * Exemplo: Job de health check externo (cada 5 minutos)
 */
async function runHealthCheckJob(): Promise<void> {
  // TODO: Implemente verificacoes de saude de servicos externos
  // Exemplo:
  // const status = await externalService.checkConnection();
  // if (!status.connected) {
  //   await alertService.notify('External service disconnected');
  // }
}

// =============================================================================
// SCHEDULER
// =============================================================================

/**
 * Inicia todos os jobs agendados
 */
export function startScheduler(): void {
  console.log('[Scheduler] Iniciando jobs agendados...');

  // Exemplo: Cleanup diario as 3:00 AM
  cron.schedule('0 3 * * *', () => {
    runCleanupJob().catch(err => console.error('[Scheduler] Cleanup failed:', err));
  });

  // Exemplo: Health check a cada 5 minutos
  cron.schedule('*/5 * * * *', () => {
    runHealthCheckJob().catch(err => console.error('[Scheduler] Health check failed:', err));
  });

  // Adicione mais jobs aqui:
  // cron.schedule('*/10 * * * *', () => {
  //   meuJob().catch(err => console.error('[Scheduler] Meu job failed:', err));
  // });

  jobsRunning = true;

  console.log('[Scheduler] Jobs agendados:');
  console.log('  - Cleanup: 0 3 * * * (diario 3:00 AM)');
  console.log('  - Health check: */5 * * * * (cada 5 min)');
}

/**
 * Retorna status do scheduler para health check
 */
export function getSchedulerStatus(): {
  jobsRunning: boolean;
} {
  return {
    jobsRunning,
  };
}

// =============================================================================
// CRON SYNTAX REFERENCE
// =============================================================================

/**
 * Formato: * * * * *
 *          | | | | |
 *          | | | | +-- Dia da semana (0-7, 0 e 7 = domingo)
 *          | | | +---- Mes (1-12)
 *          | | +------ Dia do mes (1-31)
 *          | +-------- Hora (0-23)
 *          +---------- Minuto (0-59)
 *
 * Exemplos:
 * - '* * * * *'      = A cada minuto
 * - '0 * * * *'      = A cada hora (minuto 0)
 * - '0 0 * * *'      = Diariamente a meia-noite
 * - '0 3 * * *'      = Diariamente as 3:00 AM
 * - '0 0 * * 0'      = Todo domingo a meia-noite
 * - '0 0 1 * *'      = Primeiro dia de cada mes
 * - '*/5 * * * *'    = A cada 5 minutos
 * - '*/15 * * * *'   = A cada 15 minutos
 * - '0 */2 * * *'    = A cada 2 horas
 * - '0 9-17 * * 1-5' = A cada hora das 9h as 17h, seg-sex
 */
