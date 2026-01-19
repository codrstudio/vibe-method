# Feature: Agent Orchestration

Orquestracao de agentes inteligentes com LangGraph para processos, assistentes e agentes autonomos.

**Prefixo:** AGENT

---

## Design

### DES-AGENT-001: LangGraph Architecture

Framework de orquestracao para fluxos de IA.

**Implementacao:**
- Servico Fastify dedicado (`apps/agents/`, porta XX03)
- StateGraph do LangGraph para definir fluxos
- Cada agente eh uma pasta com: `index.ts`, `types.ts`, `prompt.ts`
- Compilacao lazy dos grafos para otimizar startup

**Trade-offs:**
- Curva de aprendizado do LangGraph
- Dependencia de framework especifico
- Mas grafos explicitos facilitam debug e manutencao

**Refs:** vibe-method/AGENTS.md

---

### DES-AGENT-002: Agent Types

Tres tipos de agentes com responsabilidades distintas.

**Implementacao:**
| Tipo | Responsabilidade | Trigger |
|------|------------------|---------|
| **Gatekeeper** | Intercepta e classifica inputs externos | Webhook, evento |
| **Copilot** | Assiste usuario em tempo real | Solicitacao UI |
| **Worker** | Executa tarefas em background | Cron, fila |

**Trade-offs:**
- Tipos fixos limitam flexibilidade
- Mas categorias claras facilitam design e manutencao

---

### DES-AGENT-003: Gatekeeper Pattern

Todo input externo passa pelo gatekeeper antes de processamento.

**Implementacao:**
- Classifica intent (question, complaint, request, other)
- Detecta sentimento (positive, neutral, negative)
- Avalia urgencia (low, medium, high, critical)
- Adiciona labels automaticos
- Gera hints para atendentes
- NUNCA eh bypassed

**Trade-offs:**
- Latencia adicional em todo input (~200-500ms)
- Mas garante consistencia e classificacao automatica

---

### DES-AGENT-004: Copilot Architecture

Assistente interativo presente em cada aplicacao.

**Implementacao:**
- Streaming de respostas via Server-Sent Events
- Contexto da pagina atual injetado automaticamente
- Acesso ao catalogo de Actions para sugerir e executar
- Historico de sessao mantido em memoria/Redis
- Fallback gracioso quando LLM indisponivel

**Trade-offs:**
- Custo de tokens por interacao
- Mas multiplica produtividade do usuario

---

### DES-AGENT-005: Worker Agents

Agentes que executam tarefas assincronas.

**Implementacao:**
- **SLA Monitor:** Verifica SLAs expirando a cada 5 min
- **Session Timeout:** Fecha sessoes inativas
- **Reminder:** Envia lembretes agendados
- **ETL:** Sincroniza dados para analytics
- Jobs registrados em `scheduler.ts` com cron expressions

**Trade-offs:**
- Carga de background mesmo sem usuarios ativos
- Mas automatiza tarefas que humanos esqueceriam

---

### DES-AGENT-006: State Machine Integration

Maquinas de estado explicitas para entidades com ciclo de vida.

**Implementacao:**
- Estados e transicoes definidos em `state-machines/*.ts`
- Funcao `canTransition(from, to)` valida antes de mudar
- Funcao `calculateState(entity)` deriva estado de dados
- Transicoes invalidas lancam erro explicito

**Trade-offs:**
- Codigo adicional para cada entidade com estados
- Mas previne estados inconsistentes e documenta ciclo de vida

---

### DES-AGENT-007: Prompt Management

Gerenciamento de prompts como codigo.

**Implementacao:**
- Prompts curtos: inline em `prompt.ts`
- Prompts longos: arquivos Markdown em `prompts/*.md`
- Interpolacao com `{{variavel}}`
- Cache em memoria para evitar I/O repetido
- Sempre incluir data/hora atual como primeira informacao

**Trade-offs:**
- Prompts em arquivos separados dificulta refatoracao
- Mas legibilidade e versionamento superiores

---

### DES-AGENT-008: Intent Detection Strategy

Deteccao hibrida: quick path + LLM.

**Implementacao:**
- **Quick path:** Regex para casos obvios (saudacao, cancelamento)
- **LLM fallback:** Para casos complexos ou ambiguos
- Quick path economiza ~80% das chamadas LLM em cenarios tipicos

