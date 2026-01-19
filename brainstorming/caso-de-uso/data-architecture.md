# Feature: Data Architecture

Arquitetura de dados com tres bases distintas para diferentes propositos.

**Prefixo:** DATA

---

## Design

### DES-DATA-001: Three-Database Strategy

Separacao de responsabilidades em tres bases de dados.

**Implementacao:**
1. **Main (PostgreSQL):** Base transacional do novo sistema (RW)
2. **Analytics (PostgreSQL):** OLAP denormalizada para dashboards (RW)
3. **CiaPrimeCare (MySQL):** Sistema legado (READ-ONLY)

**Trade-offs:**
- Complexidade de gerenciar multiplas conexoes
- Sincronizacao necessaria entre bases
- Mas permite otimizar cada base para seu proposito

---

### DES-DATA-002: Main Database Schema

Base transacional para entidades do novo sistema.

**Implementacao:**
- PostgreSQL com modelo relacional normalizado
- Tabelas principais: users, conversations, messages, approvals, notifications
- Foreign keys e constraints para integridade
- Migrations versionadas com Prisma ou Drizzle
- Indices otimizados para queries frequentes

**Trade-offs:**
- Normalizacao pode exigir joins complexos
- Mas garante consistencia e evita duplicacao

---

### DES-DATA-003: Analytics Database Schema

Base OLAP com modelo estrela para dashboards.

**Implementacao:**
- PostgreSQL separado do transacional
- Modelo dimensional (fatos e dimensoes)
- Tabelas de fato: fact_recruitment, fact_reports, fact_attendance
- Dimensoes: dim_date, dim_channel, dim_guardian, dim_client
- Atualizacao D-1 (diaria) via jobs de ETL

**Trade-offs:**
- Dados com atraso de ate 24h
- Duplicacao de alguns dados
- Mas queries analiticas muito mais rapidas

---

### DES-DATA-004: Data Persistence Strategy

Regras para onde persistir cada tipo de dado.

**Implementacao:**
```
Dado critico para negocio?
  SIM → PostgreSQL Main
  NAO ↓

Tem TTL ou eh log/analytics?
  SIM → MongoDB
  NAO ↓

Precisa de acesso < 10ms?
  SIM → Redis
  NAO → PostgreSQL Main
```

**Trade-offs:**
- Complexidade de decidir onde salvar cada dado
- Mas otimiza performance e custo de armazenamento

**Refs:** vibe-method/ECOSYSTEM.md

---

### DES-DATA-005: Redis Usage Patterns

Redis para estado volatil e cache.

**Implementacao:**
- **Cache de queries:** TTL baseado no tipo de dado
- **Filas de processamento:** Jobs de agentes e notificacoes
- **Pub/Sub:** Comunicacao entre servicos
- **Presenca online:** Usuarios conectados
- **Rate limiting:** Contadores com TTL
- **OTP storage:** Codigos temporarios

**Trade-offs:**
- Dados perdidos em caso de restart (sem persistencia)
- Mas performance excepcional para casos de uso volateis

---

### DES-DATA-006: MongoDB Usage Patterns

MongoDB para dados schema-less com lifecycle curto.

**Implementacao:**
- **operation_logs:** Auditoria de acoes (TTL 90 dias)
- **workflow_executions:** Rastreamento de agentes (TTL 30 dias)
- **session_cache:** Dados de sessao temporarios
- **analytics_events:** Eventos para processamento posterior
- TTL indexes para limpeza automatica

**Trade-offs:**
- Sem transacoes ACID completas
- Mas flexibilidade de schema e auto-cleanup

---

### DES-DATA-007: Search Strategy

Meilisearch para busca textual.

**Implementacao:**
- Indice derivado do PostgreSQL (nao eh fonte primaria)
- Sincronizacao via triggers ou jobs periodicos
- Uso para: busca de candidatos, documentos KB, autocomplete
- Typo-tolerance e relevancia otimizada

**Trade-offs:**
- Dados podem estar levemente desatualizados
- Infraestrutura adicional
- Mas busca muito superior a LIKE/ILIKE do SQL

---

### DES-DATA-008: ETL Pipeline

Pipeline de extracao, transformacao e carga para analytics.

**Implementacao:**
- Jobs agendados (cron) a cada 6 horas
- Extrai do MySQL legado e PostgreSQL main
- Transforma para modelo dimensional
- Carrega em PostgreSQL analytics
- Log de execucao com contagens e erros
- Alerta se job falhar

**Trade-offs:**
- Complexidade de manter pipeline
- Dados com atraso
- Mas permite queries analiticas sem impactar producao

---

### DES-DATA-009: Connection Pooling

Gerenciamento de conexoes para cada banco.

**Implementacao:**
- Pool separado para cada banco de dados
- Limites configurados por ambiente:
  - Dev: 5 conexoes
  - Staging: 10 conexoes
  - Prod: 20+ conexoes
- Health check periodico de conexoes
- Reconnect automatico em falhas

**Trade-offs:**
- Recursos de memoria para pools
- Mas evita overhead de criar conexoes a cada query

---

### DES-DATA-010: Data Encryption

Criptografia de dados sensiveis.

**Implementacao:**
- Dados em transito: TLS obrigatorio
- Dados em repouso: Criptografia a nivel de disco (quando disponivel)
- Campos sensiveis: Criptografia a nivel de aplicacao (AES-256-GCM)
- Chaves gerenciadas em variavel de ambiente ou KMS

**Trade-offs:**
- Overhead de criptografia/descriptografia
- Complexidade de gerenciar chaves
- Mas essencial para compliance LGPD

**Depends:** DES-LGPD-001

---

## Dependencias

**Infraestrutura:**
- PostgreSQL Main (porta XX50)
- PostgreSQL Analytics (porta XX58)
- MySQL CiaPrimeCare (externo)
- Redis (porta XX51)
- MongoDB (porta XX52)
- Meilisearch (porta XX53)

**Refs:**
- vibe-method/ECOSYSTEM.md
- CLAUDE.md (secao de bases de dados)
