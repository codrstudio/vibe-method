# Features

Catalogo de especificacoes do CIA Dashboard.

**21 features** organizadas em 5 fases de implementacao.

**Total:** 59 US | 82 REQ | 155 DES

---

## Indice por Fase

### [ ] - Fase 1: Fundacao (DES only)

Infraestrutura tecnica sem interacao direta com usuario.

| # | Prefixo | Feature | Spec | Items |
|---|---------|---------|------|-------|
| 1 | AUTH | Autenticacao e permissoes | [authentication.md](./authentication.md) | 10 DES |
| 2 | DATA | Arquitetura de dados | [data-architecture.md](./data-architecture.md) | 10 DES |

**Destaques:**
- AUTH: HTTP-only cookies, login multi-step, RBAC granular
- PRIME: MySQL read-only, cache, rate limiting
- DATA: 3 bases (Main, Analytics, CiaPrimeCare), Redis, MongoDB, Meilisearch

---

### [ ] - Fase 2: IA Core (DES only)

Orquestracao de agentes e catalogo de acoes.

| # | Prefixo | Feature | Spec | Items |
|---|---------|---------|------|-------|
| 4 | AGENT | Orquestracao de agentes | [agent-orchestration.md](./agent-orchestration.md) | 15 DES |
| 5 | ACT | Catalogo de actions | [actions-catalog.md](./actions-catalog.md) | 8 DES |

**Destaques:**
- AGENT: LangGraph, Gatekeeper/Copilot/Worker, state machines
- ACT: Registry de mutations, execute/catalog endpoints, audit logging

---

### [ ] - Fase 3: Plataforma (US + REQ + DES)

Modulos reutilizaveis da plataforma de trabalho.

| # | Prefixo | Feature | Spec | Items |
|---|---------|---------|------|-------|
| 6 | DASH | Dashboards | [dashboards.md](./dashboards.md) | 5 US, 8 REQ, 6 DES |
| 7 | NOTIFY | Notificacoes | [notifications.md](./notifications.md) | 6 US, 10 REQ, 8 DES |
| 8 | QUEUE | Fila de aprovacoes | [approval-queue.md](./approval-queue.md) | 5 US, 8 REQ, 6 DES |
| 9 | CHAT | Chat analitico | [chat-insights.md](./chat-insights.md) | 4 US, 8 REQ, 10 DES |

**Destaques:**
- DASH: Layout system, charts, filtros, exportacao, alertas inteligentes
- NOTIFY: Multi-canal (push, WhatsApp, email), prioridades, real-time
- QUEUE: Side-by-side viewer, aprovar/rejeitar/editar, keyboard shortcuts
- CHAT: Agente Estrategista (proativo), Assistente Analista (reativo), streaming

---

### [ ] - Fase 4: Padroes Transversais (DES only)

Padroes tecnicos que permeiam multiplas features.

| # | Prefixo | Feature | Spec | Items |
|---|---------|---------|------|-------|
| 10 | SCORE | Algoritmos de scoring | [scoring-algorithms.md](./scoring-algorithms.md) | 8 DES |
| 11 | ESCAL | Escalacao de notificacoes | [notification-escalation.md](./notification-escalation.md) | 6 DES |
| 12 | VALID | Validacao de dados | [data-validation.md](./data-validation.md) | 6 DES |
| 13 | LGPD | Compliance de privacidade | [privacy-lgpd.md](./privacy-lgpd.md) | 8 DES |

**Destaques:**
- SCORE: Score de candidato, score de match, classificacao de guardioes
- ESCAL: Tiers de escalacao, lembretes preventivos/corretivos, tons de mensagem
- VALID: Input, content, AI validation, cross-system consistency, Zod
- LGPD: Criptografia, audit, consentimento, direitos do titular, incident response

---

### [ ] - Fase 5: Solucoes de Negocio (US + REQ + DES)

Solucoes especificas para Cia Cuidadores.

