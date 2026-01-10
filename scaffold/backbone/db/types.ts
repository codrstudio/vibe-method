/**
 * DATABASE TYPES
 *
 * Tipos especificos do banco de dados.
 * Adicione tipos das suas tabelas conforme necessario.
 */

// =============================================================================
// BASE TYPES
// =============================================================================

/**
 * Campos comuns em todas as tabelas
 */
export interface BaseEntity {
  id: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * Opcoes de paginacao
 */
export interface PaginationOptions {
  limit?: number;
  offset?: number;
  orderBy?: string;
  orderDir?: 'ASC' | 'DESC';
}

/**
 * Resultado paginado
 */
export interface PaginatedResult<T> {
  data: T[];
  total: number;
  limit: number;
  offset: number;
}

// =============================================================================
// EXAMPLE ENTITIES
// =============================================================================
// Remova ou customize conforme seu dominio

/**
 * Exemplo: Usuario
 */
export interface User extends BaseEntity {
  email: string;
  name: string;
  phone?: string;
  role: string;
  active: boolean;
}

/**
 * Exemplo: Conversa
 */
export interface Conversation extends BaseEntity {
  user_id?: string;
  phone: string;
  status: 'active' | 'closed';
  closed_at?: Date;
}

/**
 * Exemplo: Mensagem
 */
export interface Message extends BaseEntity {
  conversation_id: string;
  direction: 'in' | 'out';
  content: string;
}

/**
 * Exemplo: Execucao de workflow
 */
export interface WorkflowExecution extends BaseEntity {
  workflow: string;
  trigger: string;
  status: 'running' | 'success' | 'failed';
  conversation_id?: string;
  user_id?: string;
  steps: unknown; // JSON
  duration_ms?: number;
  error?: string;
  finished_at?: Date;
}
