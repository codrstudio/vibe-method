/**
 * SERVICES - Logica de Negocio
 *
 * Servicos encapsulam regras de negocio SEM usar LLM.
 * Sao chamados por tools, workflows e jobs.
 *
 * ESTRUTURA RECOMENDADA:
 * - Um arquivo por dominio (ex: users.ts, orders.ts)
 * - Cada arquivo exporta funcoes puras
 * - Chama queries do banco via db/queries/
 *
 * EXEMPLO:
 *
 * // services/users.ts
 * import * as userQueries from '../db/queries/users.js';
 *
 * export async function createUser(input: CreateUserInput): Promise<User> {
 *   // 1. Validar
 *   if (!input.email) throw new Error('Email required');
 *
 *   // 2. Verificar duplicidade
 *   const existing = await userQueries.findByEmail(input.email);
 *   if (existing) throw new Error('Email already exists');
 *
 *   // 3. Criar
 *   return userQueries.create(input);
 * }
 *
 * export async function deactivateUser(id: string): Promise<void> {
 *   const user = await userQueries.findById(id);
 *   if (!user) throw new Error('User not found');
 *
 *   await userQueries.update(id, { active: false });
 *
 *   // Side effect: notificar
 *   await notifications.send(user.email, 'Account deactivated');
 * }
 */

// Re-export do db para facilitar uso em services
export * as db from '../db/index.js';

// Adicione exports dos seus services aqui:
// export * as users from './users.js';
// export * as orders from './orders.js';