| # | Prefixo | Feature | Spec | Items |
|---|---------|---------|------|-------|
| 14 | RECRUIT | Recrutamento automatizado | [recruitment.md](./recruitment.md) | 6 US, 6 REQ, 4 DES |
| 15 | MEMORY | Memoria de entrevista | [interview-memory.md](./interview-memory.md) | 4 US, 5 REQ, 5 DES |
| 16 | REPORT | Humanizacao de relatorios | [report-humanization.md](./report-humanization.md) | 4 US, 6 REQ, 5 DES |
| 17 | EXPECT | Assistente de expectativas | [expectations-assistant.md](./expectations-assistant.md) | 5 US, 6 REQ, 5 DES |
| 18 | MATCH | Matching inteligente | [intelligent-matching.md](./intelligent-matching.md) | 5 US, 6 REQ, 5 DES |
| 19 | ANALYTICS | Dashboard analitico | [analytics-dashboard.md](./analytics-dashboard.md) | 5 US, 5 REQ, 6 DES |
| 20 | OPS | Dashboard operacional | [operational-dashboard.md](./operational-dashboard.md) | 5 US, 6 REQ, 6 DES |
| 21 | PLATFORM | Plataforma de gestao | [management-platform.md](./management-platform.md) | 5 US, 6 REQ, 6 DES |

**Destaques:**
- RECRUIT: Bot WhatsApp, score e agendamento, lembretes e reagendamento
- MEMORY: Gravacao e transcricao, extracao de 8 categorias, integracao com matching
- REPORT: Writer + Reviewer agents, PDF tecnico, deteccao de padroes
- EXPECT: Classificacao verde/amarelo/vermelho, framework generico, dashboard de adesao
- MATCH: Filtros eliminatorios, score ponderado, top 5 com explicacao
- ANALYTICS: 10 indicadores criticos, funil de recrutamento, analise de no-show
- OPS: 4 areas de metricas, real-time updates, alertas integrados
- PLATFORM: Portal shell e navegacao, PWA com push e offline, widget system

---

### [ ] - Fase 6: Legado

| # | Prefixo | Feature | Spec | Items |
|---|---------|---------|------|-------|
| 1 | PRIME | Integracao com legado | [primecare-api.md](./primecare-api.md) | 12 DES |


## Grafo de Dependencias

```
                          ┌─────────┐
                          │  AUTH   │ ← Primeiro
                          └────┬────┘
                               │
                          ┌────▼────┐
                          │  PRIME  │
                          └────┬────┘
                               │
                          ┌────▼────┐
              ┌───────────│  DATA   │───────────┐
              │           └────┬────┘           │
              │                │                │
         ┌────▼────┐      ┌────▼────┐      ┌────▼────┐
         │  DASH   │      │  AGENT  │      │  SCORE  │
         └────┬────┘      └────┬────┘      └─────────┘
              │                │
         ┌────▼────┐      ┌────▼────┐
         │ NOTIFY  │      │   ACT   │
         └────┬────┘      └─────────┘
              │
    ┌─────────┴─────────┐
    │                   │
┌───▼───┐          ┌────▼────┐
│ QUEUE │          │  CHAT   │
└───────┘          └─────────┘

                    │
    ┌───────────────┼───────────────┐
    │               │               │
┌───▼───┐      ┌────▼────┐     ┌────▼────┐
│RECRUIT│      │  REPORT │     │  EXPECT │
└───────┘      └─────────┘     └─────────┘
    │
┌───▼───┐
│MEMORY │
└───┬───┘
    │
┌───▼───┐
│ MATCH │
└───────┘
```

---

## Totais por Fase

| Fase | Arquivos | US | REQ | DES |
|------|----------|-----|-----|-----|
| Fase 1: Fundacao | 3 | - | - | 32 |
| Fase 2: IA Core | 2 | - | - | 23 |
| Fase 3: Plataforma | 4 | 20 | 36 | 30 |
| Fase 4: Padroes | 4 | - | - | 28 |
| Fase 5: Solucoes | 8 | 39 | 46 | 42 |
| **Total** | **21** | **59** | **82** | **155** |

