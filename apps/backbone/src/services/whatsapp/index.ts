// Types
export * from './types.js';

// Repositories
export {
  channelsRepository,
  operationsRepository,
  assignmentsRepository,
  eventsRepository,
} from './repository.js';

export { messageLogsRepository } from './message-logs-repository.js';

// Services
export { whatsappService } from './service.js';
export { evolutionClient, EvolutionApiError } from './evolution-client.js';
export { alertService } from './alert-service.js';

// Webhook Handler
export {
  handleEvolutionWebhook,
  setSocketEmitter,
  cleanup as cleanupWebhookHandler,
} from './webhook-handler.js';
