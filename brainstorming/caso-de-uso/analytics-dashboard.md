# Feature: Analytics Dashboard

Dashboard analitico com indicadores criticos de recrutamento e operacoes.

**Prefixo:** ANALYTICS

---

## User Stories

### US-ANALYTICS-001: Ver Funil de Recrutamento

**Como** coordenador de recrutamento,
**Quero** visualizar o funil de conversao completo,
**Para** identificar gargalos no processo.

**Criterios de Aceite:**
- [ ] Taxa de conversao geral (ex: 3,7%)
- [ ] Percentual por etapa (cadastro, triagem, entrevista, contratacao)
- [ ] Destaque da etapa com maior perda
- [ ] Observacao sobre principal problema

---

### US-ANALYTICS-002: Comparar KPIs Mensais

**Como** gestor,
**Quero** comparar indicadores mes a mes,
**Para** detectar tendencias rapidamente.

**Criterios de Aceite:**
- [ ] Entrevistas, contratacoes, no-show lado a lado
- [ ] Variacao percentual vs mes anterior
- [ ] Indicador visual de melhora/piora
- [ ] Filtro por periodo personalizado

---

### US-ANALYTICS-003: Analisar Taxa de No-Show

**Como** coordenador,
**Quero** ver taxa de no-show detalhada,
**Para** avaliar eficacia dos lembretes.

**Criterios de Aceite:**
- [ ] Taxa atual vs meta (<18%)
- [ ] Total de agendadas, faltas e presencas
- [ ] Indicador "dentro/fora da meta"
- [ ] Comparativo com periodo anterior

---

### US-ANALYTICS-004: Ver Tempo de Contratacao

**Como** gestor de operacoes,
**Quero** acompanhar tempo medio de contratacao,
**Para** garantir agilidade no processo.

**Criterios de Aceite:**
- [ ] Velocimetro com tempo medio atual
- [ ] Comparacao com meta (2 dias)
- [ ] Lista de ultimas contratacoes com tempo individual
- [ ] Destaque para processos acima do prazo

---

### US-ANALYTICS-005: Analisar Performance por Canal

**Como** coordenador de marketing,
**Quero** comparar canais de captacao,
**Para** decidir onde investir.

**Criterios de Aceite:**
- [ ] Candidatos por canal
- [ ] Taxa de conversao por canal
- [ ] Custo estimado por candidato
- [ ] Custo por contratado

---

## Requirements

### REQ-ANALYTICS-001: Dez Indicadores Principais

Dashboard deve exibir dez indicadores criticos.

**Regras:**
1. Funil de recrutamento
2. KPIs do mes
3. Evolucao temporal (grafico)
4. Taxa de no-show
5. Tempo medio de contratacao
6. Performance por canal
7. Melhores horarios para entrevistas
8. Candidatos para reativar
9. Status operacional (proximos 7 dias)
10. Alertas inteligentes

---

### REQ-ANALYTICS-002: Melhores Horarios

Dashboard deve analisar taxa de no-show por horario.

**Regras:**
- Grafico com taxa por faixa horaria
- Comparacao manha vs tarde
- Recomendacao de melhores horarios
- Baseado em historico de pelo menos 30 dias

---

### REQ-ANALYTICS-003: Candidatos para Reativar

Dashboard deve listar candidatos aprovados nao contratados.

**Regras:**
- Aprovados ha mais de 30 dias
- Sem contrato ativo
- Ordenados por data de aprovacao
- Exportacao CSV disponivel

---

### REQ-ANALYTICS-004: Alertas Inteligentes

Sistema deve gerar alertas baseados em anomalias.

**Regras:**
- Vermelho: critico, requer acao imediata
- Amarelo: atencao, monitorar
- Azul: informativo
- Cada alerta com recomendacao de acao

**Refs:** REQ-DASH-004

---

### REQ-ANALYTICS-005: Atualizacao a Cada 6 Horas

Dados devem ser atualizados automaticamente.

**Regras:**
- Sincronizacao com PrimeCare a cada 6h
- Timestamp de ultima atualizacao visivel
- Botao para forcar atualizacao manual
- Alerta se dados desatualizados (>12h)

**Refs:** REQ-DASH-001

---

## Design

### DES-ANALYTICS-001: Recruitment Funnel Chart

Grafico de funil de recrutamento.

**Implementacao:**
- Grafico de funil (funnel chart)
- Etapas: cadastrado, triado, agendado, entrevistado, aprovado, contratado
- Percentuais em cada transicao
- Cor indicando conversao (verde >50%, amarelo 20-50%, vermelho <20%)

**Trade-offs:**
- Funil simplificado pode nao capturar todas nuances
- Mas visao rapida dos gargalos

---

### DES-ANALYTICS-002: No-Show Analysis

Analise detalhada de no-show.

**Implementacao:**
- Cartao principal com taxa e meta
- Grafico de barras por faixa horaria
- Heatmap por dia da semana x horario
- Tendencia dos ultimos 30/60/90 dias

**Trade-offs:**
- Muitos graficos podem sobrecarregar
- Mas insights profundos para acao

---

### DES-ANALYTICS-003: Channel Performance Table

Tabela de performance por canal.

**Implementacao:**
- Colunas: canal, candidatos, entrevistas, contratacoes, conversao, custo
- Ordenacao por qualquer coluna
- Destaque para melhor/pior canal
- Drill-down para detalhes do canal

**Trade-offs:**
- Custo pode ser estimado (nao real)
- Mas visibilidade para decisoes de investimento

---

### DES-ANALYTICS-004: Time to Hire Gauge

Velocimetro de tempo de contratacao.

**Implementacao:**
- Gauge chart com zonas (verde: <2d, amarelo: 2-4d, vermelho: >4d)
- Valor atual destacado
- Lista lateral com ultimas contratacoes
- Filtro por periodo

**Trade-offs:**
- Media pode esconder outliers
- Mas visualizacao intuitiva do status

---

### DES-ANALYTICS-005: Reactivation List

Lista de candidatos para reativar.

**Implementacao:**
- Tabela com: nome, data aprovacao, dias parado, contato
- Filtro: aprovados ha >30/60/90 dias
- Botao "Exportar CSV"
- Botao "Contatar" para envio rapido

**Trade-offs:**
- Lista pode ser grande
- Mas paginacao e filtros mitigam

---

### DES-ANALYTICS-006: Weekly Forecast

Previsao dos proximos 7 dias.

**Implementacao:**
- Entrevistas agendadas por dia
- Novos curriculos recebidos (media)
- Curriculos em analise
- Alerta se semana vazia

**Trade-offs:**
- Previsao baseada em historico pode errar
- Mas visibilidade preventiva valiosa

---

## Dependencias

**Fontes:** brainstorming/Dashboard Analítico.md

**Depends:**
- DES-DASH-001 a DES-DASH-006 (sistema de dashboards)
- DES-DATA-003 (analytics database)
- DES-PRIME-001 (dados do legado)
- DES-SCORE-001 (score de candidatos)