---

## Convencao de IDs

| Tipo | Formato | Exemplo | Descricao |
|------|---------|---------|-----------|
| User Story | US-{FEAT}-{NUM} | US-DASH-001 | Historia de usuario com criterios de aceite |
| Requirement | REQ-{FEAT}-{NUM} | REQ-NOTIFY-001 | Requisito funcional com regras de negocio |
| Design | DES-{FEAT}-{NUM} | DES-AUTH-001 | Decisao tecnica com implementacao e trade-offs |

---

## Estrutura de Cada Spec

```markdown
# Feature: {Nome}

{Descricao em 1-2 linhas}

**Prefixo:** {FEAT}

---

## User Stories (se aplicavel)

### US-{FEAT}-001: {Titulo}

**Como** {persona},
**Quero** {acao},
**Para** {beneficio}.

**Criterios de Aceite:**
- [ ] ...

---

## Requirements (se aplicavel)

### REQ-{FEAT}-001: {Titulo}

{O que o sistema deve fazer}

**Regras:**
- ...

---

## Design

### DES-{FEAT}-001: {Titulo}

{Decisao tecnica com justificativa}

**Implementacao:**
- ...

**Trade-offs:**
- ...

---

## Dependencias

**Fontes:** brainstorming/{arquivo}.md
**Depends:** DES-X-001, DES-Y-002
**Refs:** vibe-method/Z.md
```

---

## Referencias Cruzadas

Usar `Refs:` para referencias informativas:
```markdown
**Refs:** DES-AUTH-007, vibe-method/PERMISSIONS.md
```

Usar `Depends:` para dependencias hard:
```markdown
**Depends:** DES-DATA-001, DES-PRIME-001
```

---

## Documentos Relacionados

| Documento | Local | Descricao |
|-----------|-------|-----------|
| Plano de Implementacao | `plans/PLAN-implementation.md` | Checklist por fase |
| Plano de Specs | `plans/PLAN-SPECS.md` | Mesmo conteudo, alias |
| Relatorio de Qualidade | `plans/REPORT-specs-quality.md` | Validacao das 21 specs |
| Plano de Derivacao | `plans/PLAN-derive-specs.md` | Historico de criacao |
| Brainstorming | `brainstorming/` | Material fonte |

---

## Fontes de Cada Feature

| Feature | Fonte Principal |
|---------|-----------------|
| AUTH | vibe-method/USER.md, vibe-method/PERMISSIONS.md |
| PRIME | brainstorming/Visao geral.md |
| DATA | brainstorming/README.md, vibe-method/ECOSYSTEM.md |
| AGENT | brainstorming/Visao geral.md, vibe-method/AGENTS.md |
| ACT | vibe-method/ACTIONS.md |
| DASH | brainstorming/Dashboard Analitico.md, Dashboard Operacional.md |
| NOTIFY | brainstorming/Plataforma de Gestao.md |
| QUEUE | brainstorming/Fila de Aprovacoes.md |
| CHAT | brainstorming/Chat Analitico com IA.md |
| SCORE | brainstorming/Recrutamento.md, Matching.md, Expectativas.md |
| ESCAL | brainstorming/Plataforma de Gestao.md, Expectativas.md |
| VALID | brainstorming/Humanizacao.md, Recrutamento.md |
| LGPD | brainstorming/Dashboard Analitico.md, Plataforma de Gestao.md |
| RECRUIT | brainstorming/Recrutamento Automatizado.md |
| MEMORY | brainstorming/Memoria de Entrevista.md |
| REPORT | brainstorming/Humanizacao de Relatorios.md |
| EXPECT | brainstorming/Assistente de Expectativas.md |
| MATCH | brainstorming/Matching Inteligente.md |
| ANALYTICS | brainstorming/Dashboard Analitico.md |
| OPS | brainstorming/Dashboard Operacional.md |
| PLATFORM | brainstorming/Plataforma de Gestao.md |
