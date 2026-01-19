# Agents Module

Modulo de agentes inteligentes com LangGraph, parte do Backbone Hub.

---

## Indice

1. [Visao Geral](#visao-geral) - Papel no sistema
2. [Tipos de Agentes](#tipos-de-agentes) - Gatekeeper, Copilot, Worker
3. [Estrutura de Pastas](#estrutura-de-pastas) - Organizacao completa
4. [Proposito de Cada Pasta](#proposito-de-cada-pasta) - Quando criar o que
5. [Anatomia de um Agente](#anatomia-de-um-agente) - index.ts, types.ts, prompt.ts
6. [Prompts](#prompts) - Estrategia e formato
7. [Nodos Reutilizaveis](#nodos-reutilizaveis) - load-context, detect-intent
8. [State Machines](#state-machines) - FSMs explicitas
9. [Persistencia](#persistencia) - WorkflowExecution tracker
10. [Tratamento de Erros](#tratamento-de-erros) - Estrategia em camadas
11. [Jobs](#jobs) - Scheduler e padroes
12. [Integracao com Actions](#integracao-com-actions) - Catalogo e execucao
13. [Boas Praticas](#boas-praticas) - DO e DON'T

---

## Visao Geral

**Agents** e o modulo de IA do Backbone Hub. Agentes observam, classificam, decidem e agem.

```
┌─────────────┐                    ┌──────────────────────────────────────┐
│  apps/app   │───── eventos ─────▶│           apps/backbone              │
│  (Next.js)  │◀──── hints ────────│                                      │
└─────────────┘                    │  ┌──────────────────────────────────┐│
                                   │  │           Agents Module          ││
                                   │  │  ┌─────────┐ ┌─────────────────┐ ││
                                   │  │  │ Triager │ │     Copilot     │ ││
                                   │  │  └────┬────┘ └────────┬────────┘ ││
                                   │  │       │               │          ││
                                   │  │       ▼               ▼          ││
                                   │  │  ┌─────────────────────────────┐ ││
                                   │  │  │        Actions Module       │ ││
                                   │  │  │    (chamada direta)         │ ││
                                   │  │  └─────────────────────────────┘ ││
                                   │  └──────────────────────────────────┘│
                                   └──────────────────────────────────────┘
```

| Aspecto | Valor |
|---------|-------|
| Localizacao | `apps/backbone/src/agents/` |
| Framework | LangGraph |
| Parte de | Backbone Hub (Fastify) |

---

## Relacao com Actions

```
Agents = "COMO pensar" (orquestracao, decisao)
Actions = "O QUE fazer" (catalogo de mutations)
```

Agentes **importam** Actions diretamente (mesmo processo).
Agentes **executam** Actions quando decidem agir.
Agentes **nunca** fazem mutations diretamente no banco.

---

## Tipos de Agentes

| Tipo | Responsabilidade | Trigger |
|------|------------------|---------|
| **Gatekeeper** | Intercepta e classifica tudo que entra | Webhook, evento |
| **Copilot** | Assiste usuario em tempo real | Solicitacao UI |
| **Worker** | Executa tarefas em background | Cron, fila |

### Gatekeeper (Obrigatorio)

Todo input externo passa pelo gatekeeper antes de qualquer processamento.

```
Input externo → Gatekeeper → Classificacao + Labels → Sistema
```

O gatekeeper:
- Classifica intent e sentimento
- Detecta urgencia
- Adiciona labels automaticos
- Gera hints para atendentes
- Nunca é bypassed

**Regra:** TODA alteracao de dados externos DEVE passar pelo Gatekeeper.

### Copilot

Assistente interativo presente em cada aplicacao.

- Streaming de respostas
- Contexto da pagina atual
- Sugere e executa actions
- Historico de sessao

Ver [COPILOT.md](./COPILOT.md) para documentacao completa.

### Worker

Agentes que executam tarefas assincronas.

- Monitoramento de SLA
- Lembretes automaticos
- Processamento de filas
- Timeout de sessoes

---

## Estrutura de Pastas

```
apps/backbone/src/agents/           # Modulo Agents dentro do Backbone
├── index.ts                        # Exports publicos do modulo
│
├── triager/                        # Gatekeeper agent
│   ├── index.ts                    # Graph LangGraph + invoke()
│   ├── types.ts                    # State annotation + Zod schemas
│   └── prompt.ts                   # Builder de prompts
│
├── copilot/                        # Assistente interativo
│   ├── index.ts
│   ├── types.ts
│   └── prompt.ts
│
├── workers/                        # Agentes de background
│   ├── sla-monitor/
│   ├── session-timeout/
│   └── reminder/
│
├── nodes/                          # Nodos reutilizaveis
│   ├── index.ts
│   ├── types.ts                    # WorkflowState base
│   ├── load-context.ts
│   ├── detect-intent.ts
│   ├── execute-tools.ts
│   ├── transition-states.ts
│   └── finalize.ts
│
├── prompts/                        # Prompts em Markdown
│   ├── triager-classify.md
│   ├── triager-reason.md
│   └── copilot-system.md
│
├── tools/                          # Tools dos agentes
│   ├── index.ts
│   ├── triager.ts
│   └── copilot.ts
│
├── state-machines/                 # FSMs explicitas
│   ├── conversation.ts
│   ├── client-card.ts
│   └── calculator.ts
│
├── jobs/                           # Cron jobs
│   ├── scheduler.ts
│   └── sla-monitor.ts
│
└── workflows/                      # Orquestracoes multi-step
    ├── message-handler.ts
    └── escalation.ts
```

**Nota:** Utilitarios compartilhados (db, redis, llm) ficam em `apps/backbone/src/lib/`.

---

## Proposito de Cada Pasta

### agents/

**O que:** Definicao de cada agente inteligente.

**Por que:** Cada agente tem seu proprio grafo, estado e prompts. Manter juntos (`index.ts`, `types.ts`, `prompt.ts`) garante coesao - tudo que define o agente esta no mesmo lugar.

**Quando criar:** Um novo agente (gatekeeper, copilot, worker especializado).

```
agents/
├── triager/          # Gatekeeper - classifica inputs
├── copilot/          # Assistente interativo
└── reminder/         # Worker de lembretes
```

---

### nodes/

**O que:** Nodos reutilizaveis entre agentes.

**Por que:** Evita duplicacao. `load-context`, `detect-intent`, `transition-states` sao operacoes comuns que varios agentes precisam. Centralizar garante consistencia e facilita manutencao.

**Quando criar:** Logica que 2+ agentes precisam.

```
nodes/
├── load-context.ts       # Carrega dados do banco em paralelo
├── detect-intent.ts      # Quick detection + LLM fallback
├── execute-tools.ts      # Executa tools do agente
├── transition-states.ts  # Aplica transicoes de FSM
└── finalize.ts           # Agregacao final, hints
```

---

### prompts/

**O que:** Prompts complexos em Markdown.

**Por que:** Prompts longos com exemplos sao dificeis de manter em TypeScript. Markdown eh legivel, versionavel, e permite colaboracao com quem nao programa. Cache em memoria evita I/O repetido.

**Quando criar:** Prompt com mais de 10 linhas ou com exemplos few-shot.

```
prompts/
├── triager-classify.md   # Classificacao de intent
├── triager-reason.md     # Planejamento de acoes
└── copilot-system.md     # System prompt do copilot
```

---

### tools/

**O que:** Ferramentas que agentes podem usar.

**Por que:** Agentes decidem quando chamar tools. Separar tools do agente permite reutilizacao e facilita testes. Tools que executam mutations chamam Actions (nunca banco direto).

**Quando criar:** Uma capacidade que o agente precisa (add_label, send_message, lookup_client).

```
tools/
├── triager.ts        # add_label, flag_attention
└── copilot.ts        # execute_action, search_kb
```

---

### state-machines/

**O que:** Maquinas de estado explicitas.

**Por que:** Estados e transicoes definidos em codigo sao testáveis, documentam o dominio, e previnem transicoes invalidas. `canTransition()` valida antes de mudar. `calculateState()` deriva estado de dados.

**Quando criar:** Entidade com ciclo de vida (conversation, order, ticket).

```
state-machines/
├── conversation.ts   # new → active → resolved → closed
├── client-card.ts    # draft → identified → complete
└── calculator.ts     # Funcoes calculateXxxState()
```

---

### workflows/

**O que:** Orquestracoes que envolvem multiplos passos.

**Por que:** Alguns fluxos sao mais que um agente - envolvem webhooks, notificacoes, esperas. Workflows encapsulam essa complexidade. Diferente de agentes (que pensam), workflows (que orquestram).

**Quando criar:** Fluxo end-to-end com multiplos sistemas.

```
workflows/
├── message-handler.ts      # Webhook → Agente → Resposta
├── appointment-reminder.ts # Cron → Verificar → Notificar
└── escalation.ts           # Timeout → Escalar → Notificar
```

---

### jobs/

**O que:** Tarefas agendadas (cron).

**Por que:** Workers que rodam periodicamente. Scheduler centraliza todos os crons. Cada job eh uma funcao isolada, testavel, com tracking de execucao.

**Quando criar:** Tarefa periodica (monitoramento, limpeza, lembretes).

```
jobs/
├── scheduler.ts      # Registra todos os crons
├── sla-monitor.ts    # Verifica SLAs expirando
└── session-timeout.ts # Fecha sessoes inativas
```

---

### services/

**O que:** Logica de dominio reutilizavel.

**Por que:** Operacoes de negocio que nodos e workflows precisam. `context.ts` carrega dados. Services orquestram queries e aplicam regras.

**Quando criar:** Logica de negocio usada por multiplos nodos/workflows.

```
services/
├── context.ts        # loadContext() com Promise.all
└── sla.ts            # calculateRemaining(), initializeSla()
```

---

### templates/

**O que:** Templates de mensagens formatadas.

**Por que:** Mensagens para WhatsApp, email, notificacoes tem formato especifico. Templates centralizam e garantem consistencia. Podem incluir cards, botoes, formatacao.

**Quando criar:** Mensagem estruturada enviada ao usuario.

```
templates/
├── appointment-card.ts   # Card de agendamento
├── confirmation.ts       # Mensagem de confirmacao
└── escalation-card.ts    # Notificacao de escalacao
```

---

### lib/

**O que:** Utilitarios e integracoes.

**Por que:** Codigo que nao eh logica de negocio mas eh necessario. `llm.ts` configura LangChain. `execution.ts` rastreia workflows. `integrations/` isola codigo de terceiros.

**Quando criar:** Utilitario generico ou integracao externa.

```
lib/
├── llm.ts                # Config LangChain/OpenRouter
├── cache.ts              # Cache de prompts em memoria
├── execution.ts          # WorkflowExecution tracker
└── integrations/
    ├── evolution.ts      # WhatsApp API
    └── redis.ts          # Pub/sub, filas
```

---

### routes/

**O que:** Endpoints HTTP.

**Por que:** Webhooks de integracoes (WhatsApp, email) entram por aqui. Rotas validam payload e delegam para workflows/agentes.

**Quando criar:** Novo endpoint de entrada.

```
routes/
├── webhook.ts        # POST /webhook/message
└── health.ts         # GET /health
```

---

### db/queries/

**O que:** Queries SQL organizadas por dominio.

**Por que:** Separa acesso a dados da logica. Queries sao funcoes puras que recebem parametros e retornam dados. Facilita testes e migracao.

**Quando criar:** Novo dominio de dados.

```
db/queries/
├── conversations.ts  # getById, create, findInactive
├── messages.ts       # create, findLast
└── metrics.ts        # logInteraction
```

---

## Anatomia de um Agente

Cada agente é uma pasta com 3 arquivos:

```
agents/<nome>/
├── index.ts      # Graph LangGraph + invoke()
├── types.ts      # State annotation + Zod schemas
└── prompt.ts     # buildPrompt(context)
```

### index.ts (Graph)

```typescript
import { StateGraph, Annotation } from '@langchain/langgraph';
import { TriagerState } from './types';
import { buildClassifyPrompt } from './prompt';

const StateAnnotation = Annotation.Root({
  input: Annotation<TriagerInput>(),
  classification: Annotation<Classification>(),
  actions: Annotation<Action[]>({
    reducer: (a, b) => [...a, ...b],
    default: () => [],
  }),
});

async function classifyNode(state: typeof StateAnnotation.State) {
  const prompt = buildClassifyPrompt(state.input);
  const result = await llm.invoke(prompt);
  return { classification: result };
}

const graph = new StateGraph(StateAnnotation)
  .addNode('classify', classifyNode)
  .addNode('reason', reasonNode)
  .addNode('act', actNode)
  .addEdge('__start__', 'classify')
  .addEdge('classify', 'reason')
  .addEdge('reason', 'act')
  .addEdge('act', '__end__');

// Compilacao lazy
let compiled: CompiledGraph | null = null;

export async function invokeTriager(input: TriagerInput) {
  if (!compiled) compiled = graph.compile();
  return compiled.invoke({ input });
}
```

**Regra:** LLM deve ser lazy-loaded. Nao instanciar no top-level.

### types.ts (State)

```typescript
import { z } from 'zod';

export const ClassificationSchema = z.object({
  intent: z.enum(['question', 'complaint', 'request', 'other']),
  sentiment: z.enum(['positive', 'neutral', 'negative']),
  urgency: z.enum(['low', 'medium', 'high', 'critical']),
  reasoning: z.string(),
});

export type Classification = z.infer<typeof ClassificationSchema>;
```

### prompt.ts (Builder)

```typescript
const PROMPTS_DIR = join(__dirname, '../../prompts');
const cache: Record<string, string> = {};

function loadPrompt(name: string): string {
  if (!cache[name]) {
    cache[name] = readFileSync(join(PROMPTS_DIR, `${name}.md`), 'utf-8');
  }
  return cache[name];
}

function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? '');
}

export function buildClassifyPrompt(input: TriagerInput): string {
  const template = loadPrompt('triager-classify');
  return interpolate(template, {
    body: input.body,
    authorType: input.authorType,
    currentDatetime: new Date().toISOString(),
  });
}
```

---

## Prompts

### Estrategia

| Tipo | Localizacao | Quando usar |
|------|-------------|-------------|
| Simples | `prompt.ts` inline | Prompts curtos, poucos vars |
| Complexos | `prompts/*.md` | Prompts longos, muitos exemplos |

### Formato Markdown

```markdown
# Triager - Classificacao

Hoje sao {{currentDatetime}}.

## Contexto

Tipo do autor: {{authorType}}
Labels existentes: {{existingLabels}}

## Mensagem

"""
{{body}}
"""

## Instrucoes

Classifique a mensagem retornando JSON:
- intent: question | complaint | request | other
- sentiment: positive | neutral | negative
- urgency: low | medium | high | critical
- reasoning: explicacao breve
```

### Regras

1. **Temporal:** Sempre incluir data/hora atual como primeira informacao
2. **Cache:** Prompts sao carregados uma vez e cacheados em memoria
3. **Interpolacao:** Usar `{{variavel}}` para substituicao
4. **Versionamento:** Prompts sao codigo, versionados no git

---

## Nodos Reutilizaveis

### load-context

Carrega dados necessarios do banco em paralelo.

```typescript
export async function loadContextNode(state: WorkflowState) {
  const [conversation, messages, clientCard] = await Promise.all([
    getConversation(state.conversationId),
    getLastMessages(state.conversationId, 10),
    getClientCard(state.conversationId),
  ]);

  return { conversation, messages, clientCard };
}
```

### detect-intent

Deteccao hibrida: quick path + LLM.

```typescript
export async function detectIntentNode(state: WorkflowState) {
  // Quick path para casos obvios
  const quick = quickDetect(state.lastMessage);
  if (quick) {
    return { intent: quick, source: 'quick' };
  }

  // LLM para casos complexos
  const result = await llm.invoke(buildIntentPrompt(state));
  return { intent: result, source: 'llm' };
}

function quickDetect(message: string): Intent | null {
  const lower = message.toLowerCase().trim();
  if (/^(oi|olá|ola|bom dia|boa tarde|boa noite)/.test(lower)) {
    return 'greeting';
  }
  if (/^(cancelar|cancela|desistir)/.test(lower)) {
    return 'cancellation';
  }
  return null;
}
```

**Vantagem:** Economiza chamadas LLM para casos triviais.

---

## State Machines

### Definicao Explicita

Estados e transicoes definidos em arquivos dedicados.

```typescript
// state-machines/conversation.ts

export const CONVERSATION_STATES = [
  'new', 'active', 'waiting_customer', 'waiting_team', 'resolved', 'closed',
] as const;

export type ConversationState = typeof CONVERSATION_STATES[number];

export const TRANSITIONS: Record<ConversationState, ConversationState[]> = {
  new: ['active'],
  active: ['waiting_customer', 'waiting_team', 'resolved'],
  waiting_customer: ['active', 'closed'],
  waiting_team: ['active'],
  resolved: ['closed', 'active'],
  closed: ['active'],
};

export function canTransition(from: ConversationState, to: ConversationState): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}
```

### Calculo Automatico

```typescript
// state-machines/calculator.ts

export function calculateState(conversation: Conversation): ConversationState {
  if (conversation.closedAt) return 'closed';
  if (conversation.resolvedAt) return 'resolved';

  const lastMessage = conversation.lastMessage;
  if (!lastMessage) return 'new';

  if (lastMessage.direction === 'outbound') return 'waiting_customer';
  return 'waiting_team';
}
```

### Validacao em Services

```typescript
export async function transitionState(id: string, newState: ConversationState) {
  const conversation = await getById(id);

  if (!canTransition(conversation.state, newState)) {
    throw new Error(`Transicao invalida: ${conversation.state} → ${newState}`);
  }

  return update(id, { state: newState });
}
```

---

## Persistencia

### Workflow Execution Tracker

Rastreia cada execucao para auditoria.

```typescript
// lib/execution.ts

interface WorkflowStep {
  node: string;
  status: 'success' | 'failed';
  input: unknown;
  output: unknown;
  durationMs: number;
}

export class WorkflowExecution {
  id: string;
  workflowName: string;
  steps: WorkflowStep[] = [];
  startedAt: Date;

  stepSuccess(node: string, input: unknown, output: unknown, durationMs: number) {
    this.steps.push({ node, status: 'success', input, output, durationMs });
  }

  stepFailed(node: string, input: unknown, error: Error, durationMs: number) {
    this.steps.push({
      node,
      status: 'failed',
      input,
      output: { error: error.message },
      durationMs,
    });
  }

  async save() {
    await logExecution({
      id: this.id,
      workflow: this.workflowName,
      steps: this.steps.map(s => ({
        ...s,
        input: sanitize(s.input),
        output: sanitize(s.output),
      })),
      totalDurationMs: Date.now() - this.startedAt.getTime(),
    });
  }
}
```

### Sanitizacao

Remove dados sensiveis antes de logar.

```typescript
function sanitize(data: unknown): unknown {
  if (!data || typeof data !== 'object') return data;

  const sensitive = ['password', 'token', 'secret', 'apiKey'];
  const result = { ...data };

  for (const key of Object.keys(result)) {
    if (sensitive.some(s => key.toLowerCase().includes(s))) {
      result[key] = '[REDACTED]';
    }
  }

  return result;
}
```

---

## Tratamento de Erros

### Estrategia em Camadas

```
┌─────────────────────────────────────────────────┐
│ Nivel 4: HTTP (400/500)                         │
├─────────────────────────────────────────────────┤
│ Nivel 3: Workflow (log + continue)              │
├─────────────────────────────────────────────────┤
│ Nivel 2: Nodo (fallback + flag)                 │
├─────────────────────────────────────────────────┤
│ Nivel 1: LLM (retry + default)                  │
└─────────────────────────────────────────────────┘
```

### Nivel 1: LLM

```typescript
async function callLLM(prompt: string, retries = 3): Promise<string> {
  for (let i = 0; i < retries; i++) {
    try {
      return await llm.invoke(prompt);
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(Math.pow(2, i) * 1000); // Exponential backoff
    }
  }
}
```

### Nivel 2: Nodo

```typescript
async function classifyNode(state: State) {
  try {
    const result = await callLLM(prompt);
    return { classification: parse(result) };
  } catch (error) {
    return {
      classification: DEFAULT_CLASSIFICATION,
      error: error.message,
      needsEscalation: true,
    };
  }
}
```

**Regra:** Todo nodo DEVE ter fallback. LLM nunca quebra o fluxo.

---

## Jobs

### Scheduler

```typescript
// jobs/scheduler.ts

import cron from 'node-cron';

export function startScheduler() {
  // SLA monitor - a cada 5 minutos
  cron.schedule('*/5 * * * *', runSlaMonitor);

  // Session timeout - a cada 5 minutos (offset 2min)
  cron.schedule('2-57/5 * * * *', runSessionTimeout);

  // Satisfaction survey - a cada 15 minutos
  cron.schedule('*/15 * * * *', runSatisfactionSurvey);
}
```

**Nota:** Usar offset nos crons para evitar congestao.

### Padrao de Job

```typescript
export async function runSlaMonitor() {
  const execution = new WorkflowExecution('sla-monitor');

  try {
    const threads = await getThreadsWithRunningSla();

    for (const thread of threads) {
      const remaining = calculateRemaining(thread.sla);
      if (remaining <= 0) {
        await expireSla(thread.id);
      }
    }

    execution.stepSuccess('monitor', { count: threads.length }, { processed: true });
  } catch (error) {
    execution.stepFailed('monitor', {}, error);
  } finally {
    await execution.save();
  }
}
```

---

## Integracao com Actions

Como Agents e Actions estao no mesmo processo (Backbone Hub), a integracao e via import direto.

### Consulta de Catalogo

```typescript
// Importa diretamente do modulo Actions
import { getAllActions, getActionsByPermissions } from '../actions/registry';

async function getAvailableActions(userPermissions: string[]) {
  // Chamada direta, sem HTTP
  return getActionsByPermissions(userPermissions);
}
```

### Execucao de Action

```typescript
import { executeAction } from '../actions/registry';

async function runAction(action: string, params: unknown, ctx: ActionContext) {
  // Chamada direta, sem HTTP
  return executeAction(action, params, ctx);
}
```

### Tool que Executa Action

```typescript
import { executeAction } from '../actions/registry';

export const addLabelTool = {
  name: 'add_label',
  description: 'Adiciona label a uma thread',
  schema: z.object({
    threadId: z.string().uuid(),
    label: z.string(),
  }),

  async execute(params: { threadId: string; label: string }, ctx: Context) {
    // Import direto, mesmo processo
    return executeAction('thread.addLabel', params, {
      userId: ctx.userId,
      userRole: ctx.userRole,
      userPermissions: ctx.permissions,
      source: 'agent',
      requestId: ctx.requestId,
    });
  },
};
```

---

## Boas Praticas

### DO

- Usar StateGraph para fluxos com multiplos passos
- Cachear prompts em memoria
- Implementar fallbacks em todo nodo
- Rastrear toda execucao com WorkflowExecution
- Validar estados antes de transicoes
- Separar quick detection de LLM
- Usar Actions para qualquer mutation

### DON'T

- Fazer mutations diretamente no banco
- Instanciar LLM no top-level (lazy load)
- Ignorar erros de LLM (sempre fallback)
- Criar entrada de dados sem passar pelo Gatekeeper
- Logar dados sensiveis
- Hardcodar prompts em codigo

---

## Checklist - Novo Agente

- [ ] Criar pasta em `apps/backbone/src/agents/<nome>/`
- [ ] Implementar `index.ts` com StateGraph
- [ ] Definir `types.ts` com State annotation e schemas Zod
- [ ] Criar `prompt.ts` com builders
- [ ] Adicionar prompts em `agents/prompts/<nome>-*.md`
- [ ] Implementar fallbacks em cada nodo
- [ ] Integrar com Actions via import direto
- [ ] Exportar em `agents/index.ts`
- [ ] Adicionar rota em `routes/agents/` se necessario
- [ ] Adicionar ao CLAUDE.md do projeto
