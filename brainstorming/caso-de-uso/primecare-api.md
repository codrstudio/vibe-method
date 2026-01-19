# Feature: PrimeCare API

Camada de integracao que conecta o ecossistema de IA com os dados e sistemas existentes da Cia Cuidadores.

**Prefixo:** PRIME

---

## Design

### DES-PRIME-001: Integration Layer Architecture

API como camada de abstracao entre novo sistema e legado CiaPrimeCare.

**Implementacao:**
- Servico Fastify dedicado (Backbone, porta XX02)
- Endpoints REST padronizados para consumo interno
- Transformacao de dados do schema legado para schema moderno
- Nao expor estrutura interna do MySQL diretamente

**Trade-offs:**
- Camada adicional de latencia (~10-20ms)
- Mas isola complexidade do legado e permite evoluir independentemente

---

### DES-PRIME-002: MySQL Read-Only Access

Conexao com banco legado apenas para leitura.

**Implementacao:**
- Usuario MySQL com permissoes somente SELECT
- Connection pool separado para queries de leitura
- Timeouts agressivos (5s query, 10s connection)
- Retry com backoff exponencial em falhas de conexao

**Trade-offs:**
- Impossibilidade de escrever diretamente (by design)
- Mas garante integridade do sistema legado em producao

**Depends:** DES-DATA-001

---

### DES-PRIME-003: SSH Tunnel for Remote Access

Conexao segura via tunel SSH quando necessario.

**Implementacao:**
- Variavel `MYSQL_SSH=true` ativa tunel
- Credenciais SSH em `.env.secrets` (host, user, key path)
- Biblioteca `ssh2` para criar tunel programaticamente
- Health check verifica conexao atraves do tunel

**Trade-offs:**
- Complexidade adicional de configuracao
- Latencia maior (~50-100ms por query)
- Mas permite acesso seguro de ambientes externos

---

### DES-PRIME-004: Data Synchronization Strategy

Sincronizacao periodica de dados do legado para analytics.

**Implementacao:**
- Job agendado a cada 6 horas (D-1 para algumas metricas)
- ETL que extrai do MySQL, transforma e carrega no PostgreSQL analytics
- Tabelas de staging para validacao antes de merge
- Log de sincronizacao com contagens e erros

**Trade-offs:**
- Dados nao sao real-time (ate 6h de atraso)
- Mas reduz carga no banco de producao e permite queries complexas

---

### DES-PRIME-005: Entity Mapping

Mapeamento de entidades do legado para novo schema.

**Implementacao:**
- Documentacao em `database/cia-prime-care/entities/`
- Glossario de termos de negocio em `database/cia-prime-care/glossary/`
- Schemas SQL documentados em `database/cia-prime-care/tables/`
- Tipos TypeScript gerados a partir dos schemas

**Trade-offs:**
- Manutencao de documentacao adicional
- Mas essencial para onboarding e consistencia

---

### DES-PRIME-006: API Endpoint Structure

Organizacao de endpoints por dominio de negocio.

**Implementacao:**
```
/api/prime/
├── candidatos/       # Curriculos, entrevistas
├── guardioes/        # Cuidadores ativos
├── assistidos/       # Pacientes/clientes
├── escalas/          # Escalas de trabalho
├── relatorios/       # Relatorios de plantao
├── financeiro/       # Faturamento, cobrancas
└── metricas/         # KPIs calculados
```

**Trade-offs:**
- Muitos endpoints para manter
- Mas organizacao clara facilita descoberta e uso

---

### DES-PRIME-007: Response Caching

Cache de respostas para reduzir carga no legado.

**Implementacao:**
- Redis como cache layer
- TTL baseado no tipo de dado:
  - Metricas calculadas: 6h
  - Listagens: 5min
  - Dados individuais: 1min
- Cache key: `prime:{endpoint}:{params_hash}`
- Invalidacao manual via endpoint admin

**Trade-offs:**
- Dados podem estar levemente desatualizados
- Mas reduz drasticamente queries no MySQL legado

---

### DES-PRIME-008: Error Handling Strategy

Tratamento de erros padronizado para integracoes.

**Implementacao:**
- Wrapper que captura erros de conexao e timeout
- Logging estruturado com correlation ID
- Fallback para cache stale quando legado indisponivel
- Alertas quando taxa de erro ultrapassa threshold

**Trade-offs:**
- Cache stale pode mostrar dados antigos
- Mas sistema continua funcional durante instabilidades

---

### DES-PRIME-009: Rate Limiting

Protecao contra sobrecarga do banco legado.

**Implementacao:**
- Limite de queries por segundo (ex: 50 qps)
- Fila de requests quando limite atingido
- Prioridade para requests de usuarios vs jobs batch
- Metricas de utilizacao expostas em `/api/prime/health`

**Trade-offs:**
- Requests podem ser enfileirados (latencia variavel)
- Mas protege banco de producao de picos

---

### DES-PRIME-010: Bidirectional Communication

API recebe dados e devolve resultados para plataforma.

**Implementacao:**
- Webhooks para eventos do legado (quando disponivel)
- Polling como fallback para sistemas sem webhook
- Buffer de eventos pendentes em Redis
- Retry automatico para envios falhos

**Trade-offs:**
- Polling menos eficiente que webhooks
- Mas garante funcionamento com qualquer sistema

---

### DES-PRIME-011: External Service Integration

Padronizacao de comunicacao com servicos externos.

**Implementacao:**
- Email: SMTP ou servico transacional (ex: Resend)
- WhatsApp: Evolution API (porta XX55)
- SMS: Integracao com provedor (ex: Twilio)
- Cada integracao em modulo isolado com interface padronizada

**Trade-offs:**
- Dependencia de multiplos provedores externos
- Mas modularidade permite trocar provedores facilmente

---

### DES-PRIME-012: Health Check and Monitoring

Monitoramento da saude das integracoes.

**Implementacao:**
- Endpoint `/api/prime/health` retorna status de cada dependencia
- Verificacao de conexao MySQL, Redis, servicos externos
- Metricas Prometheus para latencia e erros
- Dashboard de status para equipe de operacoes

**Trade-offs:**
- Overhead de verificacoes periodicas
- Mas visibilidade essencial para operacao

---

## Dependencias

**Infraestrutura:**
- MySQL CiaPrimeCare (read-only)
- PostgreSQL Main (escrita do novo sistema)
- PostgreSQL Analytics (dados sincronizados)
- Redis (cache)

**Servicos:**
- Evolution API (WhatsApp)
- Servico de email
- Servico de SMS (opcional)

**Depends:**
- DES-AUTH-001 (autenticacao para endpoints)
- DES-DATA-001 (arquitetura de dados)
