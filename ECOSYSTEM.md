# Ecosystem - Stack de Servicos

Definicao completa dos servicos que compoem o ecossistema, quando usar cada um e padrao de portas.

---

## Visao Geral

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           SERVICOS PROPRIOS                              │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌────────┐  ┌──────┐          │
│  │   App   │  │ Socket  │  │ Backbone │  │ Agents │  │ Docs │          │
│  │  XX00   │  │  XX01   │  │   XX02   │  │  XX03  │  │ XX04 │          │
│  └────┬────┘  └────┬────┘  └────┬─────┘  └───┬────┘  └──┬───┘          │
│       │            │            │            │          │               │
└───────┼────────────┼────────────┼────────────┼──────────┼───────────────┘
        │            │            │            │          │
        ▼            ▼            ▼            ▼          ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                          SERVICOS EXTERNOS                               │
│  ┌──────────┐ ┌───────┐ ┌───────┐ ┌───────────┐ ┌─────┐ ┌─────────┐    │
│  │PostgreSQL│ │ Redis │ │MongoDB│ │Meilisearch│ │ n8n │ │Evolution│    │
│  │   XX50   │ │ XX51  │ │ XX52  │ │   XX53    │ │XX54 │ │  XX55   │    │
│  └──────────┘ └───────┘ └───────┘ └───────────┘ └─────┘ └─────────┘    │
│  ┌────────┐                                                             │
│  │ Ollama │                                                             │
│  │  XX56  │                                                             │
│  └────────┘                                                             │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Servicos Proprios

Codigo desenvolvido internamente. Rodam fora do Docker em dev, dentro em prod/staging.

| Porta | Servico | Classificacao | Quando Usar | Doc |
|-------|---------|---------------|-------------|-----|
| XX00 | **App** | Interface | UI Next.js, API routes, auth | — |
| XX01 | **Socket** | Real-time | Notificacoes push, presenca, live updates | SOCKET.md |
| XX02 | **Backbone** | Servicos Gerais | Notifications, scheduling, billing, servicos transversais | BACKBONE.md |
| XX03 | **Agents** | Inteligencia | Raciocinio LLM, decisoes, fluxos conversacionais | AGENTS.md |
| XX04 | **Actions** | Mutations | Catalogo de acoes para IA e UI | ACTIONS.md |
| XX05 | **Docs** | Knowledge Base | Busca de documentos, indexacao, RAG | DOCS.md |

### Definicoes para IA

| Servico | Definicao Tecnica |
|---------|-------------------|
| **App** | Frontend Next.js com API routes. Ponto de entrada do usuario. Responsavel por UI, autenticacao (NextAuth), chamadas a Actions e Backbone. |
| **Socket** | Servidor Socket.io para comunicacao bidirecional. Usa Redis pub/sub para escalar. Responsavel por presenca online, notificacoes real-time, live chat. |
| **Backbone** | Servidor Fastify para servicos gerais do sistema. Hospeda notifications, scheduling, billing e outros servicos transversais que nao sao mutations nem IA. |
| **Agents** | Grafos LangGraph que implementam raciocinio com LLM. Recebem contexto, tomam decisoes, executam actions. Triager, Copilot, Workers. |
| **Actions** | Catalogo de mutations do sistema. Unico ponto onde IA e UI podem descobrir e executar operacoes. Toda mutation passa por aqui. |
| **Docs** | API de Knowledge Base. Indexa documentos no Meilisearch, fornece busca full-text, suporta RAG para agents. |

---

## Servicos Externos

Infraestrutura de terceiros. Rodam no Docker em todos os ambientes.

| Porta | Servico | Classificacao | Quando Usar | Quando NAO Usar |
|-------|---------|---------------|-------------|-----------------|
| XX50 | **PostgreSQL** | Persistencia critica | Dados ACID, relacionamentos, constraints, historico | Logs alto volume, dados temporarios |
| XX51 | **Redis** | Estado volatil | Cache, filas, pub/sub, presenca real-time, locks | Persistencia longo prazo, dados criticos |
| XX52 | **MongoDB** | Persistencia efemera | Logs auditoria, sessoes TTL, analytics, schema flexivel | Dados criticos, relacionamentos |
| XX53 | **Meilisearch** | Busca textual | Full-text search, autocomplete, filtros facetados | Queries relacionais, aggregations |
| XX54 | **n8n** | Automacao visual | Workflows no-code, integracoes simples, prototipagem | Logica complexa de IA |
| XX55 | **Evolution** | Canal WhatsApp | Enviar/receber mensagens WhatsApp, midia, status | Outros canais (email, SMS) |
| XX56 | **Ollama** | LLM local | Inferencia leve, classificacao, embeddings, offline | Modelos >7B, contexto longo, GPU required |

### Definicoes para IA

| Servico | Definicao Tecnica |
|---------|-------------------|
| **PostgreSQL** | RDBMS para entidades de dominio com integridade referencial. Usar para: users, orders, conversations, configs. Tudo que precisa de FK, unique constraints ou transacoes. |
| **Redis** | In-memory store para estado compartilhado de curta duracao. Usar para: cache de queries, filas de processamento, presenca online, pub/sub entre servicos. Nunca como fonte de verdade. |
| **MongoDB** | Document store para dados schema-less com lifecycle curto. Usar para: operation_logs, session_cache, analytics_events. Sempre definir TTL index quando aplicavel. |
| **Meilisearch** | Search engine otimizado para typo-tolerance e relevancia. Usar para: busca de documentos KB, autocomplete. Indice derivado do PostgreSQL (nao eh fonte primaria). |
| **n8n** | Orquestrador visual de workflows. Usar para: integracoes simples, automacoes agendadas, prototipagem rapida. Migrar para codigo quando logica ficar complexa. |
| **Evolution** | Gateway REST para WhatsApp Business. Usar para: enviar mensagens (text/media), receber webhooks, consultar status. Nao usar para logica de negocio. |
| **Ollama** | Runtime de LLMs locais com limitacao de recursos. Usar para: inferencia leve sem custo, classificacao, NER, embeddings. Respeitar limites de RAM/params definidos em .env. |

