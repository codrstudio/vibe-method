/**
 * EXAMPLE TOOL - Ferramenta de Exemplo
 *
 * Demonstra como criar uma tool para o agente.
 *
 * ESTRUTURA:
 * 1. Schema Zod para validar parametros
 * 2. Funcao async que executa a acao
 * 3. Metadados (name, description)
 *
 * DICAS:
 * - name: use snake_case, seja descritivo
 * - description: explique QUANDO usar (o LLM decide baseado nisso)
 * - schema: descreva cada parametro com .describe()
 * - retorno: sempre JSON.stringify() para o agente ler
 */

import { tool } from '@langchain/core/tools';
import { z } from 'zod';

/**
 * Tool de Eco - repete a mensagem recebida
 *
 * Util para testar se o sistema de tools funciona.
 */
export const echoTool = tool(
  async ({ message, uppercase }) => {
    // Logica da tool
    const result = uppercase ? message.toUpperCase() : message;

    // Sempre retorne JSON para o agente poder parsear
    return JSON.stringify({
      success: true,
      echo: result,
      originalLength: message.length,
    });
  },
  {
    // Nome da tool (snake_case)
    name: 'echo',

    // Descricao - CRITICO: o LLM usa isso para decidir quando chamar
    description: `Ferramenta de teste que repete a mensagem enviada.
Use esta tool para verificar se o sistema de ferramentas esta funcionando.
Retorna a mensagem original ou em maiusculas se solicitado.`,

    // Schema Zod dos parametros
    schema: z.object({
      message: z.string().describe('A mensagem para ecoar'),
      uppercase: z.boolean().optional().default(false).describe('Se true, converte para maiusculas'),
    }),
  }
);

// =============================================================================
// TEMPLATE PARA NOVAS TOOLS
// =============================================================================

/**
 * Use este template para criar novas tools:
 *
 * export const minhaTool = tool(
 *   async ({ param1, param2 }) => {
 *     // 1. Validar entrada (se necessario)
 *     if (!param1) {
 *       return JSON.stringify({ success: false, error: 'param1 is required' });
 *     }
 *
 *     // 2. Executar logica (pode chamar services)
 *     const resultado = await meuService.fazerAlgo(param1, param2);
 *
 *     // 3. Retornar JSON
 *     return JSON.stringify({
 *       success: true,
 *       data: resultado,
 *     });
 *   },
 *   {
 *     name: 'minha_tool',
 *     description: `Descreva claramente o que esta tool faz.
 * Inclua quando o agente deve usa-la.
 * Seja especifico sobre os parametros.`,
 *     schema: z.object({
 *       param1: z.string().describe('Descricao do param1'),
 *       param2: z.number().optional().describe('Descricao do param2'),
 *     }),
 *   }
 * );
 */