**Trade-offs:**
- Regras quick path precisam manutencao
- Mas reducao significativa de custo e latencia

---

### DES-AGENT-009: Tool Integration

Ferramentas que agentes podem usar.

**Implementacao:**
- Tools definidos com schema Zod para validacao
- Cada tool mapeia para uma Action ou query
- Tools de mutation SEMPRE chamam Actions (nunca banco direto)
- Contexto inclui: userId, userRole, token

**Trade-offs:**
- Mais uma camada de abstracao
- Mas garante que agentes respeitam permissoes

**Depends:** DES-ACT-001

---

### DES-AGENT-010: Error Handling in Agents

Tratamento de erros em camadas.

**Implementacao:**
1. **LLM:** Retry com backoff exponencial (ate 3x)
2. **Nodo:** Fallback para valor default + flag de escalacao
3. **Workflow:** Log de erro + continue se possivel
4. **HTTP:** Retorno de erro padronizado

**Trade-offs:**
- Fallbacks podem mascarar problemas
- Mas sistema nunca para por falha de LLM

---

### DES-AGENT-011: Workflow Execution Tracking

Rastreamento de cada execucao para auditoria.

**Implementacao:**
- `WorkflowExecution` class registra cada step
- Campos: node, status, input, output (sanitizado), durationMs
- Persistencia em MongoDB com TTL de 30 dias
- Sanitizacao remove dados sensiveis (passwords, tokens)

**Trade-offs:**
- Storage adicional para logs
- Mas essencial para debug e compliance

---

### DES-AGENT-012: LLM Configuration

Configuracao de modelos de linguagem.

**Implementacao:**
- Ollama para tarefas leves (classificacao, embeddings)
- OpenRouter/OpenAI para raciocinio complexo
- Selecao de modelo baseada em:
  - Complexidade da tarefa
  - Tamanho do contexto necessario
  - Requisito de latencia
- LLM lazy-loaded (nunca instanciado no top-level)

**Trade-offs:**
- Multiplos provedores para gerenciar
- Mas otimiza custo vs performance por tarefa

---

### DES-AGENT-013: Reusable Nodes

Nodos compartilhados entre agentes.

**Implementacao:**
- `load-context`: Carrega dados do banco em paralelo
- `detect-intent`: Quick detection + LLM fallback
- `execute-tools`: Executa tools do agente
- `transition-states`: Aplica transicoes de FSM
- `finalize`: Agregacao final, gera hints

**Trade-offs:**
- Generalizar nodos pode limitar customizacao
- Mas reduz duplicacao e facilita manutencao

---

### DES-AGENT-014: Cron Job Scheduling

Agendamento de jobs com offset para evitar congestao.

**Implementacao:**
- `node-cron` para agendamento
- Offset entre jobs para distribuir carga:
  - SLA monitor: `*/5 * * * *`
  - Session timeout: `2-57/5 * * * *` (offset 2min)
  - Satisfaction survey: `*/15 * * * *`
- Cada job tracked com WorkflowExecution

**Trade-offs:**
- Cron expressions podem ser confusas
- Mas controle fino sobre quando cada job roda

---

### DES-AGENT-015: Agent-Action Integration

Agentes descobrem e executam mutations via Actions.

**Implementacao:**
- `GET /act/catalog`: Consulta acoes disponiveis
- `POST /act/execute`: Executa acao com parametros
- Agente NUNCA faz mutations diretamente no banco
- Resultado da action retorna para continuar fluxo

**Trade-offs:**
- Indireção adicional para cada mutation
- Mas garante auditoria e permissoes em todas mutations

**Depends:** DES-ACT-001, DES-ACT-002

---

## Dependencias

**Libs:**
- `@langchain/langgraph` - Orquestracao de grafos
- `@langchain/core` - Primitivas LangChain
- `zod` - Validacao de schemas
- `node-cron` - Agendamento de jobs

**Infraestrutura:**
- Redis (pub/sub, filas)
- MongoDB (logs de execucao)
- Ollama (LLM local)
- OpenRouter (LLM cloud)

**Depends:**
- DES-DATA-001 (acesso a dados)
- DES-PRIME-001 (integracao com legado)
- DES-ACT-001 (catalogo de actions)

**Refs:**
- vibe-method/AGENTS.md