---

## Regras de Decisao

### Onde Persistir Dados?

```
Dado critico para o negocio?
  SIM → PostgreSQL
  NAO ↓

Tem TTL ou eh log/analytics?
  SIM → MongoDB
  NAO ↓

Precisa de acesso < 10ms?
  SIM → Redis
  NAO → PostgreSQL
```

### Qual Servico de Busca?

```
Busca por texto livre (humano digitando)?
  SIM → Meilisearch
  NAO ↓

Filtro exato por campos estruturados?
  SIM → PostgreSQL (WHERE/JOIN)
```

### Qual LLM Usar?

```
Tarefa simples (classificar, extrair, embeddings)?
  SIM → Ollama (local)
  NAO ↓

Precisa de raciocinio complexo ou contexto > 4K?
  SIM → API externa (OpenRouter/OpenAI)
```

---

## Padrao de Portas

### Mascara

```
XX = prefixo do projeto (definido em .env como PORT_PREFIX)

Proprios:  XX00 - XX49
Externos:  XX50 - XX99
```

### Tabela Completa

| Porta | Servico | Tipo | Porta Interna |
|-------|---------|------|---------------|
| XX00 | App | proprio | 3000 |
| XX01 | Socket | proprio | 3001 |
| XX02 | Backbone | proprio | 3002 |
| XX03 | Agents | proprio | 3003 |
| XX04 | Actions | proprio | 3004 |
| XX05 | Docs | proprio | 3005 |
| XX06-49 | (reservado) | proprio | — |
| XX50 | PostgreSQL | externo | 5432 |
| XX51 | Redis | externo | 6379 |
| XX52 | MongoDB | externo | 27017 |
| XX53 | Meilisearch | externo | 7700 |
| XX54 | n8n | externo | 5678 |
| XX55 | Evolution | externo | 8080 |
| XX56 | Ollama | externo | 11434 |
| XX57-99 | (reservado) | externo | — |

### Exemplo (XX=22)

| Porta | Servico |
|-------|---------|
| 2200 | App |
| 2201 | Socket |
| 2202 | Backbone |
| 2203 | Agents |
| 2204 | Actions |
| 2205 | Docs |
| 2250 | PostgreSQL |
| 2251 | Redis |
| 2252 | MongoDB |
| 2253 | Meilisearch |
| 2254 | n8n |
| 2255 | Evolution |
| 2256 | Ollama |

---

## Exposicao por Ambiente

| Ambiente | Arquivo | Servicos | Portas Expostas | Traefik |
|----------|---------|----------|-----------------|---------|
| **prod** | docker-compose.yml | proprios + externos | nenhuma | app, n8n via labels |
| **staging** | docker-compose.staging.yml | proprios + externos | nenhuma | app, n8n via labels |
| **dev** | docker-compose.dev.yml | so externos | todas (XX50-XX99) | nao usa |

### Dev

- Servicos proprios rodam **fora do Docker** (npm run dev)
- Servicos externos rodam **no Docker** com portas expostas
- App conecta em `localhost:XX50` (postgres), `localhost:XX51` (redis), etc.

### Staging/Prod

- Todos os servicos rodam **dentro do Docker**
- Comunicacao interna via aliases (`postgres.internal`, `redis.internal`)
- Apenas App e n8n expostos externamente via Traefik

---

## Configuracao .env

```env
# Prefixo de portas do projeto
PORT_PREFIX=22

# Servicos proprios (dev)
APP_PORT=${PORT_PREFIX}00
SOCKET_PORT=${PORT_PREFIX}01
BACKBONE_PORT=${PORT_PREFIX}02
AGENTS_PORT=${PORT_PREFIX}03
ACTIONS_PORT=${PORT_PREFIX}04
DOCS_PORT=${PORT_PREFIX}05

# Servicos externos (dev)
POSTGRES_PORT=${PORT_PREFIX}50
REDIS_PORT=${PORT_PREFIX}51
MONGO_PORT=${PORT_PREFIX}52
MEILISEARCH_PORT=${PORT_PREFIX}53
N8N_PORT=${PORT_PREFIX}54
EVOLUTION_PORT=${PORT_PREFIX}55
OLLAMA_PORT=${PORT_PREFIX}56
```

---

## Checklist - Novo Projeto

- [ ] Definir `PORT_PREFIX` unico (verificar conflitos com outros projetos)
- [ ] Configurar `.env` com todas as portas derivadas
- [ ] Criar `docker-compose.dev.yml` expondo XX50-XX56
- [ ] Criar `docker-compose.yml` sem portas expostas, com labels Traefik
- [ ] Verificar que cada servico proprio tem seu doc (BACKBONE.md, AGENTS.md, etc.)

---

## Referencias

- [DOCKER.md](./DOCKER.md) - Padrao de deploy com Docker Compose
- [BACKBONE.md](./BACKBONE.md) - Servidor de orquestracao
- [AGENTS.md](./AGENTS.md) - Agentes LangGraph
- [ACTIONS.md](./ACTIONS.md) - Operacoes do sistema
- [SOCKET.md](./SOCKET.md) - Comunicacao real-time
- [DOCS.md](./DOCS.md) - Knowledge Base
