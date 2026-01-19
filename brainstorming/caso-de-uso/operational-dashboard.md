# Feature: Operational Dashboard

Dashboard operacional com metricas em tempo real por area.

**Prefixo:** OPS

---

## User Stories

### US-OPS-001: Ver Metricas de Recrutamento

**Como** coordenador de recrutamento,
**Quero** ver metricas do dia em tempo real,
**Para** acompanhar o ritmo de trabalho.

**Criterios de Aceite:**
- [ ] Curriculos cadastrados hoje
- [ ] Entrevistas agendadas
- [ ] Taxa de conversao
- [ ] Comparativo com media

---

### US-OPS-002: Ver Metricas de Relatorios

**Como** coordenador de qualidade,
**Quero** ver status dos relatorios do dia,
**Para** garantir envio dentro do prazo.

**Criterios de Aceite:**
- [ ] Relatorios enviados vs meta
- [ ] Taxa de aprovacao automatica
- [ ] Itens aguardando revisao
- [ ] Alertas de atraso

---

### US-OPS-003: Ver Metricas de Expectativas

**Como** coordenador de operacoes,
**Quero** ver adesao dos guardioes em tempo real,
**Para** intervir rapidamente quando necessario.

**Criterios de Aceite:**
- [ ] Percentual de adesao atual
- [ ] Distribuicao verde/amarelo/vermelho
- [ ] Guardioes em risco de perder premio
- [ ] Taxa de resposta a notificacoes

---

### US-OPS-004: Ver Metricas Financeiras

**Como** gestor financeiro,
**Quero** ver indicadores financeiros consolidados,
**Para** acompanhar saude do negocio.

**Criterios de Aceite:**
- [ ] Faturamento mensal
- [ ] Taxa de inadimplencia
- [ ] Churn de clientes
- [ ] Margem liquida

---

### US-OPS-005: Ver Proximos 7 Dias

**Como** coordenador,
**Quero** ver o que esta programado para a semana,
**Para** me preparar e evitar surpresas.

**Criterios de Aceite:**
- [ ] Entrevistas agendadas por dia
- [ ] Curriculos esperados (media)
- [ ] Alertas se semana fraca
- [ ] Atalho para agendar mais

---

## Requirements

### REQ-OPS-001: Quatro Areas de Metricas

Dashboard deve ter quatro areas distintas.

**Regras:**
1. Recrutamento: curriculos, entrevistas, conversao
2. Relatorios: enviados, aprovados, aguardando
3. Expectativas: adesao, distribuicao, resposta
4. Financeiro: faturamento, inadimplencia, margem

---

### REQ-OPS-002: Atualizacao em Tempo Real

Metricas devem atualizar em tempo real.

**Regras:**
- WebSocket para push de atualizacoes
- Indicador visual quando dado atualiza
- Fallback para polling se WebSocket falhar
- Timestamp de ultima atualizacao

---

### REQ-OPS-003: Filtros por Periodo

Usuario deve poder filtrar por periodo.

**Regras:**
- Opcoes: hoje, semana, mes, personalizado
- Filtro aplica a todas as metricas da area
- Comparativo com periodo anterior disponivel

---

### REQ-OPS-004: Secoes Colapsaveis

Secoes devem ser colapsaveis.

**Regras:**
- Cada area pode ser expandida/colapsada
- Estado salvo por usuario
- Modo compacto mostra apenas KPIs principais

---

### REQ-OPS-005: Atalhos de Navegacao

Dashboard deve ter atalhos para acoes rapidas.

**Regras:**
- Botao para fila de aprovacoes
- Botao para chat analitico
- Links diretos para detalhes de cada metrica

---

### REQ-OPS-006: Alertas Integrados

Dashboard deve exibir alertas relevantes.

**Regras:**
- Contador de alertas ativos por area
- Click expande lista de alertas
- Prioridade visual (vermelho, amarelo, azul)
- Acao rapida direto do alerta

**Refs:** REQ-DASH-004

---

## Design

### DES-OPS-001: Multi-Area Layout

Layout com multiplas areas.

**Implementacao:**
- Grid responsivo com 4 areas
- Cada area com header colapsavel
- KPIs principais sempre visiveis
- Detalhes em expansao

**Trade-offs:**
- Muita informacao pode sobrecarregar
- Mas colapsaveis permitem foco

---

### DES-OPS-002: Real-time Data Feed

Alimentacao de dados em tempo real.

**Implementacao:**
- WebSocket room por dashboard
- Eventos: `ops:update:{area}`
- Payload com dados delta (apenas mudancas)
- Animacao sutil ao atualizar

**Trade-offs:**
- Conexoes persistentes consomem recursos
- Mas dados sempre atuais essenciais para operacao

---

### DES-OPS-003: Recruitment Metrics Panel

Painel de metricas de recrutamento.

**Implementacao:**
- Cartoes: curriculos, entrevistas, conversao
- Mini grafico de curriculos por dia da semana
- Funil simplificado
- Velocimetro de tempo de contratacao

**Trade-offs:**
- Duplica alguns dados do analytics
- Mas contexto operacional diferente (tempo real)

---

### DES-OPS-004: Reports Metrics Panel

Painel de metricas de relatorios.

**Implementacao:**
- Barra de progresso: enviados vs meta
- Percentual de aprovacao automatica
- Contador de itens na fila
- Mini grafico de relatorios por semana

**Trade-offs:**
- Metricas simplificadas
- Mas suficiente para acompanhamento diario

---

### DES-OPS-005: Expectations Metrics Panel

Painel de metricas de expectativas.

**Implementacao:**
- Percentual de adesao com indicador de tendencia
- Grafico pizza: verde/amarelo/vermelho
- Lista de guardioes em risco (top 5)
- Taxa de resposta a notificacoes

**Trade-offs:**
- Dados sensiveis de performance individual
- Mas necessario para gestao proativa

---

### DES-OPS-006: Financial Metrics Panel

Painel de metricas financeiras.

**Implementacao:**
- Cartoes: faturamento, inadimplencia, churn, margem
- Indicadores de tendencia (seta + percentual)
- Mini fluxo de caixa (receber, pagar, saldo)
- Top 10 contratos por rentabilidade

**Trade-offs:**
- Dados financeiros sensiveis
- Mas visibilidade essencial para gestao

---

## Dependencias

**Fontes:** brainstorming/Dashboard Operacional.md

**Depends:**
- DES-DASH-001 a DES-DASH-006 (sistema de dashboards)
- DES-NOTIFY-001 (alertas)
- DES-EXPECT-004 (metricas de adesao)
- DES-REPORT-005 (metricas de relatorios)
