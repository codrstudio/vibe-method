/**
 * TOOLS - Ferramentas do Agente
 *
 * Exporta todas as tools disponiveis para o agente.
 * Adicione novas tools importando e adicionando ao array.
 */

import { echoTool } from './example.js';

/**
 * Array de todas as tools disponiveis para o agente.
 *
 * PARA ADICIONAR NOVAS TOOLS:
 * 1. Crie um arquivo em tools/ (ex: minha-tool.ts)
 * 2. Defina a tool usando tool() do @langchain/core/tools
 * 3. Importe e adicione ao array abaixo
 */
export const tools = [
  echoTool,
  // Adicione suas tools aqui:
  // minhaNovaToolTool,
  // outraTool,
];

// Re-export das tools individuais para uso direto
export { echoTool } from './example.js';
